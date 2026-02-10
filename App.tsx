/**
 * Reactory Native App
 * 
 * Modern React Native application with TypeScript, Redux Toolkit, 
 * React Navigation, and Apollo GraphQL.
 * 
 * Uses the ReactorySDK for backend communication, authentication,
 * and dynamic route configuration from the server.
 * 
 * @format
 * @version 1.1.0
 * @updated February 1, 2026
 */

import React from 'react';
import { ReactoryApp } from './src/components/app';
import { ReactoryNavigator } from './src/navigation/ReactoryNavigator';

/**
 * Main App Component
 * 
 * Wraps the application with ReactoryApp which handles:
 * - SDK initialization
 * - Authentication state management
 * - Theme configuration
 * - Provider composition (Apollo, Redux, Paper, etc.)
 * 
 * ReactoryNavigator handles:
 * - Dynamic route configuration from server
 * - Navigation structure based on API status
 * - Role-based route access
 */
function App(): React.JSX.Element {
  return (
    <ReactoryApp>
      <ReactoryNavigator 
        navigationType="stack"
        initialRouteName="Home"
        onReady={() => {
          console.log('[ReactoryNative] Navigation ready');
        }}
      />
    </ReactoryApp>
  );
}

export default App;
