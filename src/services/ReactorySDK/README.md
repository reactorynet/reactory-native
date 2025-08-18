# ReactorySDK

The ReactorySDK is the core service class that provides the main interface between the React Native application and the Reactory backend services. It serves as the central orchestrator for authentication, component management, form schemas, GraphQL operations, and real-time updates.

## 📁 Project Structure

```
src/services/ReactorySDK/
├── README.md                 # This file
├── CLONING_SUMMARY           # Complete summary of the cloning process from PWA ReactoryAPI
├── SPECIFICATION.md          # Complete SDK specification
├── TDD_PLAN.md              # Test-Driven Development plan
├── types.ts                 # TypeScript type definitions
├── ReactorySDK.ts           # Main SDK implementation (to be created)
├── managers/                # Internal manager implementations
│   ├── AuthenticationManager.ts
│   ├── ComponentRegistry.ts
│   ├── ConfigurationManager.ts
│   ├── FormSchemaManager.ts
│   └── NetworkManager.ts
├── __tests__/               # Test files
│   ├── ReactorySDK.test.ts
│   ├── managers/
│   ├── mocks/
│   └── utils/
└── utils/                   # Utility functions
    ├── errors.ts
    ├── events.ts
    └── validation.ts
```

## 🎯 Quick Start

### Basic Usage
```typescript
import { ReactorySDK } from './services/ReactorySDK';

// Initialize SDK
const sdk = new ReactorySDK({
  apiEndpoint: 'https://api.reactory.app/graphql',
  clientKey: 'my-client',
  debug: true
});

// Initialize async components
await sdk.initialize();

// Authenticate user
const user = await sdk.authenticate({
  email: 'user@example.com',
  password: 'password'
});

// Register component
sdk.registerComponent('MyComponent', MyComponent);

// Get component
const Component = sdk.getComponent('MyComponent');
```

### React Integration
```typescript
import { ReactoryProvider, useReactory } from './providers/ReactoryProvider';

// Provider setup in App.tsx
function App() {
  return (
    <ReactoryProvider config={sdkConfig}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ReactoryProvider>
  );
}

// Using in components
function MyComponent() {
  const sdk = useReactory();
  const user = sdk.getUser();
  
  return (
    <View>
      <Text>Welcome {user?.firstName}</Text>
    </View>
  );
}
```

## 🏗️ Architecture Overview

The ReactorySDK follows a modular architecture with specialized managers:

### Core Components
- **ReactorySDK**: Main class extending EventEmitter
- **AuthenticationManager**: User authentication and token management
- **ComponentRegistry**: Dynamic component registration and resolution
- **FormSchemaManager**: Server-driven form schemas and submission
- **ConfigurationManager**: Multi-client configuration management
- **NetworkManager**: GraphQL operations and connectivity monitoring

### Event-Driven Communication
The SDK uses an EventEmitter pattern for decoupled communication:

```typescript
// Listen for authentication events
sdk.on('authentication_success', (user) => {
  console.log('User logged in:', user);
});

// Listen for form submission events
sdk.on('form_submission_success', (result) => {
  console.log('Form submitted:', result);
});
```

## 📝 Implementation Status

### Current Phase: Foundation & Core Services (Task 1.1.1)

#### ✅ Completed
- [x] Project structure setup
- [x] Comprehensive specification document
- [x] Test-Driven Development plan
- [x] Complete TypeScript type definitions

#### 🔄 In Progress
- [ ] ReactorySDK base class implementation
- [ ] Basic EventEmitter setup
- [ ] Configuration validation
- [ ] Manager initialization

#### ⏳ Next Steps
1. Implement constructor and basic setup (Tests 1.1.1 - 1.1.4)
2. Add configuration validation (Tests 1.2.1 - 1.2.2)
3. Implement initialization lifecycle (Tests 1.3.1 - 1.3.4)
4. Set up event management (Tests 1.4.1 - 1.4.2)

## 🧪 Testing Strategy

We're following Test-Driven Development (TDD) approach:

### Test Structure
```
__tests__/
├── ReactorySDK.test.ts           # Main SDK tests
├── managers/                     # Manager-specific tests
├── mocks/                        # Mock implementations
└── utils/                        # Test utilities
```

### Running Tests
```bash
# Run all SDK tests
yarn test --testPathPattern=ReactorySDK

# Run specific test file
yarn test ReactorySDK.test.ts

# Run tests in watch mode
yarn test:watch --testPathPattern=ReactorySDK

# Generate coverage report
yarn test:coverage --testPathPattern=ReactorySDK
```

### Test Coverage Goals
- **Statements**: 95% (Target) / 85% (Minimum)
- **Branches**: 90% (Target) / 85% (Minimum)
- **Functions**: 100% (Target) / 85% (Minimum)
- **Lines**: 95% (Target) / 85% (Minimum)

**Important**: A minimum test coverage of 85% is required for all metrics before proceeding to the next development phase.

## 🔧 Configuration

### SDK Configuration
```typescript
interface ReactorySDKConfig {
  apiEndpoint: string;      // Required: GraphQL API endpoint
  clientKey: string;        // Required: Client identifier
  authToken?: string;       // Optional: Initial auth token
  theme?: string;           // Optional: Theme identifier
  debug?: boolean;          // Optional: Enable debug logging
  offline?: boolean;        // Optional: Enable offline mode
  plugins?: PluginConfig[]; // Optional: Plugin configurations
}
```

### Environment Variables
```bash
# API Configuration
REACTORY_API_ENDPOINT=https://api.reactory.app/graphql
REACTORY_CLIENT_KEY=my-client

# Debug Settings
REACTORY_DEBUG=true
REACTORY_LOG_LEVEL=debug

# Feature Flags
REACTORY_OFFLINE_ENABLED=true
REACTORY_PLUGINS_ENABLED=true
```

## 🔗 API Reference

### Main SDK Methods

#### Constructor & Initialization
- `constructor(config: ReactorySDKConfig)` - Initialize SDK with configuration
- `async initialize(): Promise<void>` - Perform async initialization
- `isInitialized(): boolean` - Check initialization status
- `async destroy(): Promise<void>` - Cleanup resources

#### Authentication
- `async authenticate(credentials: AuthCredentials): Promise<User>` - Authenticate user
- `async logout(): Promise<void>` - Logout current user
- `getUser(): User | null` - Get current user
- `isAuthenticated(): boolean` - Check authentication status

#### Component Management
- `registerComponent(name, component, options?)` - Register component
- `getComponent(name): ComponentType | null` - Get component by name
- `getComponents<T>(names): T` - Get multiple components with type safety

#### Form Management
- `async loadFormSchema(formId): Promise<FormSchema>` - Load form schema
- `getFormSchemas(): FormSchema[]` - Get all cached schemas
- `async submitForm(formId, data): Promise<SubmissionResult>` - Submit form

#### Configuration
- `getConfig<T>(key): T | undefined` - Get configuration value
- `setConfig(key, value)` - Set configuration value
- `async loadClientConfig(clientKey): Promise<ClientConfig>` - Load client config

#### Network & API
- `getApolloClient(): ApolloClient` - Get Apollo Client instance
- `async query<T>(query, variables?): Promise<T>` - Execute GraphQL query
- `async mutate<T>(mutation, variables?): Promise<T>` - Execute GraphQL mutation
- `getNetworkStatus(): NetworkStatus` - Get network status

### Event System

#### Event Names
All event names are available in `ReactorySDKEvents` constant:
- Lifecycle: `initializing`, `initialized`, `initialization_failed`
- Authentication: `authentication_success`, `authentication_failed`, `logout_success`
- Components: `component_registered`, `component_loaded`
- Forms: `form_schema_loaded`, `form_submission_success`, `form_submission_failed`
- Network: `network_status_changed`, `api_status_updated`
- Errors: `error`, `warning`

#### Event Methods
- `on(event, listener)` - Add event listener
- `off(event, listener)` - Remove event listener
- `once(event, listener)` - Add one-time event listener
- `emit(event, ...args)` - Emit event

## 🔒 Security

### Token Management
- Secure token storage using Keychain
- Automatic token refresh
- Token validation before API requests

### API Security
- SSL/TLS enforcement
- Request authentication headers
- Input validation and sanitization

### Error Handling
- No sensitive data in error messages
- Secure error logging
- Graceful failure handling

## 🚀 Performance

### Initialization Performance
- Cold start: <2 seconds
- Warm start: <500ms
- Memory usage: <50MB base

### Runtime Performance
- Component resolution: <10ms
- Form schema loading: <1 second
- Event emission: <1ms

### Optimization Features
- Lazy component loading
- Efficient schema caching
- Connection pooling
- Automatic retry with backoff

## 🐛 Troubleshooting

### Common Issues

#### Initialization Failures
```typescript
// Check configuration
console.log('SDK Config:', sdk.getConfig());

// Listen for initialization events
sdk.on('initialization_failed', (error) => {
  console.error('Init failed:', error);
});
```

#### Authentication Issues
```typescript
// Check token storage
const token = await sdk.getStoredToken();
console.log('Stored token:', token ? 'Present' : 'Missing');

// Listen for auth events
sdk.on('authentication_failed', (error) => {
  console.error('Auth failed:', error);
});
```

#### Component Resolution Issues
```typescript
// List all registered components
const registry = sdk.getComponentRegistry();
console.log('Registered components:', registry.getAll());

// Check component existence
if (!sdk.getComponent('MyComponent')) {
  console.warn('Component not found: MyComponent');
}
```

### Debug Mode
Enable debug mode for detailed logging:
```typescript
const sdk = new ReactorySDK({
  ...config,
  debug: true
});

// Set log level
sdk.setLogLevel('debug');
```

## 📚 Related Documentation

- [**SPECIFICATION.md**](./SPECIFICATION.md) - Complete SDK specification
- [**TDD_PLAN.md**](./TDD_PLAN.md) - Test-Driven Development plan
- [**types.ts**](./types.ts) - TypeScript type definitions

## 🤝 Contributing

### Development Workflow
1. Review specification and TDD plan
2. Write failing tests first (Red)
3. Implement minimal code to pass tests (Green)
4. Refactor and optimize (Refactor)
5. Update documentation

### Code Standards
- Follow TypeScript strict mode
- Use ESLint and Prettier
- Maintain test coverage >90%
- Document all public APIs with JSDoc

### Pull Request Checklist
- [ ] Tests written and passing
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No lint errors
- [ ] Performance impact considered

---

**Status**: Foundation Phase - Task 1.1.1  
**Next**: Implement ReactorySDK base class with TDD approach  
**Last Updated**: August 17, 2025
