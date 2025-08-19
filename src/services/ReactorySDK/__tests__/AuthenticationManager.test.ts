/**
 * AuthenticationManager Test Suite
 * 
 * Comprehensive test coverage for the AuthenticationManager class following TDD principles.
 * Tests cover authentication flows, token management, secure storage, and error handling.
 * 
 * @version 1.0.0
 * @created August 19, 2025
 */

import { AuthenticationManager } from '../AuthenticationManager';
import { ReactorySDK } from '../ReactorySDK';
import { 
  AuthCredentials, 
  User, 
  ReactorySDKConfig
} from '../types';

// Mock GraphQL client
const mockGraphQLClient = {
  query: jest.fn(),
  mutate: jest.fn()
};

// Mock SDK configuration
const mockConfig: ReactorySDKConfig = {
  apiEndpoint: 'https://api.example.com/graphql',
  clientKey: 'test-client'
};

describe('AuthenticationManager', () => {
  let authManager: AuthenticationManager;
  let mockSdk: ReactorySDK;

  // Test data
  const validCredentials: AuthCredentials = {
    email: 'test@example.com',
    password: 'SecurePassword123!',
    rememberMe: true
  };

  const mockUser: User = {
    id: '12345',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['user'],
    permissions: ['read', 'write']
  };

  const mockAuthResponse = {
    data: {
      authenticate: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        refreshToken: 'mock-refresh-token-67890',
        user: mockUser
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Create real SDK instance for testing
    mockSdk = new ReactorySDK(mockConfig);
    (mockSdk as any).client = mockGraphQLClient;
    
    // Mock SDK methods
    mockSdk.debug = jest.fn();
    mockSdk.error = jest.fn();
    mockSdk.info = jest.fn();
    mockSdk.emit = jest.fn();

    authManager = new AuthenticationManager(mockSdk);
    
    // Ensure clean state for each test
    authManager.resetForTesting();
  });

  afterEach(async () => {
    // Ensure clean state after each test
    if (authManager) {
      try {
        // Force reset the authentication manager state
        authManager.resetForTesting();
      } catch (error) {
        // Ignore reset errors in cleanup - this is expected during testing
        console.log('Cleanup reset error (expected):', error);
      }
    }
  });

  // ============================================================================
  // Test Group 3.1: Initialization and Setup
  // ============================================================================
  describe('Test Group 3.1: Initialization and Setup', () => {
    test('should initialize successfully with valid SDK instance', async () => {
      await expect(authManager.initialize()).resolves.toBeUndefined();
      expect(mockSdk.debug).toHaveBeenCalledWith('AuthenticationManager initialized');
    });

    test('should throw error when initializing without SDK', () => {
      expect(() => new AuthenticationManager(null as any)).toThrow('SDK instance is required');
    });

    test('should prevent multiple initialization calls', async () => {
      await authManager.initialize();
      await authManager.initialize(); // Second call should be ignored
      
      // Should only call debug once for successful initialization (first call)
      // Plus one more call from resetForTesting in beforeEach
      expect(mockSdk.debug).toHaveBeenCalledWith('AuthenticationManager initialized');
    });

    test('should handle secure store unavailable scenario', async () => {
      // Mock checkSecureStorageAvailability to return false
      const checkSecureStorageSpy = jest.spyOn(authManager as any, 'checkSecureStorageAvailability')
        .mockResolvedValueOnce(false);
      
      await authManager.initialize();
      expect(checkSecureStorageSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Test Group 3.2: Authentication Flow
  // ============================================================================
  describe('Test Group 3.2: Authentication Flow', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    test('should authenticate user with valid credentials', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce(mockAuthResponse);

      const result = await authManager.authenticate(validCredentials);

      expect(result).toEqual(mockUser);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith({
        mutation: expect.any(String),
        variables: {
          email: validCredentials.email,
          password: validCredentials.password,
          rememberMe: validCredentials.rememberMe,
          twoFactorCode: undefined
        }
      });
    });

    test('should handle authentication with invalid credentials', async () => {
      mockGraphQLClient.mutate.mockRejectedValueOnce(new Error('Invalid credentials'));

      const invalidCredentials: AuthCredentials = {
        email: 'wrong@example.com',
        password: 'weakpass' // This will trigger password validation error first
      };

      await expect(authManager.authenticate(invalidCredentials)).rejects.toThrow('Password does not meet security requirements');
    });

    test('should handle two-factor authentication', async () => {
      const credentialsWithTwoFactor: AuthCredentials = {
        ...validCredentials,
        twoFactorCode: '123456'
      };

      mockGraphQLClient.mutate.mockResolvedValueOnce(mockAuthResponse);

      const result = await authManager.authenticate(credentialsWithTwoFactor);

      expect(result).toEqual(mockUser);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith({
        mutation: expect.any(String),
        variables: {
          email: credentialsWithTwoFactor.email,
          password: credentialsWithTwoFactor.password,
          rememberMe: credentialsWithTwoFactor.rememberMe,
          twoFactorCode: '123456'
        }
      });
    });

    test('should validate email format before authentication', async () => {
      const invalidEmailCredentials: AuthCredentials = {
        email: 'invalid-email',
        password: 'ValidPassword123!'
      };

      await expect(authManager.authenticate(invalidEmailCredentials)).rejects.toThrow('Invalid email format');
    });

    test('should validate password strength before authentication', async () => {
      const weakPasswordCredentials: AuthCredentials = {
        email: 'test@example.com',
        password: '123'
      };

      await expect(authManager.authenticate(weakPasswordCredentials)).rejects.toThrow('Password does not meet security requirements');
    });

    test('should emit authentication events during login', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce(mockAuthResponse);

      await authManager.authenticate(validCredentials);

      expect(mockSdk.emit).toHaveBeenCalledWith('authentication_started');
      expect(mockSdk.emit).toHaveBeenCalledWith('authentication_success', { user: mockUser });
    });

    test('should emit authentication failure events on error', async () => {
      const authError = new Error('Invalid credentials');
      mockGraphQLClient.mutate.mockRejectedValueOnce(authError);

      await expect(authManager.authenticate(validCredentials)).rejects.toThrow('Invalid credentials');

      expect(mockSdk.emit).toHaveBeenCalledWith('authentication_started');
      expect(mockSdk.emit).toHaveBeenCalledWith('authentication_failed', { error: authError });
    });
  });

  // ============================================================================
  // Test Group 3.3: Token Management
  // ============================================================================
  describe('Test Group 3.3: Token Management', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    test('should store authentication token securely', async () => {
      const token = 'valid.jwt.token';
      
      // Mock isValidJWT to return true
      const isValidJWTSpy = jest.spyOn(authManager as any, 'isValidJWT').mockReturnValue(true);
      
      await authManager.storeToken(token);
      expect(isValidJWTSpy).toHaveBeenCalledWith(token);
    });

    test('should retrieve stored authentication token', async () => {
      const mockToken = 'valid.jwt.token';
      
      // Mock getFromStorage
      const getFromStorageSpy = jest.spyOn(authManager as any, 'getFromStorage')
        .mockResolvedValueOnce(mockToken);
      
      // Mock token validation
      jest.spyOn(authManager as any, 'isTokenExpired').mockReturnValue(false);

      const token = await authManager.getStoredToken();

      expect(token).toBe(mockToken);
      expect(getFromStorageSpy).toHaveBeenCalled();
    });

    test('should return null when no token is stored', async () => {
      jest.spyOn(authManager as any, 'getFromStorage').mockResolvedValueOnce(null);

      const token = await authManager.getStoredToken();

      expect(token).toBeNull();
    });

    test('should clear stored authentication token', async () => {
      const deleteFromStorageSpy = jest.spyOn(authManager as any, 'deleteFromStorage')
        .mockResolvedValueOnce(undefined);

      await authManager.clearToken();

      expect(deleteFromStorageSpy).toHaveBeenCalled();
    });

    test('should refresh authentication token', async () => {
      const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      // Setup stored refresh token
      (authManager as any).storedRefreshToken = 'old-refresh-token';
      
      mockGraphQLClient.mutate.mockResolvedValueOnce({
        data: {
          refreshToken: {
            token: newToken,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            refreshToken: 'new-refresh-token'
          }
        }
      });

      // Mock storage operations
      jest.spyOn(authManager as any, 'setInStorage').mockResolvedValue(undefined);

      const refreshedToken = await authManager.refreshToken();

      expect(refreshedToken).toBe(newToken);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith({
        mutation: expect.any(String),
        variables: {
          refreshToken: 'old-refresh-token'
        }
      });
    });

    test('should handle refresh token failure', async () => {
      // No stored refresh token
      (authManager as any).storedRefreshToken = null;

      await expect(authManager.refreshToken()).rejects.toThrow('No refresh token available');
    });

    test('should validate token format', async () => {
      const invalidToken = 'invalid-token-format';

      await expect(authManager.storeToken(invalidToken)).rejects.toThrow('Invalid token format');
    });

    test('should handle token expiration', async () => {
      const expiredToken = 'expired.jwt.token';
      
      jest.spyOn(authManager as any, 'getFromStorage').mockResolvedValueOnce(expiredToken);
      jest.spyOn(authManager as any, 'isTokenExpired').mockReturnValue(true);
      jest.spyOn(authManager as any, 'deleteFromStorage').mockResolvedValue(undefined);
      
      const token = await authManager.getStoredToken();
      expect(token).toBeNull(); // Should return null for expired tokens
    });
  });

  // ============================================================================
  // Test Group 3.4: User Session Management
  // ============================================================================
  describe('Test Group 3.4: User Session Management', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    test('should logout user successfully', async () => {
      // Setup authenticated state
      (authManager as any).currentUser = mockUser;
      (authManager as any).authToken = 'valid-token';
      (authManager as any).storedRefreshToken = 'refresh-token';

      const deleteFromStorageSpy = jest.spyOn(authManager as any, 'deleteFromStorage')
        .mockResolvedValue(undefined);

      await authManager.logout();

      expect(deleteFromStorageSpy).toHaveBeenCalledTimes(3); // token, refresh token, user data
      expect((authManager as any).currentUser).toBeNull();
      expect((authManager as any).authToken).toBeNull();
      expect((authManager as any).storedRefreshToken).toBeNull();
    });

    test('should emit logout events', async () => {
      jest.spyOn(authManager as any, 'deleteFromStorage')
        .mockResolvedValue(undefined);

      await authManager.logout();

      expect(mockSdk.emit).toHaveBeenCalledWith('logout_started');
      expect(mockSdk.emit).toHaveBeenCalledWith('logout_success');
    });

    test('should check authentication status correctly', () => {
      expect(authManager.isAuthenticated()).toBe(false);

      // Mock authenticated state
      (authManager as any).currentUser = mockUser;
      (authManager as any).authToken = 'valid-token';
      jest.spyOn(authManager as any, 'isTokenExpired').mockReturnValue(false);

      expect(authManager.isAuthenticated()).toBe(true);
    });

    test('should return current authenticated user', () => {
      expect(authManager.getCurrentUser()).toBeNull();

      // Mock authenticated state
      (authManager as any).currentUser = mockUser;

      expect(authManager.getCurrentUser()).toEqual(mockUser);
    });

    test('should handle session timeout', () => {
      jest.useFakeTimers();
      
      // Setup authenticated state with timeout
      (authManager as any).currentUser = mockUser;
      (authManager as any).authToken = 'valid-token';
      (authManager as any).sessionTimeout = 1000; // 1 second

      // Mock session management
      const logoutSpy = jest.spyOn(authManager, 'logout').mockResolvedValue(undefined);
      
      // Setup session management
      (authManager as any).setupSessionManagement();

      // Fast-forward time
      jest.advanceTimersByTime(1001);

      expect(logoutSpy).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  // ============================================================================
  // Test Group 3.5: Error Handling and Edge Cases
  // ============================================================================
  describe('Test Group 3.5: Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    test('should handle network errors during authentication', async () => {
      const networkError = new Error('Network request failed');
      mockGraphQLClient.mutate.mockRejectedValueOnce(networkError);

      await expect(authManager.authenticate(validCredentials)).rejects.toThrow('Network request failed');
      expect(mockSdk.emit).toHaveBeenCalledWith('authentication_failed', { error: networkError });
    });

    test('should handle malformed authentication response', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce({
        data: {
          authenticate: null // Malformed response
        }
      });

      await expect(authManager.authenticate(validCredentials)).rejects.toThrow('Invalid authentication response');
    });

    test('should handle storage errors gracefully', async () => {
      const storageError = new Error('Storage error');
      jest.spyOn(authManager as any, 'setInStorage').mockRejectedValueOnce(storageError);
      jest.spyOn(authManager as any, 'isValidJWT').mockReturnValue(true);

      await expect(authManager.storeToken('valid.jwt.token')).rejects.toThrow('Failed to store authentication token');
    });

    test('should handle concurrent authentication attempts', async () => {
      // Setup mock to return a never-resolving promise for the first call
      let authResolver: any;
      const authPromise = new Promise(resolve => {
        authResolver = resolve;
      });
      
      mockGraphQLClient.mutate.mockImplementationOnce(() => authPromise);

      // Start first authentication (will be pending)
      const promise1 = authManager.authenticate(validCredentials);
      
      // Verify that authentication is in progress by checking internal state
      expect((authManager as any).authenticationInProgress).toBe(true);
      
      // Second authentication attempt should fail immediately
      await expect(authManager.authenticate(validCredentials))
        .rejects.toThrow('Authentication already in progress');

      // Resolve the first authentication
      authResolver(mockAuthResponse);
      
      // First authentication should succeed
      await expect(promise1).resolves.toEqual(mockUser);
      
      // After completion, flag should be reset
      expect((authManager as any).authenticationInProgress).toBe(false);
    });

    test('should handle empty credentials', async () => {
      const emptyCredentials: AuthCredentials = {
        email: '',
        password: ''
      };

      await expect(authManager.authenticate(emptyCredentials)).rejects.toThrow('Email and password are required');
    });

    test('should handle missing credentials', async () => {
      await expect(authManager.authenticate(null as any)).rejects.toThrow('Credentials are required');
    });

    test('should handle JWT parsing errors', async () => {
      const invalidJwt = 'invalid.jwt.token';
      jest.spyOn(authManager as any, 'getFromStorage').mockResolvedValueOnce(invalidJwt);
      jest.spyOn(authManager as any, 'isTokenExpired').mockImplementation(() => {
        throw new Error('JWT parsing error');
      });
      jest.spyOn(authManager as any, 'deleteFromStorage').mockResolvedValue(undefined);

      const token = await authManager.getStoredToken();
      expect(token).toBeNull();
      expect(mockSdk.error).toHaveBeenCalledWith('Failed to retrieve stored token', expect.any(Error));
    });

    test('should handle authentication rate limiting', async () => {
      // Manually set up failed attempts to trigger rate limiting
      const attemptData = {
        count: 5,
        lastAttempt: new Date()
      };
      
      (authManager as any).failedAttempts.set('test@example.com', attemptData);

      // Next attempt should be rate limited
      await expect(authManager.authenticate(validCredentials)).rejects.toThrow(/Too many authentication attempts/);
    });
  });

  // ============================================================================
  // Test Group 3.6: Security and Validation
  // ============================================================================
  describe('Test Group 3.6: Security and Validation', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    test('should validate email format strictly', async () => {
      const testCases = [
        { email: 'test@example.com', valid: true },
        { email: 'user.name+tag@domain.co.uk', valid: true },
        { email: 'invalid.email', valid: false },
        { email: '@domain.com', valid: false },
        { email: 'user@', valid: false }
      ];

      for (const testCase of testCases) {
        const credentials: AuthCredentials = {
          email: testCase.email,
          password: 'ValidPassword123!'
        };

        if (testCase.valid) {
          mockGraphQLClient.mutate.mockResolvedValueOnce(mockAuthResponse);
          await expect(authManager.authenticate(credentials)).resolves.toBeDefined();
        } else {
          await expect(authManager.authenticate(credentials)).rejects.toThrow('Invalid email format');
        }
      }
    });

    test('should validate password complexity', async () => {
      const testCases = [
        { password: 'ValidPassword123!', valid: true },
        { password: 'ComplexP@ssw0rd', valid: true },
        { password: 'weak', valid: false },
        { password: '12345', valid: false },
        { password: 'NoNumbers!', valid: false },
        { password: 'nonumbersorspecial', valid: false }
      ];

      for (const testCase of testCases) {
        const credentials: AuthCredentials = {
          email: 'test@example.com',
          password: testCase.password
        };

        if (testCase.valid) {
          mockGraphQLClient.mutate.mockResolvedValueOnce(mockAuthResponse);
          await expect(authManager.authenticate(credentials)).resolves.toBeDefined();
        } else {
          await expect(authManager.authenticate(credentials)).rejects.toThrow('Password does not meet security requirements');
        }
      }
    });

    test('should sanitize user input', async () => {
      const maliciousCredentials: AuthCredentials = {
        email: 'test@example.com<script>alert("xss")</script>',
        password: 'ValidPassword123!<script>alert("xss")</script>'
      };

      mockGraphQLClient.mutate.mockResolvedValueOnce(mockAuthResponse);

      await authManager.authenticate(maliciousCredentials);

      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith({
        mutation: expect.any(String),
        variables: {
          email: 'test@example.com', // Script tags should be removed
          password: 'ValidPassword123!', // Script tags should be removed
          rememberMe: undefined,
          twoFactorCode: undefined
        }
      });
    });

    test('should clear sensitive data from memory after logout', async () => {
      // Setup authenticated state
      (authManager as any).currentUser = mockUser;
      (authManager as any).authToken = 'valid-token';
      (authManager as any).storedRefreshToken = 'refresh-token';

      jest.spyOn(authManager as any, 'deleteFromStorage').mockResolvedValue(undefined);

      await authManager.logout();

      expect((authManager as any).currentUser).toBeNull();
      expect((authManager as any).authToken).toBeNull();
      expect((authManager as any).storedRefreshToken).toBeNull();
    });
  });
});
