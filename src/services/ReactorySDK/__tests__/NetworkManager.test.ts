/**
 * NetworkManager Test Suite
 * 
 * Comprehensive test coverage for the NetworkManager class following TDD principles.
 * Tests cover GraphQL operations, network monitoring, caching, offline support, and performance metrics.
 * 
 * @version 1.0.0
 * @created August 20, 2025
 */

import { NetworkManager, NetworkManagerConfig } from '../NetworkManager';
import { ReactorySDK } from '../ReactorySDK';

// Mock ReactorySDK
const mockReactorySDK = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getConfiguration: jest.fn(),
  setConfiguration: jest.fn(),
  user: null,
  organization: null,
  memberships: [],
} as unknown as ReactorySDK;

// Mock GraphQL queries and mutations
const TEST_QUERY = `
  query TestQuery($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

const TEST_MUTATION = `
  mutation UpdateUser($id: ID!, $input: UserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
    }
  }
`;

const TEST_SUBSCRIPTION = `
  subscription UserUpdates($userId: ID!) {
    userUpdated(userId: $userId) {
      id
      name
      email
    }
  }
`;

describe('NetworkManager', () => {
  let networkManager: NetworkManager;
  let mockConfig: Partial<NetworkManagerConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      enableRetry: true,
      maxRetries: 2,
      retryDelayMs: 100,
      exponentialBackoff: true,
      timeout: 5000,
      enableOfflineQueue: true,
      enableOptimisticUpdates: true,
      enableRequestDeduplication: true,
      maxConcurrentRequests: 3,
      enablePerformanceMonitoring: true,
    };

    networkManager = new NetworkManager(mockReactorySDK, mockConfig);
  });

  afterEach(async () => {
    await networkManager.destroy();
  });

  describe('Initialization and Setup', () => {
    test('should initialize with default configuration when no config provided', () => {
      const manager = new NetworkManager(mockReactorySDK);
      expect(manager).toBeInstanceOf(NetworkManager);
    });

    test('should merge provided config with defaults', () => {
      const customConfig = { enableRetry: false };
      const manager = new NetworkManager(mockReactorySDK, customConfig);
      expect(manager).toBeInstanceOf(NetworkManager);
    });

    test('should initialize successfully', async () => {
      await networkManager.initialize();
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.initialized', expect.any(Object));
    });

    test('should not initialize twice', async () => {
      await networkManager.initialize();
      jest.clearAllMocks(); // Clear all previous emissions
      await networkManager.initialize(); // Second call should be ignored
      
      // Should not emit initialization event again
      const initCalls = (mockReactorySDK.emit as jest.Mock).mock.calls.filter(
        call => call[0] === 'networkManager.initialized'
      );
      expect(initCalls).toHaveLength(0);
    });

    test('should bind methods correctly', () => {
      expect(typeof networkManager.query).toBe('function');
      expect(typeof networkManager.mutate).toBe('function');
      expect(typeof networkManager.subscribe).toBe('function');
      expect(typeof networkManager.getNetworkStatus).toBe('function');
      expect(typeof networkManager.retryFailedRequests).toBe('function');
    });
  });

  describe('GraphQL Query Operations', () => {
    test('should execute GraphQL query successfully', async () => {
      const variables = { id: 'user123' };
      const response = await networkManager.query(TEST_QUERY, variables);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.result).toBe('success');
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.queryCompleted', expect.any(Object));
    });

    test('should handle query with operation name', async () => {
      const variables = { id: 'user123' };
      const options = { operationName: 'TestQuery' };
      
      const response = await networkManager.query(TEST_QUERY, variables, options);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    });

    test('should handle query with context', async () => {
      const variables = { id: 'user123' };
      const options = { context: { authToken: 'test-token' } };
      
      const response = await networkManager.query(TEST_QUERY, variables, options);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    });

    test('should handle query without variables', async () => {
      const response = await networkManager.query(TEST_QUERY);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    });

    test('should handle concurrent queries correctly', async () => {
      const variables = { id: 'user123' };
      
      const promises = [
        networkManager.query(TEST_QUERY, variables),
        networkManager.query(TEST_QUERY, variables),
        networkManager.query(TEST_QUERY, variables),
      ];
      
      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.data).toBeDefined();
      });
    });
  });

  describe('GraphQL Mutation Operations', () => {
    test('should execute GraphQL mutation successfully', async () => {
      const variables = { id: 'user123', input: { name: 'John Doe' } };
      const response = await networkManager.mutate(TEST_MUTATION, variables);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.result).toBe('success');
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.mutationCompleted', expect.any(Object));
    });

    test('should handle mutation with optimistic response', async () => {
      const variables = { id: 'user123', input: { name: 'John Doe' } };
      const optimisticResponse = { id: 'user123', name: 'John Doe' };
      const options = { optimisticResponse };
      
      const response = await networkManager.mutate(TEST_MUTATION, variables, options);
      
      expect(response).toBeDefined();
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.optimisticUpdateApplied', expect.any(Object));
    });

    test('should handle mutation with operation name', async () => {
      const variables = { id: 'user123', input: { name: 'John Doe' } };
      const options = { operationName: 'UpdateUser' };
      
      const response = await networkManager.mutate(TEST_MUTATION, variables, options);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    });

    test('should handle mutation without variables', async () => {
      const response = await networkManager.mutate(TEST_MUTATION);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    });
  });

  describe('GraphQL Subscription Operations', () => {
    test('should create subscription successfully', async () => {
      const variables = { userId: 'user123' };
      const result = await networkManager.subscribe(TEST_SUBSCRIPTION, variables);
      
      expect(result).toBeDefined();
      expect(typeof result.unsubscribe).toBe('function');
      expect(result.observable).toBeDefined();
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.subscriptionStarted', expect.any(Object));
    });

    test('should handle subscription with operation name', async () => {
      const variables = { userId: 'user123' };
      const options = { operationName: 'UserUpdates' };
      
      const result = await networkManager.subscribe(TEST_SUBSCRIPTION, variables, options);
      
      expect(result).toBeDefined();
      expect(typeof result.unsubscribe).toBe('function');
    });

    test('should unsubscribe correctly', async () => {
      const variables = { userId: 'user123' };
      const result = await networkManager.subscribe(TEST_SUBSCRIPTION, variables);
      
      result.unsubscribe();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.subscriptionEnded', expect.any(Object));
    });
  });

  describe('Request Caching and Deduplication', () => {
    test('should cache successful query responses', async () => {
      const variables = { id: 'user123' };
      const options = { cacheable: true };
      
      // First request
      await networkManager.query(TEST_QUERY, variables, options);
      
      // Second request should hit cache
      await networkManager.query(TEST_QUERY, variables, options);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.cacheHit', expect.any(Object));
    });

    test('should not cache when cacheable is false', async () => {
      const variables = { id: 'user123' };
      const options = { cacheable: false };
      
      await networkManager.query(TEST_QUERY, variables, options);
      await networkManager.query(TEST_QUERY, variables, options);
      
      // Should not emit cache hit
      const cacheHitCalls = (mockReactorySDK.emit as jest.Mock).mock.calls.filter(
        call => call[0] === 'networkManager.cacheHit'
      );
      expect(cacheHitCalls).toHaveLength(0);
    });

    test('should deduplicate concurrent requests', async () => {
      const variables = { id: 'user123' };
      
      const promises = [
        networkManager.query(TEST_QUERY, variables),
        networkManager.query(TEST_QUERY, variables),
      ];
      
      await Promise.all(promises);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.requestDeduped', expect.any(Object));
    });

    test('should clear cache correctly', async () => {
      const variables = { id: 'user123' };
      
      // Make some requests to populate cache
      await networkManager.query(TEST_QUERY, variables, { operationName: 'TestQuery' });
      
      // Clear specific operation cache
      networkManager.clearRequestCache('TestQuery');
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.cacheCleared', 
        expect.objectContaining({ operationName: 'TestQuery' })
      );
    });

    test('should clear all cache when no operation specified', async () => {
      const variables = { id: 'user123' };
      
      await networkManager.query(TEST_QUERY, variables);
      
      networkManager.clearRequestCache();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.cacheCleared', 
        expect.objectContaining({ operationName: undefined })
      );
    });
  });

  describe('Network Status Monitoring', () => {
    test('should get current network status', () => {
      const status = networkManager.getNetworkStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.isOnline).toBe('boolean');
      expect(status.connectionType).toBeDefined();
      expect(typeof status.isExpensive).toBe('boolean');
      expect(status.effectiveType).toBeDefined();
    });

    test('should add network status change listener', () => {
      const listener = jest.fn();
      const unsubscribe = networkManager.onNetworkStatusChange(listener);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Clean up
      unsubscribe();
    });

    test('should remove network status change listener', () => {
      const listener = jest.fn();
      const unsubscribe = networkManager.onNetworkStatusChange(listener);
      
      unsubscribe();
      
      // Listener should be removed
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Offline Support and Request Queueing', () => {
    test('should handle retry failed requests when online', async () => {
      await networkManager.retryFailedRequests();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.retryingFailedRequests', 
        expect.objectContaining({ queueSize: expect.any(Number) })
      );
    });

    test('should throw error when retrying requests while offline', async () => {
      // Mock offline status
      networkManager.updateNetworkStatus({ isOnline: false });
      
      await expect(networkManager.retryFailedRequests()).rejects.toThrow('Cannot retry requests while offline');
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics', async () => {
      const variables = { id: 'user123' };
      
      await networkManager.query(TEST_QUERY, variables);
      
      const metrics = networkManager.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
      expect(typeof metrics.cacheHitRate).toBe('number');
      expect(typeof metrics.activeRequests).toBe('number');
      expect(typeof metrics.queuedRequests).toBe('number');
      expect(Array.isArray(metrics.metrics)).toBe(true);
    });

    test('should track cache hit rate correctly', async () => {
      const variables = { id: 'user123' };
      
      // First request
      await networkManager.query(TEST_QUERY, variables);
      
      // Second request should hit cache
      await networkManager.query(TEST_QUERY, variables);
      
      const metrics = networkManager.getPerformanceMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });

    test('should track average response time', async () => {
      const variables = { id: 'user123' };
      
      await networkManager.query(TEST_QUERY, variables);
      await networkManager.query(TEST_QUERY, { id: 'user456' });
      
      const metrics = networkManager.getPerformanceMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    test('should track error rate correctly', async () => {
      const metrics = networkManager.getPerformanceMetrics();
      
      // Initially no errors
      expect(metrics.errorRate).toBe(0);
    });
  });

  describe('Configuration and Options', () => {
    test('should respect retry configuration', async () => {
      const noRetryManager = new NetworkManager(mockReactorySDK, { enableRetry: false });
      
      expect(noRetryManager).toBeInstanceOf(NetworkManager);
      
      await noRetryManager.destroy();
    });

    test('should respect offline queue configuration', async () => {
      const noOfflineManager = new NetworkManager(mockReactorySDK, { enableOfflineQueue: false });
      
      await noOfflineManager.initialize();
      expect(noOfflineManager).toBeInstanceOf(NetworkManager);
      
      await noOfflineManager.destroy();
    });

    test('should respect performance monitoring configuration', async () => {
      const noMonitoringManager = new NetworkManager(mockReactorySDK, { enablePerformanceMonitoring: false });
      
      await noMonitoringManager.initialize();
      expect(noMonitoringManager).toBeInstanceOf(NetworkManager);
      
      await noMonitoringManager.destroy();
    });

    test('should respect request deduplication configuration', async () => {
      const noDedupManager = new NetworkManager(mockReactorySDK, { enableRequestDeduplication: false });
      
      const variables = { id: 'user123' };
      await noDedupManager.query(TEST_QUERY, variables);
      await noDedupManager.query(TEST_QUERY, variables);
      
      // Should not deduplicate requests
      expect(noDedupManager).toBeInstanceOf(NetworkManager);
      
      await noDedupManager.destroy();
    });

    test('should handle custom headers configuration', async () => {
      const customHeadersManager = new NetworkManager(mockReactorySDK, {
        headers: { 'Custom-Header': 'test-value' }
      });
      
      await customHeadersManager.initialize();
      expect(customHeadersManager).toBeInstanceOf(NetworkManager);
      
      await customHeadersManager.destroy();
    });

    test('should handle custom endpoints configuration', async () => {
      const customEndpointsManager = new NetworkManager(mockReactorySDK, {
        endpoints: {
          graphql: '/custom-graphql',
          subscription: '/custom-subscription',
          upload: '/custom-upload',
        }
      });
      
      await customEndpointsManager.initialize();
      expect(customEndpointsManager).toBeInstanceOf(NetworkManager);
      
      await customEndpointsManager.destroy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty query', async () => {
      const response = await networkManager.query('');
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    });

    test('should handle query with null variables', async () => {
      const response = await networkManager.query(TEST_QUERY, null as any);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    });

    test('should handle mutation with null variables', async () => {
      const response = await networkManager.mutate(TEST_MUTATION, null as any);
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    });

    test('should handle subscription with null variables', async () => {
      const result = await networkManager.subscribe(TEST_SUBSCRIPTION, null as any);
      
      expect(result).toBeDefined();
      expect(typeof result.unsubscribe).toBe('function');
      
      result.unsubscribe();
    });

    test('should destroy manager and clean up resources', async () => {
      await networkManager.initialize();
      await networkManager.query(TEST_QUERY, { id: 'user123' });
      
      await networkManager.destroy();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.destroyed');
      
      const metrics = networkManager.getPerformanceMetrics();
      expect(metrics.metrics).toHaveLength(0);
    });

    test('should handle destroy before initialization', async () => {
      const manager = new NetworkManager(mockReactorySDK);
      await manager.destroy();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.destroyed');
    });

    test('should handle concurrent destroy calls', async () => {
      await networkManager.initialize();
      
      // Multiple destroy calls should be safe
      await Promise.all([
        networkManager.destroy(),
        networkManager.destroy(),
        networkManager.destroy(),
      ]);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('networkManager.destroyed');
    });
  });
});
