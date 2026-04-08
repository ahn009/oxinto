'use strict';

/**
 * Multi-category questionnaire.
 * Flow: Category → 3 category-specific branch questions → Budget → Urgency → Freetext
 */
const questionnaire = {
  version: '2.0',

  questions: [
    // ── ENTRY: Category ──────────────────────────────────────────
    {
      id: 'q_category',
      text: { en: 'What are you shopping for today?' },
      type: 'multiple_choice',
      options: {
        en: [
          'Electronics & Gadgets',
          'Fashion & Accessories',
          'Home & Kitchen',
          'Health & Beauty',
          'Entertainment & Hobbies',
          'Grocery & Daily Essentials',
        ],
      },
      tags: {
        0: ['electronics'], 1: ['fashion'], 2: ['home'],
        3: ['health'], 4: ['entertainment'], 5: ['grocery'],
      },
      branchOn: {
        0: ['q_elec_sub',    'q_elec_use',       'q_elec_brand'],
        1: ['q_fashion_sub', 'q_fashion_style',   'q_fashion_fit'],
        2: ['q_home_sub',    'q_home_size',        'q_home_style'],
        3: ['q_health_sub',  'q_health_concern',   'q_health_type'],
        4: ['q_entertain_sub','q_entertain_setting','q_entertain_level'],
        5: ['q_grocery_sub', 'q_grocery_diet',     'q_grocery_freq'],
      },
    },

    // ── ELECTRONICS ──────────────────────────────────────────────
    {
      id: 'q_elec_sub',
      text: { en: 'Which electronics category are you interested in?' },
      type: 'multiple_choice',
      options: { en: ['Smartphones, Laptops & Tablets', 'Headphones, Earbuds & Smartwatches', 'Gaming Consoles & VR', 'Cameras & Drones'] },
      tags: { 0: ['mobile', 'computing'], 1: ['audio', 'wearables'], 2: ['gaming', 'vr'], 3: ['photography', 'drones'] },
    },
    {
      id: 'q_elec_use',
      text: { en: 'What will you mainly use it for?' },
      type: 'multiple_choice',
      options: { en: ['Work & Productivity', 'Gaming & Entertainment', 'Casual & Social', 'Professional / Creative'] },
      tags: { 0: ['professional', 'productivity'], 1: ['gaming'], 2: ['casual'], 3: ['creative', 'professional'] },
    },
    {
      id: 'q_elec_brand',
      text: { en: 'Do you have a brand or ecosystem preference?' },
      type: 'multiple_choice',
      options: { en: ['Apple / iOS ecosystem', 'Samsung / Android', 'Best value — any brand', 'Best specs — any brand'] },
      tags: { 0: ['apple', 'ios'], 1: ['samsung', 'android'], 2: ['value'], 3: ['premium', 'specs'] },
    },

    // ── FASHION & ACCESSORIES ────────────────────────────────────
    {
      id: 'q_fashion_sub',
      text: { en: 'What type of fashion item are you looking for?' },
      type: 'multiple_choice',
      options: { en: ['Clothing (T-shirts, Jackets, Jeans)', 'Shoes & Sneakers', 'Watches & Jewelry', 'Bags & Wallets'] },
      tags: { 0: ['clothing'], 1: ['footwear'], 2: ['accessories', 'jewelry'], 3: ['bags', 'accessories'] },
    },
    {
      id: 'q_fashion_style',
      text: { en: 'Which style best matches you?' },
      type: 'multiple_choice',
      options: { en: ['Casual & Everyday', 'Formal & Business', 'Sportswear & Athletic', 'Streetwear & Trendy'] },
      tags: { 0: ['casual'], 1: ['formal'], 2: ['sport', 'athletic'], 3: ['streetwear', 'trendy'] },
    },
    {
      id: 'q_fashion_fit',
      text: { en: 'What fit or size do you prefer?' },
      type: 'multiple_choice',
      options: { en: ['Slim / Fitted', 'Regular / Standard', 'Oversized / Relaxed', 'Not sure — help me choose'] },
      tags: { 0: ['slim'], 1: ['regular'], 2: ['oversized'], 3: [] },
    },

    // ── HOME & KITCHEN ───────────────────────────────────────────
    {
      id: 'q_home_sub',
      text: { en: 'Which home category are you browsing?' },
      type: 'multiple_choice',
      options: { en: ['Kitchen Appliances', 'Furniture (Sofa, Desk, Bed)', 'Home Decor (Lamps, Rugs, Art)'] },
      tags: { 0: ['appliances', 'kitchen'], 1: ['furniture'], 2: ['decor'] },
    },
    {
      id: 'q_home_size',
      text: { en: 'How much space do you have?' },
      type: 'multiple_choice',
      options: { en: ['Small / Compact', 'Medium', 'Large / Spacious', 'Not sure'] },
      tags: { 0: ['compact', 'small'], 1: ['medium'], 2: ['large', 'spacious'], 3: [] },
    },
    {
      id: 'q_home_style',
      text: { en: 'Which interior style do you prefer?' },
      type: 'multiple_choice',
      options: { en: ['Modern & Minimalist', 'Rustic & Classic', 'Industrial & Bold', 'Scandinavian & Cosy'] },
      tags: { 0: ['modern', 'minimalist'], 1: ['rustic', 'classic'], 2: ['industrial'], 3: ['scandinavian', 'cosy'] },
    },

    // ── HEALTH & BEAUTY ──────────────────────────────────────────
    {
      id: 'q_health_sub',
      text: { en: 'Which health & beauty area interests you?' },
      type: 'multiple_choice',
      options: { en: ['Skincare (Cleansers, Moisturizers)', 'Haircare (Shampoo, Conditioner, Oils)', 'Fitness Gear (Mats, Dumbbells)', 'Vitamins & Supplements'] },
      tags: { 0: ['skincare'], 1: ['haircare'], 2: ['fitness', 'gym'], 3: ['supplements', 'vitamins'] },
    },
    {
      id: 'q_health_concern',
      text: { en: 'What is your main concern or goal?' },
      type: 'multiple_choice',
      options: { en: ['Anti-aging & Glow', 'Acne & Oily Skin', 'Dry or Sensitive Skin / Hair', 'Performance & Strength'] },
      tags: { 0: ['anti-aging', 'glow'], 1: ['acne', 'oily'], 2: ['dry', 'sensitive'], 3: ['performance', 'strength'] },
    },
    {
      id: 'q_health_type',
      text: { en: 'Do you prefer natural/organic or science-based products?' },
      type: 'multiple_choice',
      options: { en: ['Natural & Organic', 'Science-based & Clinical', 'Most effective wins', 'Cruelty-free & Vegan only'] },
      tags: { 0: ['natural', 'organic'], 1: ['clinical', 'science'], 2: ['effective'], 3: ['vegan', 'cruelty-free'] },
    },

    // ── ENTERTAINMENT & HOBBIES ──────────────────────────────────
    {
      id: 'q_entertain_sub',
      text: { en: 'What type of entertainment or hobby product?' },
      type: 'multiple_choice',
      options: { en: ['Books, eBooks & Comics', 'Board Games & Puzzles', 'Musical Instruments', 'Sports Equipment'] },
      tags: { 0: ['books', 'reading'], 1: ['games', 'puzzles'], 2: ['music', 'instruments'], 3: ['sports', 'outdoor'] },
    },
    {
      id: 'q_entertain_setting',
      text: { en: 'Do you prefer indoor or outdoor activities?' },
      type: 'multiple_choice',
      options: { en: ['Indoor only', 'Outdoor only', 'Both indoor & outdoor', "Doesn't matter"] },
      tags: { 0: ['indoor'], 1: ['outdoor'], 2: ['indoor', 'outdoor'], 3: [] },
    },
    {
      id: 'q_entertain_level',
      text: { en: "What's your experience level?" },
      type: 'multiple_choice',
      options: { en: ['Complete beginner', 'Intermediate', 'Advanced / Expert', 'Buying as a gift'] },
      tags: { 0: ['beginner', 'starter'], 1: ['intermediate'], 2: ['advanced', 'expert'], 3: ['gift'] },
    },

    // ── GROCERY & DAILY ESSENTIALS ───────────────────────────────
    {
      id: 'q_grocery_sub',
      text: { en: 'Which grocery category?' },
      type: 'multiple_choice',
      options: { en: ['Snacks & Beverages', 'Organic & Health Foods', 'Household Cleaning Products', 'Pet Supplies'] },
      tags: { 0: ['snacks', 'beverages'], 1: ['organic', 'health-food'], 2: ['cleaning', 'household'], 3: ['pets'] },
    },
    {
      id: 'q_grocery_diet',
      text: { en: 'Do you have any dietary restrictions?' },
      type: 'multiple_choice',
      options: { en: ['None — anything goes', 'Vegan / Vegetarian', 'Gluten-free', 'Dairy-free'] },
      tags: { 0: [], 1: ['vegan', 'vegetarian'], 2: ['gluten-free'], 3: ['dairy-free'] },
    },
    {
      id: 'q_grocery_freq',
      text: { en: 'How often do you need this product?' },
      type: 'multiple_choice',
      options: { en: ['Daily', 'Weekly', 'Monthly / Bulk buy', 'One-time purchase'] },
      tags: { 0: ['daily', 'frequent'], 1: ['weekly'], 2: ['bulk'], 3: ['one-time'] },
    },

    // ── COMMON (always shown) ────────────────────────────────────
    {
      id: 'q_budget',
      text: { en: 'What is your budget range?' },
      type: 'multiple_choice',
      options: { en: ['Under $25', '$25 – $75', '$75 – $200', '$200+'] },
      budgetRanges: [
        { min: 0,   max: 25  },
        { min: 25,  max: 75  },
        { min: 75,  max: 200 },
        { min: 200, max: Infinity },
      ],
      tags: { 0: ['budget'], 1: ['mid-range'], 2: ['premium'], 3: ['luxury'] },
      branchOn: { 3: 'q_bundle' },
    },
    {
      id: 'q_bundle',
      text: { en: 'Since your budget is $200+, would you like a complete bundle (product + accessories)?' },
      type: 'multiple_choice',
      optional: true,
      options: { en: ['Yes, bundle me up!', 'No, just the main product'] },
      tags: { 0: ['bundle', 'luxury'], 1: ['luxury'] },
    },
    {
      id: 'q_urgency',
      text: { en: 'How soon do you need this?' },
      type: 'multiple_choice',
      options: { en: ['Today (express delivery)', 'This week', 'Next month', 'Just browsing'] },
      tags: { 0: ['urgent', 'express'], 1: ['standard'], 2: ['flexible'], 3: ['browsing'] },
    },
    {
      id: 'q_specific',
      text: { en: 'Any specific requirements or preferences? (optional)' },
      type: 'text',
      optional: true,
      placeholder: { en: 'e.g., waterproof, specific color, certain brand, size...' },
    },
  ],

  /**
   * Build ordered question flow, inserting category-specific branch questions.
   * Supports single branch ID (string) or multiple (array) per answer index.
   */
  getFlow(responses = []) {
    const branchIds = new Set();
    for (const q of this.questions) {
      if (q.branchOn) {
        Object.values(q.branchOn).forEach((v) => [].concat(v).forEach((id) => branchIds.add(id)));
      }
    }

    const base = this.questions.filter((q) => !branchIds.has(q.id));
    const flow = [];

    for (const q of base) {
      flow.push(q);
      if (q.branchOn) {
        const answer = responses.find((r) => r.questionId === q.id);
        if (answer !== undefined && answer.answerIndex !== null) {
          const branchVal = q.branchOn[answer.answerIndex];
          if (branchVal !== undefined) {
            [].concat(branchVal).forEach((id) => {
              const bq = this.questions.find((bq) => bq.id === id);
              if (bq) flow.push(bq);
            });
          }
        }
      }
    }

    return flow;
  },
};

module.exports = questionnaire;
