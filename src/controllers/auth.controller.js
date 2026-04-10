'use strict';

const jwt = require('jsonwebtoken');
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../models/user.model');
const { hashPassword, verifyPassword } = require('../models/user.model');
const EmailService = require('../services/email.service');
const { getDb, getDbType } = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET  = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const OTP_TTL_MS  = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
// Max 3 OTP requests per email per hour (enforced in-process; use Redis for multi-instance)
const otpRateMap = new Map(); // email → { count, resetAt }

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function checkOtpRate(email) {
  const now = Date.now();
  const rec = otpRateMap.get(email);
  if (!rec || now > rec.resetAt) {
    otpRateMap.set(email, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (rec.count >= 3) return false;
  rec.count++;
  return true;
}

function setAuthCookie(res, token) {
  res.cookie('smart_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookie(res) {
  res.clearCookie('smart_token', { httpOnly: true, sameSite: 'lax' });
}

// ── DB helpers for temp_users ─────────────────────────────────────────────────

function dbRun(sql, params = []) {
  const db = getDb();
  if (getDbType() === 'sqlite') {
    db.prepare(sql).run(...params);
  }
}

function dbGet(sql, params = []) {
  const db = getDb();
  if (getDbType() === 'sqlite') {
    return db.prepare(sql).get(...params);
  }
  return null;
}

// ─────────────────────────────────────────────
//  Controller
// ─────────────────────────────────────────────

const AuthController = {

  /**
   * POST /api/auth/signup  (legacy — direct signup without OTP, kept for backward compat)
   */
  async signup(req, res) {
    const { name, email, password } = req.body;
    try {
      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await hashPassword(password);
      const user = await UserModel.create({ name, email, passwordHash });

      await UserModel.trackActivity({ userId: String(user.id), action: 'signup', data: { email: user.email } });

      const token = signToken(user);
      logger.info(`New user registered (direct): ${email}`);
      setAuthCookie(res, token);
      return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      logger.error('Signup error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/send-otp
   * Step 1 of OTP signup: store temp user, send OTP email.
   */
  async sendOtp(req, res) {
    const { name, email, password } = req.body;
    try {
      // Rate limit
      if (!checkOtpRate(email.toLowerCase())) {
        return res.status(429).json({ error: 'Too many OTP requests. Try again in an hour.' });
      }

      // Check if already permanently registered
      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email already registered. Please sign in.' });

      const passwordHash = await hashPassword(password);
      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
      const tempId = uuidv4();

      // Upsert temp_users (overwrite if same email retried)
      dbRun(
        `INSERT INTO temp_users (id, name, email, password_hash, otp, otp_expires_at, otp_attempts)
         VALUES (?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(email) DO UPDATE SET
           id=excluded.id, name=excluded.name, password_hash=excluded.password_hash,
           otp=excluded.otp, otp_expires_at=excluded.otp_expires_at, otp_attempts=0`,
        [tempId, name, email.toLowerCase(), passwordHash, otp, otpExpiresAt]
      );

      // Get the actual stored id (may differ if email already existed)
      const stored = dbGet('SELECT id FROM temp_users WHERE email = ?', [email.toLowerCase()]);

      await EmailService.sendOtp(email, otp, name);
      logger.info(`OTP sent for signup: ${email}`);

      return res.status(200).json({ success: true, tempUserId: stored.id });
    } catch (err) {
      logger.error('send-otp error:', err);
      return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
  },

  /**
   * POST /api/auth/verify-otp
   * Step 2: verify OTP, create permanent user, return JWT.
   */
  async verifyOtp(req, res) {
    const { tempUserId, otp } = req.body;
    try {
      const temp = dbGet('SELECT * FROM temp_users WHERE id = ?', [tempUserId]);
      if (!temp) return res.status(400).json({ error: 'Session expired. Please start again.' });

      // Check expiry
      if (new Date(temp.otp_expires_at) < new Date()) {
        dbRun('DELETE FROM temp_users WHERE id = ?', [tempUserId]);
        return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
      }

      // Check attempts
      if (temp.otp_attempts >= MAX_OTP_ATTEMPTS) {
        dbRun('DELETE FROM temp_users WHERE id = ?', [tempUserId]);
        return res.status(400).json({ error: 'Too many failed attempts. Please start again.' });
      }

      // Verify OTP
      if (temp.otp !== otp) {
        dbRun('UPDATE temp_users SET otp_attempts = otp_attempts + 1 WHERE id = ?', [tempUserId]);
        const remaining = MAX_OTP_ATTEMPTS - (temp.otp_attempts + 1);
        return res.status(400).json({ error: `Incorrect code. ${remaining} attempt(s) remaining.` });
      }

      // Check email not taken (race condition guard)
      const existing = await UserModel.findByEmail(temp.email);
      if (existing) {
        dbRun('DELETE FROM temp_users WHERE id = ?', [tempUserId]);
        return res.status(409).json({ error: 'Email already registered. Please sign in.' });
      }

      // Create permanent user
      const user = await UserModel.create({ name: temp.name, email: temp.email, passwordHash: temp.password_hash });
      dbRun('DELETE FROM temp_users WHERE id = ?', [tempUserId]);

      await UserModel.trackActivity({ userId: String(user.id), action: 'signup', data: { email: user.email, method: 'otp' } });

      const token = signToken(user);
      logger.info(`New user verified & created: ${temp.email}`);
      setAuthCookie(res, token);
      return res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      logger.error('verify-otp error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/resend-otp
   * Regenerate and resend OTP for an existing temp session.
   */
  async resendOtp(req, res) {
    const { tempUserId } = req.body;
    try {
      const temp = dbGet('SELECT * FROM temp_users WHERE id = ?', [tempUserId]);
      if (!temp) return res.status(400).json({ error: 'Session not found. Please start again.' });

      if (!checkOtpRate(temp.email)) {
        return res.status(429).json({ error: 'Too many OTP requests. Try again in an hour.' });
      }

      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
      dbRun('UPDATE temp_users SET otp = ?, otp_expires_at = ?, otp_attempts = 0 WHERE id = ?', [otp, otpExpiresAt, tempUserId]);

      await EmailService.sendOtp(temp.email, otp, temp.name);
      logger.info(`OTP resent for: ${temp.email}`);
      return res.status(200).json({ success: true });
    } catch (err) {
      logger.error('resend-otp error:', err);
      return res.status(500).json({ error: 'Failed to resend OTP.' });
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    const { email, password } = req.body;
    try {
      const user = await UserModel.findByEmail(email);
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

      await UserModel.updateLastSeen(user.id);
      await UserModel.trackActivity({ userId: String(user.id), action: 'login', data: { email: user.email } });

      const token = signToken(user);
      logger.info(`User logged in: ${email}`);
      setAuthCookie(res, token);
      return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      logger.error('Login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      if (req.user) {
        await UserModel.trackActivity({ userId: String(req.user.id), action: 'logout' });
      }
      clearAuthCookie(res);
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch {
      clearAuthCookie(res);
      return res.status(200).json({ message: 'Logged out' });
    }
  },

  /**
   * GET /api/auth/me
   */
  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const activity = await UserModel.getActivitySummary(String(user.id));
      return res.status(200).json({
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at, lastSeen: user.last_seen_at },
        recentActivity: activity.slice(0, 10),
      });
    } catch (err) {
      logger.error('me error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/forgot-password
   * Send OTP to registered email for password reset.
   */
  async forgotPassword(req, res) {
    const { email } = req.body;
    try {
      // Always return success to prevent email enumeration
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(200).json({ success: true, message: 'If this email is registered, you will receive a reset code.' });
      }

      if (!checkOtpRate(email.toLowerCase())) {
        return res.status(429).json({ error: 'Too many requests. Try again in an hour.' });
      }

      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
      const resetId = uuidv4();

      dbRun(
        `INSERT INTO password_resets (id, email, otp, otp_expires_at, otp_attempts) VALUES (?, ?, ?, ?, 0)`,
        [resetId, email.toLowerCase(), otp, otpExpiresAt]
      );

      await EmailService.sendPasswordResetOtp(email, otp);
      logger.info(`Password reset OTP sent to: ${email}`);

      return res.status(200).json({ success: true, resetId });
    } catch (err) {
      logger.error('forgot-password error:', err);
      return res.status(500).json({ error: 'Failed to send reset email.' });
    }
  },

  /**
   * GET /auth/google
   * Initiates the Google OAuth 2.0 redirect flow via Passport.
   * No session created — stateless JWT only.
   */
  redirectToGoogle(req, res, next) {
    return passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })(req, res, next);
  },

  /**
   * GET /auth/google/callback
   * Called by Google after user grants/denies access.
   * Passport has already verified the code and populated req.user.
   * Generates a JWT, sets an httpOnly cookie, then redirects to the frontend
   * /auth/callback page which persists the token in localStorage.
   */
  handleGoogleCallback(req, res) {
    if (!req.user) {
      logger.warn('Google OAuth callback reached without req.user');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/auth/callback?error=auth_failed`);
    }

    const user = req.user;

    // Fire-and-forget activity tracking (non-blocking)
    UserModel.updateLastSeen(user.id).catch((e) => logger.error('updateLastSeen error:', e));
    UserModel.trackActivity({
      userId: String(user.id),
      action: 'login',
      data: { method: 'google_oauth', email: user.email },
    }).catch((e) => logger.error('trackActivity error:', e));

    const token = signToken(user);
    logger.info(`Google OAuth login: ${user.email}`);
    setAuthCookie(res, token);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  },

  /**
   * POST /api/auth/reset-password
   * Verify OTP and update password.
   */
  async resetPassword(req, res) {
    const { resetId, otp, newPassword } = req.body;
    try {
      const record = dbGet('SELECT * FROM password_resets WHERE id = ?', [resetId]);
      if (!record) return res.status(400).json({ error: 'Reset session expired. Please request again.' });

      if (new Date(record.otp_expires_at) < new Date()) {
        dbRun('DELETE FROM password_resets WHERE id = ?', [resetId]);
        return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
      }

      if (record.otp_attempts >= MAX_OTP_ATTEMPTS) {
        dbRun('DELETE FROM password_resets WHERE id = ?', [resetId]);
        return res.status(400).json({ error: 'Too many failed attempts. Please request a new reset.' });
      }

      if (record.otp !== otp) {
        dbRun('UPDATE password_resets SET otp_attempts = otp_attempts + 1 WHERE id = ?', [resetId]);
        const remaining = MAX_OTP_ATTEMPTS - (record.otp_attempts + 1);
        return res.status(400).json({ error: `Incorrect code. ${remaining} attempt(s) remaining.` });
      }

      // Update user password
      const newHash = await hashPassword(newPassword);
      const db = getDb();
      db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE email = ?`).run(newHash, record.email);
      dbRun('DELETE FROM password_resets WHERE id = ?', [resetId]);

      logger.info(`Password reset successful: ${record.email}`);
      return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      logger.error('reset-password error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = AuthController;
