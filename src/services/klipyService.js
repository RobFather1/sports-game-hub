/**
 * Klipy API Service
 *
 * PURPOSE: Provides functions to interact with the Klipy API for sports clips,
 * GIFs, and stickers. Handles search, trending content, and URL validation.
 *
 * FEATURES:
 * - Search for content by query
 * - Get trending sports clips and GIFs
 * - Validate Klipy CDN URLs for security
 * - Format API responses to simplified structure
 *
 * API Documentation: https://docs.klipy.com/
 * Get API key: https://partner.klipy.com/api-keys
 */

const KLIPY_API_KEY = process.env.REACT_APP_KLIPY_API_KEY;
const KLIPY_BASE_URL = 'https://api.klipy.com/api/v1';
const RESULTS_PER_PAGE = 25; // Number of items to fetch per request

/**
 * Valid Klipy CDN domains for URL validation
 * Only allow content from these trusted domains
 */
const VALID_KLIPY_DOMAINS = [
  'cdn.klipy.com',
  'media.klipy.com',
  'assets.klipy.com',
  'klipy.com',
  // Add more CDN domains as discovered
];

/**
 * Search for content (GIFs, Clips, Stickers) based on query string
 * @param {string} query - Search term (e.g., "touchdown", "celebration", "basketball")
 * @param {number} page - Page number for pagination (default: 0)
 * @returns {Promise<Array>} Array of formatted content objects
 */
export async function searchContent(query, page = 0) {
  if (!KLIPY_API_KEY) {
    console.error('Klipy API key not configured. Add REACT_APP_KLIPY_API_KEY to .env');
    return [];
  }

  if (!query || query.trim() === '') {
    console.log('Empty search query, returning trending content instead');
    return getTrendingContent(page);
  }

  try {
    // Build search URL with query parameters
    const url = `${KLIPY_BASE_URL}/${KLIPY_API_KEY}/search?q=${encodeURIComponent(query)}&page=${page}&per_page=${RESULTS_PER_PAGE}`;

    console.log(`Searching Klipy for: "${query}" (page ${page})`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Klipy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Klipy API returns data in a 'data' field
    console.log('Full Klipy search response:', JSON.stringify(data));
    const items = data.data?.data || data.data || [];
    console.log(`Found ${items.length} results for "${query}"`);

    return formatContentResults(items);
  } catch (error) {
    console.error('Error searching Klipy content:', error);
    return [];
  }
}

/**
 * Fetch trending content (sports highlights, GIFs)
 * Uses AI localization to show relevant local content
 * @param {number} page - Page number for pagination (default: 0)
 * @returns {Promise<Array>} Array of formatted content objects
 */
export async function getTrendingContent(page = 0) {
  if (!KLIPY_API_KEY) {
    console.error('Klipy API key not configured. Add REACT_APP_KLIPY_API_KEY to .env');
    return [];
  }

  try {
    // Build trending URL
    const url = `${KLIPY_BASE_URL}/${KLIPY_API_KEY}/trending?page=${page}&per_page=${RESULTS_PER_PAGE}`;

    console.log(`Fetching trending Klipy content (page ${page})`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Klipy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Klipy API returns data in a 'data' field
    console.log('Full Klipy trending response:', JSON.stringify(data));
    const items = data.data?.data || data.data || [];
    console.log(`Loaded ${items.length} trending items`);

    return formatContentResults(items);
  } catch (error) {
    console.error('Error fetching trending Klipy content:', error);
    return [];
  }
}

/**
 * Format Klipy API results to a simplified structure
 * Extracts only the fields we need for display
 * @param {Array} items - Raw Klipy API response data
 * @returns {Array} Formatted content objects
 */
function formatContentResults(items) {
  if (!Array.isArray(items)) {
    console.warn('Expected array of items from Klipy API, got:', typeof items);
    return [];
  }

  return items.map(item => {
    // Determine content type (prefer GIF format for consistency)
    const contentType = item.type || 'gif';

    // Extract file URLs (Klipy provides multiple formats)
    const gifUrl = item.gif || item.file?.gif || item.images?.original?.url || '';
    const mp4Url = item.mp4 || item.file?.mp4 || item.images?.original?.mp4 || '';
    const webpUrl = item.webp || item.file?.webp || '';

    // Use GIF URL as primary, fallback to MP4 if GIF not available
    const primaryUrl = gifUrl || mp4Url || webpUrl;

    if (!primaryUrl) {
      console.warn('No valid media URL found for Klipy item:', item.id);
      return null;
    }

    return {
      id: item.id || item.slug,
      title: item.title || 'Sports content',
      slug: item.slug || item.id,
      url: primaryUrl, // Primary URL for display (GIF format preferred)
      gifUrl: gifUrl,
      mp4Url: mp4Url,
      webpUrl: webpUrl,
      type: contentType,
      // Use fixed dimensions or extract from response
      width: item.width || item.images?.original?.width || 400,
      height: item.height || item.images?.original?.height || 300,
      // Preview URL for grid display (smaller size)
      previewUrl: item.file?.gif || gifUrl || primaryUrl,
    };
  }).filter(Boolean); // Remove any null entries
}

/**
 * Validate that a URL is from Klipy's CDN (security check)
 * Prevents XSS attacks via malicious image/video URLs
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is from Klipy CDN
 */
export function isValidKlipyUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Check if hostname matches any valid Klipy domain
    const isValid = VALID_KLIPY_DOMAINS.some(domain => {
      // Allow exact match or subdomain
      return urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`);
    });

    if (!isValid) {
      console.warn('Rejected non-Klipy URL:', url);
    }

    return isValid;
  } catch (error) {
    console.error('Invalid URL format:', url, error);
    return false;
  }
}

/**
 * Get content categories (optional - for future filtering)
 * Allows filtering by sports type (football, basketball, etc.)
 * @returns {Promise<Array>} Array of category objects
 */
export async function getCategories() {
  if (!KLIPY_API_KEY) {
    console.error('Klipy API key not configured');
    return [];
  }

  try {
    const url = `${KLIPY_BASE_URL}/${KLIPY_API_KEY}/categories`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Klipy categories loaded:', data.data?.length || 0);

    return data.data || [];
  } catch (error) {
    console.error('Error fetching Klipy categories:', error);
    return [];
  }
}
