'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
  }),
];

// Add file transports only when the logs directory is writable (not on serverless)
const logDir = path.resolve('./logs');
let fileLoggingEnabled = false;
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fileLoggingEnabled = true;
} catch (_) {
  // Read-only filesystem (e.g. serverless) — log to console only
}

if (fileLoggingEnabled) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/app.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports,
});

module.exports = logger;
