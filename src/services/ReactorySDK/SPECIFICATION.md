# ReactorySDK Specification

**Version**: 1.0.0  
**Created**: August 17, 2025  
**Last Updated**: August 17, 2025  
**Status**: Draft  

## 📋 Overview

The ReactorySDK is the core service class that provides the main interface between the React Native application and the Reactory backend services. It serves as the central orchestrator for authentication, component management, form schemas, GraphQL operations, and real-time updates.

This specification defines the public API, internal architecture, and behavioral requirements for the ReactorySDK class, ensuring compatibility with the existing PWA client patterns while optimizing for mobile development.

---

## 🎯 Design Goals

### Primary Goals
1. **API Compatibility**: Maintain similar interface to PWA ReactoryApi class
2. **Event-Driven Architecture**: Enable decoupled communication via EventEmitter
3. **Mobile Optimization**: Optimize for React Native performance and constraints
4. **Type Safety**: Comprehensive TypeScript definitions for all APIs
5. **Extensibility**: Support for plugins and custom component registration

### Secondary Goals
1. **Offline Support**: Basic offline capability with sync when online
2. **Performance**: Lazy loading and efficient resource management
3. **Security**: Secure token management and API communication
4. **Developer Experience**: Clear API with excellent debugging capabilities

---

## 🏗️ Architecture Overview

### Class Hierarchy
```typescript
EventEmitter
  └── ReactorySDK
      ├── AuthenticationManager
      ├── ComponentRegistry  
      ├── FormSchemaManager
      ├── ThemeManager
      ├── ConfigurationManager
      └── NetworkManager
```

### Core Responsibilities
1. **Initialization**: Configure and initialize all subsystems
2. **Authentication**: Manage user login, logout, and token lifecycle
3. **Component Management**: Register and resolve React components dynamically
4. **Form Processing**: Handle server-driven form schemas and rendering
5. **Event Coordination**: Emit and handle application-wide events
6. **Configuration**: Manage multi-client configurations and settings
7. **Network Management**: Handle GraphQL operations and real-time updates

---

## 📡 Public API Specification

### Constructor and Initialization

#### `constructor(config: ReactorySDKConfig)`
Initializes the SDK with configuration parameters.

**Parameters**:
```typescript
interface ReactorySDKConfig {
  apiEndpoint: string;           // GraphQL API endpoint
  clientKey: string;             // Client identifier for multi-tenant support
  authToken?: string;            // Optional initial authentication token
  theme?: string;                // Theme identifier
  debug?: boolean;               // Enable debug logging
  offline?: boolean;             // Enable offline mode
  plugins?: PluginConfig[];      // Plugin configurations
}
```

**Behavior**:
- Must not perform async operations
- Must initialize all internal managers
- Must set up event listeners
- Must validate required configuration parameters

#### `async initialize(): Promise<void>`
Performs async initialization of all subsystems.

**Behavior**:
- Load and validate configuration from storage
- Initialize Apollo Client with authentication
- Load component registry
- Establish WebSocket connections if available
- Emit `initialized` event when complete
- Throw `ReactorySDKError` if initialization fails

**Events Emitted**:
- `initializing` - Before initialization starts
- `initialized` - After successful initialization
- `initialization_failed` - If initialization fails

### Authentication Management

#### `async authenticate(credentials: AuthCredentials): Promise<User>`
Authenticates user and establishes session.

**Parameters**:
```typescript
interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Returns**: `Promise<User>` - Authenticated user object

**Behavior**:
- Validate credentials format
- Send authentication request to server
- Store authentication token securely
- Load user profile and permissions
- Initialize user-specific configuration
- Emit authentication events

**Events Emitted**:
- `authentication_started`
- `authentication_success`
- `authentication_failed`

#### `async logout(): Promise<void>`
Logs out current user and clears session.

**Behavior**:
- Clear authentication tokens
- Clear user-specific data
- Emit logout events
- Reset to unauthenticated state

**Events Emitted**:
- `logout_started`
- `logout_success`

#### `getUser(): User | null`
Returns current authenticated user or null.

#### `isAuthenticated(): boolean`
Returns authentication status.

### Component Management

#### `registerComponent(name: string, component: ComponentType, options?: ComponentOptions): void`
Registers a React component in the global registry.

**Parameters**:
```typescript
interface ComponentOptions {
  namespace?: string;           // Component namespace for organization
  version?: string;             // Component version
  dependencies?: string[];      // Required dependencies
  lazy?: boolean;              // Enable lazy loading
  metadata?: Record<string, any>; // Additional metadata
}
```

**Behavior**:
- Validate component name uniqueness
- Store component reference with metadata
- Emit component registration events

#### `getComponent(name: string): ComponentType | null`
Retrieves a registered component by name.

**Behavior**:
- Return component if found
- Handle lazy loading if configured
- Return null if not found
- Log warnings for missing components

#### `getComponents<T>(names: string[]): T`
Retrieves multiple components with type safety.

**Behavior**:
- Return object with requested components
- Handle missing components gracefully
- Provide TypeScript type inference

### Form Schema Management

#### `async loadFormSchema(formId: string): Promise<FormSchema>`
Loads form schema from server.

**Parameters**:
- `formId: string` - Unique form identifier

**Returns**: `Promise<FormSchema>` - Complete form schema definition

**Behavior**:
- Check cache for existing schema
- Fetch from server if not cached
- Validate schema structure
- Cache for future use
- Emit schema events

#### `getFormSchemas(): FormSchema[]`
Returns all cached form schemas.

#### `async submitForm(formId: string, data: FormData): Promise<SubmissionResult>`
Submits form data to server.

**Parameters**:
```typescript
interface FormData {
  [fieldName: string]: any;
}

interface SubmissionResult {
  success: boolean;
  data?: any;
  errors?: FormError[];
}
```

### Event Management

#### Event Names (Constants)
```typescript
export const ReactorySDKEvents = {
  // Lifecycle events
  INITIALIZING: 'initializing',
  INITIALIZED: 'initialized',
  INITIALIZATION_FAILED: 'initialization_failed',
  
  // Authentication events
  AUTHENTICATION_STARTED: 'authentication_started',
  AUTHENTICATION_SUCCESS: 'authentication_success',
  AUTHENTICATION_FAILED: 'authentication_failed',
  LOGOUT_STARTED: 'logout_started',
  LOGOUT_SUCCESS: 'logout_success',
  
  // Component events
  COMPONENT_REGISTERED: 'component_registered',
  COMPONENT_LOADED: 'component_loaded',
  
  // Form events
  FORM_SCHEMA_LOADED: 'form_schema_loaded',
  FORM_SUBMISSION_STARTED: 'form_submission_started',
  FORM_SUBMISSION_SUCCESS: 'form_submission_success',
  FORM_SUBMISSION_FAILED: 'form_submission_failed',
  
  // Network events
  NETWORK_STATUS_CHANGED: 'network_status_changed',
  API_STATUS_UPDATED: 'api_status_updated',
  
  // Theme events
  THEME_CHANGED: 'theme_changed',
  
  // Navigation events
  ROUTE_CHANGED: 'route_changed',
  
  // Error events
  ERROR: 'error',
  WARNING: 'warning'
} as const;
```

#### Standard EventEmitter Methods
- `on(event: string, listener: Function): this`
- `off(event: string, listener: Function): this`
- `emit(event: string, ...args: any[]): boolean`
- `once(event: string, listener: Function): this`

### Configuration Management

#### `getConfig<T>(key: string): T | undefined`
Retrieves configuration value by key.

#### `setConfig(key: string, value: any): void`
Sets configuration value and persists to storage.

#### `async loadClientConfig(clientKey: string): Promise<ClientConfig>`
Loads client-specific configuration.

### Network and API Management

#### `getApolloClient(): ApolloClient<any>`
Returns configured Apollo Client instance.

#### `async query<T>(query: DocumentNode, variables?: any): Promise<T>`
Executes GraphQL query with authentication.

#### `async mutate<T>(mutation: DocumentNode, variables?: any): Promise<T>`
Executes GraphQL mutation with authentication.

#### `getNetworkStatus(): NetworkStatus`
Returns current network connectivity status.

### Utility Methods

#### `log(message: string, level?: LogLevel, data?: any): void`
Logs message with appropriate level and context.

#### `isInitialized(): boolean`
Returns initialization status.

#### `getVersion(): string`
Returns SDK version information.

#### `async destroy(): Promise<void>`
Cleanup method for proper disposal.

---

## 🔧 Internal Architecture

### Internal Managers

#### AuthenticationManager
```typescript
interface AuthenticationManager {
  authenticate(credentials: AuthCredentials): Promise<User>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;
  getStoredToken(): Promise<string | null>;
  storeToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
}
```

#### ComponentRegistry
```typescript
interface ComponentRegistry {
  register(name: string, component: ComponentType, options?: ComponentOptions): void;
  get(name: string): ComponentType | null;
  getAll(): Map<string, ComponentType>;
  has(name: string): boolean;
  clear(): void;
}
```

#### FormSchemaManager
```typescript
interface FormSchemaManager {
  loadSchema(formId: string): Promise<FormSchema>;
  getCachedSchema(formId: string): FormSchema | null;
  cacheSchema(formId: string, schema: FormSchema): void;
  clearCache(): void;
  validateSchema(schema: FormSchema): boolean;
}
```

#### ConfigurationManager
```typescript
interface ConfigurationManager {
  load(clientKey: string): Promise<ClientConfig>;
  get<T>(key: string): T | undefined;
  set(key: string, value: any): void;
  persist(): Promise<void>;
  clear(): Promise<void>;
}
```

---

## 📊 Type Definitions

### Core Types

```typescript
// Main SDK configuration
interface ReactorySDKConfig {
  apiEndpoint: string;
  clientKey: string;
  authToken?: string;
  theme?: string;
  debug?: boolean;
  offline?: boolean;
  plugins?: PluginConfig[];
}

// User and authentication
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
  preferences?: UserPreferences;
}

interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Component registration
interface ComponentOptions {
  namespace?: string;
  version?: string;
  dependencies?: string[];
  lazy?: boolean;
  metadata?: Record<string, any>;
}

// Form schemas
interface FormSchema {
  id: string;
  name: string;
  version: string;
  schema: JSONSchema;
  uiSchema?: UISchema;
  validationRules?: ValidationRule[];
  dependencies?: string[];
}

interface FormSubmission {
  formId: string;
  data: FormData;
  metadata?: SubmissionMetadata;
}

// Configuration
interface ClientConfig {
  clientKey: string;
  name: string;
  theme: ThemeConfig;
  features: FeatureFlags;
  api: ApiConfig;
  plugins: PluginConfig[];
}

// Network and status
interface NetworkStatus {
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'unknown';
  isInternetReachable: boolean;
}

interface ApiStatus {
  online: boolean;
  version: string;
  latency?: number;
  lastUpdated: Date;
}

// Error types
interface ReactorySDKError extends Error {
  code: string;
  context?: Record<string, any>;
  recoverable: boolean;
}
```

---

## 🧪 Behavioral Requirements

### Initialization Behavior
1. **Constructor must be synchronous** - No async operations
2. **initialize() must be idempotent** - Safe to call multiple times
3. **Must validate required config** - Throw on missing required fields
4. **Must handle initialization failures** - Emit events and provide recovery
5. **Must set up all internal managers** - Complete setup before ready

### Authentication Behavior
1. **Token persistence** - Store tokens securely with Keychain
2. **Automatic token refresh** - Handle expired tokens transparently
3. **Logout cleanup** - Clear all user-specific data
4. **Error handling** - Provide detailed error information
5. **Event emission** - Notify listeners of auth state changes

### Component Registry Behavior
1. **Name uniqueness** - Prevent duplicate component names
2. **Lazy loading support** - Load components on demand
3. **Dependency resolution** - Handle component dependencies
4. **Error resilience** - Handle missing components gracefully
5. **Type safety** - Provide TypeScript type inference

### Form Management Behavior
1. **Schema caching** - Cache schemas for performance
2. **Validation** - Validate schemas and form data
3. **Offline support** - Queue submissions when offline
4. **Error handling** - Provide validation and submission errors
5. **Progress tracking** - Emit events for long operations

### Event Management Behavior
1. **Standard EventEmitter** - Follow Node.js EventEmitter patterns
2. **Error isolation** - Handle listener errors gracefully
3. **Memory management** - Prevent memory leaks from listeners
4. **Debugging support** - Log events in debug mode
5. **Type safety** - Provide typed event interfaces

---

## 🔒 Security Requirements

### Authentication Security
1. **Secure token storage** - Use Keychain for sensitive data
2. **Token validation** - Validate tokens before use
3. **Automatic logout** - Handle security violations
4. **Session management** - Proper session lifecycle
5. **Credential encryption** - Never store plain passwords

### API Security
1. **Request authentication** - Include tokens in all requests
2. **SSL/TLS enforcement** - Require secure connections
3. **Input validation** - Validate all inputs before sending
4. **Error sanitization** - Don't expose sensitive information
5. **Rate limiting** - Handle API rate limits gracefully

---

## 🚀 Performance Requirements

### Initialization Performance
- **Cold start**: <2 seconds for basic initialization
- **Warm start**: <500ms for subsequent initializations
- **Memory usage**: <50MB for base SDK without components

### Runtime Performance
- **Component resolution**: <10ms for cached components
- **Form schema loading**: <1 second including network
- **Event emission**: <1ms for local events
- **Authentication**: <3 seconds including network

### Memory Management
- **No memory leaks** - Proper cleanup of listeners and references
- **Efficient caching** - LRU cache for schemas and components
- **Garbage collection** - Allow objects to be collected when unused

---

## 🧪 Error Handling

### Error Categories
```typescript
enum ReactorySDKErrorCode {
  // Initialization errors
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CONFIGURATION_INVALID = 'CONFIGURATION_INVALID',
  
  // Authentication errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Component errors
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  COMPONENT_REGISTRATION_FAILED = 'COMPONENT_REGISTRATION_FAILED',
  
  // Form errors
  FORM_SCHEMA_NOT_FOUND = 'FORM_SCHEMA_NOT_FOUND',
  FORM_VALIDATION_FAILED = 'FORM_VALIDATION_FAILED',
  FORM_SUBMISSION_FAILED = 'FORM_SUBMISSION_FAILED',
  
  // Network errors
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  REQUEST_FAILED = 'REQUEST_FAILED',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### Error Recovery
1. **Graceful degradation** - Continue operating with reduced functionality
2. **Automatic retry** - Retry failed operations with backoff
3. **User notification** - Inform users of recoverable errors
4. **Logging** - Log all errors with context for debugging
5. **Fallback behavior** - Provide sensible defaults when possible

---

## 📝 Implementation Notes

### Dependencies
- **EventEmitter**: Use React Native compatible EventEmitter
- **AsyncStorage**: For configuration and cache persistence
- **Keychain**: For secure token storage
- **NetInfo**: For network status monitoring
- **Apollo Client**: For GraphQL operations

### Testing Strategy
- **Unit tests**: Test all public methods and error conditions
- **Integration tests**: Test manager interactions and workflows
- **Mock implementations**: Provide mocks for external dependencies
- **Performance tests**: Verify performance requirements
- **E2E tests**: Test complete initialization and auth flows

### Documentation Requirements
- **API documentation**: Complete JSDoc for all public methods
- **Usage examples**: Practical examples for common scenarios
- **Migration guide**: For teams moving from PWA client
- **Troubleshooting**: Common issues and solutions

---

## 🔄 Compatibility

### PWA Client Compatibility
- **Event names**: Use same event names as PWA ReactoryApi
- **Method signatures**: Similar signatures where possible
- **Behavioral patterns**: Maintain familiar patterns
- **Configuration**: Compatible configuration structure

### React Native Compatibility
- **Platform support**: iOS and Android
- **Performance**: Optimized for mobile constraints
- **Native integration**: Support for native features
- **Development experience**: Excellent debugging and hot reload

---

**Document Owner**: Development Team  
**Review Schedule**: Weekly during implementation  
**Next Review**: August 24, 2025
