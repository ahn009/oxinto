'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function isEmailConfigured() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return user && pass && !user.includes('your-gmail') && !pass.includes('your-gmail') && !pass.includes('your_');
}

function getTransporter() {
  if (transporter) return transporter;

  if (!isEmailConfigured()) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

const EmailService = {
  /**
   * Send a 6-digit OTP verification email.
   */
  async sendOtp(to, otp, name = '') {
    // Dev mode: if email is not configured, log OTP to console and skip sending
    if (!isEmailConfigured()) {
      logger.warn(`[DEV] OTP email not sent — EMAIL_USER/EMAIL_PASS not configured.`);
      logger.warn(`[DEV] OTP for ${to}: ${otp}`);
      return { messageId: 'dev-mode-skipped' };
    }

    const transporter = getTransporter();
    if (!transporter) {
      logger.warn(`[DEV] OTP for ${to}: ${otp}`);
      return { messageId: 'dev-mode-skipped' };
    }

    const from = process.env.EMAIL_FROM || `Smart Product Advisor <${process.env.EMAIL_USER}>`;
    const greeting = name ? `Hi ${name},` : 'Hi,';

    const mailOptions = {
      from,
      to,
      subject: 'Your verification code — Smart Product Advisor',
      html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0b0f;color:#f0f2ff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:32px 40px;">
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">✦ Smart Product Advisor</div>
          </div>
          <div style="padding:40px;">
            <p style="margin:0 0 8px;font-size:14px;color:#9ca3af;">${greeting}</p>
            <h2 style="margin:0 0 24px;font-size:22px;font-weight:700;">Your verification code</h2>
            <div style="background:#1e2130;border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
              <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#818cf8;">${otp}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:10px;">Expires in 10 minutes</div>
            </div>
            <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
              Enter this code on the verification page to complete your sign-up.<br/>
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#4b5563;">
            Smart Product Advisor — AI-powered recommendations
          </div>
        </div>
      `,
      text: `${greeting}\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`OTP email sent to ${to} (messageId: ${info.messageId})`);
    return info;
  },

  /**
   * Send a password reset OTP email.
   */
  async sendPasswordResetOtp(to, otp) {
    if (!isEmailConfigured()) {
      logger.warn(`[DEV] Password reset OTP for ${to}: ${otp}`);
      return { messageId: 'dev-mode-skipped' };
    }

    const transporter = getTransporter();
    if (!transporter) {
      logger.warn(`[DEV] Password reset OTP for ${to}: ${otp}`);
      return { messageId: 'dev-mode-skipped' };
    }

    const from = process.env.EMAIL_FROM || `Smart Product Advisor <${process.env.EMAIL_USER}>`;

    const mailOptions = {
      from,
      to,
      subject: 'Reset your password — Smart Product Advisor',
      html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0b0f;color:#f0f2ff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:32px 40px;">
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">✦ Smart Product Advisor</div>
          </div>
          <div style="padding:40px;">
            <h2 style="margin:0 0 24px;font-size:22px;font-weight:700;">Reset your password</h2>
            <p style="font-size:14px;color:#9ca3af;margin:0 0 20px;">Use this code to reset your password:</p>
            <div style="background:#1e2130;border:1px solid rgba(244,63,94,0.3);border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
              <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#fb7185;">${otp}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:10px;">Expires in 10 minutes</div>
            </div>
            <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
              If you didn't request a password reset, your account is safe — ignore this email.
            </p>
          </div>
          <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#4b5563;">
            Smart Product Advisor — AI-powered recommendations
          </div>
        </div>
      `,
      text: `Your password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`Password reset OTP sent to ${to}`);
    return info;
  },
};

module.exports = EmailService;
