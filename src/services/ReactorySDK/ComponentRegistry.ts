/**
 * ComponentRegistry - Component Management System
 * 
 * Manages the registration, retrieval, and organization of React components
 * within the Reactory SDK. Provides lazy loading support, namespace management,
 * and type-safe component access.
 * 
 * @version 1.0.0
 * @created August 19, 2025
 */

import { ComponentOptions, ReactComponentType, RegisteredComponent, ComponentRegistry as IComponentRegistry } from './types';

/**
 * Simple EventEmitter interface for ComponentRegistry
 */
interface EventEmitter {
  emit(event: string, data?: any): boolean;
}

/**
 * ComponentRegistry implementation
 * 
 * Provides a centralized registry for React components with support for:
 * - Component registration and validation
 * - Namespace and tag-based organization
 * - Lazy loading capabilities
 * - Event-driven notifications
 * - Type-safe component retrieval
 */
export class ComponentRegistry implements IComponentRegistry {
  private readonly components: Map<string, RegisteredComponent> = new Map();
  private eventEmitter?: EventEmitter;

  /**
   * Set event emitter for notifications
   * @param emitter EventEmitter instance
   */
  setEventEmitter(emitter: EventEmitter): void {
    this.eventEmitter = emitter;
  }

  /**
   * Emit an event if emitter is available
   * @param event Event name
   * @param data Event data
   */
  private emit(event: string, data?: any): void {
    this.eventEmitter?.emit(event, data);
  }

  /**
   * Register a component in the registry
   * 
   * @param name Component name/identifier
   * @param component React component
   * @param options Registration options
   * @throws Error if component name is invalid or already registered
   */
  register(name: string, component: ReactComponentType, options?: ComponentOptions): void {
    // Validate component name
    if (!name || name.trim().length === 0) {
      throw new Error('Component name cannot be empty');
    }

    // Validate component
    if (!component || (typeof component !== 'function' && typeof component !== 'object')) {
      throw new Error('Component must be a valid React component');
    }

    // Check for duplicate registration
    if (this.components.has(name)) {
      throw new Error(`Component "${name}" is already registered`);
    }

    // Prepare registration data
    const registeredComponent: RegisteredComponent = {
      name,
      component,
      options: options || {},
      registeredAt: new Date(),
      loaded: true // For now, all components are immediately loaded
    };

    // Register the component
    this.components.set(name, registeredComponent);

    // Emit registration event
    this.emit('component:registered', {
      name,
      component,
      options: options || {}
    });
  }

  /**
   * Get a registered component
   * 
   * @param name Component name
   * @returns Component or null if not found
   */
  get(name: string): ReactComponentType | null {
    const registered = this.components.get(name);
    return registered ? registered.component : null;
  }

  /**
   * Get all registered components
   * 
   * @returns Map of all registered components
   */
  getAll(): Map<string, RegisteredComponent> {
    return new Map(this.components);
  }

  /**
   * Check if a component is registered
   * 
   * @param name Component name
   * @returns True if component exists
   */
  has(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Unregister a component
   * 
   * @param name Component name
   * @returns True if component was removed, false if not found
   */
  unregister(name: string): boolean {
    const existed = this.components.delete(name);
    
    if (existed) {
      this.emit('component:unregistered', { name });
    }
    
    return existed;
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.components.clear();
    this.emit('component:cleared');
  }

  /**
   * Get components by namespace
   * 
   * @param namespace Namespace to filter by
   * @returns Array of components in the namespace
   */
  getByNamespace(namespace: string): RegisteredComponent[] {
    const results: RegisteredComponent[] = [];
    
    for (const component of this.components.values()) {
      if (component.options.namespace === namespace) {
        results.push(component);
      }
    }
    
    return results;
  }

  /**
   * Get components by tag
   * 
   * @param tag Tag to filter by
   * @returns Array of components with the tag
   */
  getByTag(tag: string): RegisteredComponent[] {
    const results: RegisteredComponent[] = [];
    
    for (const component of this.components.values()) {
      if (component.options.tags?.includes(tag)) {
        results.push(component);
      }
    }
    
    return results;
  }
}
