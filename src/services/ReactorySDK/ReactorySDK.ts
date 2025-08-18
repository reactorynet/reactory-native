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

import { ReactorySDKConfig } from './types';

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
 * Placeholder manager interfaces for basic setup
 */
interface IAuthenticationManager {
  initialize(): Promise<void>;
}

interface IComponentRegistry {
  initialize(): Promise<void>;
}

interface IConfigurationManager {
  initialize(): Promise<void>;
  get<T>(key: string): T | undefined;
  set(key: string, value: any): void;
}

interface IFormSchemaManager {
  initialize(): Promise<void>;
}

/**
 * Main ReactorySDK class extending EventEmitter for event-driven architecture
 */
export class ReactorySDK extends EventEmitter {
  private readonly config: ReactorySDKConfig;
  private authManager!: IAuthenticationManager;
  private componentRegistry!: IComponentRegistry;
  private configManager!: IConfigurationManager;
  private formSchemaManager!: IFormSchemaManager;
  private isInitializedFlag: boolean = false;

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

    // Initialize all internal managers
    this.initializeManagers();
  }

  /**
   * Validate configuration parameters
   * 
   * @param config ReactorySDKConfig - Configuration to validate
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: ReactorySDKConfig): void {
    if (!config.apiEndpoint) {
      throw new Error('apiEndpoint is required');
    }

    if (!config.clientKey) {
      throw new Error('clientKey is required');
    }

    // Simple URL validation - check if it starts with http/https
    if (!config.apiEndpoint.startsWith('http://') && !config.apiEndpoint.startsWith('https://')) {
      throw new Error('Invalid API endpoint URL');
    }
  }

  /**
   * Set default values for optional configuration parameters
   * 
   * @param config ReactorySDKConfig - Input configuration
   * @returns ReactorySDKConfig - Configuration with defaults applied
   */
  private setConfigDefaults(config: ReactorySDKConfig): ReactorySDKConfig {
    return {
      ...config,
      debug: config.debug ?? false,
      offline: config.offline ?? false,
      plugins: config.plugins ?? []
    };
  }

  /**
   * Initialize all internal managers
   * Creates placeholder manager instances for testing
   */
  private initializeManagers(): void {
    // Create placeholder manager instances
    // These will be replaced with actual implementations in later phases
    this.authManager = {
      initialize: async () => {}
    };

    this.componentRegistry = {
      initialize: async () => {}
    };

    this.configManager = {
      initialize: async () => {},
      get: <T>(key: string): T | undefined => {
        return (this.config as any)[key];
      },
      set: (key: string, value: any) => {
        (this.config as any)[key] = value;
      }
    };

    this.formSchemaManager = {
      initialize: async () => {}
    };
  }

  /**
   * Get configuration value
   * 
   * @param key string - Configuration key
   * @returns T | undefined - Configuration value or undefined if not found
   */
  public getConfig<T>(key: string): T | undefined {
    return this.configManager.get<T>(key);
  }

  /**
   * Set configuration value
   * 
   * @param key string - Configuration key
   * @param value any - Configuration value
   */
  public setConfig(key: string, value: any): void {
    this.configManager.set(key, value);
  }

  /**
   * Perform async initialization of all subsystems
   * 
   * @returns Promise<void>
   * @throws ReactorySDKError if initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.isInitializedFlag) {
      return;
    }

    try {
      this.emit('initializing');

      // Initialize all managers
      await Promise.all([
        this.authManager.initialize(),
        this.componentRegistry.initialize(),
        this.configManager.initialize(),
        this.formSchemaManager.initialize()
      ]);

      this.isInitializedFlag = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('initialization_failed', error);
      throw error;
    }
  }

  /**
   * Check if SDK is initialized
   * 
   * @returns boolean - True if initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.isInitializedFlag;
  }
}
