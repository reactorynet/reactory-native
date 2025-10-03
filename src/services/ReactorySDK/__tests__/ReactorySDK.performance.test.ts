/**
 * ReactorySDK Performance Test Suite
 * 
 * Performance and load testing for the ReactorySDK to ensure efficient
 * operation under various conditions including high load, memory constraints,
 * and concurrent operations.
 * 
 * @version 1.0.0
 * @created August 20, 2025
 */

import { ReactorySDK } from '../ReactorySDK';
import type { ReactorySDKConfig, ReactoryTheme } from '../types';

// Performance test utilities
const measureExecutionTime = async (fn: () => Promise<any>): Promise<{ result: any; duration: number }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  return { result, duration: endTime - startTime };
};

const measureMemoryUsage = (): number => {
  if (typeof performance !== 'undefined' && performance.memory) {
    return performance.memory.usedJSHeapSize;
  }
  return 0; // Fallback for environments without performance.memory
};

// Mock storage with performance tracking
const createMockStorageWithMetrics = () => {
  const operations: { type: string; duration: number }[] = [];
  
  return {
    operations,
    storage: {
      getItem: jest.fn().mockImplementation(async (key: string) => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10)); // Simulate async delay
        const duration = performance.now() - start;
        operations.push({ type: 'getItem', duration });
        return null;
      }),
      setItem: jest.fn().mockImplementation(async (key: string, value: string) => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 15)); // Simulate async delay
        const duration = performance.now() - start;
        operations.push({ type: 'setItem', duration });
      }),
      removeItem: jest.fn().mockImplementation(async (key: string) => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 8)); // Simulate async delay
        const duration = performance.now() - start;
        operations.push({ type: 'removeItem', duration });
      }),
      getAllKeys: jest.fn().mockResolvedValue([]),
      multiGet: jest.fn().mockResolvedValue([]),
      multiSet: jest.fn().mockResolvedValue(undefined),
      multiRemove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
  };
};

// Mock Apollo Client with performance simulation
const createMockApolloClientWithMetrics = () => {
  const operations: { type: string; duration: number }[] = [];
  
  return {
    operations,
    client: {
      query: jest.fn().mockImplementation(async (options: any) => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 50)); // 50-100ms delay
        const duration = performance.now() - start;
        operations.push({ type: 'query', duration });
        
        return {
          data: {
            configuration: {
              clientKey: 'test-client',
              version: '1.0.0',
              environment: 'test',
            },
          },
        };
      }),
      mutate: jest.fn().mockImplementation(async (options: any) => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 100)); // 100-200ms delay
        const duration = performance.now() - start;
        operations.push({ type: 'mutate', duration });
        
        return {
          data: {
            submitForm: { success: true, id: 'form-' + Math.random() },
          },
        };
      }),
      subscribe: jest.fn(),
      watchQuery: jest.fn(),
      cache: {
        readQuery: jest.fn(),
        writeQuery: jest.fn(),
        evict: jest.fn(),
        gc: jest.fn(),
      },
    },
  };
};

// Generate test data helpers
const generateMockTheme = (id: string): ReactoryTheme => ({
  id,
  name: `Performance Test Theme ${id}`,
  version: '1.0.0',
  description: `Generated theme for performance testing: ${id}`,
  colors: {
    primary: '#' + Math.floor(Math.random() * 16777215).toString(16),
    secondary: '#FF9800',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    error: '#F44336',
    warning: '#FF9800',
    success: '#4CAF50',
    info: '#2196F3',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
    },
    divider: '#E0E0E0',
    border: '#E0E0E0',
  },
  typography: {
    fontFamily: 'System',
    fontSize: { small: 12, medium: 14, large: 16, extraLarge: 20 },
    fontWeight: { light: '300', regular: '400', medium: '500', bold: '700' },
    lineHeight: { tight: 1.2, normal: 1.4, relaxed: 1.6 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { none: 0, sm: 4, md: 8, lg: 12, full: 9999 },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  animations: {
    duration: { fast: 150, normal: 300, slow: 500 },
    easing: { linear: 'linear', easeIn: 'ease-in', easeOut: 'ease-out', easeInOut: 'ease-in-out' },
  },
});

const generateMockFormSchema = (id: string) => ({
  id,
  name: `Performance Test Form ${id}`,
  version: '1.0.0',
  schema: {
    type: 'object',
    properties: {
      field1: { type: 'string', title: 'Field 1', required: true },
      field2: { type: 'string', title: 'Field 2', required: false },
      field3: { type: 'number', title: 'Field 3', required: false },
      field4: { type: 'boolean', title: 'Field 4', required: false },
    },
  },
  uiSchema: {
    field1: { 'ui:placeholder': 'Enter field 1' },
    field2: { 'ui:placeholder': 'Enter field 2' },
  },
});

describe('ReactorySDK Performance Tests', () => {
  let sdk: ReactorySDK;
  let mockConfig: ReactorySDKConfig;
  let storageMetrics: ReturnType<typeof createMockStorageWithMetrics>;
  let apolloMetrics: ReturnType<typeof createMockApolloClientWithMetrics>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    storageMetrics = createMockStorageWithMetrics();
    apolloMetrics = createMockApolloClientWithMetrics();

    mockConfig = {
      clientKey: 'perf-test-client',
      environment: 'test',
      apiEndpoint: 'https://api.test.com',
      storageProvider: storageMetrics.storage as any,
      apolloClient: apolloMetrics.client as any,
      enableOfflineMode: true,
      enableAnalytics: false,
    };

    sdk = new ReactorySDK(mockConfig);
  });

  afterEach(async () => {
    if (sdk) {
      await sdk.destroy();
    }
  });

  describe('Initialization Performance', () => {
    test('should initialize within acceptable time limits', async () => {
      const { duration } = await measureExecutionTime(() => sdk.initialize());
      
      // Should initialize in under 1 second
      expect(duration).toBeLessThan(1000);
      console.log(`SDK initialization took ${duration.toFixed(2)}ms`);
    });

    test('should have minimal memory impact during initialization', async () => {
      const memoryBefore = measureMemoryUsage();
      
      await sdk.initialize();
      
      const memoryAfter = measureMemoryUsage();
      const memoryIncrease = memoryAfter - memoryBefore;
      
      // Memory increase should be reasonable (less than 10MB in most cases)
      if (memoryBefore > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
        console.log(`Memory increase during initialization: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    test('should initialize managers concurrently for better performance', async () => {
      const initEvents: { manager: string; timestamp: number }[] = [];
      
      sdk.on('configurationManager.initialized', () => 
        initEvents.push({ manager: 'configuration', timestamp: performance.now() }));
      sdk.on('formSchemaManager.initialized', () => 
        initEvents.push({ manager: 'forms', timestamp: performance.now() }));
      sdk.on('networkManager.initialized', () => 
        initEvents.push({ manager: 'network', timestamp: performance.now() }));
      sdk.on('themeManager.initialized', () => 
        initEvents.push({ manager: 'theme', timestamp: performance.now() }));

      await sdk.initialize();

      // Verify managers initialized in reasonable time
      expect(initEvents.length).toBe(4);
      
      // Calculate time span for concurrent initialization
      const times = initEvents.map(e => e.timestamp);
      const timeSpan = Math.max(...times) - Math.min(...times);
      
      // Concurrent initialization should complete within 200ms span
      expect(timeSpan).toBeLessThan(200);
      console.log(`Manager initialization span: ${timeSpan.toFixed(2)}ms`);
    });
  });

  describe('Configuration Management Performance', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    test('should handle rapid configuration updates efficiently', async () => {
      const updateCount = 50;
      const updates: Promise<void>[] = [];

      const { duration } = await measureExecutionTime(async () => {
        for (let i = 0; i < updateCount; i++) {
          updates.push(sdk.configuration.updateConfiguration({
            api: { timeout: 1000 + i },
          }));
        }
        await Promise.all(updates);
      });

      // Should handle 50 updates in under 2 seconds
      expect(duration).toBeLessThan(2000);
      console.log(`${updateCount} configuration updates took ${duration.toFixed(2)}ms`);
    });

    test('should cache configuration access efficiently', async () => {
      // Warm up cache
      await sdk.configuration.getConfiguration();

      const accessCount = 1000;
      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: accessCount }, () => 
          sdk.configuration.getConfiguration()
        );
        await Promise.all(promises);
      });

      // 1000 cached accesses should be very fast
      expect(duration).toBeLessThan(100);
      console.log(`${accessCount} cached configuration accesses took ${duration.toFixed(2)}ms`);
    });

    test('should optimize storage operations', async () => {
      await sdk.configuration.updateConfiguration({
        api: { timeout: 5000 },
        theme: { defaultTheme: 'reactory-dark' },
      });

      // Check storage operation efficiency
      const avgSetItemDuration = storageMetrics.operations
        .filter(op => op.type === 'setItem')
        .reduce((sum, op) => sum + op.duration, 0) / 
        storageMetrics.operations.filter(op => op.type === 'setItem').length;

      // Average storage operation should be fast
      expect(avgSetItemDuration).toBeLessThan(50);
      console.log(`Average storage setItem duration: ${avgSetItemDuration.toFixed(2)}ms`);
    });
  });

  describe('Theme Management Performance', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    test('should handle theme switching efficiently', async () => {
      const switchCount = 20;
      
      const { duration } = await measureExecutionTime(async () => {
        for (let i = 0; i < switchCount; i++) {
          const themeId = i % 2 === 0 ? 'reactory-light' : 'reactory-dark';
          await sdk.theme.setTheme(themeId);
        }
      });

      // Should handle 20 theme switches in under 1 second
      expect(duration).toBeLessThan(1000);
      console.log(`${switchCount} theme switches took ${duration.toFixed(2)}ms`);
    });

    test('should create custom themes efficiently', async () => {
      const themeCount = 25;
      const themes = Array.from({ length: themeCount }, (_, i) => 
        generateMockTheme(`perf-theme-${i}`)
      );

      const { duration } = await measureExecutionTime(async () => {
        const promises = themes.map(theme => sdk.theme.createCustomTheme(theme));
        await Promise.all(promises);
      });

      // Should create 25 themes in under 2 seconds
      expect(duration).toBeLessThan(2000);
      console.log(`Creating ${themeCount} custom themes took ${duration.toFixed(2)}ms`);

      // Verify all themes were created
      const availableThemes = sdk.theme.getAvailableThemes();
      const customThemes = availableThemes.filter(t => t.isCustom);
      expect(customThemes.length).toBeGreaterThanOrEqual(themeCount);
    });

    test('should validate themes efficiently', async () => {
      const validationCount = 100;
      const theme = generateMockTheme('validation-test');

      const { duration } = await measureExecutionTime(() => {
        for (let i = 0; i < validationCount; i++) {
          sdk.theme.validateTheme(theme);
        }
      });

      // 100 validations should be very fast (synchronous operation)
      expect(duration).toBeLessThan(50);
      console.log(`${validationCount} theme validations took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Form Schema Management Performance', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    test('should load multiple form schemas efficiently', async () => {
      const schemaCount = 30;
      const schemas = Array.from({ length: schemaCount }, (_, i) => 
        generateMockFormSchema(`perf-form-${i}`)
      );

      const { duration } = await measureExecutionTime(async () => {
        const promises = schemas.map(schema => 
          sdk.forms.loadFormSchema(schema.id, schema)
        );
        await Promise.all(promises);
      });

      // Should load 30 schemas in under 1.5 seconds
      expect(duration).toBeLessThan(1500);
      console.log(`Loading ${schemaCount} form schemas took ${duration.toFixed(2)}ms`);
    });

    test('should validate forms efficiently', async () => {
      const schema = generateMockFormSchema('validation-perf');
      await sdk.forms.loadFormSchema(schema.id, schema);

      const validationCount = 100;
      const formData = {
        field1: 'test value',
        field2: 'another value',
        field3: 42,
        field4: true,
      };

      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: validationCount }, () =>
          sdk.forms.validateForm(schema.id, formData)
        );
        await Promise.all(promises);
      });

      // 100 validations should complete quickly
      expect(duration).toBeLessThan(500);
      console.log(`${validationCount} form validations took ${duration.toFixed(2)}ms`);
    });

    test('should handle cache operations efficiently', async () => {
      // Load schemas to populate cache
      const schemas = Array.from({ length: 20 }, (_, i) => 
        generateMockFormSchema(`cache-test-${i}`)
      );

      for (const schema of schemas) {
        await sdk.forms.loadFormSchema(schema.id, schema);
      }

      // Test cache retrieval performance
      const cacheAccessCount = 500;
      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: cacheAccessCount }, (_, i) => {
          const schemaId = `cache-test-${i % schemas.length}`;
          return sdk.forms.getFormSchema(schemaId);
        });
        await Promise.all(promises);
      });

      // 500 cache accesses should be very fast
      expect(duration).toBeLessThan(200);
      console.log(`${cacheAccessCount} cache accesses took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Network Management Performance', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    test('should handle concurrent GraphQL operations efficiently', async () => {
      const operationCount = 25;
      const query = '{ __typename }';

      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: operationCount }, () =>
          sdk.network.query(query)
        );
        await Promise.all(promises);
      });

      // Should handle 25 concurrent operations reasonably
      expect(duration).toBeLessThan(3000);
      console.log(`${operationCount} concurrent GraphQL operations took ${duration.toFixed(2)}ms`);

      // Check Apollo Client operation efficiency
      const avgQueryDuration = apolloMetrics.operations
        .filter(op => op.type === 'query')
        .reduce((sum, op) => sum + op.duration, 0) / 
        apolloMetrics.operations.filter(op => op.type === 'query').length;

      console.log(`Average GraphQL query duration: ${avgQueryDuration.toFixed(2)}ms`);
    });

    test('should manage request cache efficiently', async () => {
      const query = '{ test { id name } }';
      const variables = { id: 'test-123' };

      // First request to populate cache
      await sdk.network.query(query, variables);

      // Test cache hit performance
      const cacheHitCount = 100;
      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: cacheHitCount }, () =>
          sdk.network.query(query, variables)
        );
        await Promise.all(promises);
      });

      // Cache hits should be very fast
      expect(duration).toBeLessThan(100);
      console.log(`${cacheHitCount} cache hits took ${duration.toFixed(2)}ms`);
    });

    test('should handle offline queue efficiently', async () => {
      // Set offline mode
      await sdk.network.setOfflineMode(true);

      const queueCount = 50;
      const mutation = 'mutation { createItem(input: $input) { id } }';

      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: queueCount }, (_, i) =>
          sdk.network.mutate(mutation, { input: { name: `item-${i}` } })
        );
        await Promise.allSettled(promises); // Some may fail due to offline mode
      });

      // Queueing operations should be fast
      expect(duration).toBeLessThan(1000);
      console.log(`Queueing ${queueCount} offline operations took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Management and Cleanup', () => {
    test('should clean up resources properly after destruction', async () => {
      const memoryBefore = measureMemoryUsage();
      
      // Create and use SDK
      await sdk.initialize();
      
      // Load some data
      const themes = Array.from({ length: 10 }, (_, i) => generateMockTheme(`cleanup-${i}`));
      for (const theme of themes) {
        await sdk.theme.createCustomTheme(theme);
      }

      const schemas = Array.from({ length: 10 }, (_, i) => generateMockFormSchema(`cleanup-${i}`));
      for (const schema of schemas) {
        await sdk.forms.loadFormSchema(schema.id, schema);
      }

      // Destroy SDK
      await sdk.destroy();

      const memoryAfter = measureMemoryUsage();
      
      if (memoryBefore > 0 && memoryAfter > 0) {
        const memoryIncrease = memoryAfter - memoryBefore;
        console.log(`Memory change after cleanup: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        
        // Should not have significant memory leaks
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB tolerance
      }
    });

    test('should handle garbage collection efficiently', async () => {
      await sdk.initialize();

      // Create and destroy many objects to test GC
      for (let i = 0; i < 5; i++) {
        const themes = Array.from({ length: 20 }, (_, j) => 
          generateMockTheme(`gc-test-${i}-${j}`)
        );
        
        for (const theme of themes) {
          await sdk.theme.createCustomTheme(theme);
        }
        
        // Delete half of them
        const availableThemes = sdk.theme.getAvailableThemes();
        const customThemes = availableThemes.filter(t => t.isCustom && t.id.includes(`gc-test-${i}`));
        
        for (let j = 0; j < customThemes.length / 2; j++) {
          await sdk.theme.deleteCustomTheme(customThemes[j].id);
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // SDK should still be functional
      const currentTheme = sdk.theme.getCurrentTheme();
      expect(currentTheme).toBeDefined();
    });
  });

  describe('Concurrent Operations Stress Testing', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    test('should handle high concurrent load across all managers', async () => {
      const operationsPerManager = 20;
      const allOperations: Promise<any>[] = [];

      // Configuration operations
      for (let i = 0; i < operationsPerManager; i++) {
        allOperations.push(
          sdk.configuration.updateConfiguration({ api: { timeout: 1000 + i } })
        );
      }

      // Theme operations
      for (let i = 0; i < operationsPerManager; i++) {
        allOperations.push(
          sdk.theme.createCustomTheme(generateMockTheme(`stress-theme-${i}`))
        );
      }

      // Form operations
      for (let i = 0; i < operationsPerManager; i++) {
        const schema = generateMockFormSchema(`stress-form-${i}`);
        allOperations.push(
          sdk.forms.loadFormSchema(schema.id, schema)
        );
      }

      // Network operations
      for (let i = 0; i < operationsPerManager; i++) {
        allOperations.push(
          sdk.network.query('{ __typename }')
        );
      }

      const { duration } = await measureExecutionTime(async () => {
        const results = await Promise.allSettled(allOperations);
        
        // Most operations should succeed
        const successful = results.filter(r => r.status === 'fulfilled').length;
        expect(successful).toBeGreaterThan(allOperations.length * 0.8); // 80% success rate
        
        return results;
      });

      console.log(`${allOperations.length} concurrent operations took ${duration.toFixed(2)}ms`);
      
      // Should handle high load reasonably
      expect(duration).toBeLessThan(5000); // 5 seconds for 80 operations
    });

    test('should maintain responsiveness under load', async () => {
      // Start background load
      const backgroundOperations = Array.from({ length: 100 }, async (_, i) => {
        await new Promise(resolve => setTimeout(resolve, i * 10)); // Stagger operations
        return sdk.theme.createCustomTheme(generateMockTheme(`bg-theme-${i}`));
      });

      // Test responsiveness during load
      const responsiveOperations = [
        sdk.configuration.getConfiguration(),
        sdk.theme.getCurrentTheme(),
        sdk.forms.getCacheStats(),
        sdk.network.getNetworkStatus(),
      ];

      const { duration } = await measureExecutionTime(async () => {
        await Promise.all(responsiveOperations);
      });

      // Should remain responsive (under 100ms for simple operations)
      expect(duration).toBeLessThan(100);
      console.log(`Responsive operations during load took ${duration.toFixed(2)}ms`);

      // Clean up background operations
      await Promise.allSettled(backgroundOperations);
    });
  });
});
