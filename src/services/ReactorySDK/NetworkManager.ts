/**
 * NetworkManager - GraphQL Operations and Connectivity Management
 * 
 * Handles all GraphQL operations, network status monitoring, and request management
 * for the ReactorySDK. Provides centralized network operations with retry logic,
 * offline support, and performance optimization.
 * 
 * @version 1.1.0
 * @created August 20, 2025
 * @updated February 1, 2026 - Added Apollo Client integration
 */

import { ReactorySDK } from './ReactorySDK';
import type { ApolloClient, NormalizedCacheObject, DocumentNode } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL Request Types
export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
  context?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
  }>;
  extensions?: Record<string, any>;
}

export interface GraphQLMutation extends GraphQLRequest {
  optimisticResponse?: any;
  updateQueries?: Record<string, any>;
}

// Network Configuration
export interface NetworkManagerConfig {
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  exponentialBackoff?: boolean;
  timeout?: number;
  enableOfflineQueue?: boolean;
  enableOptimisticUpdates?: boolean;
  enableRequestDeduplication?: boolean;
  maxConcurrentRequests?: number;
  enablePerformanceMonitoring?: boolean;
  headers?: Record<string, string>;
  endpoints?: {
    graphql?: string;
    subscription?: string;
    upload?: string;
  };
}

// Network Status Types
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';
  isExpensive: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
}

export interface RequestMetrics {
  requestId: string;
  operationType: 'query' | 'mutation' | 'subscription';
  operationName?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  cacheHit?: boolean;
  retryCount?: number;
  error?: string;
  bytesTransferred?: number;
}

// Request Queue for Offline Support
interface QueuedRequest {
  id: string;
  request: GraphQLRequest | GraphQLMutation;
  type: 'query' | 'mutation';
  timestamp: number;
  retryCount: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

// Cache Entry for Request Deduplication
interface CacheEntry<T = any> {
  key: string;
  response: GraphQLResponse<T>;
  timestamp: number;
  expiresAt: number;
}

/**
 * NetworkManager handles all GraphQL operations and network connectivity
 */
export class NetworkManager {
  private reactory: ReactorySDK;
  private config: Required<NetworkManagerConfig>;
  private isInitialized: boolean = false;
  
  // Apollo Client for real GraphQL operations
  private apolloClient?: ApolloClient<NormalizedCacheObject>;
  private useMockClient: boolean = true; // Set to false when Apollo Client is provided
  
  // Network state
  private networkStatus: NetworkStatus;
  private requestQueue: Map<string, QueuedRequest> = new Map();
  private activeRequests: Map<string, Promise<any>> = new Map();
  private requestCache: Map<string, CacheEntry> = new Map();
  
  // Performance monitoring
  private requestMetrics: RequestMetrics[] = [];
  private performanceObserver?: any;
  
  // Request management
  private requestIdCounter: number = 0;
  private concurrentRequestCount: number = 0;
  private networkChangeListeners: Set<(status: NetworkStatus) => void> = new Set();

  constructor(reactory: ReactorySDK, config?: Partial<NetworkManagerConfig>) {
    this.reactory = reactory;
    this.config = this.mergeConfig(config);
    
    // Apollo Client will be set via setApolloClient() after construction
    this.useMockClient = true;
    
    // Initialize network status
    this.networkStatus = {
      isOnline: true,
      connectionType: 'unknown',
      isExpensive: false,
      effectiveType: 'unknown',
    };

    // Bind methods to preserve context
    this.query = this.query.bind(this);
    this.mutate = this.mutate.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.getNetworkStatus = this.getNetworkStatus.bind(this);
    this.retryFailedRequests = this.retryFailedRequests.bind(this);
    this.clearRequestCache = this.clearRequestCache.bind(this);
    this.getPerformanceMetrics = this.getPerformanceMetrics.bind(this);
  }

  /**
   * Initializes the NetworkManager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize network monitoring
      await this.initializeNetworkMonitoring();
      
      // Setup performance monitoring if enabled
      if (this.config.enablePerformanceMonitoring) {
        this.initializePerformanceMonitoring();
      }
      
      // Setup offline queue if enabled
      if (this.config.enableOfflineQueue) {
        await this.initializeOfflineQueue();
      }

      this.isInitialized = true;
      this.reactory.emit('networkManager.initialized', {
        config: this.config,
        networkStatus: this.networkStatus,
      });
    } catch (error) {
      this.reactory.emit('networkManager.initializationFailed', { error });
      throw error;
    }
  }

  /**
   * Executes a GraphQL query
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>,
    options?: {
      operationName?: string;
      context?: Record<string, any>;
      timeout?: number;
      cacheable?: boolean;
      retryOnFailure?: boolean;
    }
  ): Promise<GraphQLResponse<T>> {
    const requestId = this.generateRequestId();
    const request: GraphQLRequest = {
      query,
      variables,
      operationName: options?.operationName,
      context: options?.context,
    };

    const startTime = Date.now();
    this.startRequestMetrics(requestId, 'query', options?.operationName, startTime);

    try {
      // Check for cached response if deduplication is enabled
      if (this.config.enableRequestDeduplication && options?.cacheable !== false) {
        const cachedResponse = this.getCachedResponse<T>(request);
        if (cachedResponse) {
          this.completeRequestMetrics(requestId, startTime, true);
          this.reactory.emit('networkManager.cacheHit', { requestId, operationName: options?.operationName });
          return cachedResponse;
        }
      }

      // Check if request is already in progress (deduplication)
      const cacheKey = this.generateCacheKey(request);
      if (this.activeRequests.has(cacheKey)) {
        const existingRequest = this.activeRequests.get(cacheKey)!;
        this.reactory.emit('networkManager.requestDeduped', { requestId, cacheKey });
        return await existingRequest;
      }

      // Check network status and queue if offline
      if (!this.networkStatus.isOnline && this.config.enableOfflineQueue) {
        return await this.queueRequest(requestId, request, 'query');
      }

      // Check concurrent request limits
      if (this.concurrentRequestCount >= this.config.maxConcurrentRequests) {
        await this.waitForAvailableSlot();
      }

      // Execute the request
      const requestPromise = this.executeGraphQLRequest<T>(request, options);
      this.activeRequests.set(cacheKey, requestPromise);
      this.concurrentRequestCount++;

      const response = await requestPromise;

      // Cache the response if successful and cacheable
      if (response && !response.errors && this.config.enableRequestDeduplication && options?.cacheable !== false) {
        this.cacheResponse(request, response);
      }

      this.completeRequestMetrics(requestId, startTime, false);
      this.reactory.emit('networkManager.queryCompleted', { 
        requestId, 
        operationName: options?.operationName,
        hasErrors: !!response.errors,
      });

      return response;
    } catch (error) {
      this.handleRequestError(requestId, error, startTime);
      
      // Retry logic if enabled
      if (this.config.enableRetry && (options?.retryOnFailure !== false)) {
        return await this.retryRequest<T>(request, 'query', options, 0);
      }
      
      throw error;
    } finally {
      const cacheKey = this.generateCacheKey(request);
      this.activeRequests.delete(cacheKey);
      this.concurrentRequestCount = Math.max(0, this.concurrentRequestCount - 1);
    }
  }

  /**
   * Executes a GraphQL mutation
   */
  async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>,
    options?: {
      operationName?: string;
      context?: Record<string, any>;
      timeout?: number;
      optimisticResponse?: any;
      retryOnFailure?: boolean;
    }
  ): Promise<GraphQLResponse<T>> {
    const requestId = this.generateRequestId();
    const request: GraphQLMutation = {
      query: mutation,
      variables,
      operationName: options?.operationName,
      context: options?.context,
      optimisticResponse: options?.optimisticResponse,
    };

    const startTime = Date.now();
    this.startRequestMetrics(requestId, 'mutation', options?.operationName, startTime);

    try {
      // Check network status and queue if offline
      if (!this.networkStatus.isOnline && this.config.enableOfflineQueue) {
        return await this.queueRequest(requestId, request, 'mutation');
      }

      // Apply optimistic update if provided
      if (options?.optimisticResponse && this.config.enableOptimisticUpdates) {
        this.applyOptimisticUpdate(request, options.optimisticResponse);
      }

      // Check concurrent request limits
      if (this.concurrentRequestCount >= this.config.maxConcurrentRequests) {
        await this.waitForAvailableSlot();
      }

      this.concurrentRequestCount++;
      const response = await this.executeGraphQLRequest<T>(request, options);

      this.completeRequestMetrics(requestId, startTime, false);
      this.reactory.emit('networkManager.mutationCompleted', { 
        requestId, 
        operationName: options?.operationName,
        hasErrors: !!response.errors,
      });

      return response;
    } catch (error) {
      this.handleRequestError(requestId, error, startTime);
      
      // Retry logic if enabled
      if (this.config.enableRetry && (options?.retryOnFailure !== false)) {
        return await this.retryRequest<T>(request, 'mutation', options, 0);
      }
      
      throw error;
    } finally {
      this.concurrentRequestCount = Math.max(0, this.concurrentRequestCount - 1);
    }
  }

  /**
   * Subscribes to GraphQL subscription (stubbed for React Native)
   */
  async subscribe(
    subscription: string,
    variables?: Record<string, any>,
    options?: {
      operationName?: string;
      context?: Record<string, any>;
    }
  ): Promise<{ unsubscribe: () => void; observable: any }> {
    // Stubbed implementation - would integrate with subscription client
    const requestId = this.generateRequestId();
    
    this.reactory.emit('networkManager.subscriptionStarted', { 
      requestId, 
      operationName: options?.operationName,
    });

    // Mock subscription implementation
    const unsubscribe = () => {
      this.reactory.emit('networkManager.subscriptionEnded', { requestId });
    };

    const observable = {
      subscribe: (_observer: any) => {
        // Mock subscription logic would go here
        return { unsubscribe };
      },
    };

    return { unsubscribe, observable };
  }

  /**
   * Sets the Apollo Client for real GraphQL operations
   * Call this method to enable real server connections instead of mocks
   */
  setApolloClient(client: ApolloClient<NormalizedCacheObject>): void {
    this.apolloClient = client;
    this.useMockClient = false;
    this.reactory.emit('networkManager.apolloClientConfigured', { 
      clientName: (client as any).clientId || 'default',
    });
  }

  /**
   * Gets the Apollo Client instance
   */
  getApolloClient(): ApolloClient<NormalizedCacheObject> | undefined {
    return this.apolloClient;
  }

  /**
   * Checks if the manager is using real Apollo Client
   */
  isUsingRealClient(): boolean {
    return !this.useMockClient && !!this.apolloClient;
  }

  /**
   * Gets current network status
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Updates network status (primarily for testing)
   */
  updateNetworkStatus(status: Partial<NetworkStatus>): void {
    const oldStatus = { ...this.networkStatus };
    this.networkStatus = { ...this.networkStatus, ...status };
    
    // Notify listeners of status change
    this.networkChangeListeners.forEach(listener => {
      listener(this.networkStatus);
    });
    
    this.reactory.emit('networkManager.statusChanged', {
      oldStatus,
      newStatus: this.networkStatus,
    });
  }

  /**
   * Adds a network status change listener
   */
  onNetworkStatusChange(listener: (status: NetworkStatus) => void): () => void {
    this.networkChangeListeners.add(listener);
    return () => this.networkChangeListeners.delete(listener);
  }

  /**
   * Retries failed queued requests
   */
  async retryFailedRequests(): Promise<void> {
    if (!this.networkStatus.isOnline) {
      throw new Error('Cannot retry requests while offline');
    }

    const queuedRequests = Array.from(this.requestQueue.values());
    this.reactory.emit('networkManager.retryingFailedRequests', { 
      queueSize: queuedRequests.length,
    });

    for (const queuedRequest of queuedRequests) {
      try {
        const response = await this.executeGraphQLRequest(queuedRequest.request);
        queuedRequest.resolve(response);
        this.requestQueue.delete(queuedRequest.id);
      } catch (error) {
        queuedRequest.retryCount++;
        if (queuedRequest.retryCount >= this.config.maxRetries) {
          queuedRequest.reject(error);
          this.requestQueue.delete(queuedRequest.id);
        }
      }
    }
  }

  /**
   * Clears the request cache
   */
  clearRequestCache(operationName?: string): void {
    if (operationName) {
      const keysToDelete = Array.from(this.requestCache.keys()).filter(key =>
        key.includes(`"operationName":"${operationName}"`)
      );
      keysToDelete.forEach(key => this.requestCache.delete(key));
    } else {
      this.requestCache.clear();
    }

    this.reactory.emit('networkManager.cacheCleared', { operationName });
  }

  /**
   * Gets performance metrics
   */
  getPerformanceMetrics(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    activeRequests: number;
    queuedRequests: number;
    metrics: RequestMetrics[];
  } {
    const totalRequests = this.requestMetrics.length;
    const completedRequests = this.requestMetrics.filter(m => m.duration !== undefined);
    const errorCount = this.requestMetrics.filter(m => m.error).length;
    const cacheHits = this.requestMetrics.filter(m => m.cacheHit).length;

    const averageResponseTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, m) => sum + (m.duration || 0), 0) / completedRequests.length
      : 0;

    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
    const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      cacheHitRate,
      activeRequests: this.concurrentRequestCount,
      queuedRequests: this.requestQueue.size,
      metrics: [...this.requestMetrics],
    };
  }

  /**
   * Destroys the NetworkManager and cleans up resources
   */
  async destroy(): Promise<void> {
    // Cancel all active requests
    this.activeRequests.clear();
    
    // Clear queued requests
    for (const queuedRequest of this.requestQueue.values()) {
      queuedRequest.reject(new Error('NetworkManager destroyed'));
    }
    this.requestQueue.clear();
    
    // Clear cache
    this.requestCache.clear();
    
    // Clear listeners
    this.networkChangeListeners.clear();
    
    // Stop performance monitoring
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    // Clear metrics
    this.requestMetrics = [];
    
    this.isInitialized = false;
    this.reactory.emit('networkManager.destroyed');
  }

  // Private helper methods

  private mergeConfig(config?: Partial<NetworkManagerConfig>): Required<NetworkManagerConfig> {
    return {
      enableRetry: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      exponentialBackoff: true,
      timeout: 30000,
      enableOfflineQueue: true,
      enableOptimisticUpdates: true,
      enableRequestDeduplication: true,
      maxConcurrentRequests: 5,
      enablePerformanceMonitoring: true,
      headers: {},
      endpoints: {
        graphql: '/graphql',
        subscription: '/graphql',
        upload: '/upload',
      },
      ...config,
    };
  }

  private async initializeNetworkMonitoring(): Promise<void> {
    // Stubbed implementation - would integrate with NetInfo or similar
    // For now, assume online status
    this.networkStatus = {
      isOnline: true,
      connectionType: 'wifi',
      isExpensive: false,
      effectiveType: '4g',
      lastConnectedAt: new Date(),
    };

    // Mock network status changes for testing
    // Allow manual network status changes in tests if needed
  }

  private initializePerformanceMonitoring(): void {
    // Stubbed implementation - would integrate with React Native performance APIs
    this.performanceObserver = {
      disconnect: () => {},
    };
  }

  private async initializeOfflineQueue(): Promise<void> {
    // Stubbed implementation - would restore queued requests from persistent storage
    this.reactory.emit('networkManager.offlineQueueInitialized');
  }

  private generateRequestId(): string {
    return `req_${++this.requestIdCounter}_${Date.now()}`;
  }

  private generateCacheKey(request: GraphQLRequest): string {
    return JSON.stringify({
      query: request.query.replace(/\s+/g, ' ').trim(),
      variables: request.variables,
      operationName: request.operationName,
    });
  }

  private getCachedResponse<T>(request: GraphQLRequest): GraphQLResponse<T> | null {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.requestCache.get(cacheKey);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.requestCache.delete(cacheKey);
      return null;
    }
    
    return cached.response;
  }

  private cacheResponse<T>(request: GraphQLRequest, response: GraphQLResponse<T>): void {
    const cacheKey = this.generateCacheKey(request);
    const entry: CacheEntry<T> = {
      key: cacheKey,
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minutes cache
    };
    
    this.requestCache.set(cacheKey, entry);
    
    // Simple LRU: remove oldest if cache is too large
    if (this.requestCache.size > 100) {
      const oldestKey = this.requestCache.keys().next().value;
      if (oldestKey) {
        this.requestCache.delete(oldestKey);
      }
    }
  }

  private async executeGraphQLRequest<T>(
    request: GraphQLRequest | GraphQLMutation,
    options?: {
      timeout?: number;
      context?: Record<string, any>;
    }
  ): Promise<GraphQLResponse<T>> {
    // Use real Apollo Client if configured
    if (this.apolloClient && !this.useMockClient) {
      return await this.executeWithApolloClient<T>(request, options);
    }
    
    // Fallback to mock implementation for testing
    return await this.executeMockRequest<T>(request);
  }

  /**
   * Executes a GraphQL request using Apollo Client
   */
  private async executeWithApolloClient<T>(
    request: GraphQLRequest | GraphQLMutation,
    options?: {
      timeout?: number;
      context?: Record<string, any>;
    }
  ): Promise<GraphQLResponse<T>> {
    if (!this.apolloClient) {
      throw new Error('Apollo Client not configured');
    }

    const documentNode = this.parseGraphQLQuery(request.query);
    const isMutation = this.isMutation(request.query);

    try {
      if (isMutation) {
        const result = await this.apolloClient.mutate<T>({
          mutation: documentNode,
          variables: request.variables,
          context: {
            ...options?.context,
            ...request.context,
          },
        });

        return {
          data: result.data ?? undefined,
          errors: result.errors?.map(e => ({
            message: e.message,
            locations: e.locations ? [...e.locations] : undefined,
            path: e.path ? [...e.path] : undefined,
            extensions: e.extensions as Record<string, any> | undefined,
          })),
        };
      } else {
        const result = await this.apolloClient.query<T>({
          query: documentNode,
          variables: request.variables,
          context: {
            ...options?.context,
            ...request.context,
          },
          fetchPolicy: 'network-only', // Always fetch fresh data
        });

        return {
          data: result.data,
          errors: result.errors?.map(e => ({
            message: e.message,
            locations: e.locations ? [...e.locations] : undefined,
            path: e.path ? [...e.path] : undefined,
            extensions: e.extensions as Record<string, any> | undefined,
          })),
        };
      }
    } catch (error: any) {
      // Convert Apollo errors to our format
      const graphQLError = {
        message: error.message || 'Unknown error',
        extensions: error.extensions,
      };

      return {
        errors: [graphQLError],
      };
    }
  }

  /**
   * Parses a GraphQL query string into a DocumentNode
   */
  private parseGraphQLQuery(query: string): DocumentNode {
    try {
      return gql`${query}`;
    } catch (error) {
      throw new Error(`Failed to parse GraphQL query: ${error}`);
    }
  }

  /**
   * Determines if a query string is a mutation
   */
  private isMutation(query: string): boolean {
    const trimmed = query.trim().toLowerCase();
    return trimmed.startsWith('mutation');
  }

  /**
   * Executes a mock request for testing purposes
   */
  private async executeMockRequest<T>(
    request: GraphQLRequest | GraphQLMutation
  ): Promise<GraphQLResponse<T>> {
    // Simulate network delay
    await this.delay(Math.random() * 100 + 50);
    
    // Mock successful response
    const mockResponse: GraphQLResponse<T> = {
      data: {
        // Mock data based on operation
        result: 'success',
        id: 'mock-id',
        ...((request as any).variables || {}),
      } as T,
    };
    
    return mockResponse;
  }

  private async queueRequest<T>(
    requestId: string,
    request: GraphQLRequest | GraphQLMutation,
    type: 'query' | 'mutation'
  ): Promise<GraphQLResponse<T>> {
    return new Promise<GraphQLResponse<T>>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestId,
        request,
        type,
        timestamp: Date.now(),
        retryCount: 0,
        resolve,
        reject,
      };
      
      this.requestQueue.set(requestId, queuedRequest);
      this.reactory.emit('networkManager.requestQueued', { requestId, type });
    });
  }

  private async retryRequest<T>(
    request: GraphQLRequest | GraphQLMutation,
    type: 'query' | 'mutation',
    options?: any,
    retryCount: number = 0
  ): Promise<GraphQLResponse<T>> {
    if (retryCount >= this.config.maxRetries) {
      throw new Error(`Request failed after ${this.config.maxRetries} retries`);
    }

    const delay = this.config.exponentialBackoff 
      ? this.config.retryDelayMs * Math.pow(2, retryCount)
      : this.config.retryDelayMs;
    
    await this.delay(delay);
    
    try {
      return await this.executeGraphQLRequest<T>(request, options);
    } catch (retryError) {
      if (retryCount + 1 < this.config.maxRetries) {
        return await this.retryRequest<T>(request, type, options, retryCount + 1);
      }
      throw retryError;
    }
  }

  private async waitForAvailableSlot(): Promise<void> {
    // Simple implementation - wait for a slot to become available
    while (this.concurrentRequestCount >= this.config.maxConcurrentRequests) {
      await this.delay(100);
    }
  }

  private applyOptimisticUpdate(request: GraphQLMutation, optimisticResponse: any): void {
    // Stubbed implementation - would update local cache optimistically
    this.reactory.emit('networkManager.optimisticUpdateApplied', {
      operationName: request.operationName,
      optimisticResponse,
    });
  }

  private startRequestMetrics(
    requestId: string,
    operationType: 'query' | 'mutation' | 'subscription',
    operationName?: string,
    startTime?: number
  ): void {
    if (!this.config.enablePerformanceMonitoring) return;
    
    const metrics: RequestMetrics = {
      requestId,
      operationType,
      operationName,
      startTime: startTime || Date.now(),
    };
    
    this.requestMetrics.push(metrics);
  }

  private completeRequestMetrics(requestId: string, startTime: number, cacheHit: boolean): void {
    if (!this.config.enablePerformanceMonitoring) return;
    
    const metrics = this.requestMetrics.find(m => m.requestId === requestId);
    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - startTime;
      metrics.cacheHit = cacheHit;
    }
  }

  private handleRequestError(requestId: string, error: any, startTime: number): void {
    if (this.config.enablePerformanceMonitoring) {
      const metrics = this.requestMetrics.find(m => m.requestId === requestId);
      if (metrics) {
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - startTime;
        metrics.error = error.message || 'Unknown error';
      }
    }
    
    this.reactory.emit('networkManager.requestError', { requestId, error });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
