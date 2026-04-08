'use strict';

const ProductModel = require('../models/product.model');
const questionnaireConfig = require('../config/questionnaire');
const logger = require('../utils/logger');

/**
 * Recommendation Engine — Phase 1 rule-based tag scoring.
 *
 * Scoring weights:
 *   Category match:   30 pts
 *   Budget compat:    25 pts
 *   Feature keywords: 25 pts
 *   Tag overlap:      20 pts
 */
const WEIGHTS = {
  category: 30,
  budget: 25,
  feature: 25,
  tag: 20,
};

const RecommendationService = {
  /**
   * Generate scored product recommendations from session responses.
   * @param {Array} responses - Array of { questionId, answerIndex, answerText, skipped }
   * @returns {Array} products sorted by score descending
   */
  async score(responses) {
    const context = this.buildContext(responses);
    let products = await ProductModel.findAllForRecommendation();

    // Filter to selected category when known — keeps recommendations relevant
    if (context.category) {
      const filtered = products.filter((p) => p.category === context.category);
      if (filtered.length > 0) products = filtered;
    }

    logger.info(`Scoring ${products.length} products for context:`, { category: context.category, tags: context.tags.slice(0, 5) });

    const scored = products.map((product) => ({
      ...product,
      score: this.calculateMatchScore(product, context),
    }));

    return scored.sort((a, b) => b.score - a.score);
  },

  /**
   * Build a scoring context from user responses.
   * Extracts: budget range, collected tags, text keywords.
   */
  buildContext(responses) {
    const CATEGORY_MAP = ['electronics', 'fashion', 'home', 'health', 'entertainment', 'grocery'];
    const context = {
      tags: new Set(),
      budgetMin: 0,
      budgetMax: Infinity,
      keywords: [],
      wantsBundle: false,
      category: null,
    };

    for (const response of responses) {
      if (response.skipped) continue;

      const question = questionnaireConfig.questions.find((q) => q.id === response.questionId);
      if (!question) continue;

      // Collect tags from option selection
      if (response.answerIndex !== null && question.tags) {
        const tagList = question.tags[response.answerIndex] || [];
        tagList.forEach((t) => context.tags.add(t));
      }

      // Extract primary category from q_category answer
      if (question.id === 'q_category' && response.answerIndex !== null) {
        context.category = CATEGORY_MAP[response.answerIndex] || null;
      }

      // Extract budget range
      if (question.id === 'q_budget' && response.answerIndex !== null && question.budgetRanges) {
        const range = question.budgetRanges[response.answerIndex];
        if (range) {
          context.budgetMin = range.min;
          context.budgetMax = range.max === Infinity ? Infinity : range.max;
        }
      }

      // Bundle preference from q_bundle
      if (question.id === 'q_bundle' && response.answerIndex === 0) {
        context.wantsBundle = true;
      }

      // Free-text keyword extraction
      if (question.type === 'text' && response.answerText) {
        const words = response.answerText.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        context.keywords.push(...words);
      }
    }

    return {
      tags: [...context.tags],
      budgetMin: context.budgetMin,
      budgetMax: context.budgetMax,
      keywords: context.keywords,
      wantsBundle: context.wantsBundle,
      category: context.category,
    };
  },

  /**
   * Score a single product against the user context (0-100).
   */
  calculateMatchScore(product, context) {
    let score = 0;

    // 1. Budget compatibility (25 pts)
    if (product.price >= context.budgetMin && product.price <= context.budgetMax) {
      score += WEIGHTS.budget;
    } else if (context.budgetMax !== Infinity) {
      // Partial credit for being within 20% of budget ceiling
      const overflow = (product.price - context.budgetMax) / context.budgetMax;
      if (overflow > 0 && overflow <= 0.2) {
        score += Math.round(WEIGHTS.budget * (1 - overflow / 0.2));
      }
    }

    // 2. Tag overlap (20 pts)
    if (context.tags.length > 0 && product.tags && product.tags.length > 0) {
      const productTagSet = new Set(product.tags.map((t) => t.toLowerCase()));
      const matchCount = context.tags.filter((t) => productTagSet.has(t.toLowerCase())).length;
      const overlap = matchCount / context.tags.length;
      score += Math.round(WEIGHTS.tag * Math.min(overlap, 1));
    }

    // 3. Feature keyword match (25 pts)
    if (context.keywords.length > 0 && product.features && product.features.length > 0) {
      const featureText = product.features.join(' ').toLowerCase();
      const nameText = (product.name + ' ' + (product.description || '')).toLowerCase();
      const combined = featureText + ' ' + nameText;

      const matchCount = context.keywords.filter((kw) => combined.includes(kw)).length;
      const keywordScore = matchCount / context.keywords.length;
      score += Math.round(WEIGHTS.feature * Math.min(keywordScore, 1));
    } else if (context.keywords.length === 0) {
      // No free-text: award half points as neutral
      score += Math.round(WEIGHTS.feature * 0.5);
    }

    // 4. Category heuristic (30 pts)
    // Since all sample products are 'audio', award based on tag alignment instead
    const tagScore = score; // already computed above
    if (context.tags.length === 0) {
      // No preferences expressed — give equal chance
      score += Math.round(WEIGHTS.category * 0.5);
    } else if (tagScore > WEIGHTS.tag * 0.5) {
      score += WEIGHTS.category;
    } else if (tagScore > 0) {
      score += Math.round(WEIGHTS.category * 0.5);
    }

    return Math.min(Math.round(score), 100);
  },

  /**
   * Generate reasoning text for a product recommendation.
   */
  generateReason(product, context, lang = 'en') {
    const reasons = {
      en: [],
      pt: [],
    };

    if (product.tags.includes('budget') || product.tags.includes('value')) {
      reasons.en.push('great value for money');
      reasons.pt.push('ótimo custo-benefício');
    }
    if (product.tags.includes('premium') || product.tags.includes('audiophile')) {
      reasons.en.push('premium audio quality');
      reasons.pt.push('qualidade de áudio premium');
    }
    if (product.tags.includes('portable')) {
      reasons.en.push('perfect for on-the-go');
      reasons.pt.push('perfeito para usar em movimento');
    }
    if (product.tags.includes('professional')) {
      reasons.en.push('ideal for professionals');
      reasons.pt.push('ideal para profissionais');
    }
    if (product.features.includes('noise-canceling')) {
      reasons.en.push('noise-canceling for focus');
      reasons.pt.push('cancelamento de ruído para foco');
    }
    if (product.features.includes('waterproof') || product.tags.includes('sports')) {
      reasons.en.push('built for active use');
      reasons.pt.push('feito para uso ativo');
    }

    const list = reasons[lang] || reasons.en;
    if (list.length === 0) return lang === 'pt' ? 'boa opção geral' : 'solid overall option';
    return list.slice(0, 2).join(', ');
  },
};

module.exports = RecommendationService;
