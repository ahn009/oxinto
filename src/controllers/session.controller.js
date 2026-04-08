'use strict';

const SessionModel = require('../models/session.model');
const ProductModel = require('../models/product.model');
const logger = require('../utils/logger');

const SessionController = {
  /**
   * GET /api/session/:id
   * Returns full session state including responses and recommendations.
   */
  async getSession(req, res) {
    try {
      const session = await SessionModel.findById(req.params.id);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      return res.status(200).json({
        id: session.id,
        channel: session.channel,
        userId: session.user_id,
        currentQuestionIndex: session.current_question_index,
        responses: session.responses,
        completed: session.completed,
        recommendations: session.recommendations,
        metadata: session.metadata,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        expiresAt: session.expires_at,
      });
    } catch (err) {
      logger.error('getSession error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/session/reset/:id
   * Deletes the session so the user can start fresh.
   */
  async resetSession(req, res) {
    try {
      const session = await SessionModel.findById(req.params.id);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      await SessionModel.delete(req.params.id);
      logger.info(`Session manually reset: ${req.params.id}`);

      return res.status(200).json({ success: true, message: 'Session reset successfully' });
    } catch (err) {
      logger.error('resetSession error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * GET /api/products
   * Returns product catalog with optional category filter.
   */
  async getProducts(req, res) {
    try {
      const { category, limit = 50, offset = 0 } = req.query;
      const products = await ProductModel.findAll({ category, limit: parseInt(limit), offset: parseInt(offset) });
      return res.status(200).json({ products, count: products.length });
    } catch (err) {
      logger.error('getProducts error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * GET /api/health
   * Health check — verifies app and DB are running.
   */
  async healthCheck(req, res) {
    try {
      // Quick DB probe
      await ProductModel.findAll({ limit: 1 });
      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch (err) {
      logger.error('Health check failed:', err);
      return res.status(503).json({ status: 'error', message: err.message });
    }
  },
};

module.exports = SessionController;
