'use strict';

const RecommendationService = require('./recommendation.service');
const SessionModel = require('../models/session.model');
const logger = require('../utils/logger');

/**
 * Offer Service — generates 3-tier recommendations and persists them to the session.
 *
 * Tiers:
 *   Basic:        top 1-2 products with >= 50% score match
 *   Intermediate: top 3-4 products with contextual reasoning
 *   Premium:      best match (>= 85%) + optional bundle with 10% discount
 */
const TIER_THRESHOLDS = {
  basic: 50,
  premium: 85,
};

const BUNDLE_DISCOUNT_PERCENT = 10;

const ACCESSORIES = {
  en: ['Premium carry case', '3-year extended warranty', 'Extra cable set', 'Audio adapter kit'],
  pt: ['Estojo de transporte premium', 'Garantia estendida 3 anos', 'Kit de cabos extras', 'Kit adaptador de áudio'],
};

const OfferService = {
  /**
   * Generate and store 3-tier offers for a completed session.
   * @param {string} sessionId
   * @param {string} lang - 'en' | 'pt'
   * @returns {Object} { basic, intermediate, premium }
   */
  async generate(sessionId, lang = 'en') {
    const session = await SessionModel.findById(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const scored = await RecommendationService.score(session.responses);
    const context = RecommendationService.buildContext(session.responses);

    const offers = {
      basic: this.buildBasicTier(scored, lang),
      intermediate: this.buildIntermediateTier(scored, context, lang),
      premium: this.buildPremiumTier(scored, context, lang),
    };

    // Persist recommendations to session
    await SessionModel.update(sessionId, { recommendations: offers, completed: true });

    logger.info(`Offers generated for session ${sessionId}: basic=${offers.basic.length}, premium=${!!offers.premium}`);
    return offers;
  },

  /**
   * Basic tier: 1-2 most affordable options matching >= 50% criteria.
   */
  buildBasicTier(scored, lang) {
    return scored
      .filter((p) => p.score >= TIER_THRESHOLDS.basic)
      .sort((a, b) => a.price - b.price) // cheapest first for basic
      .slice(0, 2)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        score: p.score,
        tags: p.tags,
        features: p.features,
        images: p.images,
      }));
  },

  /**
   * Intermediate tier: 3-4 products with reasoning labels.
   */
  buildIntermediateTier(scored, context, lang) {
    const top = scored
      .filter((p) => p.score >= TIER_THRESHOLDS.basic)
      .slice(0, 4);

    return top.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      score: p.score,
      tags: p.tags,
      features: p.features,
      images: p.images,
      reason: RecommendationService.generateReason(p, context, lang),
    }));
  },

  /**
   * Premium tier: best match + bundle suggestion.
   * Returns null if no product scores >= 85%.
   */
  buildPremiumTier(scored, context, lang) {
    const best = scored[0];
    if (!best) return null;

    // If no product is ≥85%, still recommend best available but flag it
    const isHighConfidence = best.score >= TIER_THRESHOLDS.premium;

    const accessories = ACCESSORIES[lang] || ACCESSORIES.en;
    const bundleItems = accessories.slice(0, 2);

    const bundleBasePrice = best.price;
    const accessoryValue = bundleBasePrice * 0.3; // accessories ~30% of product value
    const bundleTotal = bundleBasePrice + accessoryValue;
    const discountedTotal = parseFloat((bundleTotal * (1 - BUNDLE_DISCOUNT_PERCENT / 100)).toFixed(2));

    const premium = {
      product: {
        id: best.id,
        name: best.name,
        description: best.description,
        price: best.price,
        score: best.score,
        tags: best.tags,
        features: best.features,
        images: best.images,
        reason: RecommendationService.generateReason(best, context, lang),
        isHighConfidence,
      },
    };

    // Only add bundle if user wants it OR score is high-confidence
    if (context.wantsBundle || isHighConfidence) {
      premium.bundle = {
        items: bundleItems,
        originalPrice: parseFloat(bundleTotal.toFixed(2)),
        discountPercent: BUNDLE_DISCOUNT_PERCENT,
        totalPrice: discountedTotal,
        savings: parseFloat((bundleTotal - discountedTotal).toFixed(2)),
      };
    }

    return premium;
  },
};

module.exports = OfferService;
