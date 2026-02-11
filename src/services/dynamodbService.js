const API_URL = process.env.REACT_APP_API_URL;

/**
 * Save a chat message via Lambda
 */
export async function saveMessage(gameId, message) {
  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: gameId,
        text: message.text,
        username: message.username
      })
    });

    const data = await response.json();
    console.log('Message saved:', data);
    return data.item;
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
}

/**
 * Load recent messages via Lambda
 */
export async function getMessages(gameId, limit = 50) {
  try {
    const response = await fetch(`${API_URL}/messages?gameId=${gameId}`);
    const data = await response.json();
    console.log(`Loaded ${data.messages?.length || 0} messages`);
    return data.messages || [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
}