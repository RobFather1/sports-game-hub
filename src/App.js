/**
 * App.js - Main Application Component
 *
 * PURPOSE: This is the main container for the Sports Game Hub.
 * It manages all the state (data) and passes it down to child components.
 *
 * STATE:
 * - selectedGame: Which game the user is currently viewing
 * - messages: Array of all chat messages
 * - currentMessage: What the user is currently typing
 * - polls: Array of all polls (active and closed)
 * - userVotes: Object tracking user's votes { pollId: optionId }
 * - showCreatePoll: Boolean - whether create poll modal is open
 * - reactionCounts: Object with emoji counts from last 30 seconds
 * - gameScore: Current game score data
 * - showScoreControls: Boolean - whether score controls are visible
 *
 * LAYOUT:
 * - Top bar: Shows app title and selected game name
 * - Score tracker: Shows current game score
 * - Left sidebar: Game selector (200px wide)
 * - Center: Chat display area with reactions
 * - Right sidebar: Polls (250px wide)
 * - Bottom: Message input and reaction bar
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';

// AWS Amplify for real-time chat
import { Amplify } from 'aws-amplify';
import { events } from 'aws-amplify/data';
import awsConfig, { CHAT_CHANNEL } from './aws-config';

// Import our custom components
import GameSelector from './components/GameSelector';
import ChatDisplay from './components/ChatDisplay';
import MessageInput from './components/MessageInput';
import PollSidebar from './components/PollSidebar';
import CreatePoll from './components/CreatePoll';
import ReactionBar from './components/ReactionBar';
import ScoreTracker from './components/ScoreTracker';
import ScoreControls from './components/ScoreControls';

// DynamoDB service for message persistence
import { saveMessage, getMessages } from './services/dynamodbService';

// Configure Amplify with AWS AppSync Events
Amplify.configure(awsConfig);

// ============================================
// HARDCODED DATA (will be replaced with real data later)
// ============================================

// Generate a unique username for this session
const generateUsername = () => {
  const adjectives = ['Swift', 'Bold', 'Fierce', 'Lucky', 'Wild', 'Mighty', 'Quick', 'Brave'];
  const nouns = ['Bear', 'Fan', 'Champ', 'Player', 'Star', 'Legend', 'Warrior', 'Hero'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
};

// Store username in sessionStorage so it persists across page refreshes but not sessions
const getOrCreateUsername = () => {
  let username = sessionStorage.getItem('chatUsername');
  if (!username) {
    username = generateUsername();
    sessionStorage.setItem('chatUsername', username);
  }
  return username;
};

const CURRENT_USER = getOrCreateUsername();

// List of available games with their sports and team info
const GAMES = [
  {
    id: 1,
    name: 'Bears vs Packers',
    sport: 'football',
    homeTeam: { name: 'Bears', logo: '🐻', score: 0 },
    awayTeam: { name: 'Packers', logo: '🧀', score: 0 },
  },
  {
    id: 2,
    name: 'White Sox vs Cubs',
    sport: 'baseball',
    homeTeam: { name: 'White Sox', logo: '🧦', score: 0 },
    awayTeam: { name: 'Cubs', logo: '🐻', score: 0 },
  },
  {
    id: 3,
    name: 'Bulls vs Lakers',
    sport: 'basketball',
    homeTeam: { name: 'Bulls', logo: '🐂', score: 0 },
    awayTeam: { name: 'Lakers', logo: '💜', score: 0 },
  },
];

// Sample chat messages to start with (mock data)
const INITIAL_MESSAGES = [
  {
    id: 1,
    username: 'BearsFan85',
    text: 'Da Bears are looking good today!',
    timestamp: '2:30 PM',
    type: 'message', // 'message', 'reaction', or 'system'
  },
  {
    id: 2,
    username: 'ChicagoNative',
    text: 'That last play was incredible!',
    timestamp: '2:32 PM',
    type: 'message',
  },
  {
    id: 3,
    username: 'GridironGuru',
    text: 'Defense is playing solid. Keep it up!',
    timestamp: '2:35 PM',
    type: 'message',
  },
  {
    id: 4,
    username: 'WindyCityFan',
    text: 'Anyone else at the stadium right now?',
    timestamp: '2:38 PM',
    type: 'message',
  },
  {
    id: 5,
    username: 'SportsJunkie22',
    text: 'Watching from home but the energy is amazing!',
    timestamp: '2:40 PM',
    type: 'message',
  },
];

// Sample polls to start with
const INITIAL_POLLS = [
  {
    id: 'poll-1',
    question: 'Will Bears score on this drive?',
    options: [
      { id: 1, text: 'Yes - Touchdown!', votes: 8 },
      { id: 2, text: 'Yes - Field Goal', votes: 5 },
      { id: 3, text: 'No - Turnover', votes: 2 },
    ],
    totalVotes: 15,
    createdBy: 'BearsFan85',
    createdAt: '2:25 PM',
    status: 'active',
  },
];

// Authentication modal state


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets the current time formatted as a readable timestamp
 */
const getCurrentTimestamp = () => {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Gets default period for a sport
 */
const getDefaultPeriod = (sport) => {
  switch (sport) {
    case 'football':
    case 'basketball':
      return 'Q1';
    case 'baseball':
      return 'Top 1';
    default:
      return 'Q1';
  }
};

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  // ----------------------------------------
  // STATE DECLARATIONS
  // ----------------------------------------
// Authentication modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'

  // Get current user from Clerk
  const { isSignedIn, user } = useUser();

  // Which game is currently selected (default to first game)
  const [selectedGame, setSelectedGame] = useState(GAMES[0]);

  // All the chat messages (start with our mock data)
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  // What the user is currently typing in the input
  const [currentMessage, setCurrentMessage] = useState('');

  // Polls state
  const [polls, setPolls] = useState(INITIAL_POLLS);
  const [userVotes, setUserVotes] = useState({}); // { pollId: optionId }
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  // Reactions state
  const [reactionCounts, setReactionCounts] = useState({
    '🔥': 0,
    '👍': 0,
    '😮': 0,
    '💪': 0,
    '😂': 0,
  });
  const [reactionTimestamps, setReactionTimestamps] = useState([]); // For 30-second window

  // Polls sidebar visibility
  const [showPollsSidebar, setShowPollsSidebar] = useState(false);

  // Mobile game selector visibility
  const [showMobileGameSelector, setShowMobileGameSelector] = useState(false);

  // Score state
  const [gameScore, setGameScore] = useState({
    gameId: selectedGame.id,
    homeTeam: { ...selectedGame.homeTeam },
    awayTeam: { ...selectedGame.awayTeam },
    period: getDefaultPeriod(selectedGame.sport),
    possession: selectedGame.sport === 'football' ? selectedGame.homeTeam.name : null,
    sport: selectedGame.sport,
  });
  const [showScoreControls, setShowScoreControls] = useState(false);

  // Real-time chat connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const channelRef = useRef(null);
  const processedMessageIds = useRef(new Set()); // Track processed message IDs to avoid duplicates

  // ----------------------------------------
  // EFFECTS (side effects like timers)
  // ----------------------------------------

  // Effect to update reaction counts every second (for 30-second window)
  useEffect(() => {
    const interval = setInterval(() => {
      const thirtySecondsAgo = Date.now() - 30000;

      // Filter out old reactions
      setReactionTimestamps(prev => {
        const recent = prev.filter(r => r.timestamp > thirtySecondsAgo);

        // Recalculate counts
        const newCounts = {
          '🔥': 0,
          '👍': 0,
          '😮': 0,
          '💪': 0,
          '😂': 0,
        };
        recent.forEach(r => {
          if (newCounts[r.emoji] !== undefined) {
            newCounts[r.emoji]++;
          }
        });
        setReactionCounts(newCounts);

        return recent;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Effect to auto-hide score controls after 10 seconds of inactivity
  useEffect(() => {
    if (showScoreControls) {
      const timer = setTimeout(() => {
        console.log('Auto-hiding score controls after 10 seconds');
        setShowScoreControls(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showScoreControls, gameScore]); // Reset timer when score changes

  // Effect to update game score when selected game changes
  useEffect(() => {
    console.log('Game changed, updating score for:', selectedGame.name);
    setGameScore({
      gameId: selectedGame.id,
      homeTeam: { ...selectedGame.homeTeam },
      awayTeam: { ...selectedGame.awayTeam },
      period: getDefaultPeriod(selectedGame.sport),
      possession: selectedGame.sport === 'football' ? selectedGame.homeTeam.name : null,
      sport: selectedGame.sport,
    });
    setShowScoreControls(false);
  }, [selectedGame]);

  // Effect to connect to AppSync Events for real-time chat
  useEffect(() => {
    let subscription = null;

    const connectToChannel = async () => {
      try {
        console.log('Connecting to AppSync Events channel:', CHAT_CHANNEL);

        // Connect to the channel
        const channel = await events.connect(CHAT_CHANNEL);
        channelRef.current = channel;
        setIsConnected(true);
        setConnectionError(null);
        console.log('Successfully connected to channel');

        // Subscribe to incoming messages
        subscription = channel.subscribe({
          next: (event) => {
            console.log('Received event:', event);
            const data = event.event;

            // Skip if we've already processed this message (prevents duplicates)
            if (data && data.id && !processedMessageIds.current.has(data.id)) {
              processedMessageIds.current.add(data.id);

              // Add the message to our local state
              const newMessage = {
                id: data.id,
                username: data.username,
                text: data.text,
                timestamp: data.timestamp,
                type: data.type || 'message',
              };

              setMessages(prev => [...prev, newMessage]);
            }
          },
          error: (err) => {
            console.error('Subscription error:', err);
            setConnectionError('Connection error. Messages may not sync.');
          },
        });

      } catch (error) {
        console.error('Failed to connect to channel:', error);
        setIsConnected(false);
        setConnectionError('Failed to connect to chat. Messages will be local only.');
      }
    };

    connectToChannel();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up AppSync Events connection');
      if (subscription) {
        subscription.unsubscribe();
      }
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // Effect to load persisted messages from DynamoDB on mount
  useEffect(() => {
    const loadPersistedMessages = async () => {
      try {
        console.log('Loading persisted messages from DynamoDB...');
        const gameId = 'default-game-chat'; // Matches CHAT_CHANNEL concept
        const persistedMessages = await getMessages(gameId, 50);

        if (persistedMessages.length > 0) {
          // Convert DynamoDB items to message format and sort oldest first
          const formattedMessages = persistedMessages
            .map(item => ({
              id: item.timestamp, // Use timestamp as ID
              username: item.username,
              text: item.text,
              timestamp: new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              type: item.type || 'message',
            }))
            .reverse(); // Reverse since DynamoDB returns newest first

          // Mark these message IDs as processed to avoid duplicates
          formattedMessages.forEach(msg => processedMessageIds.current.add(msg.id));

          // Replace initial messages with persisted ones
          setMessages(formattedMessages);
          console.log(`Loaded ${formattedMessages.length} persisted messages`);
        }
      } catch (error) {
        console.error('Failed to load persisted messages:', error);
        // Keep INITIAL_MESSAGES as fallback
      }
    };

    loadPersistedMessages();
  }, []);

  // ----------------------------------------
  // EVENT HANDLERS - Game Selection
  // ----------------------------------------

  const handleSelectGame = (game) => {
    console.log('Switching to game:', game.name);
    setSelectedGame(game);
  };

  // ----------------------------------------
  // EVENT HANDLERS - Chat Messages
  // ----------------------------------------

  const handleMessageChange = (text) => {
    setCurrentMessage(text);
  };

  const handleSendMessage = useCallback(async () => {
    if (currentMessage.trim() === '') {
      return;
    }

    const messageId = Date.now();
    const newMessage = {
      id: messageId,
      username: CURRENT_USER,
      text: currentMessage,
      timestamp: getCurrentTimestamp(),
      type: 'message',
    };

    console.log('Sending message:', newMessage);

    // Clear input immediately for better UX
    setCurrentMessage('');

    // Mark this message ID as processed so we don't duplicate when it comes back
    processedMessageIds.current.add(messageId);

    // Add message locally immediately for instant feedback
    setMessages(prev => [...prev, newMessage]);

    // Publish to AppSync Events channel
    try {
      await events.post(CHAT_CHANNEL, newMessage);
      console.log('Message published to channel');
    } catch (error) {
      console.error('Failed to publish message:', error);
      // Message is already shown locally, so user still sees it
    }

    // Save to DynamoDB for persistence (24-hour TTL)
    const gameId = 'default-game-chat';
    saveMessage(gameId, {
      text: currentMessage,
      username: CURRENT_USER,
      timestamp: messageId, // Use numeric timestamp for DynamoDB
      type: 'message',
    });
  }, [currentMessage]);

  /**
   * Adds a system message to the chat (for score updates, poll results, etc.)
   */
  const addSystemMessage = (text) => {
    const systemMessage = {
      id: Date.now(),
      username: 'System',
      text: text,
      timestamp: getCurrentTimestamp(),
      type: 'system',
    };
    console.log('System message:', text);
    setMessages(prev => [...prev, systemMessage]);
  };

  // ----------------------------------------
  // EVENT HANDLERS - Polls
  // ----------------------------------------

  /**
   * Opens the create poll modal
   */
  const handleOpenCreatePoll = () => {
    console.log('Opening create poll modal');
    setShowCreatePoll(true);
  };

  /**
   * Closes the create poll modal
   */
  const handleCloseCreatePoll = () => {
    console.log('Closing create poll modal');
    setShowCreatePoll(false);
  };

  /**
   * Creates a new poll
   */
  const handleCreatePoll = (question, optionTexts) => {
    const newPoll = {
      id: `poll-${Date.now()}`,
      question: question,
      options: optionTexts.map((text, index) => ({
        id: index + 1,
        text: text,
        votes: 0,
      })),
      totalVotes: 0,
      createdBy: CURRENT_USER,
      createdAt: getCurrentTimestamp(),
      status: 'active',
    };

    console.log('Creating new poll:', newPoll);
    setPolls([newPoll, ...polls]); // Add to beginning
    setShowCreatePoll(false);

    // Announce in chat
    addSystemMessage(`📊 New poll created: "${question}"`);
  };

  /**
   * Handles voting on a poll
   */
  const handleVote = (pollId, optionId) => {
    console.log('Voting on poll:', pollId, 'option:', optionId);

    // Record the user's vote
    setUserVotes(prev => ({
      ...prev,
      [pollId]: optionId,
    }));

    // Update the poll's vote counts
    setPolls(prev =>
      prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            options: poll.options.map(opt =>
              opt.id === optionId
                ? { ...opt, votes: opt.votes + 1 }
                : opt
            ),
            totalVotes: poll.totalVotes + 1,
          };
        }
        return poll;
      })
    );
  };

  /**
   * Closes a poll (only creator can do this)
   */
  const handleClosePoll = (pollId) => {
    console.log('Closing poll:', pollId);

    setPolls(prev =>
      prev.map(poll => {
        if (poll.id === pollId) {
          // Find the winning option
          let winner = poll.options[0];
          poll.options.forEach(opt => {
            if (opt.votes > winner.votes) {
              winner = opt;
            }
          });

          // Announce the result
          addSystemMessage(
            `📊 Poll closed! "${poll.question}" - Winner: ${winner.text} (${winner.votes} votes)`
          );

          return { ...poll, status: 'closed' };
        }
        return poll;
      })
    );
  };

  // ----------------------------------------
  // EVENT HANDLERS - Reactions
  // ----------------------------------------

  /**
   * Handles when user clicks a reaction emoji
   */
  const handleReaction = useCallback(async (emoji) => {
    console.log('Reaction sent:', emoji);

    const messageId = Date.now();

    // Add to timestamps for counting
    setReactionTimestamps(prev => [
      ...prev,
      { emoji, timestamp: Date.now() },
    ]);

    // Immediately update count
    setReactionCounts(prev => ({
      ...prev,
      [emoji]: prev[emoji] + 1,
    }));

    // Mark this message ID as processed
    processedMessageIds.current.add(messageId);

    // Add reaction message to chat
    const reactionMessage = {
      id: messageId,
      username: CURRENT_USER,
      text: emoji,
      timestamp: getCurrentTimestamp(),
      type: 'reaction',
    };
    setMessages(prev => [...prev, reactionMessage]);

    // Publish reaction to channel
    try {
      await events.post(CHAT_CHANNEL, reactionMessage);
    } catch (error) {
      console.error('Failed to publish reaction:', error);
    }
  }, []);

  // ----------------------------------------
  // EVENT HANDLERS - Polls Sidebar
  // ----------------------------------------

  /**
   * Toggle the polls sidebar visibility
   */
  const handleTogglePollsSidebar = () => {
    console.log('Toggling polls sidebar');
    setShowPollsSidebar(prev => !prev);
    // Close game selector when opening polls
    setShowMobileGameSelector(false);
  };

  /**
   * Toggle the mobile game selector visibility
   */
  const handleToggleMobileGameSelector = () => {
    console.log('Toggling mobile game selector');
    setShowMobileGameSelector(prev => !prev);
    // Close polls when opening game selector
    setShowPollsSidebar(false);
  };

  /**
   * Close all mobile overlays
   */
  const handleCloseMobileOverlays = () => {
    setShowMobileGameSelector(false);
    setShowPollsSidebar(false);
  };

  // ----------------------------------------
  // EVENT HANDLERS - Score
  // ----------------------------------------

  /**
   * Toggle score controls visibility
   */
  const handleToggleScoreControls = () => {
    console.log('Toggling score controls');
    setShowScoreControls(prev => !prev);
  };

  /**
   * Update a team's score
   */
  const handleUpdateScore = (team, points) => {
    console.log(`Updating ${team} score by ${points}`);

    setGameScore(prev => {
      const newScore = { ...prev };
      if (team === 'home') {
        newScore.homeTeam = {
          ...prev.homeTeam,
          score: Math.max(0, prev.homeTeam.score + points),
        };
      } else {
        newScore.awayTeam = {
          ...prev.awayTeam,
          score: Math.max(0, prev.awayTeam.score + points),
        };
      }

      // Announce score change in chat
      addSystemMessage(
        `⚡ Score Update: ${newScore.homeTeam.name} ${newScore.homeTeam.score} - ${newScore.awayTeam.score} ${newScore.awayTeam.name}`
      );

      return newScore;
    });
  };

  /**
   * Set the current period
   */
  const handleSetPeriod = (period) => {
    console.log('Setting period to:', period);
    setGameScore(prev => ({ ...prev, period }));
  };

  /**
   * Toggle possession between teams
   */
  const handleTogglePossession = () => {
    setGameScore(prev => ({
      ...prev,
      possession:
        prev.possession === prev.homeTeam.name
          ? prev.awayTeam.name
          : prev.homeTeam.name,
    }));
  };

  /**
   * Reset the score to 0-0
   */
  const handleResetScore = () => {
    console.log('Resetting score');
    setGameScore(prev => ({
      ...prev,
      homeTeam: { ...prev.homeTeam, score: 0 },
      awayTeam: { ...prev.awayTeam, score: 0 },
      period: getDefaultPeriod(prev.sport),
    }));
    addSystemMessage('⚡ Score has been reset to 0-0');
  };

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <div className="app">
      {/* TOP BAR - Shows app title and selected game */}
      <header className="top-bar">
        {/* Mobile menu button */}
        <button
          className={`mobile-menu-button ${showMobileGameSelector ? 'active' : ''}`}
          onClick={handleToggleMobileGameSelector}
          aria-expanded={showMobileGameSelector}
          aria-label="Toggle games menu"
        >
          <span className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <h1 className="app-title">Smack Talk Central</h1>

       <div className="top-bar-right">
        <div className="current-game">
          <span className="current-game-label">Live:</span>
          <span className="current-game-name">{selectedGame.name}</span>
        </div>
        
        {/* User authentication */}
        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <button
            className="auth-button"
            onClick={() => {
              setAuthMode('signin');
              setShowAuthModal(true);
            }}
          >
            Sign In
          </button>
        )}
        
        <button
          className={`polls-toggle-button ${showPollsSidebar ? 'active' : ''}`}
          onClick={handleTogglePollsSidebar}
          aria-expanded={showPollsSidebar}
          aria-label={showPollsSidebar ? 'Hide polls' : 'Show polls'}
        >
          <span className="polls-toggle-icon">📊</span>
          <span className="polls-toggle-text">
            {showPollsSidebar ? 'Hide' : 'Polls'}
          </span>
        </button>
      </div>
      </header>
      
      {/* SCORE TRACKER - Shows current game score */}
      <ScoreTracker
        gameScore={gameScore}
        onToggleControls={handleToggleScoreControls}
        showControls={showScoreControls}
      />

      {/* SCORE CONTROLS - Collapsible panel for editing score */}
      <ScoreControls
        gameScore={gameScore}
        isVisible={showScoreControls}
        onUpdateScore={handleUpdateScore}
        onSetPeriod={handleSetPeriod}
        onTogglePossession={handleTogglePossession}
        onResetScore={handleResetScore}
      />

      {/* MOBILE BACKDROP OVERLAY */}
      {(showMobileGameSelector || showPollsSidebar) && (
        <div
          className="mobile-backdrop"
          onClick={handleCloseMobileOverlays}
          aria-hidden="true"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        {/* LEFT SIDEBAR - Game selector */}
        <aside className={`sidebar ${showMobileGameSelector ? 'mobile-visible' : ''}`}>
          <GameSelector
            games={GAMES}
            selectedGame={selectedGame}
            onSelectGame={(game) => {
              handleSelectGame(game);
              setShowMobileGameSelector(false); // Close on selection
            }}
          />
        </aside>

        {/* CENTER - Chat area */}
        <main className="chat-area">
          {/* Connection status indicator */}
          {connectionError && (
            <div className="connection-error">
              {connectionError}
            </div>
          )}
          {isConnected && (
            <div className="connection-status">
              Live chat connected
            </div>
          )}

          {/* Chat messages display */}
          <ChatDisplay messages={messages} />

          {/* Reaction bar */}
          <ReactionBar
            reactionCounts={reactionCounts}
            onReaction={handleReaction}
          />

          {/* Message input at bottom */}
          <MessageInput
            currentMessage={currentMessage}
            onMessageChange={handleMessageChange}
            onSendMessage={handleSendMessage}
          />
        </main>

        {/* RIGHT SIDEBAR - Polls (slides in/out) */}
        <aside className={`sidebar-right ${showPollsSidebar ? 'visible' : 'hidden'}`}>
          <PollSidebar
            polls={polls}
            userVotes={userVotes}
            currentUser={CURRENT_USER}
            onCreatePoll={handleOpenCreatePoll}
            onVote={handleVote}
            onClosePoll={handleClosePoll}
          />
        </aside>
      </div>

      {/* CREATE POLL MODAL */}
      <CreatePoll
        isOpen={showCreatePoll}
        onClose={handleCloseCreatePoll}
        onSubmit={handleCreatePoll}
      />
      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowAuthModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            {authMode === 'signin' ? (
              <SignIn 
                routing="virtual"
                afterSignInUrl="/"
                signUpUrl="#"
                onSignUpClick={() => setAuthMode('signup')}
              />
            ) : (
              <SignUp
                routing="virtual"
                afterSignUpUrl="/"
                signInUrl="#"
                onSignInClick={() => setAuthMode('signin')}
              />
 )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
