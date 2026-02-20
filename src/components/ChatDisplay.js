/**
 * ChatDisplay Component
 *
 * PURPOSE: Shows all the chat messages for the selected game.
 * Each message displays the username, message text, and timestamp.
 * The chat automatically scrolls to the bottom when new messages arrive.
 *
 * Supports different message types:
 * - 'message': Regular chat message
 * - 'reaction': Quick emoji reaction (styled differently)
 * - 'system': System announcement (score updates, poll results)
 *
 * PROPS:
 * - messages: Array of message objects, each with:
 *   - id: Unique identifier for the message
 *   - username: Who sent the message
 *   - text: The actual message content
 *   - timestamp: When the message was sent
 *   - type: 'message', 'reaction', or 'system'
 */

import { useEffect, useRef } from 'react';

function ChatDisplay({ messages }) {
  // useRef creates a reference to a DOM element
  // We'll use this to scroll to the bottom of the chat
  const chatEndRef = useRef(null);

  // useEffect runs code when something changes
  // Here, we scroll to bottom whenever messages array changes
  useEffect(() => {
    // scrollIntoView is a built-in browser function that scrolls
    // an element into view. 'smooth' makes it animate nicely.
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    console.log('Chat updated, scrolling to bottom. Total messages:', messages.length);
  }, [messages]); // The [messages] means "run this when messages changes"

  /**
   * Renders a single message based on its type
   */
  const renderMessage = (message) => {
    // Handle reaction messages (compact style)
    if (message.type === 'reaction') {
      return (
        <div key={message.id} className="message reaction-message">
          <span className="reaction-content">
            <span className="message-username">{message.username}</span>
            <span className="reaction-text"> reacted {message.text}</span>
          </span>
          <span className="message-timestamp">{message.timestamp}</span>
        </div>
      );
    }

    // Handle system messages (announcements)
    if (message.type === 'system') {
      return (
        <div key={message.id} className="message system-message">
          <p className="system-text">{message.text}</p>
          <span className="message-timestamp">{message.timestamp}</span>
        </div>
      );
    }

    // Regular chat message
    return (
      <div key={message.id} className="message">
        {/* Message header: username and timestamp */}
        <div className="message-header">
          <span className="message-username">{message.username}</span>
          <span className="message-timestamp">{message.timestamp}</span>
        </div>
        {/* The actual message text */}
        <p className="message-text">{message.text}</p>
      </div>
    );
  };

  return (
    <div className="chat-display">
      {/* Container for all messages */}
      <div className="messages-container">
        {/*
          If there are no messages, show a helpful message.
          Otherwise, map through and display each message.
        */}
        {messages.length === 0 ? (
          <p className="no-messages">Well are you gonna Smack Talk me, punk?</p>
        ) : (
          messages.map(renderMessage)
        )}

        {/*
          This empty div is placed at the end of the messages.
          We use the ref to scroll to it when new messages arrive.
        */}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}

export default ChatDisplay;
