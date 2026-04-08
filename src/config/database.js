'use strict';

const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

let db = null;
let dbType = null;

/**
 * Initialize database connection based on DB_TYPE env variable.
 * Uses SQLite for development and PostgreSQL for production.
 */
async function initDatabase() {
  // Idempotent — safe to call multiple times
  if (db) return db;

  dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'sqlite') {
    return initSQLite();
  } else {
    return initPostgres();
  }
}

function initSQLite() {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || './data/database.db';
  const resolvedPath = path.resolve(dbPath);

  // Ensure data directory exists
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  logger.info(`SQLite database initialized at: ${resolvedPath}`);
  createTables();
  return db;
}

async function initPostgres() {
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test connection
  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();

  db = pool;
  logger.info('PostgreSQL database connected');
  await createTablesPg();
  return db;
}

/**
 * Create all tables for SQLite.
 */
function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      features TEXT DEFAULT '[]',
      images TEXT DEFAULT '[]',
      stock INTEGER DEFAULT 100,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      user_id TEXT NOT NULL,
      current_question_index INTEGER DEFAULT 0,
      responses TEXT DEFAULT '[]',
      completed INTEGER DEFAULT 0,
      recommendations TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_channel ON sessions(user_id, channel);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_seen_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      session_id TEXT,
      action TEXT NOT NULL,
      category TEXT,
      data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_action ON user_activity(action);

    CREATE TABLE IF NOT EXISTS temp_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      otp TEXT NOT NULL,
      otp_expires_at TEXT NOT NULL,
      otp_attempts INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_temp_users_email ON temp_users(email);
    CREATE INDEX IF NOT EXISTS idx_temp_users_expires ON temp_users(otp_expires_at);

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      otp_expires_at TEXT NOT NULL,
      otp_attempts INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pw_resets_email ON password_resets(email);

    CREATE TABLE IF NOT EXISTS google_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      google_uid TEXT UNIQUE NOT NULL,
      name TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_google_users_email ON google_users(email);
    CREATE INDEX IF NOT EXISTS idx_google_users_uid ON google_users(google_uid);
  `);

  logger.info('SQLite tables created/verified');
}

async function createTablesPg() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      tags JSONB DEFAULT '[]',
      features JSONB DEFAULT '[]',
      images JSONB DEFAULT '[]',
      stock INTEGER DEFAULT 100,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY,
      channel VARCHAR(50) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      current_question_index INTEGER DEFAULT 0,
      responses JSONB DEFAULT '[]',
      completed BOOLEAN DEFAULT false,
      recommendations JSONB,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_channel ON sessions(user_id, channel);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      last_seen_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_activity (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      session_id VARCHAR(255),
      action VARCHAR(100) NOT NULL,
      category VARCHAR(100),
      data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_action ON user_activity(action);
  `);

  logger.info('PostgreSQL tables created/verified');
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

function getDbType() {
  return dbType || process.env.DB_TYPE || 'sqlite';
}

module.exports = { initDatabase, getDb, getDbType };
