'use strict';

const ProductModel = require('../models/product.model');
const questionnaireConfig = require('../config/questionnaire');
const logger = require('../utils/logger');

/**
 * Recommendation Engine — rule-based tag scoring with per-user differentiation.
 *
 * Scoring weights:
 *   Category match:   35 pts
 *   Budget compat:    25 pts
 *   Tag overlap:      25 pts  (+10 bonus if overlap > 60%)
 *   Feature keywords: 15 pts  (0 if user skipped free-text question)
 *
 * Penalties:
 *   Price > 30% over budget ceiling: -20 pts
 */
const WEIGHTS = {
  category: 35,
  budget: 25,
  tag: 25,
  feature: 15,
};

/**
 * Minimal suffix stemmer so "running" matches "runner", "run", etc.
 */
function stem(word) {
  return word
    .replace(/ners?$/, 'n')
    .replace(/ing$/, '')
    .replace(/ers?$/, '')
    .replace(/tion$/, '')
    .replace(/s$/, '');
}

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
   * Extracts: budget range, collected tags, text keywords, category.
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
      hasFreetextResponse: false,
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

      // Free-text keyword extraction with stemming
      if (question.type === 'text' && response.answerText) {
        context.hasFreetextResponse = true;
        const words = response.answerText.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        context.keywords.push(...words.map(stem));
      }
    }

    return {
      tags: [...context.tags],
      budgetMin: context.budgetMin,
      budgetMax: context.budgetMax,
      keywords: context.keywords,
      wantsBundle: context.wantsBundle,
      category: context.category,
      hasFreetextResponse: context.hasFreetextResponse,
    };
  },

  /**
   * Score a single product against the user context (0-100).
   */
  calculateMatchScore(product, context) {
    let score = 0;

    // 1. Category match (35 pts)
    if (context.category) {
      if (product.category === context.category) {
        score += WEIGHTS.category;
      }
      // No category match → 0 pts (category filter usually handles this already)
    } else {
      // No category expressed — award half as neutral
      score += Math.round(WEIGHTS.category * 0.5);
    }

    // 2. Budget compatibility (25 pts) with penalty for expensive items
    if (product.price >= context.budgetMin && product.price <= context.budgetMax) {
      score += WEIGHTS.budget;
    } else if (product.price < context.budgetMin) {
      // Product is cheaper than the user's stated minimum — no budget points
    } else if (context.budgetMax !== Infinity && product.price > context.budgetMax) {
      const overflow = (product.price - context.budgetMax) / context.budgetMax;
      if (overflow > 0.3) {
        // More than 30% over budget ceiling — apply penalty
        score -= 20;
      } else if (overflow <= 0.2) {
        // Partial credit for being within 20% over
        score += Math.round(WEIGHTS.budget * (1 - overflow / 0.2));
      }
      // Between 20-30% over: no points, no penalty
    }

    // 3. Tag overlap (25 pts) with bonus for high overlap
    if (context.tags.length > 0 && product.tags && product.tags.length > 0) {
      const productTagSet = new Set(product.tags.map((t) => t.toLowerCase()));
      const matchCount = context.tags.filter((t) => productTagSet.has(t.toLowerCase())).length;
      const overlap = matchCount / context.tags.length;
      score += Math.round(WEIGHTS.tag * Math.min(overlap, 1));
      if (overlap > 0.6) {
        score += 10; // bonus for strong tag alignment
      }
    } else if (context.tags.length === 0) {
      score += Math.round(WEIGHTS.tag * 0.5);
    }

    // 4. Feature keyword match (15 pts) — 0 if user skipped free-text (q_specific)
    if (context.hasFreetextResponse && context.keywords.length > 0) {
      if (product.features && product.features.length > 0) {
        const featureText = product.features.join(' ').toLowerCase();
        const nameText = (product.name + ' ' + (product.description || '')).toLowerCase();
        const combined = featureText + ' ' + nameText;
        const stemmedTokens = combined.split(/\s+/).map(stem);

        const matchCount = context.keywords.filter((kw) => stemmedTokens.includes(stem(kw))).length;
        const keywordScore = matchCount / context.keywords.length;
        score += Math.round(WEIGHTS.feature * Math.min(keywordScore, 1));
      }
    }
    // If no free-text response: fall back to category + tag scoring only (feature = 0)

    return Math.min(Math.max(Math.round(score), 0), 100);
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
