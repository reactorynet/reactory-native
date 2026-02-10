/**
 * ReactoryApp - Main Application Orchestrator
 * 
 * The main higher-order component that initializes the ReactorySDK,
 * manages authentication state, applies themes, and coordinates
 * the application lifecycle.
 * 
 * Similar to the PWA's ReactoryHOC/App.tsx
 * 
 * @version 1.0.0
 * @created February 1, 2026
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StatusBar, useColorScheme, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import { PaperProvider } from 'react-native-paper';
import Config from 'react-native-config';

import { ReactoryProvider } from '../../context/ReactoryContext';
import { ReactorySDK } from '../../services/ReactorySDK/ReactorySDK';
import { ReactoryEventNames } from '../../services/ReactorySDK/events';
import { createReactoryApolloClient } from '../../services/apolloClient';
import { store } from '../../store';
import { lightTheme, darkTheme } from '../../themes';
import AppLoading from './AppLoading';
import Offline from './Offline';
import type { User, IApiStatus } from '../../services/ReactorySDK/types';

/**
 * Application state interface
 */
interface AppState {
  isReady: boolean;
  isAuthValidated: boolean;
  isAuthenticating: boolean;
  isAuthTransitioning: boolean;
  user: User | null;
  apiStatus: IApiStatus | null;
  offline: boolean;
  error: Error | null;
  themeMode: 'light' | 'dark';
}

/**
 * Initial app state
 */
const initialState: AppState = {
  isReady: false,
  isAuthValidated: false,
  isAuthenticating: true,
  isAuthTransitioning: false,
  user: null,
  apiStatus: null,
  offline: false,
  error: null,
  themeMode: 'light',
};

/**
 * Props for ReactoryApp
 */
export interface ReactoryAppProps {
  /** Child components (navigation) */
  children: React.ReactNode;
  /** Optional custom theme */
  customTheme?: typeof MD3LightTheme;
  /** SDK configuration override */
  sdkConfig?: Partial<{
    apiEndpoint: string;
    clientKey: string;
    debug: boolean;
  }>;
}

/**
 * ReactoryApp Component
 * 
 * Main application wrapper that handles:
 * - SDK initialization
 * - Authentication state
 * - Theme management
 * - Provider composition
 */
export const ReactoryApp: React.FC<ReactoryAppProps> = ({
  children,
  customTheme,
  sdkConfig,
}) => {
  // System color scheme detection
  const systemColorScheme = useColorScheme();
  
  // Application state
  const [state, setState] = useState<AppState>(initialState);
  
  // Create SDK instance (stable reference)
  const [sdk] = useState<ReactorySDK>(() => new ReactorySDK({
    apiEndpoint: sdkConfig?.apiEndpoint || Config.API_ENDPOINT || 'https://localhost:4001/graphql',
    clientKey: sdkConfig?.clientKey || Config.CLIENT_KEY || 'reactory-native',
    debug: sdkConfig?.debug ?? Config.ENABLE_DEBUG === 'true',
    offline: false,
    theme: systemColorScheme === 'dark' ? 'dark' : 'light',
  }));

  // Create Apollo Client
  const apolloClient = useMemo(() => {
    return createReactoryApolloClient(
      sdkConfig?.apiEndpoint || Config.API_ENDPOINT,
      sdkConfig?.clientKey || Config.CLIENT_KEY,
      async () => {
        // TODO: Get auth token from SDK's authentication manager
        return null;
      },
      sdkConfig?.debug ?? Config.ENABLE_DEBUG === 'true'
    );
  }, [sdkConfig?.apiEndpoint, sdkConfig?.clientKey, sdkConfig?.debug]);

  // Update state helper
  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Fetches API status and updates app state
   */
  const getApiStatus = useCallback(async (emitLogin = true): Promise<void> => {
    try {
      const apiStatus = await sdk.status({ emitLogin, forceLogout: false });
      
      if (apiStatus) {
        updateState({
          isAuthValidated: true,
          offline: apiStatus.offline ?? false,
          apiStatus,
          user: sdk.getUser(),
          isReady: apiStatus.status === 'API OK',
          isAuthenticating: false,
        });

        // Load forms after successful status check
        if (apiStatus.status === 'API OK') {
          try {
            // Forms will be loaded via FormSchemaManager
            sdk.info('API Status OK - application ready');
          } catch (formError) {
            sdk.error('Error loading forms during initialization', formError);
          }
        }
      } else {
        updateState({
          isAuthValidated: true,
          offline: true,
          isAuthenticating: false,
        });
      }
    } catch (err) {
      sdk.error('Error fetching API status', err);
      updateState({
        isAuthValidated: true,
        offline: true,
        error: err instanceof Error ? err : new Error('Unknown error'),
        isAuthenticating: false,
        isReady: false,
      });
    }
  }, [sdk, updateState]);

  /**
   * Handle login event
   */
  const onLogin = useCallback(() => {
    sdk.info('ReactoryApp.onLogin handler');
    updateState({ isAuthTransitioning: true, isAuthenticating: true });

    const currentUser = sdk.getUser();
    if (currentUser) {
      updateState({
        user: currentUser,
        isAuthValidated: true,
        isAuthenticating: false,
        isReady: true,
      });
      
      // Clear transition flag after short delay
      setTimeout(() => updateState({ isAuthTransitioning: false }), 100);
    } else {
      // Retry after short delay if user not immediately available
      setTimeout(() => {
        const retryUser = sdk.getUser();
        updateState({
          user: retryUser,
          isAuthValidated: true,
          isAuthenticating: false,
          isReady: true,
          isAuthTransitioning: false,
        });
      }, 500);
    }
  }, [sdk, updateState]);

  /**
   * Handle logout event
   */
  const onLogout = useCallback(() => {
    sdk.info('ReactoryApp.onLogout handler');
    updateState({ isAuthTransitioning: true });

    // Clear user state
    updateState({
      user: null,
      isAuthValidated: false,
      isAuthenticating: false,
      isReady: false,
    });

    // Clear transition flag
    setTimeout(() => updateState({ isAuthTransitioning: false }), 100);
  }, [sdk, updateState]);

  /**
   * Handle API status update event
   */
  const onApiStatusUpdate = useCallback((status: IApiStatus & { offline?: boolean }) => {
    if (!status) {
      sdk.debug('Received null API status update');
      return;
    }

    // Skip updates during auth transitions
    if (state.isAuthTransitioning) {
      sdk.debug('Skipping API status update during auth transition');
      return;
    }

    const isOffline = status.offline === true;

    if (isOffline) {
      updateState({ offline: true });
      // Retry after delay
      setTimeout(() => void getApiStatus(false), 3500);
    } else {
      const user = sdk.getUser();
      updateState({
        user,
        offline: false,
        apiStatus: status,
      });
    }
  }, [sdk, state.isAuthTransitioning, updateState, getApiStatus]);

  /**
   * Handle theme change
   */
  const onThemeChanged = useCallback(() => {
    sdk.info('Theme changed, refreshing status');
    sdk.status({ emitLogin: false }).then(() => {
      // Theme will be applied from API status
    });
  }, [sdk]);

  /**
   * Handle offline status change
   */
  const onOfflineChanged = useCallback((isOffline: boolean) => {
    updateState({ offline: isOffline });
    if (!isOffline) {
      // Retry connection when back online
      void getApiStatus(false);
    }
  }, [updateState, getApiStatus]);

  /**
   * Initialize the SDK and set up event listeners
   */
  useEffect(() => {
    let mounted = true;
    let failedCount = 0;

    const doInit = async () => {
      try {
        // Initialize SDK
        await sdk.initialize();

        if (!mounted) return;

        // Set up Apollo Client on Network Manager
        sdk.network.setApolloClient(apolloClient);

        // Set up event listeners
        sdk.on(ReactoryEventNames.onLogin, onLogin);
        sdk.on(ReactoryEventNames.onLogout, onLogout);
        sdk.on(ReactoryEventNames.onApiStatusUpdate, onApiStatusUpdate);
        sdk.on(ReactoryEventNames.onThemeChanged, onThemeChanged);

        // Get initial API status
        await getApiStatus(true);

        sdk.info('ReactorySDK initialized successfully');
      } catch (err) {
        sdk.error('Error initializing ReactorySDK', err);
        
        if (failedCount < 3) {
          failedCount++;
          setTimeout(() => doInit(), 750 * failedCount);
        } else {
          if (mounted) {
            updateState({
              error: err instanceof Error ? err : new Error('Failed to initialize'),
              isReady: false,
            });
          }
        }
      }
    };

    void doInit();

    // Cleanup
    return () => {
      mounted = false;
      sdk.off(ReactoryEventNames.onLogin, onLogin);
      sdk.off(ReactoryEventNames.onLogout, onLogout);
      sdk.off(ReactoryEventNames.onApiStatusUpdate, onApiStatusUpdate);
      sdk.off(ReactoryEventNames.onThemeChanged, onThemeChanged);
    };
  }, [sdk, apolloClient, onLogin, onLogout, onApiStatusUpdate, onThemeChanged, getApiStatus, updateState]);

  // Determine theme based on system preference or server config
  const currentTheme = useMemo(() => {
    if (customTheme) return customTheme;
    
    const mode = state.apiStatus?.activeTheme?.modes?.find(m => m.name === 'dark')
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : (systemColorScheme === 'dark' ? 'dark' : 'light');
    
    return mode === 'dark' ? darkTheme : lightTheme;
  }, [customTheme, state.apiStatus, systemColorScheme]);

  // Render loading states
  if (!state.isReady) {
    return (
      <PaperProvider theme={currentTheme}>
        <AppLoading message="Loading..." />
      </PaperProvider>
    );
  }

  if (state.isAuthenticating || state.isAuthTransitioning) {
    return (
      <PaperProvider theme={currentTheme}>
        <AppLoading message="Authenticating..." />
      </PaperProvider>
    );
  }

  if (!state.isAuthValidated && !state.user) {
    return (
      <PaperProvider theme={currentTheme}>
        <AppLoading message="Validating authentication..." />
      </PaperProvider>
    );
  }

  // Render the application
  return (
    <ApolloProvider client={apolloClient}>
      <ReduxProvider store={store}>
        <PaperProvider theme={currentTheme}>
          <SafeAreaProvider>
            <ReactoryProvider sdk={sdk}>
              <StatusBar
                barStyle={systemColorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={currentTheme.colors.surface}
              />
              <View style={styles.container}>
                {!state.offline && children}
                <Offline 
                  onOfflineChanged={onOfflineChanged}
                  forceOffline={state.offline}
                  onRetry={() => void getApiStatus(false)}
                />
              </View>
            </ReactoryProvider>
          </SafeAreaProvider>
        </PaperProvider>
      </ReduxProvider>
    </ApolloProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ReactoryApp;
