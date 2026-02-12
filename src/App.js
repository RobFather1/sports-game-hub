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

// DynamoDB service for message persistence
import { saveMessage, getMessages } from './services/dynamodbService';

// Input sanitization utility
import { sanitizeText, normalizeMessageInput } from './utils/sanitize';

// Configure Amplify with AWS AppSync Events
Amplify.configure(awsConfig);

// Hardcoded room ID — single chat room
const GAME_ID = 'smacktalk-main';

// ============================================
// HARDCODED DATA
// ============================================

// Sample chat messages to start with (mock data)
const INITIAL_MESSAGES = [
  {
    id: 1,
    username: 'BearsFan85',
    text: 'Da Bears are looking good today!',
    timestamp: '2:30 PM',
    type: 'message',
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

  // All the chat messages (start with our mock data)
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  // What the user is currently typing in the input
  const [currentMessage, setCurrentMessage] = useState('');

  // Polls state
  const [polls, setPolls] = useState(INITIAL_POLLS);
  const [userVotes, setUserVotes] = useState({});
  const [showCreatePoll, setShowCreatePoll] = useState(false);

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

              const newMessage = {
                id: data.id,
                username: sanitizeText(data.username || ''),
                text: sanitizeText(data.text || ''),
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
            .map(item => ({
              id: item.timestamp,
              username: sanitizeText(item.username || ''),
              text: sanitizeText(item.text || ''),
              timestamp: new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              type: item.type || 'message',
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

  // ----------------------------------------
  // EVENT HANDLERS - Chat Messages
  // ----------------------------------------

  const handleMessageChange = (text) => {
    setCurrentMessage(text);
  };

  const handleSendMessage = useCallback(async () => {
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
    setMessages(prev => [...prev, newMessage]);

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
  }, [currentMessage, currentUsername]);

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
  // RENDER
  // ----------------------------------------

  return (
    <div className="app">
      {/* HEADER */}
      <header className="top-bar">
        <h1 className="app-title">Smack Talk Central</h1>

        <div className="top-bar-right">
          {isSignedIn ? (
            <UserButton />
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
