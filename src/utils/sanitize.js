/**
 * Sanitization utilities for user input
 *
 * Prevents XSS attacks by escaping potentially dangerous characters
 * in user-generated content before display.
 */

/**
 * HTML entity map for escaping dangerous characters
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML special characters in a string to prevent XSS
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text safe for display
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Sanitizes a message object, escaping the text and username fields
 * @param {object} message - Message object with text and username
 * @returns {object} - Message with sanitized fields
 */
export function sanitizeMessage(message) {
  if (!message || typeof message !== 'object') {
    return message;
  }
  return {
    ...message,
    text: sanitizeText(message.text),
    username: sanitizeText(message.username),
  };
}

/**
 * Trims and limits message length to prevent abuse
 * @param {string} text - The input text
 * @param {number} maxLength - Maximum allowed length (default 500)
 * @returns {string} - Trimmed and length-limited text
 */
export function normalizeMessageInput(text, maxLength = 500) {
  if (typeof text !== 'string') {
    return '';
  }
  return text.trim().slice(0, maxLength);
}
