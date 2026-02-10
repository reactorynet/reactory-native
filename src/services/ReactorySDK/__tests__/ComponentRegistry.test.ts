/**
 * ComponentRegistry Test Suite
 * 
 * Comprehensive test coverage for the ComponentRegistry class following TDD principles.
 * Tests cover component registration, retrieval, validation, and edge cases.
 * 
 * @version 1.0.0
 * @created August 19, 2025
 */

import { ComponentRegistry } from '../ComponentRegistry';
import { ComponentOptions, ReactComponentType } from '../types';

// Mock React component for testing
const MockComponent: ReactComponentType = () => null;
const MockComponent2: ReactComponentType = () => null;
const MockComponent3: ReactComponentType = () => null;

// Mock component options
const defaultOptions: ComponentOptions = {
  nameSpace: 'test',
  version: '1.0.0',
  description: 'Test component',
  tags: ['test', 'mock']
};

const lazyOptions: ComponentOptions = {
  nameSpace: 'lazy',
  version: '1.0.0',
  lazy: true,
  dependencies: ['react'],
  description: 'Lazy loaded component'
};

describe('ComponentRegistry', () => {

  // ============================================================================
  // Test Group 2.1: Component Registration
  // ============================================================================
  
  describe('Test Group 2.1: Component Registration', () => {
    let registry: ComponentRegistry;

    beforeEach(() => {
      registry = new ComponentRegistry();
    });

    // Test 2.1.1: Register component successfully
    it('should register component successfully', () => {
      const result = registry.register('TestComponent', MockComponent, defaultOptions);
      
      expect(result).toBeUndefined(); // register returns void
      expect(registry.has('TestComponent')).toBe(true);
      expect(registry.get('TestComponent')).toBe(MockComponent);
    });

    // Test 2.1.2: Prevent duplicate component names
    it('should prevent duplicate component names', () => {
      registry.register('TestComponent', MockComponent, defaultOptions);
      
      expect(() => {
        registry.register('TestComponent', MockComponent2, defaultOptions);
      }).toThrow('Component "TestComponent" is already registered');
    });

    // Test 2.1.3: Validate component type
    it('should validate component type', () => {
      expect(() => {
        registry.register('InvalidComponent', null as any, defaultOptions);
      }).toThrow('Component must be a valid React component');
      
      expect(() => {
        registry.register('InvalidComponent', 'not-a-component' as any, defaultOptions);
      }).toThrow('Component must be a valid React component');
    });

    // Test 2.1.4: Handle component options correctly
    it('should handle component options correctly', () => {
      registry.register('TestComponent', MockComponent, defaultOptions);
      
      const registered = registry.getAll().get('TestComponent');
      expect(registered).toBeDefined();
      expect(registered!.options.nameSpace).toBe('test');
      expect(registered!.options.version).toBe('1.0.0');
      expect(registered!.options.tags).toEqual(['test', 'mock']);
    });

    // Test 2.1.5: Emit registration events
    it('should emit registration events', () => {
      const mockEmit = jest.fn();
      registry.setEventEmitter({ emit: mockEmit });
      
      registry.register('TestComponent', MockComponent, defaultOptions);
      
      expect(mockEmit).toHaveBeenCalledWith('component:registered', {
        fqn: 'test.TestComponent@1.0.0',
        nameSpace: 'test',
        version: '1.0.0',
        name: 'TestComponent',
        component: MockComponent,
        options: defaultOptions
      });
    });

    // Additional test: Register without options
    it('should register component without options', () => {
      registry.register('SimpleComponent', MockComponent);
      
      expect(registry.has('SimpleComponent')).toBe(true);
      const registered = registry.getAll().get('SimpleComponent');
      expect(registered!.options).toEqual({});
    });

    // Additional test: Validate component name
    it('should validate component name', () => {
      expect(() => {
        registry.register('', MockComponent, defaultOptions);
      }).toThrow('Component name cannot be empty');
      
      expect(() => {
        registry.register('   ', MockComponent, defaultOptions);
      }).toThrow('Component name cannot be empty');
    });
  });

  // ============================================================================
  // Test Group 2.2: Component Retrieval
  // ============================================================================
  
  describe('Test Group 2.2: Component Retrieval', () => {
    let registry: ComponentRegistry;

    beforeEach(() => {
      registry = new ComponentRegistry();
      registry.register('TestComponent', MockComponent, defaultOptions);
      registry.register('LazyComponent', MockComponent2, lazyOptions);
      registry.register('SimpleComponent', MockComponent3);
    });

    // Test 2.2.1: Retrieve registered component
    it('should retrieve registered component', () => {
      const component = registry.get('TestComponent');
      expect(component).toBe(MockComponent);
    });

    // Test 2.2.2: Return null for missing component
    it('should return null for missing component', () => {
      const component = registry.get('NonExistentComponent');
      expect(component).toBeNull();
    });

    // Test 2.2.3: Handle lazy loading
    it('should handle lazy loading', () => {
      const lazyComponent = registry.get('LazyComponent');
      expect(lazyComponent).toBe(MockComponent2);
      
      // Verify lazy component is marked as such
      const registered = registry.getAll().get('LazyComponent');
      expect(registered!.options.lazy).toBe(true);
    });

    // Test 2.2.4: Retrieve multiple components with type safety
    it('should retrieve multiple components with type safety', () => {
      const allComponents = registry.getAll();
      
      expect(allComponents.size).toBe(3);
      expect(allComponents.has('TestComponent')).toBe(true);
      expect(allComponents.has('LazyComponent')).toBe(true);
      expect(allComponents.has('SimpleComponent')).toBe(true);
      
      // Verify type safety
      const testComponent = allComponents.get('TestComponent');
      expect(testComponent!.component).toBe(MockComponent);
      expect(testComponent!.name).toBe('TestComponent');
    });

    // Additional test: Check component existence
    it('should check component existence correctly', () => {
      expect(registry.has('TestComponent')).toBe(true);
      expect(registry.has('NonExistentComponent')).toBe(false);
    });

    // Additional test: Get components by namespace
    it('should get components by namespace', () => {
      const testComponents = registry.getByNamespace('test');
      expect(testComponents).toHaveLength(1);
      expect(testComponents[0].name).toBe('TestComponent');
      
      const lazyComponents = registry.getByNamespace('lazy');
      expect(lazyComponents).toHaveLength(1);
      expect(lazyComponents[0].name).toBe('LazyComponent');
    });

    // Additional test: Get components by tag
    it('should get components by tag', () => {
      const testTaggedComponents = registry.getByTag('test');
      expect(testTaggedComponents).toHaveLength(1);
      expect(testTaggedComponents[0].name).toBe('TestComponent');
      
      const mockTaggedComponents = registry.getByTag('mock');
      expect(mockTaggedComponents).toHaveLength(1);
      expect(mockTaggedComponents[0].name).toBe('TestComponent');
    });
  });

  // ============================================================================
  // Test Group 2.3: Component Management
  // ============================================================================
  
  describe('Test Group 2.3: Component Management', () => {
    let registry: ComponentRegistry;

    beforeEach(() => {
      registry = new ComponentRegistry();
      registry.register('Component1', MockComponent, defaultOptions);
      registry.register('Component2', MockComponent2, lazyOptions);
    });

    // Test component unregistration
    it('should unregister components successfully', () => {
      expect(registry.has('Component1')).toBe(true);
      
      const result = registry.unregister('Component1');
      expect(result).toBe(true);
      expect(registry.has('Component1')).toBe(false);
    });

    // Test unregistering non-existent component
    it('should return false when unregistering non-existent component', () => {
      const result = registry.unregister('NonExistentComponent');
      expect(result).toBe(false);
    });

    // Test clearing all components
    it('should clear all components', () => {
      expect(registry.getAll().size).toBe(2);
      
      registry.clear();
      
      expect(registry.getAll().size).toBe(0);
      expect(registry.has('Component1')).toBe(false);
      expect(registry.has('Component2')).toBe(false);
    });

    // Test emit unregistration events
    it('should emit unregistration events', () => {
      const mockEmit = jest.fn();
      registry.setEventEmitter({ emit: mockEmit });
      
      registry.unregister('Component1');
      
      expect(mockEmit).toHaveBeenCalledWith('component:unregistered', {
        name: 'Component1'
      });
    });

    // Test emit clear events
    it('should emit clear events', () => {
      const mockEmit = jest.fn();
      registry.setEventEmitter({ emit: mockEmit });
      
      registry.clear();
      
      expect(mockEmit).toHaveBeenCalledWith('component:cleared', undefined);
    });
  });

  // ============================================================================
  // Test Group 2.4: Edge Cases and Error Handling
  // ============================================================================
  
  describe('Test Group 2.4: Edge Cases and Error Handling', () => {
    let registry: ComponentRegistry;

    beforeEach(() => {
      registry = new ComponentRegistry();
    });

    // Test case sensitivity
    it('should handle case-sensitive component names', () => {
      registry.register('TestComponent', MockComponent, defaultOptions);
      registry.register('testcomponent', MockComponent2, defaultOptions);
      
      expect(registry.get('TestComponent')).toBe(MockComponent);
      expect(registry.get('testcomponent')).toBe(MockComponent2);
      expect(registry.get('TESTCOMPONENT')).toBeNull();
    });

    // Test special characters in names
    it('should handle special characters in component names', () => {
      const specialNames = ['Test-Component', 'Test_Component', 'Test.Component', 'Test$Component'];
      
      specialNames.forEach((name, index) => {
        const component = index === 0 ? MockComponent : MockComponent2;
        registry.register(name, component, defaultOptions);
        expect(registry.has(name)).toBe(true);
      });
    });

    // Test empty registry operations
    it('should handle empty registry operations gracefully', () => {
      expect(registry.getAll().size).toBe(0);
      expect(registry.getByNamespace('any')).toEqual([]);
      expect(registry.getByTag('any')).toEqual([]);
      expect(registry.unregister('any')).toBe(false);
      
      // Clear should not throw on empty registry
      expect(() => registry.clear()).not.toThrow();
    });

    // Test undefined/null options handling
    it('should handle undefined and null options', () => {
      registry.register('UndefinedOptions', MockComponent);
      registry.register('NullOptions', MockComponent2, null as any);
      
      expect(registry.has('UndefinedOptions')).toBe(true);
      expect(registry.has('NullOptions')).toBe(true);
      
      const undefinedComp = registry.getAll().get('UndefinedOptions');
      const nullComp = registry.getAll().get('NullOptions');
      
      expect(undefinedComp!.options).toEqual({});
      expect(nullComp!.options).toEqual({});
    });
  });
});
