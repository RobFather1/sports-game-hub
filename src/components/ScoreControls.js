/**
 * ScoreControls Component
 *
 * PURPOSE: A collapsible control panel for editing the game score.
 * Provides sport-specific score buttons, period selection,
 * and possession toggle (for football).
 *
 * PROPS:
 * - gameScore: Current game score object
 * - isVisible: Boolean - whether the panel is shown
 * - onUpdateScore: Function called with (team, points) to update score
 * - onSetPeriod: Function called with (period) to change period
 * - onTogglePossession: Function to toggle possession between teams
 * - onResetScore: Function to reset the score to 0-0
 */

// Sport-specific scoring options
const SCORE_BUTTONS = {
  football: [
    { label: '+3', points: 3, description: 'Field Goal' },
    { label: '+6', points: 6, description: 'Touchdown' },
    { label: '+7', points: 7, description: 'TD + Extra Point' },
    { label: '+1', points: 1, description: 'Extra Point/Safety' },
    { label: '+2', points: 2, description: '2-Pt Conversion' },
  ],
  basketball: [
    { label: '+1', points: 1, description: 'Free Throw' },
    { label: '+2', points: 2, description: 'Field Goal' },
    { label: '+3', points: 3, description: '3-Pointer' },
  ],
  baseball: [
    { label: '+1', points: 1, description: 'Run' },
  ],
};

// Sport-specific periods
const PERIODS = {
  football: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  basketball: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  baseball: [
    'Top 1', 'Bot 1', 'Top 2', 'Bot 2', 'Top 3', 'Bot 3',
    'Top 4', 'Bot 4', 'Top 5', 'Bot 5', 'Top 6', 'Bot 6',
    'Top 7', 'Bot 7', 'Top 8', 'Bot 8', 'Top 9', 'Bot 9',
    'Extra',
  ],
};

function ScoreControls({
  gameScore,
  isVisible,
  onUpdateScore,
  onSetPeriod,
  onTogglePossession,
  onResetScore,
}) {
  console.log('ScoreControls rendered, visible:', isVisible);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const { homeTeam, awayTeam, period, possession, sport } = gameScore;
  const scoreButtons = SCORE_BUTTONS[sport] || SCORE_BUTTONS.football;
  const periods = PERIODS[sport] || PERIODS.football;

  /**
   * Renders score buttons for a specific team
   */
  const renderScoreButtons = (team, teamName) => (
    <div className="team-controls">
      <h4 className="team-controls-title">{teamName}</h4>
      <div className="score-buttons">
        {scoreButtons.map((btn) => (
          <button
            key={`${teamName}-${btn.points}`}
            className="score-button"
            onClick={() => {
              console.log(`Adding ${btn.points} to ${teamName}`);
              onUpdateScore(team, btn.points);
            }}
            title={btn.description}
          >
            {btn.label}
          </button>
        ))}
        {/* Subtract button */}
        <button
          className="score-button subtract"
          onClick={() => {
            if (team === 'home' && homeTeam.score > 0) {
              onUpdateScore(team, -1);
            } else if (team === 'away' && awayTeam.score > 0) {
              onUpdateScore(team, -1);
            }
          }}
          title="Subtract 1 point"
        >
          -1
        </button>
      </div>
    </div>
  );

  return (
    <div className="score-controls">
      {/* Score adjustment section */}
      <div className="score-controls-teams">
        {renderScoreButtons('home', homeTeam.name)}
        {renderScoreButtons('away', awayTeam.name)}
      </div>

      {/* Period/Quarter selection */}
      <div className="period-controls">
        <label htmlFor="period-select">Period:</label>
        <select
          id="period-select"
          className="period-select"
          value={period}
          onChange={(e) => {
            console.log('Changing period to:', e.target.value);
            onSetPeriod(e.target.value);
          }}
        >
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Possession toggle (football only) */}
      {sport === 'football' && (
        <div className="possession-controls">
          <label>Possession:</label>
          <div className="possession-buttons">
            <button
              className={`possession-button ${possession === homeTeam.name ? 'active' : ''}`}
              onClick={() => {
                if (possession !== homeTeam.name) {
                  onTogglePossession();
                }
              }}
            >
              {homeTeam.name}
            </button>
            <button
              className={`possession-button ${possession === awayTeam.name ? 'active' : ''}`}
              onClick={() => {
                if (possession !== awayTeam.name) {
                  onTogglePossession();
                }
              }}
            >
              {awayTeam.name}
            </button>
          </div>
        </div>
      )}

      {/* Reset button */}
      <button
        className="reset-score-button"
        onClick={() => {
          if (window.confirm('Are you sure you want to reset the score to 0-0?')) {
            console.log('Resetting score');
            onResetScore();
          }
        }}
      >
        Reset Score
      </button>
    </div>
  );
}

export default ScoreControls;
