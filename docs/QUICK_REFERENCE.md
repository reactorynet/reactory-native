# Reactory React Native - Quick Reference Guide

**Last Updated**: August 17, 2025  
**Quick Access**: Essential information for daily development  

## 🚀 Quick Start Commands

```bash
# Start development
yarn start                    # Start Metro bundler
yarn android                  # Run on Android
yarn ios                     # Run on iOS (macOS only)

# Testing
yarn test                     # Run all tests
yarn test:watch              # Run tests in watch mode
yarn test:coverage           # Generate coverage report

# Code Quality
yarn lint                     # Check for lint errors
yarn lint:fix                # Fix auto-fixable lint errors
yarn type-check              # TypeScript type checking

# Documentation
code PROGRESS_TRACKER.md      # Update daily progress
code IMPLEMENTATION_PLAN.md   # View project plan
code TECHNICAL_DECISIONS.md   # Log architecture decisions
```

---

## 📁 Key Files & Locations

### 📋 Planning Documents
- **`IMPLEMENTATION_PLAN.md`** - Master project plan and phases
- **`PROGRESS_TRACKER.md`** - Daily progress and status updates
- **`TECHNICAL_DECISIONS.md`** - Architecture decision records
- **`DEVELOPMENT_WORKFLOW.md`** - Development process and standards

### 🏗️ Core Implementation Files
- **`src/services/ReactorySDK/`** - Main SDK implementation
- **`src/providers/ReactoryProvider.tsx`** - App-wide provider setup
- **`src/components/forms/`** - Form engine components
- **`src/components/registry/`** - Component registration system
- **`src/config/`** - Client configuration management

### 🧪 Testing Files
- **`__tests__/`** - Test files alongside source code
- **`jest.config.js`** - Jest configuration
- **`__mocks__/`** - Mock implementations

---

## 📊 Current Status (August 17, 2025)

### Overall Progress: 15% Complete
- **Phase 1**: Foundation & Core Services (15% - In Progress)
- **Phase 2**: Component System & Form Engine (0% - Pending)
- **Phase 3**: Mobile-Specific Features (0% - Pending)  
- **Phase 4**: Advanced Features & Polish (0% - Pending)

### This Week's Goals
- [ ] Complete ReactorySDK base implementation
- [ ] Set up ReactoryProvider architecture
- [ ] Begin client configuration system
- [ ] Start authentication service

### Active Work
- 🔄 ReactorySDK base class design
- 🔄 PWA architecture analysis complete
- 🔄 Project planning and documentation

---

## 🎯 Priority Tasks (Next 5 Days)

### Monday, August 18
**Focus**: ReactorySDK Foundation
- [ ] Create ReactorySDK base class with EventEmitter
- [ ] Set up basic configuration interface
- [ ] Implement initialization method

### Tuesday, August 19  
**Focus**: Authentication Service
- [ ] Implement authentication management
- [ ] Add token storage with Keychain
- [ ] Create login/logout flows

### Wednesday, August 20
**Focus**: GraphQL Integration
- [ ] Integrate Apollo Client with SDK
- [ ] Set up authenticated requests
- [ ] Test GraphQL operations

### Thursday, August 21
**Focus**: Component Registry
- [ ] Create component registration system
- [ ] Register React Native Paper components
- [ ] Test component resolution

### Friday, August 22
**Focus**: Provider Setup
- [ ] Create ReactoryProvider component
- [ ] Add context hooks
- [ ] Integration testing and review

---

## 🏗️ Architecture Quick Reference

### Key Patterns from PWA
- **ReactoryApi Class**: Event-driven SDK for all app functionality
- **Component Proxy**: Dynamic component resolution and registration
- **Server-Driven UI**: Forms and routes defined by GraphQL schemas
- **Multi-Tenant**: Client-specific configurations and themes
- **HOC Pattern**: ReactoryHOC wraps app with SDK context

### React Native Adaptations
- **EventEmitter**: Same pattern, mobile-optimized event handling
- **AsyncStorage**: Replaces localStorage for configuration
- **React Navigation**: Replaces React Router for mobile navigation
- **React Native Paper**: Replaces Material-UI for mobile components
- **Component Registry**: Adapted for React Native module system

---

## 🔧 Development Environment

### Required Extensions (VS Code)
```
ms-vscode.vscode-typescript-next
esbenp.prettier-vscode
dbaeumer.vscode-eslint
ms-vscode.vscode-jest
bradlc.vscode-tailwindcss
```

### Environment Variables
```bash
# Development
REACT_NATIVE_PACKAGER_HOSTNAME=localhost
FLIPPER_DISABLE=1

# Client Configuration
REACTORY_CLIENT_KEY=reactory
REACTORY_API_ENDPOINT=http://localhost:4000/graphql
```

---

## 📝 Coding Cheatsheet

### TypeScript Patterns
```typescript
// Service interface
interface ReactorySDKConfig {
  apiEndpoint: string;
  clientKey: string;
  authToken?: string;
}

// Component props
interface ReactoryFormProps {
  formId?: string;
  formDef?: FormDefinition;
  mode?: 'view' | 'edit' | 'create';
}

// Hook return type
interface UseReactoryReturn {
  sdk: ReactorySDK;
  user: User | null;
  isAuthenticated: boolean;
}
```

### Component Patterns
```typescript
// Provider component
export const ReactoryProvider = ({ children }: PropsWithChildren) => {
  const [sdk] = useState(() => new ReactorySDK(config));
  return (
    <ReactoryContext.Provider value={sdk}>
      {children}
    </ReactoryContext.Provider>
  );
};

// Custom hook
export const useReactory = (): UseReactoryReturn => {
  const context = useContext(ReactoryContext);
  if (!context) {
    throw new Error('useReactory must be used within ReactoryProvider');
  }
  return context;
};
```

### Testing Patterns
```typescript
// Component test
describe('ReactoryForm', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ReactoryForm formId="test" />);
    expect(getByText('Submit')).toBeTruthy();
  });
});

// Service test
describe('ReactorySDK', () => {
  let sdk: ReactorySDK;
  beforeEach(() => {
    sdk = new ReactorySDK(mockConfig);
  });
});
```

---

## 🚨 Common Issues & Solutions

### Build Issues
```bash
# Clear cache
yarn start --reset-cache
npx react-native clean-project-auto

# iOS build issues
cd ios && pod install && cd ..
yarn ios --simulator="iPhone 14"

# Android build issues
cd android && ./gradlew clean && cd ..
yarn android
```

### TypeScript Errors
```bash
# Check types
yarn type-check

# Clear TypeScript cache
rm -rf node_modules/.cache
yarn install
```

### Test Issues
```bash
# Clear Jest cache
yarn test --clearCache

# Run specific test
yarn test ComponentName
```

---

## 📚 Key Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Apollo Client](https://www.apollographql.com/docs/react/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

### PWA Client References
- PWA ReactoryApi class implementation
- PWA component registration patterns
- PWA form schema definitions
- PWA authentication flows

### Project Resources
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Progress Tracker](./PROGRESS_TRACKER.md)
- [Technical Decisions](./TECHNICAL_DECISIONS.md)
- [Development Workflow](./DEVELOPMENT_WORKFLOW.md)

---

## 🔄 Daily Workflow Checklist

### Start of Day
- [ ] Check PROGRESS_TRACKER.md for assigned tasks
- [ ] Pull latest changes from main branch
- [ ] Start Metro bundler (`yarn start`)
- [ ] Review implementation details for current task

### During Development
- [ ] Follow TypeScript and coding standards
- [ ] Write tests for new functionality
- [ ] Update progress tracker when completing tasks
- [ ] Document architectural decisions if needed

### End of Day
- [ ] Update PROGRESS_TRACKER.md with progress
- [ ] Commit work to feature branch
- [ ] Note any blockers or issues encountered
- [ ] Plan next day's priorities

---

## 📞 Getting Help

### Internal Resources
- **Implementation Plan**: Detailed task breakdown and timelines
- **Technical Decisions**: Architecture patterns and rationale
- **Progress Tracker**: Current status and blockers

### External Resources
- **React Native Discord**: Community support
- **Stack Overflow**: Technical questions
- **GitHub Issues**: Library-specific problems

### Escalation Path
1. Check documentation and resources
2. Search for similar issues online
3. Post question in team chat
4. Log blocker in progress tracker
5. Schedule discussion if needed

---

**Quick Access Links**:
- 📋 [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- 📊 [Progress Tracker](./PROGRESS_TRACKER.md)  
- 🏗️ [Technical Decisions](./TECHNICAL_DECISIONS.md)
- 🔄 [Development Workflow](./DEVELOPMENT_WORKFLOW.md)
