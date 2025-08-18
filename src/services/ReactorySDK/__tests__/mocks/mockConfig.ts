/**
 * Mock configuration objects for ReactorySDK testing
 * 
 * @version 1.0.0
 * @created August 18, 2025
 */

import { ReactorySDKConfig } from '../../types';

/**
 * Valid minimal configuration for testing
 */
export const validConfig: ReactorySDKConfig = {
  apiEndpoint: 'https://api.test.com/graphql',
  clientKey: 'test-client'
};

/**
 * Valid configuration with all optional parameters
 */
export const fullConfig: ReactorySDKConfig = {
  apiEndpoint: 'https://api.test.com/graphql',
  clientKey: 'test-client',
  authToken: 'test-token-123',
  theme: 'default',
  debug: true,
  offline: false,
  plugins: []
};

/**
 * Invalid configuration missing apiEndpoint
 */
export const configMissingApiEndpoint = {
  clientKey: 'test-client'
};

/**
 * Invalid configuration missing clientKey
 */
export const configMissingClientKey = {
  apiEndpoint: 'https://api.test.com/graphql'
};

/**
 * Invalid configuration with malformed API endpoint
 */
export const configInvalidApiEndpoint: ReactorySDKConfig = {
  apiEndpoint: 'invalid-url',
  clientKey: 'test-client'
};

/**
 * Configuration for testing default values
 */
export const configForDefaults: ReactorySDKConfig = {
  apiEndpoint: 'https://api.test.com/graphql',
  clientKey: 'test-client'
  // Missing optional fields to test defaults
};
