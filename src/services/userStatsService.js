/**
 * User Stats Service
 *
 * Frontend service for user statistics.
 * Makes fetch() calls to Lambda API endpoints.
 */

const API_URL = process.env.REACT_APP_LAMBDA_API_URL;

// ============================================
// XP RULES & LEVELS
// ============================================

/**
 * XP point values for different actions
 */
export const XP_RULES = {
  message: 5,
  streak3: 15,
  streak5: 30,
  streak10: 50,
  smackdown: 25, // 3+ reactions on a message
  pollVote: 5,
  pollCreate: 10,
};

/**
 * Level definitions with XP thresholds
 */
export const LEVELS = [
  { level: 1, name: 'Rookie Ranter', xpRequired: 0 },
  { level: 2, name: 'Sideline Sniper', xpRequired: 100 },
  { level: 3, name: 'Halftime Heckler', xpRequired: 300 },
  { level: 4, name: 'Fourth-Quarter Fiend', xpRequired: 600 },
  { level: 5, name: 'Hall-of-Flame', xpRequired: 1000 },
];

/**
 * Calculate the user's level based on their XP
 * @param {number} xp - The user's current XP
 * @returns {object} The level object { level, name, xpRequired }
 */
export function calculateLevel(xp) {
  // Find the highest level the user qualifies for
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Calculate bonus XP for streak milestones
 * @param {number} streakCount - The user's current streak count
 * @returns {number} Bonus XP if a milestone was hit, otherwise 0
 */
export function calculateStreakBonus(streakCount) {
  if (streakCount === 10) return XP_RULES.streak10;
  if (streakCount === 5) return XP_RULES.streak5;
  if (streakCount === 3) return XP_RULES.streak3;
  return 0;
}

/**
 * Fetch a user's stats
 * GET /user-stats?clerkUserId=xxx
 * @param {string} clerkUserId - The Clerk user ID
 * @returns {object|null} User stats or null if not found
 */
export async function getUserStats(clerkUserId) {
  if (!clerkUserId) {
    console.error('getUserStats: clerkUserId is required');
    return null;
  }

  try {
    const response = await fetch(
      `${API_URL}/user-stats?clerkUserId=${encodeURIComponent(clerkUserId)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('User stats loaded:', data);
    return data.stats || null;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}

/**
 * Update specific fields in a user's stats
 * POST /user-stats (body: { clerkUserId, updates })
 * @param {string} clerkUserId - The Clerk user ID
 * @param {object} updates - Fields to update
 * @returns {object|null} Updated stats or null on error
 */
export async function updateUserStats(clerkUserId, updates) {
  if (!clerkUserId) {
    console.error('updateUserStats: clerkUserId is required');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/user-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkUserId, updates }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('User stats updated:', data);
    return data.stats || null;
  } catch (error) {
    console.error('Error updating user stats:', error);
    return null;
  }
}

/**
 * Increment a user's XP and recalculate level
 * POST /user-stats/xp (body: { clerkUserId, amount })
 * @param {string} clerkUserId - The Clerk user ID
 * @param {number} amount - Amount of XP to add
 * @returns {object|null} Updated stats with new XP and level
 */
export async function incrementXP(clerkUserId, amount) {
  if (!clerkUserId) {
    console.error('incrementXP: clerkUserId is required');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/user-stats/xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkUserId, amount }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('XP incremented:', data);
    return data.stats || null;
  } catch (error) {
    console.error('Error incrementing XP:', error);
    return null;
  }
}

/**
 * Get leaderboard of top users by XP
 * GET /leaderboard?limit=10
 * @param {number} limit - Number of users to return (default 10)
 * @returns {Array} Array of user stats sorted by XP descending
 */
export async function getLeaderboard(limit = 10) {
  try {
    const response = await fetch(`${API_URL}/leaderboard?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`Leaderboard loaded: ${data.leaderboard?.length || 0} users`);
    return data.leaderboard || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}
