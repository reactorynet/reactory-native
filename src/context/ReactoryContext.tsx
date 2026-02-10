/**
 * ReactoryContext - React Context for ReactorySDK
 * 
 * Provides the ReactorySDK instance throughout the React Native application,
 * similar to the PWA's ReactoryProvider.
 * 
 * @version 1.0.0
 * @created February 1, 2026
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ReactorySDK } from '../services/ReactorySDK/ReactorySDK';
import type { 
  User, 
  IApiStatus,
  IMenu,
  IRoute,
} from '../services/ReactorySDK/types';

/**
 * Context value interface
 */
export interface ReactoryContextValue {
  /** The ReactorySDK instance */
  sdk: ReactorySDK;
  /** Convenience method to get the SDK */
  reactory: ReactorySDK;
}

/**
 * The React Context for ReactorySDK
 */
const ReactoryContext = createContext<ReactoryContextValue | null>(null);

/**
 * Props for ReactoryProvider
 */
export interface ReactoryProviderProps {
  /** The ReactorySDK instance */
  sdk: ReactorySDK;
  /** Child components */
  children: ReactNode;
}

/**
 * ReactoryProvider - Provides ReactorySDK to the component tree
 */
export const ReactoryProvider: React.FC<ReactoryProviderProps> = ({ sdk, children }) => {
  const value: ReactoryContextValue = {
    sdk,
    reactory: sdk, // Alias for compatibility with PWA patterns
  };

  return (
    <ReactoryContext.Provider value={value}>
      {children}
    </ReactoryContext.Provider>
  );
};

/**
 * useReactory - Hook to access the ReactorySDK
 * 
 * @returns ReactoryContextValue
 * @throws Error if used outside of ReactoryProvider
 */
export function useReactory(): ReactoryContextValue {
  const context = useContext(ReactoryContext);
  
  if (!context) {
    throw new Error('useReactory must be used within a ReactoryProvider');
  }
  
  return context;
}

/**
 * useReactoryUser - Hook to access the current user
 * 
 * @returns User | null
 */
export function useReactoryUser(): User | null {
  const { sdk } = useReactory();
  return sdk.getUser();
}

/**
 * useReactoryStatus - Hook to access API status
 * 
 * @returns IApiStatus | null
 */
export function useReactoryStatus(): IApiStatus | null {
  const { sdk } = useReactory();
  return sdk.apiStatus.getStatus();
}

/**
 * useReactoryMenus - Hook to access menus from API status
 * 
 * @returns IMenu[]
 */
export function useReactoryMenus(): IMenu[] {
  const { sdk } = useReactory();
  return sdk.apiStatus.getMenus();
}

/**
 * useReactoryRoutes - Hook to access routes from API status
 * 
 * @returns IRoute[]
 */
export function useReactoryRoutes(): IRoute[] {
  const { sdk } = useReactory();
  return sdk.apiStatus.getRoutes();
}

/**
 * useReactoryIsLoggedIn - Hook to check if user is logged in
 * 
 * @returns boolean
 */
export function useReactoryIsLoggedIn(): boolean {
  const { sdk } = useReactory();
  return sdk.isLoggedIn();
}

/**
 * useReactoryIsOnline - Hook to check if API is online
 * 
 * @returns boolean
 */
export function useReactoryIsOnline(): boolean {
  const { sdk } = useReactory();
  return sdk.isOnline();
}

export default ReactoryContext;
