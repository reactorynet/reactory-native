/**
 * ReactoryNavigator - Dynamic Navigation based on Server Routes
 * 
 * Creates a navigation structure based on routes received from the
 * server API status. Adapts the PWA's ReactoryRouter pattern for
 * React Native using React Navigation.
 * 
 * @version 1.0.0
 * @created February 1, 2026
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Drawer and Tab navigators are disabled due to react-native-reanimated compatibility issues
// import { createDrawerNavigator } from '@react-navigation/drawer';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useReactory } from '../context/ReactoryContext';
import { ReactoryEventNames } from '../services/ReactorySDK/events';
import type { IRoute, IMenu, User } from '../services/ReactorySDK/types';

// Navigation types
export type RootStackParamList = {
  [key: string]: { [key: string]: any } | undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
// Note: Drawer and Tab navigators disabled due to react-native-reanimated compatibility issues
// Re-enable when reanimated is updated or fixed

/**
 * Props for ReactoryNavigator
 */
export interface ReactoryNavigatorProps {
  /** Navigation style: stack, drawer, or tabs */
  navigationType?: 'stack' | 'drawer' | 'tabs';
  /** Custom header component */
  headerComponent?: React.ComponentType<any>;
  /** Show loading indicator while configuring routes */
  showLoading?: boolean;
  /** Callback when navigation is ready */
  onReady?: () => void;
  /** Initial route name */
  initialRouteName?: string;
  /** Child screens to always include */
  children?: React.ReactNode;
}

/**
 * Screen wrapper that handles route component rendering
 */
interface RouteScreenProps {
  route: IRoute;
  navigation: any;
}

const RouteScreen: React.FC<RouteScreenProps> = ({ route: navRoute, navigation }) => {
  const { sdk } = useReactory();
  const theme = useTheme();
  const routeDef = navRoute.params?.routeDef as IRoute | undefined;

  if (!routeDef) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground }}>Route not found</Text>
      </View>
    );
  }

  // For now, render a placeholder - in future, this will render the actual component
  // based on routeDef.componentFqn using the ComponentRegistry
  const ComponentToRender = sdk.components.get(routeDef.componentFqn);
  
  if (ComponentToRender) {
    const componentProps = {
      ...(routeDef.componentProps || {}),
      navigation,
      route: navRoute,
    };
    return <ComponentToRender {...componentProps} />;
  }

  // Placeholder for routes without registered components
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        {routeDef.path}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Component: {routeDef.componentFqn || 'Not specified'}
      </Text>
      <Text style={[styles.info, { color: theme.colors.onSurfaceVariant }]}>
        {routeDef.public ? 'Public Route' : 'Protected Route'}
      </Text>
    </View>
  );
};

/**
 * Login screen placeholder
 */
const LoginScreen: React.FC = () => {
  const theme = useTheme();
  
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Icon name="login" size={64} color={theme.colors.primary} />
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>Login</Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Authentication screen will be implemented
      </Text>
    </View>
  );
};

/**
 * Home screen placeholder when no routes configured
 */
const HomeScreen: React.FC = () => {
  const theme = useTheme();
  
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Icon name="home" size={64} color={theme.colors.primary} />
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>Home</Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Welcome to Reactory Native
      </Text>
    </View>
  );
};

/**
 * Not found screen
 */
const NotFoundScreen: React.FC = () => {
  const theme = useTheme();
  
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Icon name="alert-circle-outline" size={64} color={theme.colors.error} />
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>Not Found</Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        The requested screen could not be found
      </Text>
    </View>
  );
};

/**
 * Loading screen while routes are being configured
 */
const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
        {message}
      </Text>
    </View>
  );
};

/**
 * Convert path to screen name
 */
const pathToScreenName = (path: string): string => {
  // Remove leading slash and convert to PascalCase
  return path
    .replace(/^\//, '')
    .split(/[/-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') || 'Home';
};

/**
 * Get icon name from menu entry
 */
const getIconName = (icon?: string): string => {
  // Map common icon names or return a default
  if (!icon) return 'circle-outline';
  
  // Common mappings
  const iconMap: Record<string, string> = {
    'home': 'home',
    'dashboard': 'view-dashboard',
    'settings': 'cog',
    'profile': 'account',
    'logout': 'logout',
    'login': 'login',
    'help': 'help-circle',
    'info': 'information',
    'search': 'magnify',
    'menu': 'menu',
    'close': 'close',
    'back': 'arrow-left',
    'forward': 'arrow-right',
    'up': 'arrow-up',
    'down': 'arrow-down',
  };
  
  return iconMap[icon.toLowerCase()] || icon;
};

/**
 * ReactoryNavigator Component
 */
export const ReactoryNavigator: React.FC<ReactoryNavigatorProps> = ({
  navigationType = 'stack',
  headerComponent,
  showLoading = true,
  onReady,
  initialRouteName,
  children,
}) => {
  const { sdk } = useReactory();
  const theme = useTheme();
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);
  
  const [routes, setRoutes] = useState<IRoute[]>([]);
  const [menus, setMenus] = useState<IMenu[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  /**
   * Configure routes from API status
   */
  const configureRoutes = useCallback(() => {
    sdk.debug('Configuring navigation routes');
    
    const apiRoutes = sdk.apiStatus.getRoutes();
    const apiMenus = sdk.apiStatus.getMenus();
    const currentUser = sdk.getUser();
    
    setRoutes(apiRoutes);
    setMenus(apiMenus);
    setUser(currentUser);
    setIsConfiguring(false);
    
    sdk.debug('Routes configured', { 
      routeCount: apiRoutes.length, 
      menuCount: apiMenus.length,
      isLoggedIn: sdk.isLoggedIn(),
    });
  }, [sdk]);

  /**
   * Handle login event
   */
  const onLogin = useCallback(() => {
    sdk.debug('Navigation: onLogin - reconfiguring routes');
    setTimeout(configureRoutes, 100);
  }, [sdk, configureRoutes]);

  /**
   * Handle logout event
   */
  const onLogout = useCallback(() => {
    sdk.debug('Navigation: onLogout - reconfiguring routes');
    setTimeout(configureRoutes, 100);
  }, [sdk, configureRoutes]);

  // Set up event listeners and initial configuration
  useEffect(() => {
    configureRoutes();
    
    sdk.on(ReactoryEventNames.onLogin, onLogin);
    sdk.on(ReactoryEventNames.onLogout, onLogout);
    sdk.on(ReactoryEventNames.onApiStatusUpdate, configureRoutes);
    
    return () => {
      sdk.off(ReactoryEventNames.onLogin, onLogin);
      sdk.off(ReactoryEventNames.onLogout, onLogout);
      sdk.off(ReactoryEventNames.onApiStatusUpdate, configureRoutes);
    };
  }, [sdk, configureRoutes, onLogin, onLogout]);

  /**
   * Check if user has access to route
   */
  const hasRouteAccess = useCallback((route: IRoute): boolean => {
    if (route.public) return true;
    if (!sdk.isLoggedIn()) return false;
    if (!route.roles || route.roles.length === 0) return true;
    
    const userRoles = user?.roles || [];
    return route.roles.some(role => userRoles.includes(role) || role === '*');
  }, [sdk, user]);

  /**
   * Build screens from routes
   */
  const buildScreens = useMemo(() => {
    const screens: React.ReactElement[] = [];
    
    // Add default screens
    screens.push(
      <Stack.Screen 
        key="Home" 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
    );
    
    screens.push(
      <Stack.Screen 
        key="Login" 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Login' }}
      />
    );
    
    // Add route-based screens
    routes.forEach((route, index) => {
      if (!hasRouteAccess(route)) {
        sdk.debug(`Skipping route ${route.path} - no access`);
        return;
      }
      
      const screenName = pathToScreenName(route.path);
      
      // Skip if screen already exists
      if (screens.some(s => s.key === screenName)) {
        return;
      }
      
      screens.push(
        <Stack.Screen
          key={screenName}
          name={screenName}
          component={RouteScreen}
          initialParams={{ routeDef: route }}
          options={{
            title: screenName,
            headerShown: true,
          }}
        />
      );
    });
    
    // Add not found screen
    screens.push(
      <Stack.Screen 
        key="NotFound" 
        name="NotFound" 
        component={NotFoundScreen}
        options={{ title: 'Not Found' }}
      />
    );
    
    return screens;
  }, [routes, hasRouteAccess, sdk]);

  /**
   * Handle navigation ready
   */
  const handleReady = useCallback(() => {
    sdk.debug('Navigation container ready');
    onReady?.();
  }, [sdk, onReady]);

  // Show loading state
  if (isConfiguring && showLoading) {
    return <LoadingScreen message="Configuring navigation..." />;
  }

  // Determine initial route
  const defaultInitialRoute = sdk.isLoggedIn() ? 'Home' : 'Login';
  const computedInitialRoute = initialRouteName || defaultInitialRoute;

  // Stack Navigator (default)
  if (navigationType === 'stack') {
    return (
      <NavigationContainer 
        ref={navigationRef}
        onReady={handleReady}
        theme={{
          dark: theme.dark,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.onBackground,
            border: theme.colors.outline,
            notification: theme.colors.error,
          },
        }}
      >
        <Stack.Navigator
          initialRouteName={computedInitialRoute}
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        >
          {buildScreens}
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Note: Drawer and Tab navigators are temporarily disabled due to react-native-reanimated compatibility issues
  // When reanimated is fixed, they can be re-enabled
  if (navigationType === 'drawer' || navigationType === 'tabs') {
    console.warn(`[ReactoryNavigator] ${navigationType} navigation is temporarily disabled. Falling back to stack navigation.`);
  }

  // Fallback to stack navigator
  return (
    <NavigationContainer ref={navigationRef} onReady={handleReady}>
      <Stack.Navigator initialRouteName={computedInitialRoute}>
        {buildScreens}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    marginTop: 16,
    opacity: 0.7,
  },
});

export default ReactoryNavigator;
