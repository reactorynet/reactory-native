/**
 * ConfigurationManager Implementation
 * 
 * Manages application configuration including loading from server, caching,
 * validation, and real-time updates. Supports multi-client configurations
 * and environment-specific settings.
 * 
 * @version 1.0.0
 * @created August 19, 2025
 */

import { ReactorySDK } from './ReactorySDK';
import { EventEmitter } from 'events';

// Configuration interfaces
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

interface ConfigurationUpdateNotification {
  key: string;
  value: any;
  timestamp: number;
}

interface ConfigurationCache {
  data: Configuration;
  timestamp: number;
  ttl: number;
}

type ConfigurationCallback = (value: any, key: string) => void;

export class ConfigurationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationValidationError';
  }
}

// GraphQL queries
const GET_CONFIGURATION_QUERY = `
  query GetConfiguration($clientKey: String!) {
    getConfiguration(clientKey: $clientKey) {
      client {
        name
        version
        theme
        features {
          authentication
          darkMode
          notifications
        }
      }
      api {
        timeout
        retryAttempts
        cacheTimeout
      }
      ui {
        defaultLanguage
        dateFormat
        currency
      }
    }
  }
`;

const UPDATE_CONFIGURATION_MUTATION = `
  mutation UpdateConfiguration($clientKey: String!, $configuration: ConfigurationInput!) {
    updateConfiguration(clientKey: $clientKey, configuration: $configuration) {
      success
      configuration {
        client {
          name
          version
          theme
        }
      }
    }
  }
`;

/**
 * ConfigurationManager handles all configuration-related operations
 */
export class ConfigurationManager extends EventEmitter {
  private sdk: ReactorySDK;
  private configuration: Configuration = {};
  private cache: ConfigurationCache | null = null;
  private subscriptions: Map<string, Set<ConfigurationCallback>> = new Map();
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private clientKey: string;

  constructor(sdk: ReactorySDK, clientKey?: string) {
    super();
    this.sdk = sdk;
    this.clientKey = clientKey || 'test-client';
  }

  /**
   * Initialize the configuration manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      this.sdk.debug?.('Initializing ConfigurationManager');

      // Load initial configuration during initialization
      await this.loadConfiguration();

      this.isInitialized = true;
      this.sdk.debug?.('ConfigurationManager initialized');
    } catch (error) {
      this.sdk.error?.('Failed to initialize ConfigurationManager', error);
      throw error;
    }
  }

  /**
   * Load configuration from server
   */
  async loadConfiguration(forceReload: boolean = false): Promise<Configuration> {
    try {
      // Check cache first unless force reload or this is during initialization
      if (!forceReload && this.cache && this.isCacheValid() && this.isInitialized) {
        this.sdk.debug?.('Using cached configuration');
        this.configuration = this.cache.data;
        return this.cache.data;
      }

      this.sdk.debug?.('Loading configuration from server');

      const response = await this.sdk.client.query({
        query: GET_CONFIGURATION_QUERY,
        variables: {
          clientKey: this.clientKey
        }
      });

      if (!response.data?.getConfiguration) {
        throw new Error('Invalid configuration response');
      }

      const config = response.data.getConfiguration;

      // Validate configuration
      this.validate(config);

      // Deep clone the configuration to avoid reference issues
      const clonedConfig = JSON.parse(JSON.stringify(config));

      // Update cache only after initialization
      if (this.isInitialized) {
        this.cache = {
          data: clonedConfig,
          timestamp: Date.now(),
          ttl: this.defaultCacheTTL
        };
      }

      this.configuration = clonedConfig;

      this.sdk.emit?.('configuration_loaded', { configuration: clonedConfig });
      return clonedConfig;

    } catch (error) {
      this.sdk.error?.('Failed to load configuration', error);
      this.sdk.emit?.('configuration_load_failed', { error });
      
      throw error;
    }
  }

  /**
   * Get configuration value by key path
   */
  get<T = any>(keyPath: string, defaultValue?: T): T | undefined {
    if (!this.configuration) {
      return defaultValue;
    }

    const keys = keyPath.split('.');
    let current: any = this.configuration;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current as T;
  }

  /**
   * Set configuration value by key path
   */
  set(keyPath: string, value: any): void {
    if (!this.configuration) {
      throw new Error('Configuration not loaded');
    }

    const keys = keyPath.split('.');
    const lastKey = keys.pop()!;
    let current: any = this.configuration;

    // Navigate to parent object
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const oldValue = current[lastKey];
    current[lastKey] = value;

    // Notify subscribers
    this.notifySubscribers(keyPath, value, oldValue);

    // Emit change event
    this.sdk.emit?.('configuration_changed', {
      key: keyPath,
      oldValue,
      newValue: value
    });

    // Invalidate cache
    if (this.cache) {
      this.cache.data = { ...this.configuration };
    }
  }

  /**
   * Get all configuration
   */
  getAll(): Configuration | null {
    return this.configuration;
  }

  /**
   * Check if configuration key exists
   */
  has(keyPath: string): boolean {
    return this.get(keyPath) !== undefined;
  }

  /**
   * Get configuration section
   */
  getSection<T = any>(sectionKey: string): T | undefined {
    return this.get<T>(sectionKey);
  }

  /**
   * Merge configuration object
   */
  merge(updates: Partial<Configuration>): void {
    if (!this.configuration) {
      throw new Error('Configuration not loaded');
    }

    const mergeObject = (target: any, source: any, path: string = '') => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          const fullPath = path ? `${path}.${key}` : key;
          
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
              target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
            // Deep merge objects
            mergeObject(target[key], source[key], fullPath);
          } else {
            const oldValue = target[key];
            target[key] = source[key];
            
            // Notify for each changed value
            this.notifySubscribers(fullPath, source[key], oldValue);
            this.sdk.emit?.('configuration_changed', {
              key: fullPath,
              oldValue,
              newValue: source[key]
            });
          }
        }
      }
    };

    mergeObject(this.configuration, updates);

    // Update cache
    if (this.cache) {
      this.cache.data = { ...this.configuration };
    }
  }

  /**
   * Persist configuration changes to server
   */
  async persist(): Promise<void> {
    if (!this.configuration) {
      throw new Error('No configuration to persist');
    }

    try {
      await this.sdk.client.mutate({
        query: UPDATE_CONFIGURATION_MUTATION,
        variables: {
          clientKey: this.clientKey,
          configuration: configToUpdate
        }
      });

      // Also persist to local storage
      await this.persistToStorage();

      this.sdk.emit?.('configuration_persisted', { configuration: this.configuration });
    } catch (error) {
      this.sdk.error?.('Failed to persist configuration', error);
      throw error;
    }
  }

  /**
   * Validate configuration structure
   */
  validate(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new ConfigurationValidationError('Invalid configuration format');
    }

    // Validate required sections
    if (!config.client) {
      throw new ConfigurationValidationError('client configuration is required');
    }

    if (!config.api) {
      throw new ConfigurationValidationError('api configuration is required');
    }

    if (!config.ui) {
      throw new ConfigurationValidationError('ui configuration is required');
    }

    // Validate client section
    if (typeof config.client.name !== 'string') {
      throw new ConfigurationValidationError('client.name must be a string');
    }

    if (typeof config.client.version !== 'string') {
      throw new ConfigurationValidationError('client.version must be a string');
    }

    // Validate api section
    if (typeof config.api.timeout !== 'number') {
      throw new ConfigurationValidationError('api.timeout must be a number');
    }

    if (typeof config.api.retryAttempts !== 'number') {
      throw new ConfigurationValidationError('api.retryAttempts must be a number');
    }

    // Validate ui section
    if (typeof config.ui.defaultLanguage !== 'string') {
      throw new ConfigurationValidationError('ui.defaultLanguage must be a string');
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.cache = null;
    this.sdk.debug?.('Configuration cache cleared');
  }

  /**
   * Handle real-time configuration updates
   */
  handleConfigurationUpdate(notification: ConfigurationUpdateNotification): void {
    try {
      // Validate the update
      if (!notification.key || notification.value === undefined) {
        throw new Error('Invalid configuration update');
      }

      // Check if configuration is loaded first
      if (!this.configuration) {
        throw new Error('Configuration not loaded');
      }

      // Validate the update value based on the key
      this.validateUpdateValue(notification.key, notification.value);

      // Apply the update
      this.set(notification.key, notification.value);

      this.sdk.emit?.('configuration_updated', notification);
      this.sdk.debug?.(`Configuration updated: ${notification.key} = ${notification.value}`);
    } catch (error) {
      this.sdk.error?.('Failed to handle configuration update', error);
      throw error;
    }
  }

  /**
   * Validate a configuration update value
   */
  private validateUpdateValue(keyPath: string, value: any): void {
    // Validate specific types for known configuration keys
    if (keyPath === 'api.timeout' && typeof value !== 'number') {
      throw new Error('Invalid configuration update');
    }
    
    if (keyPath === 'api.retryAttempts' && typeof value !== 'number') {
      throw new Error('Invalid configuration update');
    }
    
    if (keyPath.startsWith('client.name') && typeof value !== 'string') {
      throw new Error('Invalid configuration update');
    }
    
    if (keyPath.startsWith('client.version') && typeof value !== 'string') {
      throw new Error('Invalid configuration update');
    }
    
    if (keyPath === 'ui.defaultLanguage' && typeof value !== 'string') {
      throw new Error('Invalid configuration update');
    }
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(keyPath: string, callback: (newValue: any, oldValue: any) => void): () => void {
    if (!this.subscribers.has(keyPath)) {
      this.subscribers.set(keyPath, []);
    }

    this.subscribers.get(keyPath)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(keyPath);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) {
      return false;
    }

    const now = Date.now();
    return (now - this.cache.timestamp) < this.cache.ttl;
  }

  /**
   * Notify subscribers of configuration changes
   */
  private notifySubscribers(keyPath: string, newValue: any, oldValue: any): void {
    const callbacks = this.subscribers.get(keyPath);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          this.sdk.error?.('Error in configuration change callback', error);
        }
      });
    }
  }

  /**
   * Persist configuration to local storage
   */
  private async persistToStorage(): Promise<void> {
    try {
      // In a real implementation, this would use AsyncStorage or SecureStore
      // For now, we'll simulate storage persistence
      this.sdk.debug?.('Configuration persisted to local storage');
    } catch (error) {
      this.sdk.error?.('Failed to persist to storage', error);
      throw error;
    }
  }

  /**
   * Reset configuration manager state (useful for testing)
   */
  public resetForTesting?(): void {
    this.configuration = null;
    this.cache = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.subscribers.clear();
  }
}
