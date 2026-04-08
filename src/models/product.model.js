'use strict';

const { getDb, getDbType } = require('../config/database');

/**
 * Product model — abstracts SQLite and PostgreSQL operations.
 */
const ProductModel = {
  /**
   * Get all active products, optionally filtered by category.
   */
  async findAll({ category, limit = 100, offset = 0 } = {}) {
    const db = getDb();

    if (getDbType() === 'sqlite') {
      let sql = 'SELECT * FROM products WHERE active = 1';
      const params = [];
      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }
      sql += ' ORDER BY price ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      const rows = db.prepare(sql).all(...params);
      return rows.map(parseProduct);
    } else {
      let sql = 'SELECT * FROM products WHERE active = true';
      const params = [];
      let i = 1;
      if (category) {
        sql += ` AND category = $${i++}`;
        params.push(category);
      }
      sql += ` ORDER BY price ASC LIMIT $${i++} OFFSET $${i++}`;
      params.push(limit, offset);
      const { rows } = await db.query(sql, params);
      return rows;
    }
  },

  /**
   * Find a product by ID.
   */
  async findById(id) {
    const db = getDb();

    if (getDbType() === 'sqlite') {
      const row = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(id);
      return row ? parseProduct(row) : null;
    } else {
      const { rows } = await db.query('SELECT * FROM products WHERE id = $1 AND active = true', [id]);
      return rows[0] || null;
    }
  },

  /**
   * Create a new product.
   */
  async create(product) {
    const db = getDb();
    const { name, description, price, category, tags = [], features = [], images = [], stock = 100 } = product;

    if (getDbType() === 'sqlite') {
      const stmt = db.prepare(`
        INSERT INTO products (name, description, price, category, tags, features, images, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        name, description, price, category,
        JSON.stringify(tags), JSON.stringify(features), JSON.stringify(images), stock
      );
      return { id: result.lastInsertRowid, ...product };
    } else {
      const { rows } = await db.query(
        `INSERT INTO products (name, description, price, category, tags, features, images, stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, description, price, category, JSON.stringify(tags), JSON.stringify(features), JSON.stringify(images), stock]
      );
      return rows[0];
    }
  },

  /**
   * Get all active products for recommendation engine (no pagination).
   */
  async findAllForRecommendation() {
    const db = getDb();

    if (getDbType() === 'sqlite') {
      const rows = db.prepare('SELECT * FROM products WHERE active = 1 AND stock > 0').all();
      return rows.map(parseProduct);
    } else {
      const { rows } = await db.query('SELECT * FROM products WHERE active = true AND stock > 0');
      return rows;
    }
  },
};

/**
 * Parse SQLite row (JSON fields stored as strings).
 */
function parseProduct(row) {
  return {
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
    features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
    active: row.active === 1 || row.active === true,
  };
}

module.exports = ProductModel;
