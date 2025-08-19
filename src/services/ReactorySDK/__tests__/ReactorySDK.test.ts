/**
 * ReactorySDK Core Tests
 * 
 * Test suite for the main ReactorySDK class following TDD approach.
 * Starting with Phase 1: Core Foundation tests.
 * 
 * @version 1.0.0
 * @created August 18, 2025
 */

import { ReactorySDK } from '../ReactorySDK';
import { 
  validConfig, 
  configMissingApiEndpoint,
  configMissingClientKey,
  configInvalidApiEndpoint,
  configForDefaults
} from './mocks/mockConfig';

describe('ReactorySDK', () => {
  
  // ============================================================================
  // Test Group 1.1: Constructor and Basic Setup
  // ============================================================================
  
  describe('Constructor and Basic Setup', () => {
    
    // Test 1.1.1: Constructor accepts valid configuration
    it('should accept valid configuration', () => {
      expect(() => new ReactorySDK(validConfig)).not.toThrow();
    });

    // Test 1.1.2: Constructor validates required fields
    it('should throw error for missing apiEndpoint', () => {
      expect(() => new ReactorySDK(configMissingApiEndpoint as any))
        .toThrow('apiEndpoint is required');
    });

    it('should throw error for missing clientKey', () => {
      expect(() => new ReactorySDK(configMissingClientKey as any))
        .toThrow('clientKey is required');
    });

    // Test 1.1.3: Constructor sets up event emitter
    it('should extend EventEmitter', () => {
      const sdk = new ReactorySDK(validConfig);
      
      // Check that SDK has EventEmitter-like functionality
      expect(typeof sdk.on).toBe('function');
      expect(typeof sdk.emit).toBe('function');
      expect(typeof sdk.off).toBe('function');
    });

    // Test 1.1.4: Constructor initializes managers
    it('should initialize all internal managers', () => {
      const sdk = new ReactorySDK(validConfig);
      
      // Access private properties for testing purposes
      // In a real implementation, we might expose these via getter methods
      expect((sdk as any).authManager).toBeDefined();
      expect((sdk as any).componentRegistry).toBeDefined();
      expect((sdk as any).configManager).toBeDefined();
      expect((sdk as any).formSchemaManager).toBeDefined();
    });
  });

  // ============================================================================
  // Test Group 1.2: Configuration Validation
  // ============================================================================
  
  describe('Configuration Validation', () => {
    
    // Test 1.2.1: Validates API endpoint format
    it('should validate API endpoint URL format', () => {
      expect(() => new ReactorySDK(configInvalidApiEndpoint))
        .toThrow('Invalid API endpoint URL');
    });

    // Test 1.2.2: Sets default values for optional config
    it('should set default values for optional configuration', () => {
      const sdk = new ReactorySDK(configForDefaults);
      
      expect(sdk.getConfig('debug')).toBe(false);
      expect(sdk.getConfig('offline')).toBe(false);
    });
  });

  // ============================================================================
  // Test Group 1.3: Initialization Lifecycle
  // ============================================================================
  
  describe('Initialization Lifecycle', () => {
    
    // Test 1.3.1: Initialize method performs async setup
    it('should perform async initialization', async () => {
      const sdk = new ReactorySDK(validConfig);
      
      expect(sdk.isInitialized()).toBe(false);
      
      await sdk.initialize();
      
      expect(sdk.isInitialized()).toBe(true);
    });

    // Test 1.3.2: Emits correct lifecycle events
    it('should emit lifecycle events during initialization', async () => {
      const sdk = new ReactorySDK(validConfig);
      const initializingListener = jest.fn();
      const initializedListener = jest.fn();
      
      sdk.on('initializing', initializingListener);
      sdk.on('initialized', initializedListener);
      
      await sdk.initialize();
      
      expect(initializingListener).toHaveBeenCalledTimes(1);
      expect(initializedListener).toHaveBeenCalledTimes(1);
    });

    // Test 1.3.3: Handles initialization failures gracefully
    it('should handle initialization failures', async () => {
      const sdk = new ReactorySDK(validConfig);
      const failureListener = jest.fn();
      
      // Mock one of the managers to fail
      (sdk as any).authManager.initialize = jest.fn().mockRejectedValue(new Error('Auth failed'));
      
      sdk.on('initialization_failed', failureListener);
      
      await expect(sdk.initialize()).rejects.toThrow('Auth failed');
      expect(failureListener).toHaveBeenCalledTimes(1);
      expect(sdk.isInitialized()).toBe(false);
    });

    // Test 1.3.4: Prevents multiple initialization calls
    it('should prevent multiple initialization calls', async () => {
      const sdk = new ReactorySDK(validConfig);
      
      // Initialize once
      await sdk.initialize();
      expect(sdk.isInitialized()).toBe(true);
      
      // Try to initialize again
      await sdk.initialize();
      expect(sdk.isInitialized()).toBe(true);
    });
  });

  // ============================================================================
  // Test Group 1.4: Basic Event Management
  // ============================================================================
  
  describe('Basic Event Management', () => {
    
    // Test 1.4.1: Can emit and listen to events
    it('should emit and listen to events', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      const testData = { test: 'data' };
      
      sdk.on('test_event', listener);
      sdk.emit('test_event', testData);
      
      expect(listener).toHaveBeenCalledWith(testData);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    // Test 1.4.2: Event listeners work correctly
    it('should manage event listeners correctly', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      // Add multiple listeners
      sdk.on('test_event', listener1);
      sdk.on('test_event', listener2);
      
      // Emit event
      sdk.emit('test_event', 'test');
      
      expect(listener1).toHaveBeenCalledWith('test');
      expect(listener2).toHaveBeenCalledWith('test');
      
      // Remove one listener
      sdk.off('test_event', listener1);
      
      // Emit again
      sdk.emit('test_event', 'test2');
      
      expect(listener1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(listener2).toHaveBeenCalledTimes(2); // Should be called again
    });

    // Test for event with no listeners
    it('should handle events with no listeners', () => {
      const sdk = new ReactorySDK(validConfig);
      
      // Should not throw error when emitting event with no listeners
      expect(() => sdk.emit('non_existent_event', 'data')).not.toThrow();
    });

    // Test for removing non-existent listener
    it('should handle removing non-existent listener', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      // Should not throw error when removing non-existent listener
      expect(() => sdk.off('non_existent_event', listener)).not.toThrow();
    });

    // Test for once listeners
    it('should support one-time listeners', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      sdk.once('test_event', listener);
      
      // Emit event twice
      sdk.emit('test_event', 'data1');
      sdk.emit('test_event', 'data2');
      
      // Listener should only be called once
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('data1');
    });

    // Test for context binding
    it('should support context binding', () => {
      const sdk = new ReactorySDK(validConfig);
      const context = { name: 'test-context' };
      
      const listener = jest.fn(function(this: any, _data: string) {
        expect(this).toBe(context);
        expect(this.name).toBe('test-context');
      });
      
      sdk.on('test_event', listener, context);
      sdk.emit('test_event', 'data');
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    // Test for listenerCount
    it('should return correct listener count', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      expect(sdk.listenerCount('test_event')).toBe(0);
      
      sdk.on('test_event', listener1);
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      sdk.on('test_event', listener2);
      expect(sdk.listenerCount('test_event')).toBe(2);
      
      sdk.off('test_event', listener1);
      expect(sdk.listenerCount('test_event')).toBe(1);
    });

    // Test for listeners method
    it('should return array of listeners', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      expect(sdk.listeners('test_event')).toEqual([]);
      
      sdk.on('test_event', listener1);
      sdk.on('test_event', listener2);
      
      const listeners = sdk.listeners('test_event');
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(listener1);
      expect(listeners).toContain(listener2);
    });

    // Test for eventNames method
    it('should return array of event names', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      expect(sdk.eventNames()).toEqual([]);
      
      sdk.on('event1', listener);
      sdk.on('event2', listener);
      
      const eventNames = sdk.eventNames();
      expect(eventNames).toHaveLength(2);
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
    });

    // Test for removeAllListeners
    it('should remove all listeners for an event', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      sdk.on('test_event', listener1);
      sdk.on('test_event', listener2);
      sdk.on('other_event', listener1);
      
      expect(sdk.listenerCount('test_event')).toBe(2);
      expect(sdk.listenerCount('other_event')).toBe(1);
      
      sdk.removeAllListeners('test_event');
      
      expect(sdk.listenerCount('test_event')).toBe(0);
      expect(sdk.listenerCount('other_event')).toBe(1);
    });

    // Test for removeAllListeners without event parameter
    it('should remove all listeners for all events', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      sdk.on('event1', listener);
      sdk.on('event2', listener);
      
      expect(sdk.eventNames()).toHaveLength(2);
      
      sdk.removeAllListeners();
      
      expect(sdk.eventNames()).toHaveLength(0);
    });

    // Test for addListener alias
    it('should support addListener alias', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      sdk.addListener('test_event', listener);
      sdk.emit('test_event', 'data');
      
      expect(listener).toHaveBeenCalledWith('data');
    });

    // Test edge case: removing listener without function
    it('should remove all listeners when no function specified', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      sdk.on('test_event', listener);
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      sdk.removeListener('test_event');
      expect(sdk.listenerCount('test_event')).toBe(0);
    });

    // Test edge case: context-specific removal
    it('should remove listeners with specific context only', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      const context1 = { id: 1 };
      const context2 = { id: 2 };
      
      sdk.on('test_event', listener, context1);
      sdk.on('test_event', listener, context2);
      
      expect(sdk.listenerCount('test_event')).toBe(2);
      
      // Remove only listener with context1
      sdk.removeListener('test_event', listener, context1);
      
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      // Verify the remaining listener still has context2
      sdk.emit('test_event', 'data');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    // Test edge case: once-specific removal
    it('should remove only once listeners when specified', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      sdk.on('test_event', listener);
      sdk.once('test_event', listener);
      
      expect(sdk.listenerCount('test_event')).toBe(2);
      
      // Remove only once listeners
      sdk.removeListener('test_event', listener, undefined, true);
      
      expect(sdk.listenerCount('test_event')).toBe(1);
    });

    // Test multiple arguments in emit
    it('should handle multiple arguments in emit', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      sdk.on('test_event', listener);
      
      // Test with 0 arguments
      sdk.emit('test_event');
      expect(listener).toHaveBeenLastCalledWith();
      
      // Test with 1 argument
      sdk.emit('test_event', 'arg1');
      expect(listener).toHaveBeenLastCalledWith('arg1');
      
      // Test with 2 arguments
      sdk.emit('test_event', 'arg1', 'arg2');
      expect(listener).toHaveBeenLastCalledWith('arg1', 'arg2');
      
      // Test with 3 arguments
      sdk.emit('test_event', 'arg1', 'arg2', 'arg3');
      expect(listener).toHaveBeenLastCalledWith('arg1', 'arg2', 'arg3');
      
      // Test with more than 3 arguments
      sdk.emit('test_event', 'arg1', 'arg2', 'arg3', 'arg4', 'arg5');
      expect(listener).toHaveBeenLastCalledWith('arg1', 'arg2', 'arg3', 'arg4', 'arg5');
    });

    // Test error handling in listener validation
    it('should throw error for non-function listener', () => {
      const sdk = new ReactorySDK(validConfig);
      
      expect(() => {
        sdk.on('test_event', 'not-a-function' as any);
      }).toThrow('The listener must be a function');
    });

    // Test getOwnPropertySymbols fallback
    it('should handle eventNames when Object.getOwnPropertySymbols is not available', () => {
      const sdk = new ReactorySDK(validConfig);
      const originalGetOwnPropertySymbols = Object.getOwnPropertySymbols;
      
      // Temporarily remove Object.getOwnPropertySymbols
      (Object as any).getOwnPropertySymbols = undefined;
      
      try {
        sdk.on('test_event', jest.fn());
        const names = sdk.eventNames();
        expect(names).toContain('test_event');
      } finally {
        // Restore original function
        Object.getOwnPropertySymbols = originalGetOwnPropertySymbols;
      }
    });

    // Test prefix handling for event names
    it('should handle prefixed and non-prefixed event names correctly', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      // Test with regular string event names
      sdk.on('test_event', listener);
      expect(sdk.eventNames()).toContain('test_event');
      
      // Test with symbol event names if supported
      if (typeof Symbol !== 'undefined') {
        const symbolEvent = Symbol('test');
        sdk.on(symbolEvent, listener);
        const eventNames = sdk.eventNames();
        // Symbol events are converted to strings in eventNames
        expect(eventNames).toContain('Symbol(test)');
      }
    });

    // Test edge case: Object.create fallback
    it('should handle environments where Object.create might fail', () => {
      // This tests the try-catch fallback in the prefix logic
      expect(() => {
        const sdk = new ReactorySDK(validConfig);
        const listener = jest.fn();
        sdk.on('test_event', listener);
        sdk.emit('test_event', 'data');
        expect(listener).toHaveBeenCalledWith('data');
      }).not.toThrow();
    });

    // Test fallback when Object.create is undefined
    it('should handle environments where Object.create is undefined', () => {
      const originalCreate = Object.create;
      
      try {
        // Temporarily remove Object.create
        (Object as any).create = undefined;
        
        // This should trigger the fallback in createEvents (line 30)
        const sdk = new ReactorySDK(validConfig);
        const listener = jest.fn();
        sdk.on('test_event', listener);
        expect(sdk.eventNames()).toContain('test_event');
      } finally {
        // Restore original function
        Object.create = originalCreate;
      }
    });

    // Test fallback for legacy environments
    it('should handle legacy environments gracefully', () => {
      // This test verifies the SDK works even in environments with different Object capabilities
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      // Basic functionality should work regardless of environment quirks
      sdk.on('test_event', listener);
      sdk.emit('test_event', 'data');
      expect(listener).toHaveBeenCalledWith('data');
      
      // The SDK should maintain state properly
      expect(sdk.listenerCount('test_event')).toBe(1);
      expect(sdk.eventNames()).toContain('test_event');
    });

    // Test listener count edge cases
    it('should handle listenerCount for events with no listeners', () => {
      const sdk = new ReactorySDK(validConfig);
      
      expect(sdk.listenerCount('nonexistent_event')).toBe(0);
    });

    // Test emit returning false for non-existent events
    it('should return false when emitting to non-existent events', () => {
      const sdk = new ReactorySDK(validConfig);
      
      const result = sdk.emit('nonexistent_event', 'data');
      expect(result).toBe(false);
    });

    // Test different argument patterns in emit (for switch cases in callListeners)
    it('should handle different numbers of arguments when emitting events', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      sdk.on('test_event', listener);
      
      // Test 0 arguments
      sdk.emit('test_event');
      expect(listener).toHaveBeenLastCalledWith();
      
      // Test 1 argument  
      sdk.emit('test_event', 'arg1');
      expect(listener).toHaveBeenLastCalledWith('arg1');
      
      // Test 2 arguments
      sdk.emit('test_event', 'arg1', 'arg2');
      expect(listener).toHaveBeenLastCalledWith('arg1', 'arg2');
      
      // Test 3 arguments
      sdk.emit('test_event', 'arg1', 'arg2', 'arg3');
      expect(listener).toHaveBeenLastCalledWith('arg1', 'arg2', 'arg3');
      
      // Test more than 3 arguments (default case)
      sdk.emit('test_event', 'arg1', 'arg2', 'arg3', 'arg4', 'arg5');
      expect(listener).toHaveBeenLastCalledWith('arg1', 'arg2', 'arg3', 'arg4', 'arg5');
    });

    // Test removal scenarios that affect array handling
    it('should handle complex listener removal scenarios', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      
      // Add multiple listeners
      sdk.on('test_event', listener1);
      sdk.on('test_event', listener2);
      sdk.on('test_event', listener3);
      
      expect(sdk.listenerCount('test_event')).toBe(3);
      
      // Remove middle listener
      sdk.off('test_event', listener2);
      expect(sdk.listenerCount('test_event')).toBe(2);
      
      // Remove remaining listeners one by one to test array handling
      sdk.off('test_event', listener1);
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      sdk.off('test_event', listener3);
      expect(sdk.listenerCount('test_event')).toBe(0);
    });

    // Test once listener removal during emit (line 258)
    it('should automatically remove once listeners when they are called', () => {
      const sdk = new ReactorySDK(validConfig);
      const onceListener = jest.fn();
      const regularListener = jest.fn();
      
      // Add a once listener and a regular listener
      sdk.once('test_event', onceListener);
      sdk.on('test_event', regularListener);
      
      expect(sdk.listenerCount('test_event')).toBe(2);
      
      // Emit event - should trigger both listeners
      sdk.emit('test_event', 'data');
      
      expect(onceListener).toHaveBeenCalledTimes(1);
      expect(regularListener).toHaveBeenCalledTimes(1);
      
      // Once listener should be automatically removed
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      // Emit again - only regular listener should be called
      sdk.emit('test_event', 'data2');
      
      expect(onceListener).toHaveBeenCalledTimes(1); // Still only called once
      expect(regularListener).toHaveBeenCalledTimes(2);
    });

    // Test completely clear event when all listeners are removed (line 366)
    it('should completely clear event when all listeners are removed', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      // Add multiple listeners
      sdk.on('test_event', listener1);
      sdk.on('test_event', listener2);
      expect(sdk.listenerCount('test_event')).toBe(2);
      
      // Remove all listeners individually - this should trigger clearEvent
      sdk.off('test_event', listener1);
      sdk.off('test_event', listener2);
      
      expect(sdk.listenerCount('test_event')).toBe(0);
      expect(sdk.eventNames()).not.toContain('test_event');
    });

    // Test single listener edge case (converting array back to single listener)
    it('should handle transition from multiple listeners to single listener', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      
      // Add multiple listeners to create array
      sdk.on('test_event', listener1);
      sdk.on('test_event', listener2);
      sdk.on('test_event', listener3);
      expect(sdk.listenerCount('test_event')).toBe(3);
      
      // Remove two listeners, leaving only one - should convert back from array
      sdk.off('test_event', listener2);
      sdk.off('test_event', listener3);
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      // Verify the remaining listener still works
      sdk.emit('test_event', 'data');
      expect(listener1).toHaveBeenCalledWith('data');
    });

    // Test with mixed once and regular listeners
    it('should handle mixed once and regular listeners correctly', () => {
      const sdk = new ReactorySDK(validConfig);
      const onceListener1 = jest.fn();
      const onceListener2 = jest.fn();
      const regularListener = jest.fn();
      
      // Add mixed listener types
      sdk.once('test_event', onceListener1);
      sdk.on('test_event', regularListener);
      sdk.once('test_event', onceListener2);
      
      expect(sdk.listenerCount('test_event')).toBe(3);
      
      // Emit event - all should be called, but once listeners removed
      sdk.emit('test_event', 'data');
      
      expect(onceListener1).toHaveBeenCalledTimes(1);
      expect(onceListener2).toHaveBeenCalledTimes(1);
      expect(regularListener).toHaveBeenCalledTimes(1);
      
      // Only regular listener should remain
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      // Second emit - only regular listener called
      sdk.emit('test_event', 'data2');
      expect(onceListener1).toHaveBeenCalledTimes(1);
      expect(onceListener2).toHaveBeenCalledTimes(1);
      expect(regularListener).toHaveBeenCalledTimes(2);
    });

    // Test single listener path specifically
    it('should handle single listeners through callSingleListener path', () => {
      const sdk = new ReactorySDK(validConfig);
      const singleListener = jest.fn();
      
      // Add only one listener to trigger single listener path
      sdk.on('test_event', singleListener);
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      // Test all argument variations on single listener
      sdk.emit('test_event'); // 0 args
      expect(singleListener).toHaveBeenLastCalledWith();
      
      sdk.emit('test_event', 'a'); // 1 arg
      expect(singleListener).toHaveBeenLastCalledWith('a');
      
      sdk.emit('test_event', 'a', 'b'); // 2 args
      expect(singleListener).toHaveBeenLastCalledWith('a', 'b');
      
      sdk.emit('test_event', 'a', 'b', 'c'); // 3 args
      expect(singleListener).toHaveBeenLastCalledWith('a', 'b', 'c');
      
      sdk.emit('test_event', 'a', 'b', 'c', 'd', 'e'); // 5+ args
      expect(singleListener).toHaveBeenLastCalledWith('a', 'b', 'c', 'd', 'e');
    });

    // Test single once listener specifically (line 233)
    it('should handle single once listener removal correctly', () => {
      const sdk = new ReactorySDK(validConfig);
      const onceListener = jest.fn();
      
      // Add single once listener
      sdk.once('test_event', onceListener);
      expect(sdk.listenerCount('test_event')).toBe(1);
      
      // Emit - should call listener and remove it
      sdk.emit('test_event', 'data');
      expect(onceListener).toHaveBeenCalledWith('data');
      expect(sdk.listenerCount('test_event')).toBe(0);
    });
  });

  describe('Test Group 1.5: Manager and Configuration Edge Cases', () => {
    // Test configuration edge cases  
    it('should handle configuration with minimal valid values', () => {
      const minimalConfig = {
        ...validConfig,
        clientKey: 'test',
        apiUrl: 'http://test.com'
      };
      
      expect(() => {
        const sdk = new ReactorySDK(minimalConfig);
        expect(sdk.isInitialized()).toBe(false);
      }).not.toThrow();
    });

    // Test manager edge cases
    it('should handle manager operations when not initialized', () => {
      const sdk = new ReactorySDK(validConfig);
      
      // Test access when not initialized
      expect(sdk.isInitialized()).toBe(false);
      
      // Should not throw even when not initialized
      expect(() => {
        sdk.emit('test_event', 'data');
      }).not.toThrow();
    });

    // Test lifecycle state transitions
    it('should handle multiple initialize calls gracefully', async () => {
      const sdk = new ReactorySDK(validConfig);
      
      // First initialize
      await sdk.initialize();
      expect(sdk.isInitialized()).toBe(true);
      
      // Second initialize should not throw
      await expect(sdk.initialize()).resolves.not.toThrow();
      expect(sdk.isInitialized()).toBe(true);
    });

    // Test error handling in configuration validation
    it('should handle configuration with undefined values gracefully', () => {
      const configWithUndefined = {
        ...validConfig,
        themeOptions: undefined,
        debugMode: undefined
      };
      
      expect(() => {
        const sdk = new ReactorySDK(configWithUndefined as any);
        expect(sdk.isInitialized()).toBe(false);
      }).not.toThrow();
    });

    // Test event listener edge cases
    it('should handle listener removal when listener not found', () => {
      const sdk = new ReactorySDK(validConfig);
      const listener = jest.fn();
      
      // Try to remove a listener that was never added
      expect(() => {
        sdk.off('test_event', listener);
      }).not.toThrow();
      
      // Add listener then remove twice
      sdk.on('test_event', listener);
      sdk.off('test_event', listener);
      
      expect(() => {
        sdk.off('test_event', listener);
      }).not.toThrow();
    });

    // Test removeAllListeners edge cases
    it('should handle removeAllListeners with no events', () => {
      const sdk = new ReactorySDK(validConfig);
      
      expect(() => {
        sdk.removeAllListeners();
        sdk.removeAllListeners('nonexistent_event');
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Test Group 1.7: Component Registry Integration
  // ============================================================================
  
  describe('Component Registry Integration', () => {
    
    // Test component registration through SDK
    it('should register components through SDK interface', () => {
      const sdk = new ReactorySDK(validConfig);
      const TestComponent = () => null;
      
      sdk.registerComponent('TestComponent', TestComponent, {
        namespace: 'test',
        version: '1.0.0'
      });
      
      expect(sdk.hasComponent('TestComponent')).toBe(true);
      expect(sdk.getComponent('TestComponent')).toBe(TestComponent);
    });

    // Test component retrieval through SDK
    it('should retrieve components through SDK interface', () => {
      const sdk = new ReactorySDK(validConfig);
      const TestComponent = () => null;
      
      sdk.registerComponent('TestComponent', TestComponent);
      
      const retrieved = sdk.getComponent('TestComponent');
      expect(retrieved).toBe(TestComponent);
      
      const nonExistent = sdk.getComponent('NonExistent');
      expect(nonExistent).toBeNull();
    });

    // Test component management through SDK
    it('should manage components through SDK interface', () => {
      const sdk = new ReactorySDK(validConfig);
      const TestComponent1 = () => null;
      const TestComponent2 = () => null;
      
      // Register multiple components
      sdk.registerComponent('TestComponent1', TestComponent1);
      sdk.registerComponent('TestComponent2', TestComponent2);
      
      // Check all components
      const allComponents = sdk.getAllComponents();
      expect(allComponents.size).toBe(2);
      
      // Unregister one component
      const result = sdk.unregisterComponent('TestComponent1');
      expect(result).toBe(true);
      expect(sdk.hasComponent('TestComponent1')).toBe(false);
      expect(sdk.hasComponent('TestComponent2')).toBe(true);
      
      // Clear all components
      sdk.clearComponents();
      expect(sdk.getAllComponents().size).toBe(0);
    });

    // Test namespace and tag filtering through SDK
    it('should filter components by namespace and tags through SDK', () => {
      const sdk = new ReactorySDK(validConfig);
      const TestComponent1 = () => null;
      const TestComponent2 = () => null;
      
      sdk.registerComponent('TestComponent1', TestComponent1, {
        namespace: 'forms',
        tags: ['input', 'validation']
      });
      
      sdk.registerComponent('TestComponent2', TestComponent2, {
        namespace: 'widgets',
        tags: ['display', 'charts']
      });
      
      // Test namespace filtering
      const formsComponents = sdk.getComponentsByNamespace('forms');
      expect(formsComponents).toHaveLength(1);
      expect(formsComponents[0].name).toBe('TestComponent1');
      
      // Test tag filtering
      const inputComponents = sdk.getComponentsByTag('input');
      expect(inputComponents).toHaveLength(1);
      expect(inputComponents[0].name).toBe('TestComponent1');
    });

    // Test component events through SDK
    it('should emit component events through SDK event system', () => {
      const sdk = new ReactorySDK(validConfig);
      const TestComponent = () => null;
      const eventListener = jest.fn();
      
      // Listen for component registration events
      sdk.on('component:registered', eventListener);
      
      sdk.registerComponent('TestComponent', TestComponent, {
        namespace: 'test'
      });
      
      expect(eventListener).toHaveBeenCalledWith({
        name: 'TestComponent',
        component: TestComponent,
        options: { namespace: 'test' }
      });
    });
  });

  // ============================================================================
  // Test Group 1.6: Configuration Management
  // ============================================================================
  
  describe('Configuration Management', () => {
    
    // Test for setConfig method
    it('should allow setting configuration values', () => {
      const sdk = new ReactorySDK(validConfig);
      
      sdk.setConfig('newKey', 'newValue');
      
      expect(sdk.getConfig('newKey')).toBe('newValue');
    });

    // Test for getting non-existent config
    it('should return undefined for non-existent config keys', () => {
      const sdk = new ReactorySDK(validConfig);
      
      expect(sdk.getConfig('nonExistentKey')).toBeUndefined();
    });

    // Test for overriding existing config
    it('should allow overriding existing configuration', () => {
      const sdk = new ReactorySDK(validConfig);
      
      expect(sdk.getConfig('debug')).toBe(false);
      
      sdk.setConfig('debug', true);
      
      expect(sdk.getConfig('debug')).toBe(true);
    });
  });

});
