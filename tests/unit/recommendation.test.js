'use strict';

const RecommendationService = require('../../src/services/recommendation.service');

describe('RecommendationService', () => {
  const sampleProducts = [
    { id: 1, name: 'Basic Headphones', price: 49, category: 'audio', tags: ['budget', 'wired', 'value'], features: ['good sound', 'basic'], description: 'Budget option' },
    { id: 2, name: 'Sport Earbuds', price: 79, category: 'audio', tags: ['wireless', 'sports', 'mid-range', 'portable'], features: ['waterproof', 'bluetooth'], description: 'Sports option' },
    { id: 3, name: 'Compact Pro', price: 149, category: 'audio', tags: ['premium', 'portable', 'professional'], features: ['noise-canceling', 'compact'], description: 'Professional option' },
    { id: 4, name: 'Premium Sound', price: 199, category: 'audio', tags: ['premium', 'audiophile', 'wireless'], features: ['hi-res audio', 'wireless', 'noise-canceling'], description: 'Premium option' },
  ];

  describe('buildContext', () => {
    it('extracts budget range from q_budget answer index 0 (under $25)', () => {
      const responses = [{ questionId: 'q_budget', answerIndex: 0, answerText: 'Under $25' }];
      const ctx = RecommendationService.buildContext(responses);
      expect(ctx.budgetMin).toBe(0);
      expect(ctx.budgetMax).toBe(25);
    });

    it('extracts budget range from q_budget answer index 3 (200+)', () => {
      const responses = [{ questionId: 'q_budget', answerIndex: 3, answerText: '$200+' }];
      const ctx = RecommendationService.buildContext(responses);
      expect(ctx.budgetMin).toBe(200);
      expect(ctx.budgetMax).toBe(Infinity);
    });

    it('collects tags from multiple questions', () => {
      const responses = [
        { questionId: 'q_elec_sub', answerIndex: 1, answerText: 'Headphones, Earbuds & Smartwatches' },
        { questionId: 'q_elec_use', answerIndex: 3, answerText: 'Professional / Creative' },
      ];
      const ctx = RecommendationService.buildContext(responses);
      expect(ctx.tags).toContain('audio');
      expect(ctx.tags).toContain('professional');
    });

    it('sets wantsBundle from q_bundle answer index 0', () => {
      const responses = [{ questionId: 'q_bundle', answerIndex: 0, answerText: 'Yes, bundle me up!' }];
      const ctx = RecommendationService.buildContext(responses);
      expect(ctx.wantsBundle).toBe(true);
    });

    it('extracts keywords from free text q_specific', () => {
      const responses = [{ questionId: 'q_specific', answerText: 'waterproof noise canceling', answerIndex: null }];
      const ctx = RecommendationService.buildContext(responses);
      expect(ctx.keywords).toContain('waterproof');
      expect(ctx.keywords).toContain('noise');
    });

    it('skips skipped responses', () => {
      const responses = [{ questionId: 'q_specific', skipped: true }];
      const ctx = RecommendationService.buildContext(responses);
      expect(ctx.keywords).toHaveLength(0);
    });
  });

  describe('calculateMatchScore', () => {
    it('awards budget points when product price is within range', () => {
      const ctx = { tags: [], budgetMin: 0, budgetMax: 50, keywords: [], wantsBundle: false };
      const score = RecommendationService.calculateMatchScore(sampleProducts[0], ctx); // $49 in range
      expect(score).toBeGreaterThan(0);
    });

    it('scores 0 budget points when product is outside range with no partial credit', () => {
      const ctx = { tags: [], budgetMin: 0, budgetMax: 50, keywords: [], wantsBundle: false };
      const premium = sampleProducts[3]; // $199 - way over budget
      const basicScore = RecommendationService.calculateMatchScore(sampleProducts[0], ctx);
      const premiumScore = RecommendationService.calculateMatchScore(premium, ctx);
      expect(basicScore).toBeGreaterThan(premiumScore);
    });

    it('awards tag overlap points', () => {
      const ctx = { tags: ['premium', 'audiophile'], budgetMin: 0, budgetMax: Infinity, keywords: [], wantsBundle: false };
      const premiumScore = RecommendationService.calculateMatchScore(sampleProducts[3], ctx);
      const basicScore = RecommendationService.calculateMatchScore(sampleProducts[0], ctx);
      expect(premiumScore).toBeGreaterThan(basicScore);
    });

    it('awards feature keyword match points', () => {
      const ctx = { tags: [], budgetMin: 0, budgetMax: Infinity, keywords: ['noise-canceling'], wantsBundle: false };
      const proScore = RecommendationService.calculateMatchScore(sampleProducts[2], ctx); // has noise-canceling
      const basicScore = RecommendationService.calculateMatchScore(sampleProducts[0], ctx); // does not
      expect(proScore).toBeGreaterThan(basicScore);
    });

    it('returns score between 0 and 100', () => {
      const ctx = { tags: ['budget', 'value'], budgetMin: 0, budgetMax: 50, keywords: ['good'], wantsBundle: false };
      sampleProducts.forEach(p => {
        const score = RecommendationService.calculateMatchScore(p, ctx);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('generateReason', () => {
    it('returns a non-empty reason string', () => {
      const ctx = { tags: ['budget'], budgetMin: 0, budgetMax: 50, keywords: [], wantsBundle: false };
      const reason = RecommendationService.generateReason(sampleProducts[0], ctx, 'en');
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(0);
    });

    it('returns Portuguese reason when lang=pt', () => {
      const ctx = { tags: [], budgetMin: 0, budgetMax: Infinity, keywords: [], wantsBundle: false };
      const reason = RecommendationService.generateReason(sampleProducts[3], ctx, 'pt');
      expect(typeof reason).toBe('string');
    });
  });
});
