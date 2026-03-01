/**
 * App.js - Main Application Component
 *
 * PURPOSE: Single chat room for sports fans — Smack Talk Central.
 *
 * STATE:
 * - messages: Array of all chat messages
 * - currentMessage: What the user is currently typing
 * - polls: Array of all polls (active and closed)
 * - userVotes: Object tracking user's votes { pollId: optionId }
 * - showCreatePoll: Boolean - whether create poll modal is open
 * - reactionCounts: Object with emoji counts from last 30 seconds
 *
 * LAYOUT:
 * - Header: App title and user button
 * - Center: Full-screen chat display area with reactions
 * - Right sidebar: Polls (slides in/out)
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
import ChatDisplay from './components/ChatDisplay';
import MessageInput from './components/MessageInput';
import PollSidebar from './components/PollSidebar';
import CreatePoll from './components/CreatePoll';
import ReactionBar from './components/ReactionBar';
import KlipyPicker from './components/KlipyPicker';

// DynamoDB service for message persistence
import { saveMessage, getMessages } from './services/dynamodbService';

// User stats service for XP and levels
import {
  getUserStats,
  incrementXP,
  XP_RULES,
  LEVELS,
  calculateLevel,
  calculateStreakBonus,
} from './services/userStatsService';

// Input sanitization utility
import { sanitizeText, normalizeMessageInput, sanitizeMessageWithMedia } from './utils/sanitize';

// Configure Amplify with AWS AppSync Events
Amplify.configure(awsConfig);

// Hardcoded room ID — single chat room
const GAME_ID = 'smacktalk-main';

// ============================================
// HELPER FUNCTIONS
// ============================================

const getCurrentTimestamp = () => {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  // Authentication modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'

  // Get current user from Clerk
  const { isSignedIn, user } = useUser();

  // Get username from Clerk user data
  const currentUsername = user?.username || user?.firstName || 'Anonymous';

  // All the chat messages (start empty)
  const [messages, setMessages] = useState([]);

  // What the user is currently typing in the input
  const [currentMessage, setCurrentMessage] = useState('');

  // Polls state
  const [polls, setPolls] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  // Klipy picker state
  const [showKlipyPicker, setShowKlipyPicker] = useState(false);

  // Reactions state
  const [reactionCounts, setReactionCounts] = useState({
    '🔥': 0,
    '👍': 0,
    '😮': 0,
    '💪': 0,
    '😂': 0,
  });
  const [reactionTimestamps, setReactionTimestamps] = useState([]);

  // Polls sidebar visibility
  const [showPollsSidebar, setShowPollsSidebar] = useState(false);

  // Real-time chat connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const channelRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  // User stats state (XP, level, streak)
  const [userStats, setUserStats] = useState({
    xp: 0,
    level: LEVELS[0],
    currentStreak: 0,
  });

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // ----------------------------------------
  // EFFECTS
  // ----------------------------------------

  // Reaction counts decay — 30-second rolling window
  useEffect(() => {
    const interval = setInterval(() => {
      const thirtySecondsAgo = Date.now() - 30000;

      setReactionTimestamps(prev => {
        const recent = prev.filter(r => r.timestamp > thirtySecondsAgo);

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

  // Connect to AppSync Events for real-time chat
  useEffect(() => {
    let subscription = null;

    const connectToChannel = async () => {
      try {
        console.log('Connecting to AppSync Events channel:', CHAT_CHANNEL);

        const channel = await events.connect(CHAT_CHANNEL);
        channelRef.current = channel;
        setIsConnected(true);
        setConnectionError(null);
        console.log('Successfully connected to channel');

        subscription = channel.subscribe({
          next: (event) => {
            console.log('Received event:', event);
            const data = event.event;

            if (data && data.id && !processedMessageIds.current.has(data.id)) {
              processedMessageIds.current.add(data.id);

              console.log('🔵 Received message from AppSync:', data);
              console.log('🔵 Media field in received data:', data.media);

              const newMessage = sanitizeMessageWithMedia({
                id: data.id,
                username: data.username || '',
                text: data.text || '',
                timestamp: data.timestamp,
                type: data.type || 'message',
                media: data.media || undefined,
              });

              console.log('🟢 After sanitization:', newMessage);
              console.log('🟢 Media field after sanitization:', newMessage.media);

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

  // Load persisted messages from DynamoDB on mount
  useEffect(() => {
    const loadPersistedMessages = async () => {
      try {
        console.log('Loading persisted messages from DynamoDB...');
        const persistedMessages = await getMessages(GAME_ID, 50);

        if (persistedMessages.length > 0) {
          const formattedMessages = persistedMessages
            .map(item => sanitizeMessageWithMedia({
              id: item.timestamp,
              username: item.username || '',
              text: item.text || '',
              timestamp: new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              type: item.type || 'message',
              media: item.media || undefined,
            }))
            .reverse();

          formattedMessages.forEach(msg => processedMessageIds.current.add(msg.id));
          setMessages(formattedMessages);
          console.log(`Loaded ${formattedMessages.length} persisted messages`);
        }
      } catch (error) {
        console.error('Failed to load persisted messages:', error);
      }
    };

    loadPersistedMessages();
  }, []);

  // Load user stats from backend when signed in
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    const initUserStats = async () => {
      const stats = await getUserStats(user.id);
      if (stats) {
        setUserStats({
          xp: stats.xp || 0,
          level: calculateLevel(stats.xp || 0),
          currentStreak: 0, // streak is session-only
        });
      }
    };

    initUserStats();
  }, [isSignedIn, user?.id]);

  // ----------------------------------------
  // HELPER FUNCTIONS - Toasts & XP
  // ----------------------------------------

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const calculateCurrentStreak = useCallback((messageList, username) => {
    // Count consecutive messages from the end by the same user
    let streak = 0;
    for (let i = messageList.length - 1; i >= 0; i--) {
      const msg = messageList[i];
      if (msg.type === 'message' && msg.username === username) {
        streak++;
      } else if (msg.type === 'message') {
        break; // Different user, stop counting
      }
      // Skip reactions and system messages
    }
    return streak;
  }, []);

  const awardXPForMessage = useCallback(async (newMessages) => {
    if (!user?.id) return;

    const clerkUserId = user.id;
    let totalXP = XP_RULES.message;
    const previousLevel = userStats.level;

    // Check streak after adding the new message
    const streak = calculateCurrentStreak(newMessages, currentUsername);

    // Award streak bonus if milestone hit
    const streakBonus = calculateStreakBonus(streak);
    if (streakBonus > 0) {
      totalXP += streakBonus;
      showToast(`🔥 Heating Up! ${streak}-message streak! +${streakBonus} XP`, 'streak');
    }

    // Update local state optimistically
    setUserStats(prev => {
      const newXP = prev.xp + totalXP;
      const newLevel = calculateLevel(newXP);

      // Check for level up
      if (newLevel.level > previousLevel.level) {
        setTimeout(() => {
          showToast(`🎉 Level Up! You're now a ${newLevel.name}!`, 'levelup');
        }, 100);
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        currentStreak: streak,
      };
    });

    // Fire-and-forget API call (non-blocking)
    incrementXP(clerkUserId, currentUsername, totalXP).catch(err => {
      console.error('Failed to persist XP:', err);
    });
  }, [user?.id, userStats.level, currentUsername, calculateCurrentStreak, showToast]);

  // ----------------------------------------
  // EVENT HANDLERS - Chat Messages
  // ----------------------------------------

  const handleMessageChange = (text) => {
    setCurrentMessage(text);
  };

  const handleSendMessage = useCallback(async () => {
    if (!isSignedIn) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }

    const sanitizedText = normalizeMessageInput(currentMessage);
    if (sanitizedText === '') return;

    const messageId = Date.now();
    const newMessage = {
      id: messageId,
      username: sanitizeText(currentUsername),
      text: sanitizedText,
      timestamp: getCurrentTimestamp(),
      type: 'message',
    };

    console.log('Sending message:', newMessage);
    setCurrentMessage('');

    processedMessageIds.current.add(messageId);
    setMessages(prev => {
      const updatedMessages = [...prev, newMessage];
      // Award XP non-blocking (fire-and-forget)
      awardXPForMessage(updatedMessages);
      return updatedMessages;
    });

    try {
      await events.post(CHAT_CHANNEL, newMessage);
      console.log('Message published to channel');
    } catch (error) {
      console.error('Failed to publish message:', error);
    }

    saveMessage(GAME_ID, {
      text: currentMessage,
      username: currentUsername,
      timestamp: messageId,
      type: 'message',
    });
  }, [currentMessage, currentUsername, isSignedIn, awardXPForMessage]);

  const addSystemMessage = (text) => {
    const systemMessage = {
      id: Date.now(),
      username: 'System',
      text,
      timestamp: getCurrentTimestamp(),
      type: 'system',
    };
    console.log('System message:', text);
    setMessages(prev => [...prev, systemMessage]);
  };

  // ----------------------------------------
  // EVENT HANDLERS - Polls
  // ----------------------------------------

  const handleOpenCreatePoll = () => {
    if (!isSignedIn) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }
    setShowCreatePoll(true);
  };

  const handleCloseCreatePoll = () => {
    setShowCreatePoll(false);
  };

  const handleCreatePoll = (question, optionTexts) => {
    const newPoll = {
      id: `poll-${Date.now()}`,
      question,
      options: optionTexts.map((text, index) => ({
        id: index + 1,
        text,
        votes: 0,
      })),
      totalVotes: 0,
      createdBy: currentUsername,
      createdAt: getCurrentTimestamp(),
      status: 'active',
    };

    console.log('Creating new poll:', newPoll);
    setPolls([newPoll, ...polls]);
    setShowCreatePoll(false);
    addSystemMessage(`📊 New poll created: "${question}"`);
  };

  const handleVote = (pollId, optionId) => {
    if (!isSignedIn) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }

    console.log('Voting on poll:', pollId, 'option:', optionId);

    setUserVotes(prev => ({ ...prev, [pollId]: optionId }));

    setPolls(prev =>
      prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            options: poll.options.map(opt =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
            totalVotes: poll.totalVotes + 1,
          };
        }
        return poll;
      })
    );
  };

  const handleClosePoll = (pollId) => {
    console.log('Closing poll:', pollId);

    setPolls(prev =>
      prev.map(poll => {
        if (poll.id === pollId) {
          let winner = poll.options[0];
          poll.options.forEach(opt => {
            if (opt.votes > winner.votes) winner = opt;
          });

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

  const handleReaction = useCallback(async (emoji) => {
    console.log('Reaction sent:', emoji);

    const messageId = Date.now();

    setReactionTimestamps(prev => [
      ...prev,
      { emoji, timestamp: Date.now() },
    ]);

    setReactionCounts(prev => ({
      ...prev,
      [emoji]: prev[emoji] + 1,
    }));

    processedMessageIds.current.add(messageId);

    const reactionMessage = {
      id: messageId,
      username: currentUsername,
      text: emoji,
      timestamp: getCurrentTimestamp(),
      type: 'reaction',
    };
    setMessages(prev => [...prev, reactionMessage]);

    try {
      await events.post(CHAT_CHANNEL, reactionMessage);
    } catch (error) {
      console.error('Failed to publish reaction:', error);
    }
  }, [currentUsername]);

  // ----------------------------------------
  // EVENT HANDLERS - Polls Sidebar
  // ----------------------------------------

  const handleTogglePollsSidebar = () => {
    setShowPollsSidebar(prev => !prev);
  };

  // ----------------------------------------
  // EVENT HANDLERS - Klipy Picker
  // ----------------------------------------

  const handleOpenKlipyPicker = () => {
    if (!isSignedIn) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }
    setShowKlipyPicker(true);
  };

  const handleCloseKlipyPicker = () => {
    setShowKlipyPicker(false);
  };

  const handleSelectGif = (url, alt, width, height) => {
    console.log('GIF selected:', alt);

    const gifData = { type: 'gif', url, alt, width, height };
    const messageId = Date.now();

    const newMessage = {
      id: messageId,
      username: sanitizeText(currentUsername),
      text: '', // GIF-only message (no caption for now)
      timestamp: getCurrentTimestamp(),
      type: 'message',
      media: gifData,
    };

    console.log('🟡 Publishing message to AppSync:', newMessage);
    console.log('🟡 Media field being sent:', newMessage.media);

    // Optimistic UI update
    processedMessageIds.current.add(messageId);
    setMessages(prev => [...prev, newMessage]);

    // Award XP
    awardXPForMessage([...messages, newMessage]);

    // Publish to AppSync Events
    events.post(CHAT_CHANNEL, newMessage).catch(console.error);

    // Save to DynamoDB
    saveMessage(GAME_ID, {
      text: '',
      username: currentUsername,
      timestamp: messageId,
      type: 'message',
      media: gifData,
    });

    setShowKlipyPicker(false);
  };

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <div className="app">
      {/* HEADER */}
      <header className="top-bar">
        <h1 className="app-title">Smack Talk Central</h1>

        <div className="top-bar-right">
          {isSignedIn && (
            <div className="user-level-badge">
              <span className="level-name">{userStats.level.name}</span>
              <span className="xp-display">{userStats.xp} XP</span>
            </div>
          )}
{isSignedIn ? (
  <UserButton />
) : (
  <div style={{ display: 'flex', gap: '8px' }}>
    <button
      className="auth-button"
      onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
    >
      Sign In
    </button>
    <button
      className="auth-button"
      onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
    >
      Sign Up
    </button>
  </div>
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

      {/* MAIN CONTENT */}
      <div className="main-content">
        {/* CHAT AREA */}
        <main className="chat-area">
          {connectionError && (
            <div className="connection-error">{connectionError}</div>
          )}
          {isConnected && (
            <div className="connection-status">Live chat connected</div>
          )}

          <ChatDisplay messages={messages} />

          <ReactionBar
            reactionCounts={reactionCounts}
            onReaction={handleReaction}
          />

          <MessageInput
            currentMessage={currentMessage}
            onMessageChange={handleMessageChange}
            onSendMessage={handleSendMessage}
            onOpenKlipyPicker={handleOpenKlipyPicker}
          />
        </main>

        {/* RIGHT SIDEBAR - Polls */}
        <aside className={`sidebar-right ${showPollsSidebar ? 'visible' : 'hidden'}`}>
          <PollSidebar
            polls={polls}
            userVotes={userVotes}
            currentUser={currentUsername}
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

      {/* KLIPY PICKER MODAL */}
      <KlipyPicker
        isOpen={showKlipyPicker}
        onClose={handleCloseKlipyPicker}
        onSelectContent={handleSelectGif}
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
          fallbackRedirectUrl="/"
          signUpUrl="/"
          afterSignOutUrl="/"
        />
      ) : (
        <SignUp
          routing="virtual"
          fallbackRedirectUrl="/"
          signInUrl="/"
          afterSignOutUrl="/"
        />
      )}
    </div>
  </div>
)}

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
