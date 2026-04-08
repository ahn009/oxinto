'use strict';

const { getDb, getDbType } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30');

/**
 * Session model — manages conversation sessions across channels.
 * Each session is isolated per user+channel combination.
 */
const SessionModel = {
  /**
   * Create a new session for a user on a given channel.
   */
  async create({ userId, channel, metadata = {} }) {
    const db = getDb();
    const id = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

    if (getDbType() === 'sqlite') {
      db.prepare(`
        INSERT INTO sessions (id, channel, user_id, responses, metadata, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, channel, userId, '[]', JSON.stringify(metadata), expiresAt.toISOString());
    } else {
      await db.query(
        `INSERT INTO sessions (id, channel, user_id, responses, metadata, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, channel, userId, '[]', JSON.stringify(metadata), expiresAt]
      );
    }

    return this.findById(id);
  },

  /**
   * Find session by ID.
   */
  async findById(id) {
    const db = getDb();

    if (getDbType() === 'sqlite') {
      const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
      return row ? parseSession(row) : null;
    } else {
      const { rows } = await db.query('SELECT * FROM sessions WHERE id = $1', [id]);
      return rows[0] ? parseSession(rows[0]) : null;
    }
  },

  /**
   * Find the most recent active (non-expired) session for a user+channel.
   */
  async findActiveByUserChannel(userId, channel) {
    const db = getDb();
    const now = new Date().toISOString();

    if (getDbType() === 'sqlite') {
      const row = db.prepare(`
        SELECT * FROM sessions
        WHERE user_id = ? AND channel = ? AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
      `).get(userId, channel, now);
      return row ? parseSession(row) : null;
    } else {
      const { rows } = await db.query(
        `SELECT * FROM sessions
         WHERE user_id = $1 AND channel = $2 AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [userId, channel]
      );
      return rows[0] ? parseSession(rows[0]) : null;
    }
  },

  /**
   * Update session state after each question answer.
   */
  async update(id, updates) {
    const db = getDb();
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

    const fields = { ...updates, expires_at: expiresAt };

    if (getDbType() === 'sqlite') {
      const setClauses = [];
      const values = [];

      for (const [key, val] of Object.entries(fields)) {
        const col = camelToSnake(key);
        setClauses.push(`${col} = ?`);
        values.push(toSQLiteValue(val));
      }
      values.push(id);

      db.prepare(`UPDATE sessions SET ${setClauses.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);
    } else {
      const setClauses = [];
      const values = [];
      let i = 1;

      for (const [key, val] of Object.entries(fields)) {
        const col = camelToSnake(key);
        setClauses.push(`${col} = $${i++}`);
        values.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
      }
      values.push(id);

      await db.query(
        `UPDATE sessions SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
        values
      );
    }

    return this.findById(id);
  },

  /**
   * Delete a session (used for reset).
   */
  async delete(id) {
    const db = getDb();

    if (getDbType() === 'sqlite') {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    } else {
      await db.query('DELETE FROM sessions WHERE id = $1', [id]);
    }
  },

  /**
   * Remove all expired sessions (called by cleanup cron job).
   */
  async deleteExpired() {
    const db = getDb();
    const now = new Date().toISOString();

    if (getDbType() === 'sqlite') {
      const result = db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
      return result.changes;
    } else {
      const { rowCount } = await db.query('DELETE FROM sessions WHERE expires_at < NOW()');
      return rowCount;
    }
  },
};

/**
 * Convert a JS value to a SQLite-compatible type.
 * Booleans → integer, Date → ISO string, objects → JSON string.
 */
function toSQLiteValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

function parseSession(row) {
  return {
    ...row,
    responses: typeof row.responses === 'string' ? JSON.parse(row.responses) : row.responses || [],
    recommendations: row.recommendations
      ? typeof row.recommendations === 'string'
        ? JSON.parse(row.recommendations)
        : row.recommendations
      : null,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
    completed: row.completed === 1 || row.completed === true,
  };
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

module.exports = SessionModel;
