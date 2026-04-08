'use strict';

require('dotenv').config();
const { initDatabase } = require('../config/database');
const logger = require('./logger');

async function migrate() {
  logger.info('Running database migration...');
  await initDatabase();
  logger.info('Migration complete.');
  process.exit(0);
}

migrate().catch((err) => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
