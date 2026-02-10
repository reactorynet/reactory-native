/**
 * Mock for @react-native-community/netinfo
 * 
 * Provides a mock implementation for testing
 */

const mockNetInfo = {
  addEventListener: jest.fn((callback) => {
    // Call callback immediately with connected state
    callback({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {
        isConnectionExpensive: false,
        ssid: 'TestNetwork',
      },
    });
    // Return unsubscribe function
    return jest.fn();
  }),
  fetch: jest.fn(() => 
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {
        isConnectionExpensive: false,
        ssid: 'TestNetwork',
      },
    })
  ),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: {
      isConnectionExpensive: false,
      ssid: 'TestNetwork',
    },
  })),
  refresh: jest.fn(() => 
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {
        isConnectionExpensive: false,
        ssid: 'TestNetwork',
      },
    })
  ),
};

export default mockNetInfo;
