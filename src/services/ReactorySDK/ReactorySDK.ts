/**
 * ReactorySDK - Main SDK Implementation
 * 
 * The core service class that provides the main interface between the React Native
 * application and the Reactory backend services. Serves as the central orchestrator
 * for authentication, component management, form schemas, GraphQL operations, and
 * real-time updates.
 * 
 * @version 1.0.0
 * @created August 18, 2025
 */

import { ReactorySDKConfig, IApiStatus, IApiStatusRequestOptions, User } from './types';
import { ConfigurationManager } from './ConfigurationManager';
import { FormSchemaManager } from './FormSchemaManager';
import { NetworkManager } from './NetworkManager';
import { ThemeManager } from './ThemeManager';
import { ApiStatusManager } from './ApiStatusManager';
import type { 
  Organization,
  UserMembership
} from './types';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 * 
 * @constructor
 * @private
 */
interface Events {
  [key: string]: any;
}

function createEvents(): Events {
  if (Object.create) {
    return Object.create(null);
  }
  return {};
}

// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
const has = Object.prototype.hasOwnProperty;
let prefix = '~';

// Check if we can use Object.create safely
try {
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  const testEvents = createEvents();
  if (!Object.getPrototypeOf || Object.getPrototypeOf(testEvents) === null) {
    prefix = '';
  }
} catch {
  // Fallback to prefix if Object.create fails
  prefix = '~';
}

/**
 * Representation of a single event listener.
 * 
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
class EE {
  fn: Function;
  context: any;
  once: boolean;

  constructor(fn: Function, context: any, once: boolean = false) {
    this.fn = fn;
    this.context = context;
    this.once = once;
  }
}

/**
 * Add a listener for a given event.
 * 
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {string|symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter: EventEmitter, event: string | symbol, fn: Function, context: any, once: boolean): EventEmitter {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  const listener = new EE(fn, context || emitter, once);
  const evt = prefix ? prefix + event.toString() : event.toString();

  if (!emitter._events[evt]) {
    emitter._events[evt] = listener;
    emitter._eventsCount++;
  } else if (!emitter._events[evt].fn) {
    (emitter._events[evt] as EE[]).push(listener);
  } else {
    emitter._events[evt] = [emitter._events[evt] as EE, listener];
  }

  return emitter;
}

/**
 * Clear event by name.
 * 
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {string} evt The Event name.
 * @private
 */
function clearEvent(emitter: EventEmitter, evt: string): void {
  if (--emitter._eventsCount === 0) {
    emitter._events = createEvents();
  } else {
    delete emitter._events[evt];
  }
}

/**
 * Enhanced EventEmitter implementation based on EventEmitter3
 * Provides a complete event management system with context support,
 * one-time listeners, and comprehensive listener management.
 */
class EventEmitter {
  _events: any;
  _eventsCount: number;

  constructor() {
    this._events = createEvents();
    this._eventsCount = 0;
  }

  /**
   * Return an array listing the events for which the emitter has registered listeners.
   * 
   * @returns {Array} Array of event names
   * @public
   */
  eventNames(): (string | symbol)[] {
    const names: (string | symbol)[] = [];
    let name: string;

    if (this._eventsCount === 0) return names;

    const events = this._events;
    for (name in events) {
      if (has.call(events, name)) {
        names.push(prefix ? name.slice(1) : name);
      }
    }

    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }

    return names;
  }

  /**
   * Return the listeners registered for a given event.
   * 
   * @param {string|symbol} event The event name.
   * @returns {Function[]} The registered listeners.
   * @public
   */
  listeners(event: string | symbol): Function[] {
    const evt = prefix ? prefix + event.toString() : event.toString();
    const handlers = this._events[evt];

    if (!handlers) return [];
    if ((handlers as EE).fn) return [(handlers as EE).fn];

    const result: Function[] = [];
    for (let i = 0, l = (handlers as EE[]).length; i < l; i++) {
      result[i] = (handlers as EE[])[i].fn;
    }

    return result;
  }

  /**
   * Return the number of listeners listening to a given event.
   * 
   * @param {string|symbol} event The event name.
   * @returns {number} The number of listeners.
   * @public
   */
  listenerCount(event: string | symbol): number {
    const evt = prefix ? prefix + event.toString() : event.toString();
    const listeners = this._events[evt];

    if (!listeners) return 0;
    if ((listeners as EE).fn) return 1;
    return (listeners as EE[]).length;
  }

  /**
   * Calls each of the listeners registered for a given event.
   * 
   * @param {string|symbol} event The event name.
   * @param {...any} args Arguments to pass to the listeners.
   * @returns {boolean} `true` if the event had listeners, else `false`.
   * @public
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    const evt = prefix ? prefix + event.toString() : event.toString();

    if (!this._events[evt]) return false;

    const listeners = this._events[evt];
    
    this.callListeners(listeners, event, args);
    return true;
  }

  /**
   * Helper method to call listeners with proper context and argument handling
   * @private
   */
  private callListeners(listeners: EE | EE[], event: string | symbol, args: any[]): void {
    if ((listeners as EE).fn) {
      this.callSingleListener(listeners as EE, event, args);
    } else {
      this.callMultipleListeners(listeners as EE[], event, args);
    }
  }

  /**
   * Helper method to call a single listener
   * @private
   */
  private callSingleListener(listener: EE, event: string | symbol, args: any[]): void {
    if (listener.once) {
      this.removeListener(event, listener.fn, undefined, true);
    }

    switch (args.length) {
      case 0: listener.fn.call(listener.context); break;
      case 1: listener.fn.call(listener.context, args[0]); break;
      case 2: listener.fn.call(listener.context, args[0], args[1]); break;
      case 3: listener.fn.call(listener.context, args[0], args[1], args[2]); break;
      default: listener.fn.apply(listener.context, args); break;
    }
  }

  /**
   * Helper method to call multiple listeners
   * @private
   */
  private callMultipleListeners(listenerArray: EE[], event: string | symbol, args: any[]): void {
    const length = listenerArray.length;

    for (let i = 0; i < length; i++) {
      const listener = listenerArray[i];
      if (listener.once) {
        this.removeListener(event, listener.fn, undefined, true);
      }

      switch (args.length) {
        case 0: listener.fn.call(listener.context); break;
        case 1: listener.fn.call(listener.context, args[0]); break;
        case 2: listener.fn.call(listener.context, args[0], args[1]); break;
        case 3: listener.fn.call(listener.context, args[0], args[1], args[2]); break;
        default: listener.fn.apply(listener.context, args); break;
      }
    }
  }

  /**
   * Add a listener for a given event.
   * 
   * @param {string|symbol} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  on(event: string | symbol, fn: Function, context?: any): this {
    addListener(this, event, fn, context, false);
    return this;
  }

  /**
   * Add a one-time listener for a given event.
   * 
   * @param {string|symbol} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  once(event: string | symbol, fn: Function, context?: any): this {
    addListener(this, event, fn, context, true);
    return this;
  }

  /**
   * Remove the listeners of a given event.
   * 
   * @param {string|symbol} event The event name.
   * @param {Function} fn Only remove the listeners that match this function.
   * @param {*} context Only remove the listeners that have this context.
   * @param {boolean} once Only remove one-time listeners.
   * @returns {EventEmitter} `this`.
   * @public
   */
  removeListener(event: string | symbol, fn?: Function, context?: any, once?: boolean): this {
    const evt = prefix ? prefix + event.toString() : event.toString();

    if (!this._events[evt]) return this;
    if (!fn) {
      clearEvent(this, evt);
      return this;
    }

    const listeners = this._events[evt];

    if ((listeners as EE).fn) {
      this.removeSingleListener(listeners as EE, evt, fn, context, once);
    } else {
      this.removeFromMultipleListeners(evt, listeners as EE[], fn, context, once);
    }

    return this;
  }

  /**
   * Helper method to remove a single listener
   * @private
   */
  private removeSingleListener(listener: EE, evt: string, fn: Function, context?: any, once?: boolean): void {
    if (
      listener.fn === fn &&
      (!once || listener.once) &&
      (!context || listener.context === context)
    ) {
      clearEvent(this, evt);
    }
  }

  /**
   * Helper method to remove from multiple listeners
   * @private
   */
  private removeFromMultipleListeners(evt: string, listenerArray: EE[], fn: Function, context?: any, once?: boolean): void {
    const events: EE[] = [];
    const length = listenerArray.length;

    for (let i = 0; i < length; i++) {
      const listener = listenerArray[i];
      if (
        listener.fn !== fn ||
        (once && !listener.once) ||
        (context && listener.context !== context)
      ) {
        events.push(listener);
      }
    }

    // Reset the array, or remove it completely if we have no more listeners.
    if (events.length) {
      this._events[evt] = events.length === 1 ? events[0] : events;
    } else {
      clearEvent(this, evt);
    }
  }

  /**
   * Remove all listeners, or those of the specified event.
   * 
   * @param {string|symbol} [event] The event name.
   * @returns {EventEmitter} `this`.
   * @public
   */
  removeAllListeners(event?: string | symbol): this {
    if (event) {
      const evt = prefix ? prefix + event.toString() : event.toString();
      if (this._events[evt]) {
        clearEvent(this, evt);
      }
    } else {
      this._events = createEvents();
      this._eventsCount = 0;
    }

    return this;
  }

  /**
   * Alias for removeListener
   */
  off(event: string | symbol, fn?: Function, context?: any, once?: boolean): this {
    return this.removeListener(event, fn, context, once);
  }

  /**
   * Alias for on
   */
  addListener(event: string | symbol, fn: Function, context?: any): this {
    return this.on(event, fn, context);
  }
}

/**
 * Main ReactorySDK class extending EventEmitter for event-driven architecture
 */
export class ReactorySDK extends EventEmitter {
  private readonly config: ReactorySDKConfig;
  private _configuration?: ConfigurationManager;
  private _forms?: FormSchemaManager;
  private _network?: NetworkManager;
  private _theme?: ThemeManager;
  private _apiStatus?: ApiStatusManager;
  private isInitializedFlag: boolean = false;
  private _isDestroyed: boolean = false;
  private readonly _user: User | null = null;
  private readonly _organization: Organization | null = null;
  private readonly _memberships: UserMembership[] = [];
  public client: any = null; // GraphQL client - initialized during setup

  /**
   * Constructor - Initialize SDK with configuration parameters
   * Must not perform async operations
   * 
   * @param config ReactorySDKConfig - Configuration object
   * @throws Error if required configuration parameters are missing or invalid
   */
  constructor(config: ReactorySDKConfig) {
    super();

    // Validate required configuration parameters
    this.validateConfig(config);

    // Store configuration with defaults
    this.config = this.setConfigDefaults(config);

    // Set Apollo Client from config if provided
    this.client = (config as any).apolloClient || null;
  }

  /**
   * Validate configuration parameters during construction
   * @param config ReactorySDKConfig to validate
   * @throws Error if validation fails
   */
  private validateConfig(config: ReactorySDKConfig): void {
    if (!config) {
      throw new Error('ReactorySDK configuration is required');
    }

    if (!config.apiEndpoint || typeof config.apiEndpoint !== 'string') {
      throw new Error('ReactorySDK requires a valid apiEndpoint');
    }

    if (!config.clientKey || typeof config.clientKey !== 'string') {
      throw new Error('ReactorySDK requires a valid clientKey');
    }
  }

  /**
   * Set default configuration values for optional parameters
   * @param config ReactorySDKConfig
   * @returns ReactorySDKConfig with defaults applied
   */
  private setConfigDefaults(config: ReactorySDKConfig): ReactorySDKConfig {
    return {
      ...config,
      debug: config.debug ?? false,
      offline: config.offline ?? false,
      plugins: config.plugins ?? [],
    };
  }

  /**
   * Initialize all manager instances asynchronously
   * Called during SDK initialization
   */
  private async initializeManagers(): Promise<void> {
    try {
      // Initialize Configuration Manager first as others depend on it
      this._configuration = new ConfigurationManager(this, this.config.clientKey);

      // Initialize Network Manager
      this._network = new NetworkManager(this, {
        endpoints: {
          graphql: this.config.apiEndpoint,
        },
        timeout: 10000,
        maxRetries: 3,
        enableRetry: true,
      });

      // Initialize Theme Manager
      this._theme = new ThemeManager(this, {
        defaultTheme: this.config.theme,
        enableThemePersistence: true,
        enableAutoThemeDetection: false,
      });

      // Initialize Form Schema Manager
      this._forms = new FormSchemaManager(this, {
        maxCacheSize: 100,
        enableCaching: true,
        cacheExpirationMs: 3600000, // 1 hour
        enableOfflineSupport: this.config.offline || false,
        retryConfig: {
          maxRetries: 3,
          retryDelayMs: 1000,
          exponentialBackoff: true,
        },
        enableRealTimeUpdates: false,
      });

      // Initialize API Status Manager
      this._apiStatus = new ApiStatusManager(this, {
        defaultTheme: this.config.theme,
        defaultMode: 'light',
        autoValidateToken: true,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during manager initialization';
      throw new Error(`Failed to initialize ReactorySDK managers: ${message}`);
    }
  }

  // ============================================================================
  // Public Initialization Methods
  // ============================================================================

  /**
   * Perform async initialization of all subsystems
   * @returns Promise<void>
   * @throws Error if initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.isInitializedFlag) {
      return;
    }

    if (this._isDestroyed) {
      throw new Error('Cannot initialize destroyed SDK instance');
    }

    try {
      this.emit('initializing');

      // Initialize all managers
      await this.initializeManagers();

      // Initialize each manager
      if (this._configuration) {
        await this._configuration.initialize();
      }
      if (this._network) {
        await this._network.initialize();
      }
      if (this._theme) {
        await this._theme.initialize();
      }
      if (this._forms) {
        await this._forms.initialize();
      }
      // Initialize API Status Manager (after network is ready)
      if (this._apiStatus) {
        await this._apiStatus.initialize();
      }

      this.isInitializedFlag = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('initialization_failed', error);
      throw error;
    }
  }

  /**
   * Check if SDK is initialized
   * @returns boolean - True if initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.isInitializedFlag;
  }

  /**
   * Destroy the SDK instance and cleanup resources
   * @returns Promise<void>
   */
  public async destroy(): Promise<void> {
    if (this._isDestroyed) {
      return;
    }

    try {
      this.emit('destroying');

      // Destroy all managers
      if (this._forms) {
        await this._forms.destroy();
        this._forms = undefined;
      }
      if (this._theme) {
        await this._theme.destroy();
        this._theme = undefined;
      }
      if (this._network) {
        await this._network.destroy();
        this._network = undefined;
      }
      if (this._configuration) {
        // Configuration manager doesn't have destroy method yet
        this._configuration = undefined;
      }

      this.isInitializedFlag = false;
      this._isDestroyed = true;
      this.removeAllListeners();
      this.emit('destroyed');
    } catch (error) {
      this.emit('destruction_failed', error);
      throw error;
    }
  }

  // ============================================================================
  // Manager Access Methods
  // ============================================================================

  /**
   * Get the configuration manager instance
   * @returns ConfigurationManager
   * @throws Error if SDK not initialized
   */
  public get configuration(): ConfigurationManager {
    if (!this._configuration) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return this._configuration;
  }

  /**
   * Get the form schema manager instance
   * @returns FormSchemaManager
   * @throws Error if SDK not initialized
   */
  public get forms(): FormSchemaManager {
    if (!this._forms) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return this._forms;
  }

  /**
   * Get the network manager instance
   * @returns NetworkManager
   * @throws Error if SDK not initialized
   */
  public get network(): NetworkManager {
    if (!this._network) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return this._network;
  }

  /**
   * Get the theme manager instance
   * @returns ThemeManager
   * @throws Error if SDK not initialized
   */
  public get theme(): ThemeManager {
    if (!this._theme) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return this._theme;
  }

  /**
   * Get the API status manager instance
   * @returns ApiStatusManager
   * @throws Error if SDK not initialized
   */
  public get apiStatus(): ApiStatusManager {
    if (!this._apiStatus) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return this._apiStatus;
  }

  // ============================================================================
  // Convenience API Status Methods
  // ============================================================================

  /**
   * Fetches API status from the server
   * Convenience method that delegates to apiStatus.status()
   */
  async status(options?: IApiStatusRequestOptions): Promise<IApiStatus | null> {
    return this.apiStatus.status(options);
  }

  /**
   * Gets the current user
   * Convenience method that delegates to apiStatus.getUser()
   */
  getUser(): User | null {
    return this._apiStatus?.getUser() || null;
  }

  /**
   * Checks if a user is logged in
   * Convenience method that delegates to apiStatus.isLoggedIn()
   */
  isLoggedIn(): boolean {
    return this._apiStatus?.isLoggedIn() || false;
  }

  /**
   * Checks if the API is online and reachable
   */
  isOnline(): boolean {
    return this._apiStatus?.isOnline() || false;
  }

  // ============================================================================
  // Legacy Compatibility Methods (Deprecated)
  // ============================================================================

  /**
   * Get configuration value
   * Falls back to basic config when ConfigurationManager not initialized
   * @deprecated Use configuration.get() instead for full functionality
   */
  public getConfig<T>(key: string): T | undefined {
    // If ConfigurationManager is available, use it
    if (this._configuration) {
      return this._configuration.get<T>(key);
    }
    // Fall back to basic config object for pre-initialization access
    return (this.config as any)[key] as T | undefined;
  }

  /**
   * Set configuration value
   * Falls back to basic config when ConfigurationManager not initialized
   * @deprecated Use configuration.set() instead for full functionality
   */
  public setConfig(key: string, value: any): void {
    // If ConfigurationManager is available, use it
    if (this._configuration) {
      this._configuration.set(key, value);
    } else {
      // Fall back to basic config object for pre-initialization access
      (this.config as any)[key] = value;
    }
  }

  // ============================================================================
  // Logging Methods
  // ============================================================================

  /**
   * Log debug message (only when debug mode is enabled)
   * @param message Debug message
   * @param data Additional data to log
   */
  public debug(message: string, data?: any): void {
    if (this.config.debug) {
      if (data !== undefined) {
        console.log(`[ReactorySDK] DEBUG: ${message}`, data);
      } else {
        console.log(`[ReactorySDK] DEBUG: ${message}`);
      }
    }
  }

  /**
   * Log error message
   * 
   * @param message Error message
   * @param error Error object or additional data
   */
  public error(message: string, error?: any): void {
    if (error !== undefined) {
      console.error(`[ReactorySDK] ERROR: ${message}`, error);
    } else {
      console.error(`[ReactorySDK] ERROR: ${message}`);
    }
  }

  /**
   * Log info message
   * 
   * @param message Info message
   * @param data Additional data to log
   */
  public info(message: string, data?: any): void {
    if (data !== undefined) {
      console.log(`[ReactorySDK] INFO: ${message}`, data);
    } else {
      console.log(`[ReactorySDK] INFO: ${message}`);
    }
  }
}
