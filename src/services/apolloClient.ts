/**
 * Apollo Client Configuration for Reactory Native
 * 
 * This module provides a configurable Apollo Client setup that integrates
 * with the ReactorySDK for authentication and error handling.
 * 
 * @version 1.2.0
 * @updated February 1, 2026 - Added react-native-config support
 */

import { ApolloClient, InMemoryCache, createHttpLink, from, NormalizedCacheObject } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import Config from 'react-native-config';

// Default GraphQL endpoint from environment or fallback
const DEFAULT_GRAPHQL_ENDPOINT = (
  (Config.REACT_APP_API_ENDPOINT
    ? `${Config.REACT_APP_API_ENDPOINT.replace(/\/$/, '')}/graphql`
    : null)
) || 'https://localhost:4000/graphql';
const DEFAULT_CLIENT_KEY = Config.REACT_APP_CLIENT_KEY || 'reactory';
const IS_DEBUG = Config.ENABLE_DEBUG === 'true';

/**
 * Configuration options for creating Apollo Client
 */
export interface ApolloClientConfig {
  /** GraphQL API endpoint URL */
  endpoint?: string;
  /** Client key for multi-tenant applications */
  clientKey?: string;
  /** Function to get the current auth token */
  getAuthToken?: () => Promise<string | null>;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom headers to include in all requests */
  customHeaders?: Record<string, string>;
  /** Callback for handling GraphQL errors */
  onGraphQLError?: (errors: any[]) => void;
  /** Callback for handling network errors */
  onNetworkError?: (error: any) => void;
  /** Callback for handling unauthorized (401) errors */
  onUnauthorized?: () => void;
}

/**
 * Creates a configured Apollo Client instance
 */
export function createApolloClient(config: ApolloClientConfig = {}): ApolloClient<NormalizedCacheObject> {
  const {
    endpoint = DEFAULT_GRAPHQL_ENDPOINT,
    clientKey,
    getAuthToken,
    debug = false,
    customHeaders = {},
    onGraphQLError,
    onNetworkError,
    onUnauthorized,
  } = config;

  // HTTP link for GraphQL requests
  const httpLink = createHttpLink({
    uri: endpoint,
  });

  // Auth link to add authentication headers
  const authLink = setContext(async (_, { headers }) => {
    let token: string | null = null;
    
    // Get auth token if function is provided
    if (getAuthToken) {
      try {
        token = await getAuthToken();
      } catch (error) {
        if (debug) {
          console.warn('[Apollo] Failed to get auth token:', error);
        }
      }
    }
    
    return {
      headers: {
        ...headers,
        ...customHeaders,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(clientKey ? { 'x-client-key': clientKey } : {}),
        'Content-Type': 'application/json',
      },
    };
  });

  // Error link to handle GraphQL and network errors
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        if (debug) {
          console.log(
            `[Apollo] GraphQL error: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
          );
        }
      });
      
      // Call custom error handler if provided
      if (onGraphQLError) {
        onGraphQLError([...graphQLErrors]);
      }
    }

    if (networkError) {
      if (debug) {
        console.log(`[Apollo] Network error: ${networkError}`);
      }
      
      // Handle specific network errors
      if ('statusCode' in networkError && networkError.statusCode === 401) {
        if (debug) {
          console.log('[Apollo] Unauthorized access detected');
        }
        if (onUnauthorized) {
          onUnauthorized();
        }
      }
      
      // Call custom error handler if provided
      if (onNetworkError) {
        onNetworkError(networkError);
      }
    }
  });

  // Create and return Apollo Client instance
  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // Define custom merge functions for paginated queries if needed
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
      },
      query: {
        errorPolicy: 'all',
        fetchPolicy: 'network-only',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
}

// Create default Apollo Client instance for backward compatibility
export const apolloClient = createApolloClient();

/**
 * Helper function to reset Apollo cache
 */
export const resetApolloCache = () => {
  return apolloClient.resetStore();
};

/**
 * Creates an Apollo Client configured for use with ReactorySDK
 * Uses environment variables from react-native-config as defaults
 */
export function createReactoryApolloClient(
  apiEndpoint?: string,
  clientKey?: string,
  getAuthToken?: () => Promise<string | null>,
  debug?: boolean
): ApolloClient<NormalizedCacheObject> {
  return createApolloClient({
    endpoint: apiEndpoint || DEFAULT_GRAPHQL_ENDPOINT,
    clientKey: clientKey || DEFAULT_CLIENT_KEY,
    getAuthToken,
    debug: debug ?? IS_DEBUG,
    onUnauthorized: () => {
      // This will be handled by the SDK's authentication manager
      console.warn('[ReactoryApollo] Session expired - requires re-authentication');
    },
  });
}

/**
 * Export environment configuration for use in other modules
 */
export const EnvConfig = {
  apiEndpoint: DEFAULT_GRAPHQL_ENDPOINT,
  wsEndpoint: (
    (Config.REACT_APP_API_ENDPOINT
      ? `${Config.REACT_APP_API_ENDPOINT.replace(/\/$/, '')}/graphql`
      : null)
  ) || 'wss://localhost:4000/graphql',
  clientKey: DEFAULT_CLIENT_KEY,
  clientName: Config.REACT_APP_SHORTNAME || 'Reactory',
  isDebug: IS_DEBUG,
  enableOfflineMode: Config.ENABLE_OFFLINE_MODE === 'true',
};
