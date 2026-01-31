/**
 * ReactionBar Component
 *
 * PURPOSE: Displays a row of emoji reaction buttons below the message input.
 * Users can click an emoji to send a quick reaction to the chat.
 * Each button shows a count of reactions in the last 30 seconds.
 *
 * PROPS:
 * - reactionCounts: Object with emoji counts { '🔥': 5, '👍': 3, ... }
 * - onReaction: Function called with (emoji) when user clicks a reaction
 */

import { useState } from 'react';

// Define our reaction emojis with their meanings
const REACTIONS = [
  { emoji: '🔥', label: 'Fire', description: "That was hot!" },
  { emoji: '👍', label: 'Thumbs Up', description: 'Good play' },
  { emoji: '😮', label: 'Wow', description: "Can't believe that!" },
  { emoji: '💪', label: 'Flex', description: 'Strong move!' },
  { emoji: '😂', label: 'Laugh', description: 'That was funny!' },
];

function ReactionBar({ reactionCounts, onReaction }) {
  // Track which button was just clicked (for animation)
  const [activeEmoji, setActiveEmoji] = useState(null);

  // Track floating emojis for animation (array of { id, emoji, x, y })
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  console.log('ReactionBar rendered, counts:', reactionCounts);

  /**
   * Handles clicking a reaction button
   * - Triggers the click animation
   * - Creates a floating emoji animation
   * - Calls the parent's onReaction function
   */
  const handleReactionClick = (emoji, event) => {
    console.log('Reaction clicked:', emoji);

    // Set active for animation (brief glow effect)
    setActiveEmoji(emoji);
    setTimeout(() => setActiveEmoji(null), 300); // Reset after 300ms

    // Create floating emoji animation
    // Get button position for starting point
    const rect = event.currentTarget.getBoundingClientRect();
    const floatingId = Date.now();

    // Add floating emoji
    setFloatingEmojis(prev => [
      ...prev,
      {
        id: floatingId,
        emoji: emoji,
        x: rect.left + rect.width / 2,
        y: rect.top,
      }
    ]);

    // Remove floating emoji after animation completes (1 second)
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(f => f.id !== floatingId));
    }, 1000);

    // Tell parent component about the reaction
    onReaction(emoji);
  };

  return (
    <div className="reaction-bar">
      {/* Label */}
      <span className="reaction-label">Quick Reactions:</span>

      {/* Reaction buttons */}
      <div className="reaction-buttons">
        {REACTIONS.map(({ emoji, label, description }) => (
          <button
            key={emoji}
            className={`reaction-button ${activeEmoji === emoji ? 'active' : ''}`}
            onClick={(e) => handleReactionClick(emoji, e)}
            title={description}
            aria-label={`${label} reaction - ${description}`}
          >
            {/* The emoji itself */}
            <span className="reaction-emoji">{emoji}</span>

            {/* Count badge (only show if count > 0) */}
            {reactionCounts[emoji] > 0 && (
              <span className="reaction-count">
                {reactionCounts[emoji]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Floating emoji animations */}
      {floatingEmojis.map(floating => (
        <div
          key={floating.id}
          className="floating-emoji"
          style={{
            left: floating.x,
            top: floating.y,
          }}
        >
          {floating.emoji}
        </div>
      ))}
    </div>
  );
}

export default ReactionBar;
