/**
 * ScoreTracker Component
 *
 * PURPOSE: Displays the current game score in a prominent bar.
 * Shows both teams, their scores, the current period/quarter,
 * and possession indicator (for football).
 *
 * PROPS:
 * - gameScore: Object containing:
 *   - homeTeam: { name, score, logo }
 *   - awayTeam: { name, score, logo }
 *   - period: string (e.g., "Q2", "3rd", "Top 5")
 *   - possession: string or null (team name that has possession)
 *   - sport: "football" | "basketball" | "baseball"
 * - onToggleControls: Function to toggle the score controls panel
 * - showControls: Boolean - whether controls are currently visible
 */

function ScoreTracker({ gameScore, onToggleControls, showControls }) {
  console.log('ScoreTracker rendered:', gameScore);

  // Destructure for easier access
  const { homeTeam, awayTeam, period, possession, sport } = gameScore;

  // Determine which team is winning (for highlighting)
  const homeWinning = homeTeam.score > awayTeam.score;
  const awayWinning = awayTeam.score > homeTeam.score;
  const isTied = homeTeam.score === awayTeam.score;

  // Get sport-specific ball emoji
  const getSportEmoji = () => {
    switch (sport) {
      case 'football': return '🏈';
      case 'basketball': return '🏀';
      case 'baseball': return '⚾';
      default: return '🏈';
    }
  };

  return (
    <div className="score-tracker">
      {/* Main score display */}
      <div className="score-display">
        {/* Home Team */}
        <div className={`team-score home-team ${homeWinning ? 'winning' : ''}`}>
          <span className="team-logo">{homeTeam.logo}</span>
          <span className="team-name">{homeTeam.name}</span>
          <span className="score">{homeTeam.score}</span>
        </div>

        {/* Center section: VS and period */}
        <div className="score-center">
          <span className="versus">-</span>
          <span className="period">{period}</span>
          {isTied && <span className="tied-badge">TIED</span>}
        </div>

        {/* Away Team */}
        <div className={`team-score away-team ${awayWinning ? 'winning' : ''}`}>
          <span className="score">{awayTeam.score}</span>
          <span className="team-name">{awayTeam.name}</span>
          <span className="team-logo">{awayTeam.logo}</span>
        </div>
      </div>

      {/* Possession indicator (football only) */}
      {sport === 'football' && possession && (
        <div className="possession-indicator">
          <span className="possession-ball">{getSportEmoji()}</span>
          <span className="possession-text">{possession} has possession</span>
        </div>
      )}

      {/* Edit Score button */}
      <button
        className={`edit-score-button ${showControls ? 'active' : ''}`}
        onClick={onToggleControls}
      >
        {showControls ? 'Hide Controls' : 'Edit Score'}
      </button>
    </div>
  );
}

export default ScoreTracker;
