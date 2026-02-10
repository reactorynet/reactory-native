/**
 * Offline - Offline status indicator component
 * 
 * Displays when the app is offline or cannot reach the server.
 * 
 * @version 1.0.0
 * @created February 1, 2026
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Text, Button, useTheme, Surface, IconButton } from 'react-native-paper';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

export interface OfflineProps {
  /** Callback when offline status changes */
  onOfflineChanged?: (isOffline: boolean) => void;
  /** Custom message when offline */
  message?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Force show offline state (for server unavailable) */
  forceOffline?: boolean;
}

/**
 * Offline component
 */
export const Offline: React.FC<OfflineProps> = ({
  onOfflineChanged,
  message = 'You appear to be offline. Please check your internet connection.',
  showRetry = true,
  onRetry,
  forceOffline = false,
}) => {
  const theme = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = !state.isConnected || !state.isInternetReachable;
      setIsOffline(offline);
      onOfflineChanged?.(offline);
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      const offline = !state.isConnected || !state.isInternetReachable;
      setIsOffline(offline);
      onOfflineChanged?.(offline);
    });

    return () => {
      unsubscribe();
    };
  }, [onOfflineChanged]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const state = await NetInfo.fetch();
      const offline = !state.isConnected || !state.isInternetReachable;
      setIsOffline(offline);
      onOfflineChanged?.(offline);
      
      if (!offline) {
        onRetry?.();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  // Only show when offline or forced
  if (!isOffline && !forceOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Surface 
        style={[
          styles.banner, 
          { backgroundColor: theme.colors.errorContainer }
        ]}
      >
        <View style={styles.content}>
          <IconButton
            icon="wifi-off"
            iconColor={theme.colors.error}
            size={24}
          />
          <Text 
            variant="bodyMedium" 
            style={[styles.message, { color: theme.colors.onErrorContainer }]}
            numberOfLines={2}
          >
            {forceOffline ? 'Unable to connect to server.' : message}
          </Text>
        </View>
        
        {showRetry && (
          <Button
            mode="text"
            onPress={handleRetry}
            loading={isRetrying}
            disabled={isRetrying}
            textColor={theme.colors.error}
            compact
          >
            Retry
          </Button>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    marginLeft: 4,
  },
});

export default Offline;
