/**
 * TypeScript declarations for react-native-config environment variables
 * 
 * This file provides type safety for environment variables loaded from .env files.
 * Update this file when adding new environment variables.
 */

declare module 'react-native-config' {
  export interface NativeConfig {
    // API Configuration
    REACT_APP_API_ENDPOINT: string;
    //The CDN endpoint for the client
    REACT_APP_CDN: string;
    // The title of the client
    REACT_APP_TITLE: string;
    // The theme of the client
    REACT_APP_THEME: string;
    // The client key
    REACT_APP_CLIENT_KEY: string;
    // The shortname of the client
    REACT_APP_SHORTNAME: string;
    //The client password
    REACT_APP_CLIENT_PASSWORD: string;
    // The primary theme color
    REACT_APP_THEME_PRIMARY: string;
    //The background theme color
    REACT_APP_THEME_BG: string;
    // Environment
    NODE_ENV?: 'development' | 'staging' | 'production';

    // Feature Flags
    ENABLE_DEBUG?: string;
    ENABLE_OFFLINE_MODE?: string;

    // Analytics (optional)
    ANALYTICS_KEY?: string;
  }

  const Config: NativeConfig;
  export default Config;
}
