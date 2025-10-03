/**
 * ConfigurationManager - Simplified Working Version
 * 
 * Manages application configuration with dependency injection to avoid circular dependencies
 * 
 * @version 1.0.0
 * @created August 20, 2025
 */

import { ReactorySDK } from './ReactorySDK';

// Configuration interfaces
export interface Configuration {
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

export type ConfigurationCallback = (value: any, key: string) => void;

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

/**
 * ConfigurationManager class with dependency injection
 */
export class ConfigurationManager {
  private readonly sdk: ReactorySDK;
  private readonly clientKey: string;
  private configuration: Configuration | null = null;
  private cache: { data: Configuration; timestamp: number; ttl: number } | null = null;
  private readonly subscriptions = new Map<string, Set<ConfigurationCallback>>();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly defaultCacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(sdk: ReactorySDK, clientKey: string = 'test-client') {
    if (!sdk) {
      throw new Error('SDK instance is required');
    }
    this.sdk = sdk;
    this.clientKey = clientKey;
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
      // Check cache first unless force reload
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

      // Update configuration and cache
      this.configuration = config;
      this.cache = {
        data: config,
        timestamp: Date.now(),
        ttl: this.defaultCacheTTL
      };

      this.sdk.debug?.('Configuration loaded successfully');
      return config;
    } catch (error) {
      this.sdk.error?.('Failed to load configuration', error);
      throw error;
    }
  }

  /**
   * Get configuration value by key path
   */
  get<T>(keyPath: string, defaultValue?: T): T | undefined {
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

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    const oldValue = current[lastKey];
    current[lastKey] = value;

    // Emit change events
    this.notifySubscribers(keyPath, value, oldValue);
    this.sdk.emit?.('configuration_changed', {
      key: keyPath,
      oldValue,
      newValue: value
    });
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(keyPath: string, callback: ConfigurationCallback): () => void {
    if (!this.subscriptions.has(keyPath)) {
      this.subscriptions.set(keyPath, new Set());
    }

    this.subscriptions.get(keyPath)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(keyPath);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(keyPath);
        }
      }
    };
  }

  /**
   * Check if configuration exists
   */
  has(keyPath: string): boolean {
    return this.get(keyPath) !== undefined;
  }

  /**
   * Get entire configuration object
   */
  getConfig(): Configuration | null {
    return this.configuration;
  }

  /**
   * Get entire configuration object (alias for getConfig)
   */
  getAll(): Configuration | null {
    return this.configuration;
  }

  /**
   * Get configuration section
   */
  getSection<T>(sectionName: string): T | undefined {
    return this.get<T>(sectionName);
  }

  /**
   * Merge configuration objects
   */
  merge(updates: Partial<Configuration>): void {
    if (!this.configuration) {
      throw new Error('Configuration not loaded');
    }

    // Deep merge the updates into current configuration
    this.configuration = this.deepMerge(this.configuration, updates);
    
    // Emit merge event
    this.sdk.emit?.('configuration_merged', { updates });
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
        query: `
          mutation UpdateConfiguration($clientKey: String!, $configuration: ConfigurationInput!) {
            updateConfiguration(clientKey: $clientKey, configuration: $configuration) {
              success
            }
          }
        `,
        variables: {
          clientKey: this.clientKey,
          configuration: this.configuration
        }
      });

      this.sdk.debug?.('Configuration persisted successfully');
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
    const requiredSections = ['client', 'api', 'ui'];
    for (const section of requiredSections) {
      if (!config[section]) {
        throw new ConfigurationValidationError(`${section} configuration is required`);
      }
    }

    // Validate client section
    if (!config.client.name || !config.client.version) {
      throw new ConfigurationValidationError('Client name and version are required');
    }

    // Validate field types
    if (config.api && config.api.timeout && typeof config.api.timeout !== 'number') {
      throw new ConfigurationValidationError('api.timeout must be a number');
    }
  }

  /**
   * Handle real-time configuration updates
   */
  handleConfigurationUpdate(update: { key: string; value: any; timestamp: number }): void {
    if (!update || !update.key || update.value === undefined) {
      throw new Error('Invalid configuration update');
    }

    this.set(update.key, update.value);
    this.sdk.emit?.('configuration_updated', update);
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.cache.ttl;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Notify subscribers of configuration changes
   */
  private notifySubscribers(keyPath: string, newValue: any, _oldValue: any): void {
    const callbacks = this.subscriptions.get(keyPath);
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach((callback: ConfigurationCallback) => {
        try {
          callback(newValue, keyPath);
        } catch (error) {
          this.sdk.error?.('Error in configuration change callback', error);
        }
      });
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
    this.sdk.debug?.('Configuration cache cleared');
  }

  /**
   * Destroy manager and clean up resources
   */
  async destroy(): Promise<void> {
    this.isInitialized = false;
    this.configuration = null;
    this.cache = null;
    this.subscriptions.clear();
    this.initializationPromise = null;
    this.sdk.debug?.('ConfigurationManager destroyed');
  }
}
