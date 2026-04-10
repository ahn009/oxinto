'use strict';

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const UserModel = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Configure Passport.js with Google OAuth 2.0 strategy.
 * Sessions are disabled — stateless JWT flow only.
 * Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
 *
 * Strategy registration is skipped when env vars are absent (e.g. in tests)
 * so the process does not crash. Requests to /auth/google will return 500
 * if the vars are genuinely missing in production.
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId   = profile.id;
          const emailEntry = profile.emails && profile.emails[0];
          const email      = emailEntry ? emailEntry.value : null;
          const name       = profile.displayName || (email ? email.split('@')[0] : 'User');

          if (!email) {
            return done(new Error('No email provided by Google account'), null);
          }

          const lowerEmail = email.toLowerCase();

          // 1. Check if user already linked via Google ID in google_users table
          let user = await UserModel.findByGoogleId(googleId);

          if (!user) {
            // 2. Check if an email/password account already exists for this email
            user = await UserModel.findByEmail(lowerEmail);

            if (!user) {
              // 3. Brand-new user — create account and link Google ID
              user = await UserModel.createGoogleUser({ email: lowerEmail, name, googleId });
              logger.info(`New Google OAuth user created: ${lowerEmail}`);
            } else {
              // 4. Link existing email/password account to this Google ID
              await UserModel.linkGoogleId(user.id, lowerEmail, name, googleId);
              logger.info(`Existing user linked to Google OAuth: ${lowerEmail}`);
            }
          }

          return done(null, user);
        } catch (err) {
          logger.error('Google OAuth strategy error:', err);
          return done(err, null);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth not configured: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_CALLBACK_URL is missing');
}

module.exports = passport;
