import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Configure the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.REACT_APP_AWS_REGION,
  // For Amplify hosting, IAM role handles credentials automatically
  // For local dev, make sure AWS CLI is configured
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.REACT_APP_DYNAMODB_TABLE_NAME;

/**
 * Save a chat message to DynamoDB
 * @param {string} gameId - Identifier for the game session
 * @param {object} message - Message object with { text, username, timestamp }
 * @returns {object|null} - Saved item or null if error
 */
export async function saveMessage(gameId, message) {
  try {
    const now = Date.now(); // milliseconds
    const expiresAt = Math.floor(now / 1000) + (24 * 60 * 60); // 24 hours in seconds

    const item = {
      gameId: gameId,
      timestamp: message.timestamp || now,
      text: message.text,
      username: message.username,
      expiresAt: expiresAt
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    });

    await docClient.send(command);
    console.log('Message saved to DynamoDB:', item);
    return item;
  } catch (error) {
    console.error('Error saving message to DynamoDB:', error);
    return null;
  }
}

/**
 * Load recent messages for a game from DynamoDB
 * @param {string} gameId - Identifier for the game session
 * @param {number} limit - Maximum number of messages to return (default 50)
 * @returns {array} - Array of message objects, newest first
 */
export async function getMessages(gameId, limit = 50) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'gameId = :gameId',
      ExpressionAttributeValues: {
        ':gameId': gameId
      },
      ScanIndexForward: false, // newest first
      Limit: limit
    });

    const response = await docClient.send(command);
    console.log(`Loaded ${response.Items?.length || 0} messages from DynamoDB`);
    return response.Items || [];
  } catch (error) {
    console.error('Error loading messages from DynamoDB:', error);
    return [];
  }
}
