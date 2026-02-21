/**
 * MessageInput Component
 *
 * PURPOSE: Provides an input field and send button for users to type
 * and send chat messages. Users can send by clicking the button OR
 * by pressing the Enter key.
 *
 * PROPS:
 * - currentMessage: The text currently in the input field
 * - onMessageChange: Function to call when user types (updates the text)
 * - onSendMessage: Function to call when user sends the message
 */

// No imports needed - this is a simple component with no hooks

function MessageInput({ currentMessage, onMessageChange, onSendMessage, onOpenKlipyPicker }) {
  /**
   * Handles the send action
   * This function is called when the user clicks Send or presses Enter
   */
  const handleSend = () => {
    // Don't send empty messages (trim removes whitespace)
    if (currentMessage.trim() === '') {
      console.log('Cannot send empty message');
      return;
    }

    console.log('Sending message:', currentMessage);
    onSendMessage(); // Call the parent's send function
  };

  /**
   * Handles key press events
   * We want to send the message when user presses Enter
   */
  const handleKeyPress = (event) => {
    // event.key tells us which key was pressed
    if (event.key === 'Enter') {
      console.log('Enter key pressed');
      handleSend();
    }
  };

  return (
    <div className="message-input">
      {/*
        Text input field
        - value: controlled by currentMessage prop (from parent)
        - onChange: calls onMessageChange when user types
        - onKeyPress: checks for Enter key to send
        - placeholder: gray text shown when input is empty
      */}
      <input
        type="text"
        className="message-input-field"
        value={currentMessage}
        onChange={(event) => onMessageChange(event.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
      />

      {/* GIF Button */}
      <button
        className="gif-button"
        onClick={onOpenKlipyPicker}
        aria-label="Send GIF or Clip"
        title="Send a sports GIF or clip"
        type="button"
      >
        GIF
      </button>

      {/* Send button */}
      <button
        className="send-button"
        onClick={handleSend}
        disabled={currentMessage.trim() === ''} // Disable if no text
      >
        Send
      </button>
    </div>
  );
}

export default MessageInput;
