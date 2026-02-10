/**
 * AppLoading - Loading screen component
 * 
 * Displays a loading indicator while the app is initializing,
 * authenticating, or performing background operations.
 * 
 * @version 1.0.0
 * @created February 1, 2026
 */

import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { ActivityIndicator, Text, useTheme, Surface } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

export interface AppLoadingProps {
  /** Loading message to display */
  message?: string;
  /** Show as full screen overlay */
  fullScreen?: boolean;
  /** Custom logo or branding component */
  logo?: React.ReactNode;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Show progress indicator */
  showProgress?: boolean;
}

/**
 * AppLoading component
 */
export const AppLoading: React.FC<AppLoadingProps> = ({
  message = 'Loading...',
  fullScreen = true,
  logo,
  progress,
  showProgress = false,
}) => {
  const theme = useTheme();

  const containerStyle = [
    styles.container,
    { backgroundColor: theme.colors.background },
    fullScreen && styles.fullScreen,
  ];

  return (
    <View style={containerStyle}>
      <Surface style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        {logo && <View style={styles.logoContainer}>{logo}</View>}
        
        <ActivityIndicator
          animating
          size="large"
          color={theme.colors.primary}
          style={styles.spinner}
        />
        
        <Text 
          variant="bodyLarge" 
          style={[styles.message, { color: theme.colors.onSurface }]}
        >
          {message}
        </Text>
        
        {showProgress && progress !== undefined && (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { backgroundColor: theme.colors.surfaceVariant }
              ]}
            >
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.colors.primary,
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                  }
                ]} 
              />
            </View>
            <Text 
              variant="bodySmall" 
              style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
            >
              {Math.round(progress)}%
            </Text>
          </View>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
    zIndex: 999,
  },
  content: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoContainer: {
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    marginTop: 8,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
  },
});

export default AppLoading;
