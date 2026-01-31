/**
 * AWS AppSync Events API Configuration
 *
 * This file contains the configuration for connecting to AWS AppSync Events API
 * for real-time chat functionality.
 */

const awsConfig = {
  API: {
    Events: {
      endpoint: 'https://ew3rrqxucrgvtd3sz4pvhlebxm.appsync-api.us-east-2.amazonaws.com/event',
      region: 'us-east-2',
      defaultAuthMode: 'apiKey',
      apiKey: 'da2-atop5ry5jvhxvbm7xczmvjjnsi',
    },
  },
};

// Channel name for game chat
export const CHAT_CHANNEL = '/default/game-chat';

export default awsConfig;
