/**
 * LeaderboardSidebar Component
 *
 * PURPOSE: Displays top users ranked by XP in the right sidebar.
 * Fetches data from the leaderboard API and highlights the current user.
 *
 * PROPS:
 * - currentUser: The current user's username (for highlighting their row)
 */

import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard, calculateLevel } from '../services/userStatsService';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function LeaderboardSidebar({ currentUser }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(10);
      setEntries(data);
    } catch (err) {
      setError('Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="leaderboard-sidebar">
      {/* Header */}
      <div className="leaderboard-header">
        <h3>Leaderboard</h3>
        <button
          className="leaderboard-refresh-btn"
          onClick={fetchLeaderboard}
          disabled={loading}
          aria-label="Refresh leaderboard"
        >
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {/* Content */}
      <div className="leaderboard-content">
        {loading && (
          <p className="leaderboard-loading">Loading...</p>
        )}

        {!loading && error && (
          <p className="leaderboard-error">{error}</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="leaderboard-empty">No data yet. Start chatting to earn XP!</p>
        )}

        {!loading && !error && entries.length > 0 && (
          <ol className="leaderboard-list">
            {entries.map((entry, index) => {
              const levelInfo = calculateLevel(entry.xp || 0);
              const isCurrentUser = entry.username === currentUser;
              const medal = RANK_MEDALS[index];

              return (
                <li
                  key={entry.clerkUserId || index}
                  className={`leaderboard-row${isCurrentUser ? ' is-current-user' : ''}`}
                >
                  <span className="leaderboard-rank">
                    {medal ? (
                      <span className="rank-medal">{medal}</span>
                    ) : (
                      <span className="rank-number">{index + 1}</span>
                    )}
                  </span>

                  <span className="leaderboard-user-info">
                    <span className="leaderboard-username">
                      {entry.username || 'Unknown'}
                      {isCurrentUser && <span className="leaderboard-you-tag"> (you)</span>}
                    </span>
                    <span className="leaderboard-level-name">{levelInfo.name}</span>
                  </span>

                  <span className="leaderboard-xp">{entry.xp || 0} XP</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

export default LeaderboardSidebar;
