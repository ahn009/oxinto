'use strict';

const OfferService = require('../../src/services/offer.service');
const RecommendationService = require('../../src/services/recommendation.service');

describe('OfferService', () => {
  const sampleScored = [
    { id: 4, name: 'Premium Sound', price: 199, tags: ['premium', 'audiophile'], features: ['hi-res audio', 'wireless', 'noise-canceling'], description: 'Best option', images: [], score: 92 },
    { id: 3, name: 'Compact Pro', price: 149, tags: ['premium', 'portable'], features: ['noise-canceling', 'compact'], description: 'Pro option', images: [], score: 78 },
    { id: 2, name: 'Sport Earbuds', price: 79, tags: ['wireless', 'sports'], features: ['waterproof', 'bluetooth'], description: 'Sport option', images: [], score: 61 },
    { id: 1, name: 'Basic Headphones', price: 49, tags: ['budget', 'wired'], features: ['good sound'], description: 'Basic option', images: [], score: 45 },
  ];

  describe('buildBasicTier', () => {
    it('returns at most 2 products', () => {
      const result = OfferService.buildBasicTier(sampleScored, 'en');
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('filters out products below 50% score', () => {
      const result = OfferService.buildBasicTier(sampleScored, 'en');
      result.forEach(p => expect(p.score).toBeGreaterThanOrEqual(50));
    });

    it('sorts by price ascending (cheapest first)', () => {
      const result = OfferService.buildBasicTier(sampleScored, 'en');
      for (let i = 1; i < result.length; i++) {
        expect(result[i].price).toBeGreaterThanOrEqual(result[i - 1].price);
      }
    });

    it('returns empty array when no products meet threshold', () => {
      const lowScored = sampleScored.map(p => ({ ...p, score: 10 }));
      const result = OfferService.buildBasicTier(lowScored, 'en');
      expect(result).toHaveLength(0);
    });
  });

  describe('buildIntermediateTier', () => {
    const ctx = { tags: ['premium'], budgetMin: 100, budgetMax: 200, keywords: [], wantsBundle: false };

    it('returns at most 4 products', () => {
      const result = OfferService.buildIntermediateTier(sampleScored, ctx, 'en');
      expect(result.length).toBeLessThanOrEqual(4);
    });

    it('includes reason field for each product', () => {
      const result = OfferService.buildIntermediateTier(sampleScored, ctx, 'en');
      result.forEach(p => {
        expect(typeof p.reason).toBe('string');
        expect(p.reason.length).toBeGreaterThan(0);
      });
    });
  });

  describe('buildPremiumTier', () => {
    const ctx = { tags: ['premium'], budgetMin: 150, budgetMax: 250, keywords: [], wantsBundle: true };

    it('returns null when scored list is empty', () => {
      const result = OfferService.buildPremiumTier([], ctx, 'en');
      expect(result).toBeNull();
    });

    it('returns the highest-scored product', () => {
      const result = OfferService.buildPremiumTier(sampleScored, ctx, 'en');
      expect(result.product.id).toBe(sampleScored[0].id);
    });

    it('includes bundle when wantsBundle=true', () => {
      const result = OfferService.buildPremiumTier(sampleScored, ctx, 'en');
      expect(result.bundle).toBeDefined();
      expect(result.bundle.discountPercent).toBe(10);
      expect(result.bundle.totalPrice).toBeLessThan(result.bundle.originalPrice);
    });

    it('bundle totalPrice is correctly discounted', () => {
      const result = OfferService.buildPremiumTier(sampleScored, ctx, 'en');
      const expected = parseFloat((result.bundle.originalPrice * 0.9).toFixed(2));
      expect(result.bundle.totalPrice).toBeCloseTo(expected, 1);
    });

    it('marks isHighConfidence when score >= 85', () => {
      const result = OfferService.buildPremiumTier(sampleScored, ctx, 'en');
      expect(result.product.isHighConfidence).toBe(true); // score=92
    });

    it('isHighConfidence=false when score < 85', () => {
      const lowScored = [{ ...sampleScored[0], score: 70 }];
      const ctx2 = { ...ctx, wantsBundle: false };
      const result = OfferService.buildPremiumTier(lowScored, ctx2, 'en');
      expect(result.product.isHighConfidence).toBe(false);
    });
  });
});
