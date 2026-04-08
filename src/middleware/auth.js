'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * Require valid JWT — checks Authorization header OR smart_token cookie.
 * Returns 401 JSON if missing or invalid (for API routes).
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  const cookieToken = req.cookies && req.cookies.smart_token;
  const token = (header && header.startsWith('Bearer ') ? header.slice(7) : null) || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Auth guard for HTML pages — redirects to /login.html if no valid token.
 * Checks Authorization header OR smart_token cookie.
 */
function requireAuthPage(req, res, next) {
  const cookieToken = req.cookies && req.cookies.smart_token;
  const header = req.headers['authorization'];
  const token = (header && header.startsWith('Bearer ') ? header.slice(7) : null) || cookieToken;

  if (!token) {
    return res.redirect('/login.html');
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.clearCookie('smart_token');
    return res.redirect('/login.html');
  }
}

/**
 * Optional JWT — attaches req.user if token present; never blocks.
 */
function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {
      // ignore invalid token in optional context
    }
  }
  next();
}

/**
 * API key authentication middleware for internal endpoints.
 */
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`Unauthorized request from ${req.ip} to ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized', message: 'Valid API key required' });
  }

  next();
}

/**
 * Twilio webhook signature verification.
 * Validates that incoming requests are genuinely from Twilio.
 */
function verifyTwilioSignature(req, res, next) {
  // Skip in test/development if no auth token is set
  if (!process.env.TWILIO_AUTH_TOKEN || process.env.NODE_ENV === 'test') {
    return next();
  }

  const twilioSignature = req.headers['x-twilio-signature'];
  if (!twilioSignature) {
    return res.status(403).json({ error: 'Missing Twilio signature' });
  }

  try {
    const { validateRequest } = require('twilio');
    const url = `${process.env.APP_URL}${req.originalUrl}`;
    const isValid = validateRequest(process.env.TWILIO_AUTH_TOKEN, twilioSignature, url, req.body || {});

    if (!isValid) {
      logger.warn(`Invalid Twilio signature from ${req.ip}`);
      return res.status(403).json({ error: 'Invalid Twilio signature' });
    }

    next();
  } catch (err) {
    logger.error('Twilio signature verification error:', err);
    return res.status(403).json({ error: 'Signature verification failed' });
  }
}

/**
 * Meta/Instagram webhook signature verification.
 * Uses HMAC-SHA256 with APP_SECRET to validate X-Hub-Signature-256 header.
 */
function verifyMetaSignature(req, res, next) {
  if (!process.env.META_APP_SECRET || process.env.NODE_ENV === 'test') {
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return res.status(403).json({ error: 'Missing Meta signature' });
  }

  const rawBody = req.rawBody || JSON.stringify(req.body);
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    logger.warn(`Invalid Meta signature from ${req.ip}`);
    return res.status(403).json({ error: 'Invalid Meta signature' });
  }

  next();
}

/**
 * Capture raw body for signature verification before JSON parsing.
 */
function captureRawBody(req, res, next) {
  let data = '';
  req.on('data', (chunk) => { data += chunk; });
  req.on('end', () => { req.rawBody = data; next(); });
}

module.exports = { apiKeyAuth, verifyTwilioSignature, verifyMetaSignature, captureRawBody, requireAuth, optionalAuth, requireAuthPage };
