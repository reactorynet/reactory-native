/**
 * FormSchemaManager - Server-driven form schema management
 * 
 * This manager handles the loading, caching, validation, and submission of form schemas
 * from the Reactory server. It provides comprehensive form management capabilities
 * including schema versioning, intelligent caching, and real-time updates.
 * 
 * @version 1.0.0
 * @created August 20, 2025
 */

import { ReactorySDK } from './ReactorySDK';

/**
 * Configuration interface for FormSchemaManager
 */
export interface FormSchemaManagerConfig {
  /** Enable/disable schema caching */
  enableCaching: boolean;
  
  /** Cache expiration time in milliseconds (default: 1 hour) */
  cacheExpirationMs: number;
  
  /** Maximum number of cached schemas */
  maxCacheSize: number;
  
  /** Enable/disable offline support */
  enableOfflineSupport: boolean;
  
  /** Retry configuration for failed requests */
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
  };
  
  /** Enable/disable real-time schema updates */
  enableRealTimeUpdates: boolean;
  
  /** GraphQL endpoints for schema operations */
  endpoints: {
    getSchema: string;
    submitForm: string;
    validateForm: string;
    getSchemaVersions: string;
  };
}

/**
 * Cache entry structure for form schemas
 */
interface FormSchemaCacheEntry {
  schema: Reactory.Forms.IReactoryForm;
  cachedAt: number;
  expiresAt: number;
  version: string;
  etag?: string;
}

/**
 * Form submission result interface
 */
export interface FormSubmissionResult {
  success: boolean;
  data?: any;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  validationErrors?: Reactory.Schema.IErrorSchema;
  serverMessage?: string;
  redirectUrl?: string;
}

/**
 * Form validation result interface
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Reactory.Schema.IErrorSchema;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Schema loading options
 */
export interface SchemaLoadOptions {
  /** Force refresh from server */
  forceRefresh?: boolean;
  
  /** Specific version to load */
  version?: string;
  
  /** Include preview/draft schemas */
  includePreview?: boolean;
  
  /** Context data for dynamic schemas */
  context?: Record<string, any>;
  
  /** Timeout for the request */
  timeoutMs?: number;
}

/**
 * FormSchemaManager - Comprehensive form schema management
 * 
 * Provides enterprise-grade form schema management with caching, validation,
 * submission handling, versioning, and real-time updates.
 */
export class FormSchemaManager {
  private readonly reactory: ReactorySDK;
  private readonly config: FormSchemaManagerConfig;
  private readonly schemaCache: Map<string, FormSchemaCacheEntry> = new Map();
  private readonly loadingPromises: Map<string, Promise<Reactory.Forms.IReactoryForm>> = new Map();
  private readonly subscriptions: Map<string, () => void> = new Map();
  private hitCount: number = 0;
  private missCount: number = 0;
  private isInitialized: boolean = false;

  /**
   * Default configuration for FormSchemaManager
   */
  private static readonly DEFAULT_CONFIG: FormSchemaManagerConfig = {
    enableCaching: true,
    cacheExpirationMs: 60 * 60 * 1000, // 1 hour
    maxCacheSize: 100,
    enableOfflineSupport: true,
    retryConfig: {
      maxRetries: 3,
      retryDelayMs: 1000,
      exponentialBackoff: true,
    },
    enableRealTimeUpdates: true,
    endpoints: {
      getSchema: 'getFormSchema',
      submitForm: 'submitForm',
      validateForm: 'validateForm',
      getSchemaVersions: 'getFormSchemaVersions',
    },
  };

  /**
   * Creates a new FormSchemaManager instance
   * 
   * @param reactory - ReactorySDK instance
   * @param config - Configuration options
   */
  constructor(reactory: ReactorySDK, config?: Partial<FormSchemaManagerConfig>) {
    this.reactory = reactory;
    this.config = { ...FormSchemaManager.DEFAULT_CONFIG, ...config };
    
    // Bind methods to maintain correct context
    this.getSchema = this.getSchema.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.clearCache = this.clearCache.bind(this);
    this.preloadSchemas = this.preloadSchemas.bind(this);
  }

  /**
   * Initializes the FormSchemaManager
   * 
   * Sets up caching, real-time subscriptions, and loads persistent cache
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load persistent cache (stubbed for now)
      await this.loadPersistentCache();

      // Setup real-time updates if enabled
      if (this.config.enableRealTimeUpdates) {
        this.setupRealTimeUpdates();
      }

      // Setup cache cleanup interval
      this.setupCacheCleanup();

      this.isInitialized = true;
      
      this.reactory.emit('formSchemaManager.initialized', {
        cacheSize: this.schemaCache.size,
        config: this.config,
      });
    } catch (error) {
      this.reactory.emit('formSchemaManager.initializationError', { error });
      throw new Error(`FormSchemaManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads a form schema by ID with comprehensive caching and error handling
   * 
   * @param schemaId - Unique identifier for the form schema
   * @param options - Loading options
   * @returns Promise resolving to the form schema
   */
  async getSchema(schemaId: string, options: SchemaLoadOptions = {}): Promise<Reactory.Forms.IReactoryForm> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cacheKey = this.generateCacheKey(schemaId, options);

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Check cache first (unless force refresh)
    if (!options.forceRefresh && this.config.enableCaching) {
      const cached = this.getCachedSchema(cacheKey);
      if (cached) {
        this.hitCount++;
        this.reactory.emit('formSchemaManager.cacheHit', { schemaId, cacheKey });
        return cached;
      }
    }

    this.missCount++;

    // Create loading promise
    const loadingPromise = this.loadSchemaFromServer(schemaId, options);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const schema = await loadingPromise;
      
      // Cache the result
      if (this.config.enableCaching) {
        this.cacheSchema(cacheKey, schema);
      }
      
      this.reactory.emit('formSchemaManager.schemaLoaded', { schemaId, schema });
      return schema;
    } catch (error) {
      this.reactory.emit('formSchemaManager.schemaLoadError', { schemaId, error });
      
      // Try to return cached version as fallback
      if (this.config.enableOfflineSupport) {
        const cached = this.getCachedSchema(cacheKey, true); // Ignore expiration
        if (cached) {
          this.reactory.emit('formSchemaManager.fallbackToCache', { schemaId });
          return cached;
        }
      }
      
      throw error;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Validates form data against a schema
   * 
   * @param schemaId - Form schema identifier
   * @param formData - Data to validate
   * @param options - Validation options
   * @returns Promise resolving to validation result
   */
  async validateForm(
    schemaId: string, 
    formData: Record<string, any>, 
    options: { mode?: 'client' | 'server' | 'hybrid' } = {}
  ): Promise<FormValidationResult> {
    const { mode = 'hybrid' } = options;

    try {
      // Get schema for validation
      const schema = await this.getSchema(schemaId);

      let result: FormValidationResult = {
        isValid: true,
        errors: {},
      };

      // Client-side validation
      if (mode === 'client' || mode === 'hybrid') {
        result = this.validateClientSide(schema, formData);
      }

      // Server-side validation (stubbed for now)
      if ((mode === 'server' || mode === 'hybrid') && result.isValid) {
        const serverResult = await this.validateServerSide(schemaId, formData);
        if (!serverResult.isValid) {
          result = serverResult;
        }
      }

      this.reactory.emit('formSchemaManager.validationCompleted', {
        schemaId,
        result,
        mode,
      });

      return result;
    } catch (error) {
      this.reactory.emit('formSchemaManager.validationError', { schemaId, error });
      throw error;
    }
  }

  /**
   * Submits form data using the schema configuration
   * 
   * @param schemaId - Form schema identifier
   * @param formData - Data to submit
   * @param options - Submission options
   * @returns Promise resolving to submission result
   */
  async submitForm(
    schemaId: string, 
    formData: Record<string, any>,
    options: {
      validateFirst?: boolean;
      timeout?: number;
      retryOnFailure?: boolean;
    } = {}
  ): Promise<FormSubmissionResult> {
    const { validateFirst = true } = options;

    try {
      // Get schema
      const schema = await this.getSchema(schemaId);

      // Validate first if requested
      if (validateFirst) {
        const validation = await this.validateForm(schemaId, formData);
        if (!validation.isValid) {
          return {
            success: false,
            validationErrors: validation.errors,
            errors: Object.entries(validation.errors).map(([field, message]) => ({
              field,
              message: Array.isArray(message) ? message.join(', ') : String(message),
              code: 'VALIDATION_ERROR',
            })),
          };
        }
      }

      // Submit form (stubbed for now)
      const result = await this.submitToServer(schema, formData, options);
      
      this.reactory.emit('formSchemaManager.formSubmitted', {
        schemaId,
        success: result.success,
        result,
      });

      return result;
    } catch (error) {
      this.reactory.emit('formSchemaManager.submissionError', { schemaId, error });
      throw error;
    }
  }

  /**
   * Gets available versions for a schema
   * 
   * @param schemaId - Schema identifier
   * @returns Promise resolving to version list
   */
  async getSchemaVersions(schemaId: string): Promise<Array<{ version: string; createdAt: Date; isActive: boolean; }>> {
    try {
      // Stubbed implementation - would use GraphQL query
      this.reactory.emit('formSchemaManager.versionLoadStarted', { schemaId });
      
      // Mock data for testing
      const versions = [
        { version: '1.0.0', createdAt: new Date(), isActive: true },
        { version: '0.9.0', createdAt: new Date(Date.now() - 86400000), isActive: false },
      ];

      this.reactory.emit('formSchemaManager.versionLoadCompleted', { schemaId, versions });
      return versions;
    } catch (error) {
      this.reactory.emit('formSchemaManager.versionLoadError', { schemaId, error });
      throw error;
    }
  }

  /**
   * Preloads multiple schemas for performance optimization
   * 
   * @param schemaIds - Array of schema IDs to preload
   * @param options - Loading options
   */
  async preloadSchemas(schemaIds: string[], options: SchemaLoadOptions = {}): Promise<void> {
    const loadPromises = schemaIds.map(id => 
      this.getSchema(id, options).catch(error => {
        this.reactory.emit('formSchemaManager.preloadError', { schemaId: id, error });
        return null;
      })
    );

    await Promise.allSettled(loadPromises);
    this.reactory.emit('formSchemaManager.preloadCompleted', { 
      total: schemaIds.length,
      successful: (await Promise.allSettled(loadPromises)).filter(r => r.status === 'fulfilled').length,
    });
  }

  /**
   * Clears cached schemas
   * 
   * @param schemaId - Specific schema ID to clear, or undefined to clear all
   */
  async clearCache(schemaId?: string): Promise<void> {
    if (schemaId) {
      // Clear specific schema and its variants
      const keysToDelete = Array.from(this.schemaCache.keys()).filter(key => 
        key === schemaId || key.startsWith(`${schemaId}:`)
      );
      keysToDelete.forEach(key => this.schemaCache.delete(key));
    } else {
      // Clear all cache
      this.schemaCache.clear();
    }

    // Clear persistent cache (stubbed)
    await this.clearPersistentCache(schemaId);
    
    this.reactory.emit('formSchemaManager.cacheCleared', { schemaId });
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; size: number; expiresAt: number; }>;
  } {
    const entries = Array.from(this.schemaCache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.schema).length,
      expiresAt: entry.expiresAt,
    }));

    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;

    return {
      size: this.schemaCache.size,
      maxSize: this.config.maxCacheSize,
      hitRate,
      entries,
    };
  }

  /**
   * Destroys the FormSchemaManager and cleans up resources
   */
  async destroy(): Promise<void> {
    // Clear all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();

    // Clear caches
    this.schemaCache.clear();
    this.loadingPromises.clear();

    this.isInitialized = false;
    this.reactory.emit('formSchemaManager.destroyed');
  }

  // Private methods

  /**
   * Generates a cache key for a schema request
   */
  private generateCacheKey(schemaId: string, options: SchemaLoadOptions): string {
    const parts = [schemaId];
    if (options.version) parts.push(`v:${options.version}`);
    if (options.includePreview) parts.push('preview');
    if (options.context) parts.push(`ctx:${JSON.stringify(options.context)}`);
    return parts.join(':');
  }

  /**
   * Retrieves a schema from cache
   */
  private getCachedSchema(cacheKey: string, ignoreExpiration = false): Reactory.Forms.IReactoryForm | null {
    const entry = this.schemaCache.get(cacheKey);
    if (!entry) return null;

    if (!ignoreExpiration && Date.now() > entry.expiresAt) {
      this.schemaCache.delete(cacheKey);
      return null;
    }

    return entry.schema;
  }

  /**
   * Caches a schema with expiration
   */
  private cacheSchema(cacheKey: string, schema: Reactory.Forms.IReactoryForm): void {
    // Enforce cache size limit
    if (this.schemaCache.size >= this.config.maxCacheSize) {
      this.evictOldestCacheEntry();
    }

    const entry: FormSchemaCacheEntry = {
      schema,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.config.cacheExpirationMs,
      version: schema.version,
    };

    this.schemaCache.set(cacheKey, entry);
    this.saveToPersistentCache(cacheKey, entry);
  }

  /**
   * Evicts the oldest cache entry
   */
  private evictOldestCacheEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.schemaCache.entries()) {
      if (entry.cachedAt < oldestTime) {
        oldestTime = entry.cachedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.schemaCache.delete(oldestKey);
    }
  }

  /**
   * Loads schema from server with retry logic
   */
  private async loadSchemaFromServer(schemaId: string, options: SchemaLoadOptions): Promise<Reactory.Forms.IReactoryForm> {
    const { retryConfig } = this.config;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Mock implementation - would use GraphQL query
        await this.delay(100); // Simulate network delay
        
        // Create mock schema for testing
        const mockSchema: Reactory.Forms.IReactoryForm = {
          id: `reactory.forms.${schemaId}@1.0.0`,
          name: schemaId,
          nameSpace: 'reactory.forms',
          version: options.version || '1.0.0',
          title: `Form: ${schemaId}`,
          description: `Mock form schema for ${schemaId}`,
          schema: {
            type: 'object',
            title: `Form: ${schemaId}`,
            properties: {
              name: {
                type: 'string',
                title: 'Name',
                description: 'Enter your name',
              },
              email: {
                type: 'string',
                format: 'email',
                title: 'Email',
                description: 'Enter your email address',
              },
            },
            required: ['name', 'email'],
          },
          uiSchema: {
            'ui:field': 'ObjectField',
            'ui:options': {
              submitText: 'Submit Form',
            },
            name: {
              'ui:widget': 'TextWidget',
              'ui:placeholder': 'Enter your full name',
            },
            email: {
              'ui:widget': 'EmailWidget',
              'ui:placeholder': 'Enter your email',
            },
          },
        };

        return mockSchema;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retryConfig.maxRetries) {
          const delay = retryConfig.exponentialBackoff 
            ? retryConfig.retryDelayMs * Math.pow(2, attempt)
            : retryConfig.retryDelayMs;
          
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Failed to load schema after all retries');
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Performs client-side validation
   */
  private validateClientSide(schema: Reactory.Forms.IReactoryForm, formData: Record<string, any>): FormValidationResult {
    const errors: Reactory.Schema.IErrorSchema = {};
    
    // Basic validation against schema
    this.validateSchemaFields(schema.schema, formData, errors);
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validates schema fields recursively
   */
  private validateSchemaFields(schema: Reactory.Schema.ISchema, data: any, errors: Reactory.Schema.IErrorSchema, path = ''): void {
    if (schema.type !== 'object' || !schema.properties) {
      return;
    }

    for (const [key, fieldSchema] of Object.entries(schema.properties)) {
      const fieldPath = path ? `${path}.${key}` : key;
      const fieldValue = data?.[key];
      
      // Check required fields
      const requiredFields = Array.isArray(schema.required) ? schema.required : [];
      const isRequired = requiredFields.includes(key);
      const isEmpty = fieldValue === undefined || fieldValue === null || fieldValue === '';
      
      if (isRequired && isEmpty) {
        errors[fieldPath] = 'This field is required';
        continue;
      }
      
      // Validate field type and constraints if value exists
      if (!isEmpty) {
        this.validateSchemaFields(fieldSchema, fieldValue, errors, fieldPath);
      }
    }
  }

  /**
   * Performs server-side validation (stubbed)
   */
  private async validateServerSide(_schemaId: string, _formData: Record<string, any>): Promise<FormValidationResult> {
    // Mock validation - would use GraphQL query
    await this.delay(50);
    
    return {
      isValid: true,
      errors: {},
    };
  }

  /**
   * Submits form to server (stubbed)
   */
  private async submitToServer(
    _schema: Reactory.Forms.IReactoryForm, 
    formData: Record<string, any>,
    _options: { timeout?: number; retryOnFailure?: boolean }
  ): Promise<FormSubmissionResult> {
    // Mock submission - would use GraphQL mutation
    await this.delay(200);
    
    return {
      success: true,
      data: { id: 'mock-id', ...formData },
      serverMessage: 'Form submitted successfully',
    };
  }

  /**
   * Loads persistent cache (stubbed)
   */
  private async loadPersistentCache(): Promise<void> {
    // Stubbed - would use AsyncStorage
    await this.delay(10);
  }

  /**
   * Saves cache entry to persistent storage (stubbed)
   */
  private async saveToPersistentCache(_cacheKey: string, _entry: FormSchemaCacheEntry): Promise<void> {
    // Stubbed - would use AsyncStorage
    await this.delay(5);
  }

  /**
   * Clears persistent cache (stubbed)
   */
  private async clearPersistentCache(_schemaId?: string): Promise<void> {
    // Stubbed - would use AsyncStorage
    await this.delay(10);
  }

  /**
   * Sets up real-time schema updates
   */
  private setupRealTimeUpdates(): void {
    const unsubscribe = () => {
      // Cleanup function for real-time updates
    };

    this.subscriptions.set('schema.updated', unsubscribe);
  }

  /**
   * Sets up cache cleanup interval
   */
  private setupCacheCleanup(): void {
    const interval = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, entry] of this.schemaCache.entries()) {
        if (now > entry.expiresAt) {
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach(key => this.schemaCache.delete(key));

      if (expiredKeys.length > 0) {
        this.reactory.emit('formSchemaManager.cacheExpired', { 
          expiredCount: expiredKeys.length,
          remainingCount: this.schemaCache.size,
        });
      }
    }, 60000); // Run every minute

    // Store cleanup function
    this.subscriptions.set('cache.cleanup', () => clearInterval(interval));
  }
}

export default FormSchemaManager;
