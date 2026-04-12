'use strict';

require('dotenv').config();
const path = require('path');
const { initDatabase } = require('../config/database');
const ProductModel = require('../models/product.model');
const logger = require('./logger');

const sampleProducts = require(path.join(__dirname, '../../data/products.json'));

async function seed() {
  logger.info('Seeding database with sample products...');
  const { getDb, getDbType } = require('../config/database');
  await initDatabase();

  // Clear existing products before seeding to prevent duplicates on re-run
  const db = getDb();
  if (getDbType() === 'sqlite') {
    db.prepare('DELETE FROM products').run();
  } else {
    await db.query('DELETE FROM products');
  }
  logger.info('Cleared existing products.');

  for (const product of sampleProducts) {
    try {
      await ProductModel.create(product);
      logger.info(`Seeded: ${product.name}`);
    } catch (err) {
      logger.error(`Failed to seed ${product.name}:`, err.message);
    }
  }

  logger.info('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seeding failed:', err);
  process.exit(1);
});
