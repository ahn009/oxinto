'use strict';

/**
 * Formats messages and recommendation offers for WhatsApp/Twilio.
 * WhatsApp supports basic markdown: *bold*, _italic_, ~strikethrough~
 */

/**
 * Format a question for WhatsApp delivery.
 * @param {Object} question - Question object from questionnaire config
 * @param {number} questionNumber - Current question number (1-based)
 * @param {number} totalQuestions - Total questions in flow
 * @param {string} lang - Language code ('en' | 'pt')
 * @returns {string} Formatted message body
 */
function formatQuestion(question, questionNumber, totalQuestions, lang = 'en') {
  const text = question.text[lang] || question.text.en;
  const options = question.options ? question.options[lang] || question.options.en : null;

  let message = `📋 *Question ${questionNumber}/${totalQuestions}*\n\n${text}`;

  if (question.type === 'multiple_choice' && options) {
    message += '\n\n';
    options.forEach((option, idx) => {
      message += `${idx + 1}. ${option}\n`;
    });
    message += '\n_Reply with the number of your choice_';
  } else if (question.type === 'text') {
    const placeholder = question.placeholder ? question.placeholder[lang] || question.placeholder.en : '';
    if (placeholder) {
      message += `\n\n_${placeholder}_`;
    }
    if (question.optional) {
      message += '\n_(You can skip this by typing "skip")_';
    }
  }

  return message;
}

/**
 * Format 3-tier recommendation offers for WhatsApp.
 * @param {Object} offers - { basic, intermediate, premium } tier objects
 * @param {string} lang - Language code
 * @returns {string} Formatted message
 */
function formatOffers(offers, lang = 'en') {
  const labels = {
    en: {
      header: '🎯 *Your Personalized Recommendations*',
      basic: '🟢 *BASIC OPTION*',
      intermediate: '🔵 *INTERMEDIATE OPTIONS*',
      premium: '⭐ *PREMIUM RECOMMENDATION*',
      price: 'Price',
      score: 'Match',
      bundle: '🎁 Bundle includes',
      discount: 'Bundle discount',
      contact: 'To order, reply with *ORDER [product name]* or visit our website.',
    },
    pt: {
      header: '🎯 *Suas Recomendações Personalizadas*',
      basic: '🟢 *OPÇÃO BÁSICA*',
      intermediate: '🔵 *OPÇÕES INTERMEDIÁRIAS*',
      premium: '⭐ *RECOMENDAÇÃO PREMIUM*',
      price: 'Preço',
      score: 'Compatibilidade',
      bundle: '🎁 Pacote inclui',
      discount: 'Desconto do pacote',
      contact: 'Para pedir, responda com *PEDIR [nome do produto]* ou visite nosso site.',
    },
  };

  const t = labels[lang] || labels.en;
  let message = `${t.header}\n\n`;

  // Basic tier
  if (offers.basic && offers.basic.length > 0) {
    message += `${t.basic}\n`;
    offers.basic.forEach((p) => {
      message += `• *${p.name}* - $${p.price}\n`;
      if (p.description) message += `  ${p.description}\n`;
    });
    message += '\n';
  }

  // Intermediate tier
  if (offers.intermediate && offers.intermediate.length > 0) {
    message += `${t.intermediate}\n`;
    offers.intermediate.forEach((p) => {
      message += `• *${p.name}* - $${p.price} (${t.score}: ${p.score}%)\n`;
      if (p.reason) message += `  _${p.reason}_\n`;
    });
    message += '\n';
  }

  // Premium tier
  if (offers.premium) {
    message += `${t.premium}\n`;
    message += `🏆 *${offers.premium.product.name}* - $${offers.premium.product.price}\n`;
    if (offers.premium.product.description) {
      message += `${offers.premium.product.description}\n`;
    }
    if (offers.premium.bundle) {
      message += `\n${t.bundle}:\n`;
      offers.premium.bundle.items.forEach((item) => {
        message += `  + ${item}\n`;
      });
      message += `💰 ${t.discount}: ${offers.premium.bundle.discountPercent}% OFF\n`;
      message += `Total: $${offers.premium.bundle.totalPrice}\n`;
    }
    message += '\n';
  }

  message += `---\n${t.contact}`;
  return message;
}

/**
 * Format a simple text message with optional emoji prefix.
 */
function formatMessage(text, emoji = '') {
  return emoji ? `${emoji} ${text}` : text;
}

/**
 * Format welcome/greeting message.
 */
function formatWelcome(lang = 'en') {
  const messages = {
    en: `👋 *Welcome to Smart Product Advisor!*\n\nI'll help you find the perfect product by asking a few quick questions.\n\nThis will take about 2 minutes. Ready? Type *START* to begin!`,
    pt: `👋 *Bem-vindo ao Smart Product Advisor!*\n\nVou ajudá-lo a encontrar o produto perfeito fazendo algumas perguntas rápidas.\n\nIsso levará cerca de 2 minutos. Pronto? Digite *INICIAR* para começar!`,
  };
  return messages[lang] || messages.en;
}

/**
 * Format session timeout message.
 */
function formatTimeout(lang = 'en') {
  const messages = {
    en: `⏰ Your session has expired due to inactivity.\n\nType *START* to begin a new product search!`,
    pt: `⏰ Sua sessão expirou por inatividade.\n\nDigite *INICIAR* para começar uma nova busca de produto!`,
  };
  return messages[lang] || messages.en;
}

/**
 * Format error/invalid input message.
 */
function formatInvalidInput(optionCount, lang = 'en') {
  const messages = {
    en: `❌ Invalid choice. Please reply with a number between 1 and ${optionCount}.`,
    pt: `❌ Escolha inválida. Por favor, responda com um número entre 1 e ${optionCount}.`,
  };
  return messages[lang] || messages.en;
}

module.exports = {
  formatQuestion,
  formatOffers,
  formatMessage,
  formatWelcome,
  formatTimeout,
  formatInvalidInput,
};
