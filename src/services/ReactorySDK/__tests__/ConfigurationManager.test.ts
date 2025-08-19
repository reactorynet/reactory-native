/**
 * ConfigurationManager Test Suite
 * 
 * Comprehensive test coverage for the ConfigurationManager class following TDD principles.
 * Tests cover configuration loading, validation, caching, and real-time updates.
 * 
 * @version 1.0.0
 * @created August 19, 2025
 */

import { ConfigurationManager, ConfigurationValidationError } from '../ConfigurationManager';
import { ReactorySDK } from '../ReactorySDK';
import { 
  ReactorySDKConfig
} from '../types';

// Define test-specific types that will be added to types.ts
interface Configuration {
  client: {
    name: string;
    version: string;
    theme: string;
    features: {
      authentication: boolean;
      darkMode: boolean;
      notifications: boolean;
    };
  };
  api: {
    timeout: number;
    retryAttempts: number;
    cacheTimeout: number;
  };
  ui: {
    defaultLanguage: string;
    dateFormat: string;
    currency: string;
  };
}

// Mock GraphQL client
const mockGraphQLClient = {
  query: jest.fn(),
  mutate: jest.fn()
};

// Mock SDK configuration
const mockConfig: ReactorySDKConfig = {
  apiEndpoint: 'https://api.example.com/graphql',
  clientKey: 'test-client'
};

// Mock configuration data
const mockServerConfig: Configuration = {
  client: {
    name: 'Test Client',
    version: '1.0.0',
    theme: 'default',
    features: {
      authentication: true,
      darkMode: true,
      notifications: false
    }
  },
  api: {
    timeout: 30000,
    retryAttempts: 3,
    cacheTimeout: 300000
  },
  ui: {
    defaultLanguage: 'en',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  }
};

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  let mockSdk: ReactorySDK;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Create real SDK instance for testing
    mockSdk = new ReactorySDK(mockConfig);
    (mockSdk as any).client = mockGraphQLClient;
    
    // Mock SDK methods
    mockSdk.debug = jest.fn();
    mockSdk.error = jest.fn();
    mockSdk.info = jest.fn();
    mockSdk.emit = jest.fn();

    configManager = new ConfigurationManager(mockSdk);
  });

  afterEach(() => {
    // Ensure clean state after each test
    if (configManager) {
      configManager.resetForTesting?.();
    }
  });

  // ============================================================================
  // Test Group 4.1: Initialization and Setup
  // ============================================================================
  describe('Test Group 4.1: Initialization and Setup', () => {
    test('should initialize successfully with valid SDK instance', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce({
        data: { getConfiguration: mockServerConfig }
      });

      await expect(configManager.initialize()).resolves.toBeUndefined();
      expect(mockSdk.debug).toHaveBeenCalledWith('ConfigurationManager initialized');
    });

    test('should throw error when initializing without SDK', () => {
      expect(() => new ConfigurationManager(null as any)).toThrow('SDK instance is required');
    });

    test('should prevent multiple initialization calls', async () => {
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });

      await configManager.initialize();
      await configManager.initialize(); // Second call should be ignored
      
      expect(mockSdk.debug).toHaveBeenCalledWith('ConfigurationManager initialized');
    });

    test('should handle configuration loading failure gracefully', async () => {
      const configError = new Error('Failed to load configuration');
      mockGraphQLClient.query.mockRejectedValueOnce(configError);

      await expect(configManager.initialize()).rejects.toThrow('Failed to load configuration');
      expect(mockSdk.error).toHaveBeenCalledWith('Failed to initialize ConfigurationManager', configError);
    });
  });

  // ============================================================================
  // Test Group 4.2: Configuration Loading
  // ============================================================================
  describe('Test Group 4.2: Configuration Loading', () => {
    beforeEach(async () => {
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });
      await configManager.initialize();
    });

    test('should load configuration from server', async () => {
      const config = await configManager.loadConfiguration();
      
      expect(config).toEqual(mockServerConfig);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith({
        query: expect.stringContaining('getConfiguration'),
        variables: { clientKey: 'test-client' }
      });
    });

    test('should cache loaded configuration', async () => {
      const config1 = await configManager.loadConfiguration();
      const config2 = await configManager.loadConfiguration();
      
      expect(config1).toEqual(config2);
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(2); // Once during init, once for first load
    });

    test('should force reload configuration when requested', async () => {
      const updatedConfig = { ...mockServerConfig, client: { ...mockServerConfig.client, version: '2.0.0' } };
      
      await configManager.loadConfiguration();
      
      mockGraphQLClient.query.mockResolvedValueOnce({
        data: { getConfiguration: updatedConfig }
      });
      
      const reloadedConfig = await configManager.loadConfiguration(true);
      
      expect(reloadedConfig.client.version).toBe('2.0.0');
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(3); // Init + first load + force reload
    });

    test('should handle network errors during configuration loading', async () => {
      const networkError = new Error('Network request failed');
      mockGraphQLClient.query.mockRejectedValueOnce(networkError);

      await expect(configManager.loadConfiguration(true)).rejects.toThrow('Network request failed');
      expect(mockSdk.emit).toHaveBeenCalledWith('configuration_load_failed', { error: networkError });
    });
  });

  // ============================================================================
  // Test Group 4.3: Configuration Access
  // ============================================================================
  describe('Test Group 4.3: Configuration Access', () => {
    beforeEach(async () => {
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });
      await configManager.initialize();
    });

    test('should get configuration value by key path', () => {
      expect(configManager.get('client.name')).toBe('Test Client');
      expect(configManager.get('api.timeout')).toBe(30000);
      expect(configManager.get('ui.defaultLanguage')).toBe('en');
    });

    test('should return default value for non-existent keys', () => {
      expect(configManager.get('non.existent.key')).toBeUndefined();
      expect(configManager.get('non.existent.key', 'default')).toBe('default');
    });

    test('should get entire configuration object', () => {
      const config = configManager.getAll();
      expect(config).toEqual(mockServerConfig);
    });

    test('should check if configuration key exists', () => {
      expect(configManager.has('client.name')).toBe(true);
      expect(configManager.has('non.existent.key')).toBe(false);
    });

    test('should get configuration section', () => {
      const clientConfig = configManager.getSection('client');
      expect(clientConfig).toEqual(mockServerConfig.client);
      
      const apiConfig = configManager.getSection('api');
      expect(apiConfig).toEqual(mockServerConfig.api);
    });
  });

  // ============================================================================
  // Test Group 4.4: Configuration Updates
  // ============================================================================
  describe('Test Group 4.4: Configuration Updates', () => {
    beforeEach(async () => {
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });
      await configManager.initialize();
    });

    test('should set configuration values', () => {
      configManager.set('client.name', 'Updated Client');
      expect(configManager.get('client.name')).toBe('Updated Client');
    });

    test('should emit configuration change events', () => {
      configManager.set('api.timeout', 60000);
      
      expect(mockSdk.emit).toHaveBeenCalledWith('configuration_changed', {
        key: 'api.timeout',
        oldValue: 30000,
        newValue: 60000
      });
    });

    test('should merge configuration objects', () => {
      const updates = {
        client: { version: '2.0.0' },
        api: { timeout: 45000 }
      } as any;
      
      configManager.merge(updates);
      
      expect(configManager.get('client.version')).toBe('2.0.0');
      expect(configManager.get('client.name')).toBe('Test Client'); // Should preserve existing
      expect(configManager.get('api.timeout')).toBe(45000);
    });

    test('should persist configuration changes', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce({
        data: { updateConfiguration: { success: true } }
      });

      configManager.set('client.name', 'Persisted Client');
      await configManager.persist();

      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith({
        mutation: expect.stringContaining('updateConfiguration'),
        variables: {
          clientKey: 'test-client',
          configuration: expect.objectContaining({
            client: expect.objectContaining({ name: 'Persisted Client' })
          })
        }
      });
    });
  });

  // ============================================================================
  // Test Group 4.5: Configuration Validation
  // ============================================================================
  describe('Test Group 4.5: Configuration Validation', () => {
    beforeEach(async () => {
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });
      await configManager.initialize();
    });

    test('should validate configuration structure', () => {
      const validConfig = { ...mockServerConfig };
      expect(() => configManager.validate(validConfig)).not.toThrow();
    });

    test('should reject invalid configuration', () => {
      const invalidConfig = { invalid: 'structure' };
      expect(() => configManager.validate(invalidConfig as any)).toThrow(ConfigurationValidationError);
    });

    test('should validate required fields', () => {
      const configMissingRequired: any = { ...mockServerConfig };
      delete configMissingRequired.client;
      
      expect(() => configManager.validate(configMissingRequired)).toThrow('client configuration is required');
    });

    test('should validate field types', () => {
      const configWithWrongTypes = {
        ...mockServerConfig,
        api: { ...mockServerConfig.api, timeout: 'invalid' as any }
      };
      
      expect(() => configManager.validate(configWithWrongTypes)).toThrow('api.timeout must be a number');
    });
  });

  // ============================================================================
  // Test Group 4.6: Cache Management
  // ============================================================================
  describe('Test Group 4.6: Cache Management', () => {
    beforeEach(async () => {
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });
      await configManager.initialize();
    });

    test('should cache configuration with TTL', async () => {
      await configManager.loadConfiguration();
      
      // Should use cache and not make another request
      await configManager.loadConfiguration();
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(2); // Only init call + first load
    });

    test('should expire cache after TTL', async () => {
      // Mock Date.now to control cache expiration
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(1000);
      
      await configManager.loadConfiguration();
      
      // Advance time beyond cache TTL (default 5 minutes = 300000ms)
      mockNow.mockReturnValue(1000 + 300001);
      
      await configManager.loadConfiguration();
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(3); // Init + first load + expired reload
      
      mockNow.mockRestore();
    });

    test('should clear cache when requested', async () => {
      await configManager.loadConfiguration();
      
      configManager.clearCache();
      
      await configManager.loadConfiguration();
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(3); // Init + first load + post-clear load
    });
  });

  // ============================================================================
  // Test Group 4.7: Real-time Updates
  // ============================================================================
  describe('Test Group 4.7: Real-time Updates', () => {
    beforeEach(async () => {
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });
      await configManager.initialize();
    });

    test('should handle configuration update notifications', () => {
      const updateNotification = {
        key: 'client.theme',
        value: 'dark',
        timestamp: Date.now()
      };

      configManager.handleConfigurationUpdate(updateNotification);

      expect(configManager.get('client.theme')).toBe('dark');
      expect(mockSdk.emit).toHaveBeenCalledWith('configuration_updated', updateNotification);
    });

    test('should validate real-time updates', () => {
      const invalidUpdate = {
        key: 'api.timeout',
        value: 'invalid',
        timestamp: Date.now()
      };

      expect(() => configManager.handleConfigurationUpdate(invalidUpdate)).toThrow('Invalid configuration update');
    });

    test('should subscribe to configuration changes', () => {
      const callback = jest.fn();
      
      configManager.subscribe('client.theme', callback);
      configManager.set('client.theme', 'dark');

      expect(callback).toHaveBeenCalledWith('dark', 'default');
    });

    test('should unsubscribe from configuration changes', () => {
      const callback = jest.fn();
      
      const unsubscribe = configManager.subscribe('client.theme', callback);
      unsubscribe();
      
      configManager.set('client.theme', 'dark');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Test Group 4.8: Error Handling and Edge Cases
  // ============================================================================
  describe('Test Group 4.8: Error Handling and Edge Cases', () => {
    test('should handle empty configuration response', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce({
        data: { getConfiguration: null }
      });

      await expect(configManager.initialize()).rejects.toThrow('Invalid configuration response');
    });

    test('should handle malformed configuration data', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce({
        data: { getConfiguration: 'invalid-json' }
      });

      await expect(configManager.initialize()).rejects.toThrow('Invalid configuration format');
    });

    test('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      mockGraphQLClient.query.mockRejectedValueOnce(timeoutError);

      await expect(configManager.initialize()).rejects.toThrow('Request timeout');
      expect(mockSdk.error).toHaveBeenCalledWith('Failed to initialize ConfigurationManager', timeoutError);
    });

    test('should handle concurrent configuration access', async () => {
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });

      const promises = [
        configManager.initialize(),
        configManager.initialize(),
        configManager.initialize()
      ];

      await Promise.all(promises);
      
      // Should only initialize once
      expect(mockSdk.debug).toHaveBeenCalledWith('ConfigurationManager initialized');
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(1);
    });

    test('should handle storage errors gracefully', async () => {
      // Initialize the configuration manager first
      mockGraphQLClient.query.mockResolvedValue({
        data: { getConfiguration: mockServerConfig }
      });
      await configManager.initialize();
      
      const storageError = new Error('Storage quota exceeded');
      jest.spyOn(configManager as any, 'persistToStorage').mockRejectedValueOnce(storageError);

      configManager.set('client.name', 'Test');
      await expect(configManager.persist()).rejects.toThrow('Storage quota exceeded');
      expect(mockSdk.error).toHaveBeenCalledWith('Failed to persist configuration', storageError);
    });
  });
});
