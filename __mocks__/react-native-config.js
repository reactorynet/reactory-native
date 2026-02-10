/**
 * Mock for react-native-config in Jest tests
 * Provides default test values for environment variables
 */
export default {
  API_ENDPOINT: 'https://test-api.reactory.io/graphql',
  API_WS_ENDPOINT: 'wss://test-api.reactory.io/graphql',
  CLIENT_KEY: 'test-client',
  CLIENT_NAME: 'Test Client',
  NODE_ENV: 'test',
  ENABLE_DEBUG: 'false',
  ENABLE_OFFLINE_MODE: 'true',
};
