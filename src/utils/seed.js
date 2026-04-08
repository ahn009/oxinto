'use strict';

require('dotenv').config();
const path = require('path');
const { initDatabase } = require('../config/database');
const ProductModel = require('../models/product.model');
const logger = require('./logger');

const sampleProducts = require(path.join(__dirname, '../../data/products.json'));

async function seed() {
  logger.info('Seeding database with sample products...');
  await initDatabase();

  for (const product of sampleProducts) {
    try {
      await ProductModel.create(product);
      logger.info(`Seeded: ${product.name}`);
    } catch (err) {
      // Skip if already exists (re-run safe)
      if (!err.message.includes('UNIQUE') && !err.message.includes('duplicate')) {
        logger.error(`Failed to seed ${product.name}:`, err.message);
      }
    }
  }

  logger.info('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seeding failed:', err);
  process.exit(1);
});
