/**
 * AWS AppSync Events API Configuration
 *
 * This file contains the configuration for connecting to AWS AppSync Events API
 * for real-time chat functionality.
 */

const awsConfig = {
  API: {
    Events: {
      endpoint: process.env.REACT_APP_APPSYNC_ENDPOINT,
      region: process.env.REACT_APP_APPSYNC_REGION || 'us-east-2',
      defaultAuthMode: 'apiKey',
      apiKey: process.env.REACT_APP_APPSYNC_API_KEY,
    },
  },
};

// Channel name for game chat
export const CHAT_CHANNEL = '/default/game-chat';

export default awsConfig;
