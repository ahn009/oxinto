'use strict';

const QuestionnaireService = require('../../src/services/questionnaire.service');
const config = require('../../src/config/questionnaire');

describe('QuestionnaireService', () => {
  describe('parseAnswer - multiple_choice', () => {
    const question = config.questions.find(q => q.id === 'q_category');

    it('accepts valid numeric choice "1"', () => {
      const result = QuestionnaireService.parseAnswer(question, '1', 'en');
      expect(result.invalid).toBe(false);
      expect(result.index).toBe(0);
    });

    it('accepts valid numeric choice "3"', () => {
      const result = QuestionnaireService.parseAnswer(question, '3', 'en');
      expect(result.invalid).toBe(false);
      expect(result.index).toBe(2);
    });

    it('rejects out-of-range number', () => {
      const result = QuestionnaireService.parseAnswer(question, '99', 'en');
      expect(result.invalid).toBe(true);
    });

    it('rejects zero', () => {
      const result = QuestionnaireService.parseAnswer(question, '0', 'en');
      expect(result.invalid).toBe(true);
    });

    it('accepts full option text (case-insensitive)', () => {
      const options = question.options.en;
      const result = QuestionnaireService.parseAnswer(question, options[0].toUpperCase(), 'en');
      expect(result.invalid).toBe(false);
      expect(result.index).toBe(0);
    });

    it('rejects gibberish input', () => {
      const result = QuestionnaireService.parseAnswer(question, 'xyzabc', 'en');
      expect(result.invalid).toBe(true);
    });
  });

  describe('parseAnswer - text', () => {
    const textQuestion = config.questions.find(q => q.type === 'text');

    it('accepts any non-empty text', () => {
      const result = QuestionnaireService.parseAnswer(textQuestion, 'waterproof please', 'en');
      expect(result.invalid).toBe(false);
      expect(result.text).toBe('waterproof please');
    });

    it('accepts "skip" for optional text questions', () => {
      const result = QuestionnaireService.parseAnswer(textQuestion, 'skip', 'en');
      expect(result.skipped).toBe(true);
      expect(result.invalid).toBe(false);
    });

    it('accepts "pular" (Portuguese skip) for optional questions', () => {
      const result = QuestionnaireService.parseAnswer(textQuestion, 'pular', 'pt');
      expect(result.skipped).toBe(true);
    });
  });

  describe('questionnaire flow', () => {
    it('has correct base question count', () => {
      const flow = config.getFlow([]);
      // Base questions: q_category, q_budget, q_urgency, q_specific (q_bundle is branch)
      expect(flow.length).toBe(4);
    });

    it('inserts branch question q_bundle when budget is $200+', () => {
      const responses = [
        { questionId: 'q_budget', answerIndex: 3 }, // $200+ triggers q_bundle
      ];
      const flow = config.getFlow(responses);
      const hasBundle = flow.some(q => q.id === 'q_bundle');
      expect(hasBundle).toBe(true);
      expect(flow.length).toBe(5);
    });

    it('does NOT insert q_bundle for budget under $200', () => {
      const responses = [
        { questionId: 'q_budget', answerIndex: 0 }, // Under $25 — no branch
      ];
      const flow = config.getFlow(responses);
      const hasBundle = flow.some(q => q.id === 'q_bundle');
      expect(hasBundle).toBe(false);
    });
  });
});
