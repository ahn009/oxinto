'use strict';

const Joi = require('joi');

/**
 * Generic Joi validation middleware factory.
 * @param {Object} schema - Joi schema with optional { body, query, params } keys
 */
function validate(schema) {
  return (req, res, next) => {
    const toValidate = {};
    if (schema.body) toValidate.body = req.body;
    if (schema.query) toValidate.query = req.query;
    if (schema.params) toValidate.params = req.params;

    const fullSchema = Joi.object(
      Object.fromEntries(
        Object.entries(toValidate).map(([key, val]) => [key, schema[key]])
      )
    );

    const { error, value } = fullSchema.validate(toValidate, { abortEarly: false, stripUnknown: true });

    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      });
    }

    // Merge validated values back
    if (value.body) req.body = value.body;
    if (value.query) req.query = value.query;
    if (value.params) req.params = value.params;

    next();
  };
}

// --- Schemas ---

const schemas = {
  signup: {
    body: Joi.object({
      name:     Joi.string().min(2).max(100).required(),
      email:    Joi.string().email().required(),
      password: Joi.string().min(8).max(128).required(),
    }),
  },

  login: {
    body: Joi.object({
      email:    Joi.string().email().required(),
      password: Joi.string().min(1).max(128).required(),
    }),
  },

  webMessage: {
    body: Joi.object({
      userId: Joi.string().max(255).required(),
      message: Joi.string().max(1000).required(),
      sessionId: Joi.string().uuid().optional().allow(null),
      language: Joi.string().valid('en', 'pt').default('en'),
    }),
  },

  sessionId: {
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
  },

  productFilter: {
    query: Joi.object({
      category: Joi.string().max(100).optional(),
      limit: Joi.number().integer().min(1).max(100).default(50),
      offset: Joi.number().integer().min(0).default(0),
    }),
  },

  sendOtp: {
    body: Joi.object({
      name:     Joi.string().min(2).max(100).required(),
      email:    Joi.string().email().required(),
      password: Joi.string().min(8).max(128).required(),
    }),
  },

  verifyOtp: {
    body: Joi.object({
      tempUserId: Joi.string().required(),
      otp:        Joi.string().length(6).pattern(/^\d+$/).required(),
    }),
  },

  resendOtp: {
    body: Joi.object({
      tempUserId: Joi.string().required(),
    }),
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  },

  resetPassword: {
    body: Joi.object({
      resetId:     Joi.string().required(),
      otp:         Joi.string().length(6).pattern(/^\d+$/).required(),
      newPassword: Joi.string().min(8).max(128).required(),
    }),
  },
};

module.exports = { validate, schemas };
