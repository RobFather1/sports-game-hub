const API_URL = 'https://o4trgcru2c.execute-api.us-east-2.amazonaws.com/default/SmackTalkAPI';
console.log('🔍 API_URL value:', API_URL)

/**
 * Save a chat message via Lambda
 */
export async function saveMessage(gameId, message) {
  try {
    const payload = {
      gameId: gameId,
      text: message.text,
      username: message.username,
      timestamp: message.timestamp,
      type: message.type || 'message',
    };

    // Include media field if present
    if (message.media) {
      payload.media = message.media;
    }

    console.log('💾 Saving message to DynamoDB:', payload);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('✅ Message saved to DynamoDB:', data);
    return data.item;
  } catch (error) {
    console.error('❌ Error saving message to DynamoDB:', error);
    return null;
  }
}

/**
 * Load recent messages via Lambda
 */
export async function getMessages(gameId, limit = 50) {
  try {
    const response = await fetch(`${API_URL}?gameId=${gameId}`);
    const data = await response.json();
    console.log(`Loaded ${data.messages?.length || 0} messages`);
    return data.messages || [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
}