module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/mocks/',
    '/mocks/',
  ],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-redux|@react-native|react-native|react-native-paper|react-native-vector-icons|react-native-safe-area-context|react-native-screens|@react-navigation|@apollo/client|@reduxjs/toolkit|immer|react-native-config)/)',
  ],
  // Mock react-native-config for testing
  moduleNameMapper: {
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
  },
};
