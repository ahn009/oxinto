'use strict';

const config = require('../config/questionnaire');
const SessionModel = require('../models/session.model');
const logger = require('../utils/logger');

const MAX_INVALID_ATTEMPTS = 3;

/**
 * Questionnaire Service — manages the dynamic question flow and session state.
 */
const QuestionnaireService = {
  /**
   * Get or create a session, return the current question.
   * @param {string} userId - Platform-specific user ID
   * @param {string} channel - 'whatsapp' | 'instagram' | 'web'
   * @param {Object} metadata - Optional extra data (e.g., phone number, username)
   * @returns {{ session, question, questionNumber, totalQuestions, isComplete }}
   */
  async startOrResume(userId, channel, metadata = {}) {
    let session = await SessionModel.findActiveByUserChannel(userId, channel);

    if (!session) {
      session = await SessionModel.create({ userId, channel, metadata });
      logger.info(`New session created: ${session.id} [${channel}] user=${userId}`);
    } else {
      logger.info(`Resumed session: ${session.id} [${channel}] user=${userId}`);
    }

    return this.getCurrentState(session);
  },

  /**
   * Process a user's answer to the current question.
   * Handles validation, re-prompting (max 3 attempts), and progression.
   * @param {string} sessionId
   * @param {string} userInput - Raw text input from the user
   * @returns {{ session, nextQuestion, questionNumber, totalQuestions, isComplete, invalidInput, recommendations }}
   */
  async processAnswer(sessionId, userInput) {
    const session = await SessionModel.findById(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    if (session.completed) {
      return { isComplete: true, session, recommendations: session.recommendations };
    }

    const flow = config.getFlow(session.responses);
    const currentQ = flow[session.current_question_index];

    if (!currentQ) {
      return { isComplete: true, session, recommendations: session.recommendations };
    }

    // Validate and parse the answer
    const parsed = this.parseAnswer(currentQ, userInput, session.metadata.language || 'en');

    if (parsed.invalid) {
      // Track invalid attempts in metadata
      const attempts = (session.metadata.invalidAttempts || 0) + 1;

      if (attempts >= MAX_INVALID_ATTEMPTS) {
        // Skip optional question after max attempts, fail on required
        if (currentQ.optional) {
          return this.advanceQuestion(session, { questionId: currentQ.id, answerText: null, answerIndex: null, skipped: true });
        }
        // Reset attempt count but re-ask
        await SessionModel.update(sessionId, { metadata: { ...session.metadata, invalidAttempts: 0 } });
      } else {
        await SessionModel.update(sessionId, { metadata: { ...session.metadata, invalidAttempts: attempts } });
      }

      return {
        invalidInput: true,
        optionCount: currentQ.options ? (currentQ.options.en || currentQ.options).length : 0,
        attemptsRemaining: MAX_INVALID_ATTEMPTS - attempts,
        session,
        question: currentQ,
        questionNumber: session.current_question_index + 1,
        totalQuestions: flow.length,
      };
    }

    // Valid input — advance
    return this.advanceQuestion(session, {
      questionId: currentQ.id,
      answerText: parsed.text,
      answerIndex: parsed.index,
      skipped: parsed.skipped || false,
    });
  },

  /**
   * Advance session to next question after a valid answer.
   */
  async advanceQuestion(session, answerData) {
    const newResponses = [...session.responses, answerData];

    // Recompute flow with updated responses (branching may add questions)
    const flow = config.getFlow(newResponses);
    const nextIndex = session.current_question_index + 1;
    const isComplete = nextIndex >= flow.length;

    const updates = {
      responses: newResponses,
      current_question_index: nextIndex,
      completed: isComplete,
      metadata: { ...session.metadata, invalidAttempts: 0 },
    };

    if (isComplete) {
      updates.completed = true;
    }

    const updatedSession = await SessionModel.update(session.id, updates);
    const state = this.getCurrentState(updatedSession);

    return { ...state, justAnswered: answerData };
  },

  /**
   * Reset a session (user wants to start over).
   */
  async resetSession(sessionId) {
    await SessionModel.delete(sessionId);
    logger.info(`Session reset: ${sessionId}`);
  },

  /**
   * Get current state summary for a session.
   */
  getCurrentState(session) {
    const flow = config.getFlow(session.responses);
    const currentQ = flow[session.current_question_index];
    const isComplete = session.completed || session.current_question_index >= flow.length;

    return {
      session,
      question: currentQ || null,
      questionNumber: session.current_question_index + 1,
      totalQuestions: flow.length,
      isComplete,
      recommendations: session.recommendations || null,
    };
  },

  /**
   * Parse and validate user input for a question.
   * @returns {{ index, text, invalid, skipped }}
   */
  parseAnswer(question, input, lang = 'en') {
    const trimmed = (input || '').trim();

    if (question.optional && /^(skip|pular|no|não|nao)$/i.test(trimmed)) {
      return { skipped: true, text: null, index: null, invalid: false };
    }

    if (question.type === 'text') {
      if (!trimmed && !question.optional) return { invalid: true };
      return { text: trimmed || null, index: null, invalid: false };
    }

    if (question.type === 'multiple_choice') {
      const options = question.options[lang] || question.options.en;
      const num = parseInt(trimmed);

      if (!isNaN(num) && num >= 1 && num <= options.length) {
        return { index: num - 1, text: options[num - 1], invalid: false };
      }

      // Accept full option text (case-insensitive)
      const idx = options.findIndex((o) => o.toLowerCase() === trimmed.toLowerCase());
      if (idx !== -1) {
        return { index: idx, text: options[idx], invalid: false };
      }

      return { invalid: true };
    }

    return { text: trimmed, index: null, invalid: false };
  },
};

module.exports = QuestionnaireService;
