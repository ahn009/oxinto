'use strict';

const crypto = require('crypto');
const { getDb, getDbType } = require('../config/database');

/**
 * User model — authentication and profile management.
 * Passwords hashed with Node.js crypto.scrypt (no extra deps).
 */
const UserModel = {
  async create({ name, email, passwordHash }) {
    const db = getDb();
    if (getDbType() === 'sqlite') {
      const stmt = db.prepare(
        `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`
      );
      const result = stmt.run(name, email.toLowerCase(), passwordHash);
      return this.findById(result.lastInsertRowid);
    } else {
      const { rows } = await db.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
        [name, email.toLowerCase(), passwordHash]
      );
      return rows[0];
    }
  },

  async findById(id) {
    const db = getDb();
    if (getDbType() === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
    } else {
      const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return rows[0] || null;
    }
  },

  async findByEmail(email) {
    const db = getDb();
    const e = email.toLowerCase();
    if (getDbType() === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE email = ?').get(e) || null;
    } else {
      const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [e]);
      return rows[0] || null;
    }
  },

  async updateLastSeen(id) {
    const db = getDb();
    if (getDbType() === 'sqlite') {
      db.prepare(`UPDATE users SET last_seen_at = datetime('now') WHERE id = ?`).run(id);
    } else {
      await db.query(`UPDATE users SET last_seen_at = NOW() WHERE id = $1`, [id]);
    }
  },

  async trackActivity({ userId, sessionId, action, category, data = {} }) {
    const db = getDb();
    if (getDbType() === 'sqlite') {
      db.prepare(
        `INSERT INTO user_activity (user_id, session_id, action, category, data) VALUES (?, ?, ?, ?, ?)`
      ).run(userId, sessionId || null, action, category || null, JSON.stringify(data));
    } else {
      await db.query(
        `INSERT INTO user_activity (user_id, session_id, action, category, data) VALUES ($1,$2,$3,$4,$5)`,
        [userId, sessionId || null, action, category || null, JSON.stringify(data)]
      );
    }
  },

  async getActivitySummary(userId) {
    const db = getDb();
    if (getDbType() === 'sqlite') {
      const rows = db.prepare(
        `SELECT action, category, data, created_at FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
      ).all(userId);
      return rows.map((r) => ({ ...r, data: JSON.parse(r.data || '{}') }));
    } else {
      const { rows } = await db.query(
        `SELECT action, category, data, created_at FROM user_activity WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );
      return rows;
    }
  },
};

// ── Password utilities ───────────────────────────────────
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, hash) => {
      if (err) return reject(err);
      resolve(`${salt}:${hash.toString('hex')}`);
    });
  });
}

async function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      try {
        resolve(crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

module.exports = UserModel;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
