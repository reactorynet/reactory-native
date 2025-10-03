
# Copilot Instructions for Reactory Native Client

## Project Overview

The Reactory Native Client is a React Native application that serves as a native clone of the Reactory PWA Client with architectural improvements. This project leverages modern React Native patterns and technologies to provide a robust, scalable mobile application.

## Architecture Principles

### 🏗️ Core Architecture
- **Component-Based Architecture**: Modular, reusable components following React Native best practices
- **State Management**: Redux Toolkit for centralized state management
- **Navigation**: React Navigation v7 for type-safe navigation
- **Data Layer**: Apollo GraphQL client for efficient data fetching
- **UI Framework**: React Native Paper for Material Design components
- **Type Safety**: Full TypeScript implementation with strict typing

### 🔄 Architectural Improvements Over PWA
- **Native Performance**: Leverage native platform capabilities
- **Offline-First**: Implement robust offline functionality
- **Push Notifications**: Native push notification support
- **Deep Linking**: Platform-specific deep linking implementation
- **Biometric Authentication**: Native biometric integration
- **Background Processing**: Efficient background task handling

## Technology Stack

### Core Dependencies
- **React Native**: 0.81.0 (latest stable)
- **React**: 19.1.0
- **TypeScript**: 5.8.3
- **Redux Toolkit**: 2.8.2
- **React Navigation**: 7.x
- **Apollo Client**: 3.13.9
- **React Native Paper**: 5.14.5

### Development Tools
- **Metro**: React Native bundler
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Babel**: JavaScript compilation

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── store/              # Redux store and slices
├── services/           # API and external services
├── graphql/            # GraphQL queries and mutations
├── themes/             # UI themes and styling
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

## Development Guidelines

### 🎯 Component Development
- **Functional Components**: Use functional components with hooks
- **TypeScript**: Implement proper TypeScript interfaces for props and state
- **Performance**: Implement React.memo and useMemo for expensive operations
- **Accessibility**: Include proper accessibility props and labels
- **Testing**: Write unit tests for all components

### 📱 Screen Development
- **Navigation**: Use React Navigation hooks for navigation logic
- **State Management**: Connect screens to Redux store using hooks
- **Error Handling**: Implement proper error boundaries and user feedback
- **Loading States**: Show appropriate loading indicators
- **Offline Support**: Handle offline scenarios gracefully

### 🔄 State Management
- **Redux Toolkit**: Use RTK Query for API state management
- **Local State**: Use useState for component-specific state
- **Async Operations**: Handle async operations with proper loading states
- **Error States**: Implement comprehensive error handling
- **Optimistic Updates**: Provide immediate UI feedback

### 🌐 API Integration
- **GraphQL**: Use Apollo Client for GraphQL operations
- **Type Safety**: Generate TypeScript types from GraphQL schema
- **Caching**: Implement efficient Apollo Client caching
- **Error Handling**: Handle network errors and API failures
- **Offline Support**: Implement offline-first data strategies

## Code Quality Standards

### 📝 Code Style
- **ESLint**: Follow project ESLint configuration
- **Prettier**: Use Prettier for consistent formatting
- **TypeScript**: Enable strict TypeScript mode
- **Naming**: Use descriptive, consistent naming conventions
- **Comments**: Document complex logic and business rules

### 🧪 Testing Requirements
- **Unit Tests**: Test all components and utilities
- **Integration Tests**: Test navigation and state management
- **Mocking**: Mock external dependencies and APIs
- **Coverage**: Maintain high test coverage
- **Performance**: Test component rendering performance

### 🔒 Security Considerations
- **Input Validation**: Validate all user inputs
- **API Security**: Implement proper authentication and authorization
- **Data Encryption**: Encrypt sensitive data in storage
- **Network Security**: Use HTTPS for all API calls
- **Biometric Security**: Implement secure biometric authentication

## Platform-Specific Considerations

### 🤖 Android
- **Permissions**: Request necessary Android permissions
- **Back Button**: Handle Android back button navigation
- **Material Design**: Follow Material Design guidelines
- **Performance**: Optimize for Android performance characteristics
- **Testing**: Test on various Android devices and versions

### 🍎 iOS
- **Human Interface**: Follow iOS Human Interface Guidelines
- **Navigation**: Implement iOS-specific navigation patterns
- **Permissions**: Request iOS permissions appropriately
- **Performance**: Optimize for iOS performance characteristics
- **Testing**: Test on various iOS devices and versions

## Performance Optimization

### 🚀 Rendering Performance
- **FlatList**: Use FlatList for large data sets
- **Virtualization**: Implement virtual scrolling where appropriate
- **Image Optimization**: Optimize images and implement lazy loading
- **Bundle Size**: Minimize JavaScript bundle size
- **Memory Management**: Implement proper cleanup and memory management

### 📱 App Performance
- **Startup Time**: Optimize app startup performance
- **Navigation**: Implement efficient navigation patterns
- **Background Processing**: Minimize background resource usage
- **Battery Usage**: Optimize for battery efficiency
- **Network**: Implement efficient network request strategies

## Development Workflow

### 🔄 Development Process
1. **Feature Planning**: Plan features with proper architecture
2. **Component Development**: Build reusable components
3. **Screen Implementation**: Implement screen functionality
4. **State Integration**: Connect to Redux store
5. **Testing**: Write and run tests
6. **Code Review**: Submit for code review
7. **Integration**: Integrate with existing codebase

### 🧪 Testing Strategy
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Test rendering and app performance
- **Platform Tests**: Test on both Android and iOS

### 📱 Debugging
- **React Native Debugger**: Use React Native Debugger for debugging
- **Flipper**: Use Flipper for advanced debugging
- **Console Logging**: Implement proper logging strategy
- **Error Tracking**: Track and monitor errors
- **Performance Monitoring**: Monitor app performance metrics

## Common Patterns

### 🔄 Data Fetching
```typescript
// Use RTK Query for API calls
const { data, isLoading, error } = useGetDataQuery();

// Handle loading and error states
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### 🧭 Navigation
```typescript
// Use navigation hooks
const navigation = useNavigation();
const route = useRoute();

// Navigate with type safety
navigation.navigate('ScreenName', { params });
```

### 🎨 Theming
```typescript
// Use theme context
const theme = useTheme();

// Apply theme colors
<View style={{ backgroundColor: theme.colors.surface }} />
```

### 🔐 Authentication
```typescript
// Use Redux for auth state
const { user, isAuthenticated } = useSelector(authSelector);

// Protect routes
if (!isAuthenticated) return <LoginScreen />;
```

## Troubleshooting

### 🐛 Common Issues
- **Metro Issues**: Clear Metro cache and restart
- **Build Errors**: Check native dependencies and configurations
- **Performance Issues**: Use React DevTools and Flipper
- **Navigation Issues**: Verify navigation configuration
- **State Issues**: Check Redux DevTools for state debugging

### 🔧 Debugging Tools
- **React Native Debugger**: For JavaScript debugging
- **Flipper**: For native debugging and performance
- **React DevTools**: For React component debugging
- **Redux DevTools**: For state management debugging
- **Performance Monitor**: For performance analysis

## Best Practices

### 📱 Mobile-First Design
- **Touch Targets**: Ensure adequate touch target sizes
- **Gestures**: Implement intuitive touch gestures
- **Responsiveness**: Design for various screen sizes
- **Accessibility**: Include proper accessibility features
- **Performance**: Prioritize smooth animations and interactions

### 🔄 State Management
- **Single Source of Truth**: Use Redux as single state source
- **Immutable Updates**: Use Redux Toolkit for immutable updates
- **Selectors**: Use efficient selectors for state access
- **Async Operations**: Handle async operations properly
- **Error Boundaries**: Implement error boundaries for error handling

### 🌐 Network Handling
- **Offline Support**: Implement offline-first functionality
- **Caching**: Use efficient caching strategies
- **Error Handling**: Handle network errors gracefully
- **Retry Logic**: Implement retry mechanisms
- **Loading States**: Show appropriate loading indicators

## Contributing Guidelines

### 📋 Pull Request Process
1. **Feature Branch**: Create feature branch from main
2. **Development**: Implement feature with tests
3. **Testing**: Ensure all tests pass
4. **Code Review**: Submit for review
5. **Integration**: Merge after approval

### 🧪 Testing Requirements
- **Unit Tests**: All new code must have unit tests
- **Integration Tests**: Test component interactions
- **Platform Testing**: Test on both Android and iOS
- **Performance**: Ensure no performance regressions
- **Accessibility**: Verify accessibility compliance

### 📝 Documentation
- **Code Comments**: Document complex logic
- **README Updates**: Update relevant documentation
- **API Documentation**: Document new APIs and components
- **Change Log**: Document breaking changes
- **Migration Guide**: Provide migration guides for changes

## Resources

### 📚 Documentation
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/introduction/getting-started)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)

### 🛠️ Tools
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

### 🎯 Learning Resources
- [React Native Community](https://github.com/react-native-community)
- [React Native Elements](https://reactnativeelements.com/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [React Native Security](https://reactnative.dev/docs/security)

## Support

For questions or issues related to this project:
- Check existing documentation and issues
- Review the codebase for similar implementations
- Consult the development team
- Follow established patterns and conventions
- Maintain consistency with existing code style
