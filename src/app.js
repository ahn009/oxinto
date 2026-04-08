'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');

const { initDatabase } = require('./config/database');
const SessionModel = require('./models/session.model');
const WebhookController = require('./controllers/webhook.controller');
const SessionController = require('./controllers/session.controller');
const { apiKeyAuth, verifyTwilioSignature, verifyMetaSignature, requireAuth } = require('./middleware/auth');
const AuthController = require('./controllers/auth.controller');
const { generalLimiter, webhookLimiter } = require('./middleware/rateLimiter');
const { validate, schemas } = require('./middleware/validation');
// eslint-disable-next-line no-unused-vars
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
//  Security & Middleware
// ─────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", 'https://www.gstatic.com', 'https://apis.google.com'],
      scriptSrcElem: ["'self'", "'unsafe-inline'", 'https://www.gstatic.com', 'https://apis.google.com'],
      styleSrc:      ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:       ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:        ["'self'", 'data:', 'https:'],
      connectSrc:    [
        "'self'",
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://oauth2.googleapis.com',
        'https://www.googleapis.com',
        'https://*.firebaseio.com',
        'wss://*.firebaseio.com',
      ],
      frameSrc:      ['https://accounts.google.com', 'https://*.firebaseapp.com'],
    },
  },
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(compression());
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Capture raw body ONLY for signature-verified channels (WhatsApp, Instagram).
// The web chat route does NOT need this — it uses standard express.json() parsing.
app.use((req, res, next) => {
  if (req.path === '/api/webhook/whatsapp' || req.path === '/api/webhook/instagram') {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      try { req.body = JSON.parse(data); } catch { /* urlencoded or empty body — ok */ }
      next();
    });
  } else {
    next();
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply general rate limiting
app.use('/api/', generalLimiter);

// ─────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────

// ── Public config (Firebase settings from env) ───────────
app.get('/api/config/client', AuthController.clientConfig);

// ── Auth routes ──────────────────────────────────────────
app.post('/api/auth/signup',           validate(schemas.signup),         AuthController.signup);
app.post('/api/auth/send-otp',         validate(schemas.sendOtp),        AuthController.sendOtp);
app.post('/api/auth/verify-otp',       validate(schemas.verifyOtp),      AuthController.verifyOtp);
app.post('/api/auth/resend-otp',       validate(schemas.resendOtp),      AuthController.resendOtp);
app.post('/api/auth/google',           validate(schemas.googleAuth),     AuthController.googleAuth);
app.post('/api/auth/login',            validate(schemas.login),          AuthController.login);
app.post('/api/auth/logout',           requireAuth,                      AuthController.logout);
app.get('/api/auth/me',                requireAuth,                      AuthController.me);
app.post('/api/auth/forgot-password',  validate(schemas.forgotPassword), AuthController.forgotPassword);
app.post('/api/auth/reset-password',   validate(schemas.resetPassword),  AuthController.resetPassword);

// Health check (no auth required)
app.get('/api/health', SessionController.healthCheck);

// WhatsApp Webhook (Twilio signature verification)
app.post(
  '/api/webhook/whatsapp',
  webhookLimiter,
  verifyTwilioSignature,
  WebhookController.handleWhatsApp
);

// Instagram Webhook (Meta verification + signature)
app.get('/api/webhook/instagram', WebhookController.verifyInstagram);
app.post(
  '/api/webhook/instagram',
  webhookLimiter,
  verifyMetaSignature,
  WebhookController.handleInstagram
);

// Web Chat (no external auth needed — rate limited)
app.post(
  '/api/webhook/web',
  validate(schemas.webMessage),
  WebhookController.handleWeb
);

// Session endpoints (require API key)
app.get('/api/session/:id', apiKeyAuth, validate(schemas.sessionId), SessionController.getSession);
app.post('/api/session/reset/:id', apiKeyAuth, validate(schemas.sessionId), SessionController.resetSession);

// Product catalog (public read)
app.get('/api/products', validate(schemas.productFilter), SessionController.getProducts);

// Unknown API routes — return 404 JSON. UI routing is handled by Next.js frontend.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─────────────────────────────────────────────
//  Global Error Handler
// ─────────────────────────────────────────────

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────
//  Cron: Session Cleanup
// ─────────────────────────────────────────────

function startCleanupJob() {
  const interval = parseInt(process.env.SESSION_CLEANUP_INTERVAL_MINUTES || '10');
  cron.schedule(`*/${interval} * * * *`, async () => {
    try {
      const deleted = await SessionModel.deleteExpired();
      if (deleted > 0) logger.info(`Session cleanup: removed ${deleted} expired sessions`);
    } catch (err) {
      logger.error('Session cleanup error:', err);
    }
  });
  logger.info(`Session cleanup job scheduled every ${interval} minutes`);
}

// ─────────────────────────────────────────────
//  Startup
// ─────────────────────────────────────────────

async function start() {
  try {
    await initDatabase();
    logger.info('Database initialized');

    startCleanupJob();

    const server = app.listen(PORT, () => {
      logger.info(`Smart AI Recommendation System running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`DB type: ${process.env.DB_TYPE || 'sqlite'}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Only auto-start when run directly; tests import and call start() themselves
if (require.main === module) {
  start();
}

module.exports = app;
module.exports.start = start;
