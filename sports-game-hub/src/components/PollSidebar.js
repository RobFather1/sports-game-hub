/**
 * PollSidebar Component
 *
 * PURPOSE: Displays the polls section on the right side of the screen.
 * Shows active polls where users can vote, and collapsed past polls.
 * Has a "Create Poll" button to open the poll creation form.
 *
 * PROPS:
 * - polls: Array of all poll objects
 * - userVotes: Object tracking which polls the user has voted on { pollId: optionId }
 * - currentUser: The current user's username
 * - onCreatePoll: Function to open the create poll form
 * - onVote: Function called when user votes on a poll
 * - onClosePoll: Function called when poll creator closes a poll
 */

import { useState } from 'react';

function PollSidebar({ polls, userVotes, currentUser, onCreatePoll, onVote, onClosePoll }) {
  // Track which past polls are expanded (to show details)
  const [expandedPastPolls, setExpandedPastPolls] = useState({});

  // Debug log
  console.log('PollSidebar rendered with', polls.length, 'polls');

  // Separate active polls from closed (past) polls
  const activePolls = polls.filter(poll => poll.status === 'active');
  const pastPolls = polls.filter(poll => poll.status === 'closed');

  /**
   * Calculates the percentage of votes for each option
   * @param {Object} poll - The poll to calculate percentages for
   * @returns {Array} - Options with added 'percentage' property
   */
  const calculatePercentages = (poll) => {
    if (poll.totalVotes === 0) {
      // If no votes yet, all options have 0%
      return poll.options.map(opt => ({ ...opt, percentage: 0 }));
    }
    return poll.options.map(opt => ({
      ...opt,
      percentage: Math.round((opt.votes / poll.totalVotes) * 100)
    }));
  };

  /**
   * Finds the winning option (highest votes) in a closed poll
   * @param {Object} poll - The poll to check
   * @returns {number} - The ID of the winning option
   */
  const getWinningOptionId = (poll) => {
    if (poll.totalVotes === 0) return null;
    let maxVotes = 0;
    let winnerId = null;
    poll.options.forEach(opt => {
      if (opt.votes > maxVotes) {
        maxVotes = opt.votes;
        winnerId = opt.id;
      }
    });
    return winnerId;
  };

  /**
   * Toggle whether a past poll is expanded
   */
  const togglePastPoll = (pollId) => {
    setExpandedPastPolls(prev => ({
      ...prev,
      [pollId]: !prev[pollId]
    }));
  };

  /**
   * Renders a single poll card
   * @param {Object} poll - The poll to render
   * @param {boolean} isPast - Whether this is a past (closed) poll
   */
  const renderPollCard = (poll, isPast = false) => {
    const optionsWithPercentage = calculatePercentages(poll);
    const userVotedOption = userVotes[poll.id]; // Which option did user vote for?
    const winningOptionId = isPast ? getWinningOptionId(poll) : null;
    const isCreator = poll.createdBy === currentUser;

    return (
      <div
        key={poll.id}
        className={`poll-card ${isPast ? 'poll-closed' : 'poll-active'}`}
      >
        {/* Poll Question */}
        <h4 className="poll-question">{poll.question}</h4>

        {/* Poll Creator and Time */}
        <p className="poll-meta">
          by {poll.createdBy} at {poll.createdAt}
        </p>

        {/* Poll Options */}
        <div className="poll-options">
          {optionsWithPercentage.map(option => {
            const isUserVote = userVotedOption === option.id;
            const isWinner = winningOptionId === option.id;
            const hasVoted = userVotedOption !== undefined;

            return (
              <button
                key={option.id}
                className={`poll-option
                  ${isUserVote ? 'user-voted' : ''}
                  ${isWinner ? 'winner' : ''}
                  ${hasVoted || isPast ? 'voted' : ''}`}
                onClick={() => {
                  // Only allow voting if poll is active and user hasn't voted
                  if (!isPast && !hasVoted) {
                    console.log('Voting for option:', option.text);
                    onVote(poll.id, option.id);
                  }
                }}
                disabled={isPast || hasVoted}
              >
                {/* Option text and checkmark if voted */}
                <span className="option-text">
                  {isUserVote && <span className="checkmark">✓ </span>}
                  {isWinner && <span className="winner-icon">🏆 </span>}
                  {option.text}
                </span>

                {/* Vote count and percentage (always show after voting) */}
                {(hasVoted || isPast) && (
                  <span className="option-stats">
                    {option.votes} votes ({option.percentage}%)
                  </span>
                )}

                {/* Percentage bar (visual) */}
                {(hasVoted || isPast) && (
                  <div
                    className="percentage-bar"
                    style={{ width: `${option.percentage}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Total votes */}
        <p className="poll-total-votes">
          Total: {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
        </p>

        {/* Close Poll button (only for creator of active polls) */}
        {!isPast && isCreator && (
          <button
            className="close-poll-button"
            onClick={() => {
              console.log('Closing poll:', poll.id);
              onClosePoll(poll.id);
            }}
          >
            Close Poll
          </button>
        )}

        {/* Status badge for closed polls */}
        {isPast && (
          <span className="poll-status-badge">Closed</span>
        )}
      </div>
    );
  };

  return (
    <div className="poll-sidebar">
      {/* Header with Create Poll button */}
      <div className="poll-sidebar-header">
        <h3>Polls</h3>
        <button className="create-poll-button" onClick={onCreatePoll}>
          + Create Poll
        </button>
      </div>

      {/* Active Polls Section */}
      <div className="polls-section">
        <h4 className="polls-section-title">Active Polls</h4>
        {activePolls.length === 0 ? (
          <p className="no-polls">No active polls. Create one!</p>
        ) : (
          activePolls.map(poll => renderPollCard(poll, false))
        )}
      </div>

      {/* Past Polls Section (Collapsible) */}
      {pastPolls.length > 0 && (
        <div className="polls-section past-polls-section">
          <h4 className="polls-section-title">Past Polls ({pastPolls.length})</h4>
          {pastPolls.map(poll => (
            <div key={poll.id}>
              {/* Collapsed header - click to expand */}
              <button
                className="past-poll-header"
                onClick={() => togglePastPoll(poll.id)}
              >
                <span>{poll.question}</span>
                <span>{expandedPastPolls[poll.id] ? '▼' : '▶'}</span>
              </button>

              {/* Expanded content */}
              {expandedPastPolls[poll.id] && renderPollCard(poll, true)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PollSidebar;
