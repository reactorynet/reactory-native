/**
 * FormSchemaManager Test Suite
 * 
 * Comprehensive test coverage for the FormSchemaManager class following TDD principles.
 * Tests cover schema loading, caching, validation, form submission, and versioning.
 * 
 * @version 1.0.0
 * @created August 20, 2025
 */

import { FormSchemaManager, FormSchemaManagerConfig } from '../FormSchemaManager';
import { ReactorySDK } from '../ReactorySDK';

// Mock ReactorySDK
const mockReactorySDK = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  query: jest.fn(),
  mutate: jest.fn(),
  getConfiguration: jest.fn(),
  setConfiguration: jest.fn(),
  user: null,
  organization: null,
  memberships: [],
} as unknown as ReactorySDK;

// Create a mock schema for testing
// const createMockSchema = (id: string = 'test-form', version: string = '1.0.0'): Reactory.Forms.IReactoryForm => ({
//   id: `reactory.forms.${id}@${version}`,
//   name: id,
//   nameSpace: 'reactory.forms',
//   version,
//   title: `Test Form: ${id}`,
//   description: `Mock form schema for testing: ${id}`,
//   schema: {
//     type: 'object',
//     title: `Form: ${id}`,
//     properties: {
//       name: {
//         type: 'string',
//         title: 'Name',
//         description: 'Enter your name',
//       },
//       email: {
//         type: 'string',
//         format: 'email',
//         title: 'Email',
//         description: 'Enter your email address',
//       },
//       age: {
//         type: 'number',
//         title: 'Age',
//         description: 'Enter your age',
//       },
//     },
//     required: ['name', 'email'],
//   },
//   uiSchema: {
//     'ui:field': 'ObjectField',
//     'ui:options': {
//       submitText: 'Submit Form',
//     },
//     name: {
//       'ui:widget': 'TextWidget',
//       'ui:placeholder': 'Enter your full name',
//     },
//     email: {
//       'ui:widget': 'EmailWidget',
//       'ui:placeholder': 'Enter your email',
//     },
//     age: {
//       'ui:widget': 'NumberWidget',
//       'ui:placeholder': 'Enter your age',
//     },
//   },
// });

describe('FormSchemaManager', () => {
  let formSchemaManager: FormSchemaManager;
  let mockConfig: Partial<FormSchemaManagerConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      enableCaching: true,
      cacheExpirationMs: 60000, // 1 minute for testing
      maxCacheSize: 10,
      enableOfflineSupport: true,
      retryConfig: {
        maxRetries: 2,
        retryDelayMs: 100,
        exponentialBackoff: true,
      },
      enableRealTimeUpdates: true,
    };

    formSchemaManager = new FormSchemaManager(mockReactorySDK, mockConfig);
  });

  afterEach(async () => {
    // Clean up any resources
    await formSchemaManager.destroy();
  });

  describe('Initialization and Setup', () => {
    test('should initialize with default configuration when no config provided', () => {
      const manager = new FormSchemaManager(mockReactorySDK);
      expect(manager).toBeInstanceOf(FormSchemaManager);
    });

    test('should merge provided config with defaults', () => {
      const customConfig = { enableCaching: false };
      const manager = new FormSchemaManager(mockReactorySDK, customConfig);
      expect(manager).toBeInstanceOf(FormSchemaManager);
    });

    test('should initialize successfully', async () => {
      await formSchemaManager.initialize();
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('formSchemaManager.initialized', expect.any(Object));
    });

    test('should not initialize twice', async () => {
      await formSchemaManager.initialize();
      await formSchemaManager.initialize(); // Second call should be ignored
      expect(mockReactorySDK.emit).toHaveBeenCalledTimes(1);
    });

    test('should bind methods correctly', () => {
      expect(typeof formSchemaManager.getSchema).toBe('function');
      expect(typeof formSchemaManager.submitForm).toBe('function');
      expect(typeof formSchemaManager.validateForm).toBe('function');
      expect(typeof formSchemaManager.clearCache).toBe('function');
      expect(typeof formSchemaManager.preloadSchemas).toBe('function');
    });
  });

  describe('Schema Loading and Caching', () => {
    test('should load schema from server', async () => {
      const schema = await formSchemaManager.getSchema('test-form');
      
      expect(schema).toBeDefined();
      expect(schema.id).toBe('reactory.forms.test-form@1.0.0');
      expect(schema.name).toBe('test-form');
      expect(schema.schema.type).toBe('object');
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('formSchemaManager.schemaLoaded', expect.any(Object));
    });

    test('should cache loaded schemas', async () => {
      const schema1 = await formSchemaManager.getSchema('test-form');
      const schema2 = await formSchemaManager.getSchema('test-form');
      
      expect(schema1).toBe(schema2); // Should be same object reference due to caching
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('formSchemaManager.cacheHit', expect.any(Object));
    });

    test('should force refresh when requested', async () => {
      await formSchemaManager.getSchema('test-form');
      await formSchemaManager.getSchema('test-form', { forceRefresh: true });
      
      // Should not emit cache hit for the forced refresh
      const cacheHitCalls = (mockReactorySDK.emit as jest.Mock).mock.calls.filter(
        call => call[0] === 'formSchemaManager.cacheHit'
      );
      expect(cacheHitCalls).toHaveLength(0);
    });

    test('should handle different cache keys for different options', async () => {
      const schema1 = await formSchemaManager.getSchema('test-form');
      const schema2 = await formSchemaManager.getSchema('test-form', { version: '2.0.0' });
      const schema3 = await formSchemaManager.getSchema('test-form', { includePreview: true });
      
      expect(schema1).toBeDefined();
      expect(schema2).toBeDefined();
      expect(schema3).toBeDefined();
      
      // All should be different due to different cache keys
      const cacheStats = formSchemaManager.getCacheStats();
      expect(cacheStats.size).toBe(3);
    });

    test('should handle concurrent requests for same schema', async () => {
      const promises = [
        formSchemaManager.getSchema('test-form'),
        formSchemaManager.getSchema('test-form'),
        formSchemaManager.getSchema('test-form'),
      ];
      
      const schemas = await Promise.all(promises);
      
      // All should resolve to the same schema
      expect(schemas[0]).toBe(schemas[1]);
      expect(schemas[1]).toBe(schemas[2]);
    });

    test('should respect cache size limits', async () => {
      const manager = new FormSchemaManager(mockReactorySDK, { maxCacheSize: 2 });
      
      await manager.getSchema('form1');
      await manager.getSchema('form2');
      await manager.getSchema('form3'); // Should evict oldest
      
      const stats = manager.getCacheStats();
      expect(stats.size).toBe(2);
      
      await manager.destroy();
    });

    test('should clear cache correctly', async () => {
      await formSchemaManager.getSchema('form1');
      await formSchemaManager.getSchema('form2');
      
      let stats = formSchemaManager.getCacheStats();
      expect(stats.size).toBe(2);
      
      await formSchemaManager.clearCache('form1');
      stats = formSchemaManager.getCacheStats();
      expect(stats.size).toBe(1);
      
      await formSchemaManager.clearCache();
      stats = formSchemaManager.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Form Validation', () => {
    test('should validate form data successfully', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };
      
      const result = await formSchemaManager.validateForm('test-form', validData);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('formSchemaManager.validationCompleted', expect.any(Object));
    });

    test('should detect validation errors', async () => {
      const invalidData = {
        // Missing required 'name' field
        email: 'john@example.com',
        age: 30,
      };
      
      const result = await formSchemaManager.validateForm('test-form', invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('This field is required');
    });

    test('should validate multiple required fields', async () => {
      const invalidData = {
        // Missing both required fields
        age: 30,
      };
      
      const result = await formSchemaManager.validateForm('test-form', invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('This field is required');
      expect(result.errors.email).toBe('This field is required');
    });

    test('should handle client-side validation mode', async () => {
      const validData = { name: 'John', email: 'john@example.com' };
      
      const result = await formSchemaManager.validateForm('test-form', validData, { mode: 'client' });
      
      expect(result.isValid).toBe(true);
    });

    test('should handle server-side validation mode', async () => {
      const validData = { name: 'John', email: 'john@example.com' };
      
      const result = await formSchemaManager.validateForm('test-form', validData, { mode: 'server' });
      
      expect(result.isValid).toBe(true);
    });

    test('should handle hybrid validation mode', async () => {
      const validData = { name: 'John', email: 'john@example.com' };
      
      const result = await formSchemaManager.validateForm('test-form', validData, { mode: 'hybrid' });
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    test('should submit valid form data successfully', async () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };
      
      const result = await formSchemaManager.submitForm('test-form', formData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'mock-id', ...formData });
      expect(result.serverMessage).toBe('Form submitted successfully');
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('formSchemaManager.formSubmitted', expect.any(Object));
    });

    test('should validate before submission by default', async () => {
      const invalidData = {
        // Missing required name field
        email: 'john@example.com',
      };
      
      const result = await formSchemaManager.submitForm('test-form', invalidData);
      
      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'This field is required',
        code: 'VALIDATION_ERROR',
      });
    });

    test('should skip validation when requested', async () => {
      const invalidData = {
        // Missing required name field
        email: 'john@example.com',
      };
      
      const result = await formSchemaManager.submitForm('test-form', invalidData, { validateFirst: false });
      
      expect(result.success).toBe(true); // Should succeed because validation was skipped
    });

    test('should handle submission options', async () => {
      const formData = { name: 'John', email: 'john@example.com' };
      
      const result = await formSchemaManager.submitForm('test-form', formData, {
        validateFirst: true,
        timeout: 5000,
        retryOnFailure: true,
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('Schema Versioning', () => {
    test('should get schema versions', async () => {
      const versions = await formSchemaManager.getSchemaVersions('test-form');
      
      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0]).toHaveProperty('version');
      expect(versions[0]).toHaveProperty('createdAt');
      expect(versions[0]).toHaveProperty('isActive');
    });

    test('should load specific version of schema', async () => {
      const schema = await formSchemaManager.getSchema('test-form', { version: '2.0.0' });
      
      expect(schema).toBeDefined();
      expect(schema.version).toBe('2.0.0');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty form data', async () => {
      const result = await formSchemaManager.validateForm('test-form', {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should preload multiple schemas', async () => {
      await formSchemaManager.preloadSchemas(['form1', 'form2', 'form3']);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('formSchemaManager.preloadCompleted', expect.any(Object));
    });

    test('should get cache statistics', () => {
      const stats = formSchemaManager.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('entries');
      expect(Array.isArray(stats.entries)).toBe(true);
    });

    test('should destroy manager and clean up resources', async () => {
      await formSchemaManager.initialize();
      await formSchemaManager.getSchema('test-form');
      
      await formSchemaManager.destroy();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('formSchemaManager.destroyed');
      
      const stats = formSchemaManager.getCacheStats();
      expect(stats.size).toBe(0);
    });

    test('should handle destroy before initialization', async () => {
      const manager = new FormSchemaManager(mockReactorySDK);
      await manager.destroy();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('formSchemaManager.destroyed');
    });
  });

  describe('Configuration and Options', () => {
    test('should respect caching configuration', async () => {
      const noCacheManager = new FormSchemaManager(mockReactorySDK, { enableCaching: false });
      
      await noCacheManager.getSchema('test-form');
      await noCacheManager.getSchema('test-form');
      
      const stats = noCacheManager.getCacheStats();
      expect(stats.size).toBe(0); // No caching
      
      await noCacheManager.destroy();
    });

    test('should respect offline support configuration', async () => {
      const offlineManager = new FormSchemaManager(mockReactorySDK, { enableOfflineSupport: false });
      
      await offlineManager.initialize();
      expect(offlineManager).toBeInstanceOf(FormSchemaManager);
      
      await offlineManager.destroy();
    });

    test('should respect real-time updates configuration', async () => {
      const noRealtimeManager = new FormSchemaManager(mockReactorySDK, { enableRealTimeUpdates: false });
      
      await noRealtimeManager.initialize();
      expect(noRealtimeManager).toBeInstanceOf(FormSchemaManager);
      
      await noRealtimeManager.destroy();
    });

    test('should handle custom retry configuration', async () => {
      const customRetryManager = new FormSchemaManager(mockReactorySDK, {
        retryConfig: {
          maxRetries: 1,
          retryDelayMs: 50,
          exponentialBackoff: false,
        },
      });
      
      const schema = await customRetryManager.getSchema('test-form');
      expect(schema).toBeDefined();
      
      await customRetryManager.destroy();
    });

    test('should handle custom endpoints configuration', async () => {
      const customEndpointsManager = new FormSchemaManager(mockReactorySDK, {
        endpoints: {
          getSchema: 'customGetSchema',
          submitForm: 'customSubmitForm',
          validateForm: 'customValidateForm',
          getSchemaVersions: 'customGetVersions',
        },
      });
      
      const schema = await customEndpointsManager.getSchema('test-form');
      expect(schema).toBeDefined();
      
      await customEndpointsManager.destroy();
    });
  });
});
