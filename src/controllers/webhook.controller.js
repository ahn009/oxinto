'use strict';

const twilio = require('twilio');
const axios = require('axios');
const QuestionnaireService = require('../services/questionnaire.service');
const OfferService = require('../services/offer.service');
const SessionModel = require('../models/session.model');
const formatter = require('../utils/whatsappFormatter');
const logger = require('../utils/logger');

const WebhookController = {
  // ─────────────────────────────────────────────
  //  WhatsApp (Twilio)
  // ─────────────────────────────────────────────

  /**
   * Handle incoming WhatsApp messages via Twilio webhook.
   * POST /api/webhook/whatsapp
   */
  async handleWhatsApp(req, res) {
    const { From: from, Body: body, ProfileName: name } = req.body;
    if (!from || !body) return res.status(200).send('<Response/>');

    const userId = from.replace('whatsapp:', '');
    const userInput = (body || '').trim();
    const lang = 'en'; // TODO: detect from user locale

    logger.info(`WhatsApp incoming [${userId}]: "${userInput}"`);

    try {
      const responseText = await WebhookController._processMessage(userId, 'whatsapp', userInput, lang, { name });
      await WebhookController._sendWhatsApp(from, responseText);
    } catch (err) {
      logger.error('WhatsApp handler error:', err);
      await WebhookController._sendWhatsApp(from, formatter.formatMessage('Sorry, something went wrong. Please try again.', '⚠️'));
    }

    // Always respond 200 to Twilio immediately
    res.status(200).send('<Response/>');
  },

  // ─────────────────────────────────────────────
  //  Instagram / Meta Messenger
  // ─────────────────────────────────────────────

  /**
   * Handle Meta webhook verification challenge.
   * GET /api/webhook/instagram
   */
  verifyInstagram(req, res) {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      logger.info('Instagram webhook verified');
      return res.status(200).send(challenge);
    }

    res.status(403).json({ error: 'Verification failed' });
  },

  /**
   * Handle incoming Instagram messages.
   * POST /api/webhook/instagram
   */
  async handleInstagram(req, res) {
    // Acknowledge immediately (Meta requires < 20s response)
    res.status(200).json({ status: 'ok' });

    const body = req.body;
    if (body.object !== 'page') return;

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        if (!event.message || event.message.is_echo) continue;

        const userId = event.sender.id;
        const userInput = (event.message.text || '').trim();
        const lang = 'en';

        logger.info(`Instagram incoming [${userId}]: "${userInput}"`);

        try {
          const responseText = await WebhookController._processMessage(userId, 'instagram', userInput, lang, {});
          await WebhookController._sendInstagram(userId, responseText);
        } catch (err) {
          logger.error('Instagram handler error:', err);
          await WebhookController._sendInstagram(userId, 'Sorry, something went wrong. Please try again.');
        }
      }
    }
  },

  // ─────────────────────────────────────────────
  //  Web Chat
  // ─────────────────────────────────────────────

  /**
   * Handle web chat messages.
   * POST /api/webhook/web
   */
  async handleWeb(req, res) {
    const { userId, message: userInput, sessionId, language: lang = 'en' } = req.body;

    logger.info(`Web chat [${userId}]: "${userInput}"`);

    try {
      // If sessionId provided, check if it's valid
      let session = null;
      if (sessionId) {
        session = await SessionModel.findById(sessionId);
        if (session && session.user_id !== userId) session = null; // security check
      }

      const overrideSession = session;

      const result = await WebhookController._processMessageFull(
        userId, 'web', userInput, lang, {}, overrideSession
      );

      return res.status(200).json({
        sessionId: result.sessionId,
        response: result.text,
        isComplete: result.isComplete,
        offers: result.offers || null,
        question: result.question || null,
        questionNumber: result.questionNumber,
        totalQuestions: result.totalQuestions,
      });
    } catch (err) {
      logger.error('Web handler error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ─────────────────────────────────────────────
  //  Shared Processing Logic
  // ─────────────────────────────────────────────

  /**
   * Shared message processing — returns formatted text for channel delivery.
   */
  async _processMessage(userId, channel, userInput, lang, metadata) {
    const result = await WebhookController._processMessageFull(userId, channel, userInput, lang, metadata);
    return result.text;
  },

  async _processMessageFull(userId, channel, userInput, lang, metadata, existingSession = null) {
    const lowerInput = userInput.toLowerCase();
    const isStartCommand = /^(start|iniciar|hi|hello|olá|ola|hey)$/i.test(lowerInput);
    const isResetCommand = /^(reset|restart|recomeçar|recomecar|new)$/i.test(lowerInput);

    // Handle reset
    if (isResetCommand) {
      const current = existingSession || await SessionModel.findActiveByUserChannel(userId, channel);
      if (current) await QuestionnaireService.resetSession(current.id);

      const state = await QuestionnaireService.startOrResume(userId, channel, { ...metadata, language: lang });
      const text = formatter.formatWelcome(lang);
      return { sessionId: state.session.id, text, isComplete: false, question: state.question, questionNumber: 1, totalQuestions: state.totalQuestions };
    }

    // If no active session or start command, create/resume
    if (isStartCommand || !existingSession) {
      const state = await QuestionnaireService.startOrResume(userId, channel, { ...metadata, language: lang });

      if (state.isComplete && state.recommendations) {
        // Already completed — show offers again
        const text = formatter.formatOffers(state.recommendations, lang);
        return { sessionId: state.session.id, text, isComplete: true, offers: state.recommendations, questionNumber: state.questionNumber, totalQuestions: state.totalQuestions };
      }

      const text = isStartCommand
        ? formatter.formatWelcome(lang) + '\n\n' + formatter.formatQuestion(state.question, state.questionNumber, state.totalQuestions, lang)
        : formatter.formatQuestion(state.question, state.questionNumber, state.totalQuestions, lang);

      return { sessionId: state.session.id, text, isComplete: false, question: state.question, questionNumber: state.questionNumber, totalQuestions: state.totalQuestions };
    }

    // Process answer for existing session
    const result = await QuestionnaireService.processAnswer(existingSession.id, userInput);

    if (result.invalidInput) {
      const text = formatter.formatInvalidInput(result.optionCount, lang);
      return { sessionId: existingSession.id, text, isComplete: false, question: result.question, questionNumber: result.questionNumber, totalQuestions: result.totalQuestions };
    }

    if (result.isComplete) {
      // Generate recommendations
      const offers = await OfferService.generate(existingSession.id, lang);
      const text = formatter.formatOffers(offers, lang);
      return { sessionId: existingSession.id, text, isComplete: true, offers, questionNumber: result.questionNumber, totalQuestions: result.totalQuestions };
    }

    const text = formatter.formatQuestion(result.question, result.questionNumber, result.totalQuestions, lang);
    return { sessionId: existingSession.id, text, isComplete: false, question: result.question, questionNumber: result.questionNumber, totalQuestions: result.totalQuestions };
  },

  // ─────────────────────────────────────────────
  //  Channel Delivery
  // ─────────────────────────────────────────────

  async _sendWhatsApp(to, message) {
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.NODE_ENV === 'test') {
      logger.info(`[MOCK WhatsApp -> ${to}]: ${message.substring(0, 80)}...`);
      return;
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to,
      body: message,
    });
  },

  async _sendInstagram(recipientId, message) {
    if (!process.env.META_PAGE_ACCESS_TOKEN || process.env.NODE_ENV === 'test') {
      logger.info(`[MOCK Instagram -> ${recipientId}]: ${message.substring(0, 80)}...`);
      return;
    }

    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: 'RESPONSE',
      },
      {
        params: { access_token: process.env.META_PAGE_ACCESS_TOKEN },
        timeout: 10000,
      }
    );
  },
};

module.exports = WebhookController;
