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

/**
 * Allowed domains for media content (GIFs)
 */
const ALLOWED_MEDIA_DOMAINS = [
  'media.giphy.com',
  'giphy.com',
  'i.giphy.com',
  'media0.giphy.com',
  'media1.giphy.com',
  'media2.giphy.com',
  'media3.giphy.com',
  'media4.giphy.com',
  'tenor.com',
  'media.tenor.com',
  'c.tenor.com',
  'klipy.com',
  'static.klipy.com',
];

/**
 * Validates and sanitizes media URLs to prevent malicious content
 * @param {object} media - Media object with url, type, and alt properties
 * @returns {object|null} - Sanitized media object or null if invalid
 */
export function sanitizeMedia(media) {
  console.log('🔍 sanitizeMedia input:', media);

  // Check if media exists and is an object
  if (!media || typeof media !== 'object') {
    console.log('❌ Media validation failed: not an object');
    return null;
  }

  // Validate media type
  if (media.type !== 'gif') {
    console.log('❌ Media validation failed: type is not gif, got:', media.type);
    return null;
  }

  // Validate URL
  if (typeof media.url !== 'string' || !media.url) {
    console.log('❌ Media validation failed: invalid URL');
    return null;
  }

  try {
    const url = new URL(media.url);

    // Only allow HTTPS protocol
    if (url.protocol !== 'https:') {
      console.log('❌ Media validation failed: not HTTPS, got:', url.protocol);
      return null;
    }

    // Check if domain is in allowed list
    const isAllowedDomain = ALLOWED_MEDIA_DOMAINS.some(domain =>
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );

    if (!isAllowedDomain) {
      console.log('❌ Media validation failed: domain not allowed:', url.hostname);
      return null;
    }

    // Return sanitized media object
    const sanitized = {
      type: 'gif',
      url: media.url,
      alt: sanitizeText(media.alt || 'GIF'),
    };
    console.log('✅ Media sanitized successfully:', sanitized);
    return sanitized;
  } catch (error) {
    // Invalid URL format
    console.log('❌ Media validation failed: URL parse error:', error.message);
    return null;
  }
}

/**
 * Sanitizes a message with media content
 * @param {object} message - Message object with text, username, and optional media
 * @returns {object} - Message with sanitized fields
 */
export function sanitizeMessageWithMedia(message) {
  if (!message || typeof message !== 'object') {
    return message;
  }

  // Start with basic text/username sanitization
  const sanitized = {
    ...message,
    text: sanitizeText(message.text),
    username: sanitizeText(message.username),
  };

  // Sanitize media if present
  if (message.media) {
    const sanitizedMedia = sanitizeMedia(message.media);
    if (sanitizedMedia) {
      sanitized.media = sanitizedMedia;
    } else {
      // Remove invalid media
      delete sanitized.media;
    }
  }

  return sanitized;
}
