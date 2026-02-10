/**
 * ApiStatusManager - API Status and Application State Management
 * 
 * Manages the application's connection to the Reactory backend,
 * handling API status checks, user state, and application configuration.
 * 
 * @version 1.0.0
 * @created February 1, 2026
 */

import { ReactorySDK } from './ReactorySDK';
import { 
  IApiStatus, 
  IApiStatusRequestOptions,
  ILoggedInContext,
  User,
} from './types';
import { 
  buildApiStatusQuery, 
  ApiStatusQueryScope,
  DEFAULT_STARTUP_SCOPES,
  MOBILE_API_STATUS_SCOPES,
} from './graphql/ApiStatus';

/**
 * API Status Manager Configuration
 */
export interface ApiStatusManagerConfig {
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Scopes to use for mobile devices */
  mobileScopes?: ApiStatusQueryScope[];
  /** Default theme name */
  defaultTheme?: string;
  /** Default theme mode */
  defaultMode?: string;
  /** Enable automatic token validation */
  autoValidateToken?: boolean;
}

/**
 * Anonymous user template
 */
const ANONYMOUS_USER: User = {
  id: 'anonymous',
  firstName: 'Anonymous',
  lastName: 'User',
  email: '',
  avatar: '',
  roles: [],
};

/**
 * ApiStatusManager handles API status checking and user state management
 */
export class ApiStatusManager {
  private sdk: ReactorySDK;
  private config: Required<ApiStatusManagerConfig>;
  private isInitialized: boolean = false;
  
  // Current state
  private currentStatus: IApiStatus | null = null;
  private currentUser: User | null = null;
  private tokenValidated: boolean = false;
  private lastValidation: number = 0;
  
  // Auto-refresh timer
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(sdk: ReactorySDK, config?: Partial<ApiStatusManagerConfig>) {
    this.sdk = sdk;
    this.config = this.mergeConfig(config);
    
    // Bind methods
    this.status = this.status.bind(this);
    this.getApiStatus = this.getApiStatus.bind(this);
    this.getUser = this.getUser.bind(this);
    this.setUser = this.setUser.bind(this);
    this.isLoggedIn = this.isLoggedIn.bind(this);
  }

  /**
   * Initializes the ApiStatusManager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.sdk.emit('apiStatusManager.initializing');
      
      // Perform initial API status check with minimal scopes
      await this.checkStartupStatus();
      
      // Start auto-refresh if configured
      if (this.config.refreshInterval > 0) {
        this.startAutoRefresh();
      }
      
      this.isInitialized = true;
      this.sdk.emit('apiStatusManager.initialized', {
        status: this.currentStatus,
        user: this.currentUser,
      });
    } catch (error) {
      this.sdk.emit('apiStatusManager.initializationFailed', { error });
      throw error;
    }
  }

  /**
   * Performs initial startup status check
   */
  private async checkStartupStatus(): Promise<void> {
    try {
      const status = await this.getApiStatus(DEFAULT_STARTUP_SCOPES);
      
      if (status && status.status === 'API OK') {
        this.currentStatus = status;
        this.sdk.emit('apiStatusManager.serverOnline', { 
          server: status.server,
          applicationName: status.applicationName,
        });
      } else {
        this.sdk.emit('apiStatusManager.serverOffline', { status });
      }
    } catch (error) {
      this.sdk.error('Failed to check startup status', error);
      this.sdk.emit('apiStatusManager.serverOffline', { error });
    }
  }

  /**
   * Fetches API status from the server
   */
  private async getApiStatus(
    scope: ApiStatusQueryScope[] = ['application'],
    theme?: string,
    mode?: string
  ): Promise<IApiStatus | null> {
    const query = buildApiStatusQuery(scope);
    const variables = {
      theme: theme || this.config.defaultTheme,
      mode: mode || this.config.defaultMode,
    };

    try {
      const response = await this.sdk.network.query<{ apiStatus: IApiStatus }>(
        query,
        variables,
        { operationName: 'ApiStatus' }
      );

      if (response.errors && response.errors.length > 0) {
        response.errors.forEach(error => {
          this.sdk.error(`GraphQL Error: ${error.message}`, error);
        });
      }

      if (response.data?.apiStatus) {
        this.sdk.emit('apiStatusManager.statusReceived', { 
          status: response.data.apiStatus,
          scope,
        });
        return response.data.apiStatus;
      }

      return null;
    } catch (error) {
      this.sdk.error('Failed to fetch API status', error);
      throw error;
    }
  }

  /**
   * Main status method - fetches full API status and updates application state
   * Similar to PWA ReactoryApi.status()
   */
  async status(options: IApiStatusRequestOptions = {}): Promise<IApiStatus | null> {
    try {
      // Use mobile scopes by default
      const apiStatus = await this.getApiStatus(
        this.config.mobileScopes,
        options.theme,
        options.mode
      );

      if (!apiStatus) {
        return this.currentStatus;
      }

      if (apiStatus.status === 'API OK') {
        // Update current status
        this.currentStatus = apiStatus;
        this.lastValidation = Date.now();
        this.tokenValidated = true;

        // Extract and set user from loggedIn context
        if (apiStatus.loggedIn?.user) {
          this.setUser(apiStatus.loggedIn.user);
          
          if (options.emitLogin) {
            this.sdk.emit('apiStatusManager.login', { user: this.currentUser });
          }
        }

        // Handle messages/notifications
        if (apiStatus.messages && apiStatus.messages.length > 0) {
          apiStatus.messages.forEach(message => {
            this.sdk.emit('apiStatusManager.notification', { message });
          });
        }

        // Emit status update event
        this.sdk.emit('apiStatusManager.statusUpdate', { 
          ...apiStatus, 
          offline: false,
        });

        return apiStatus;
      } else {
        // API not OK - handle logout if needed
        if (options.forceLogout !== false) {
          await this.logout(false);
          this.setUser(ANONYMOUS_USER);
          this.sdk.emit('apiStatusManager.statusUpdate', { 
            ...apiStatus, 
            status: 'API OFFLINE', 
            offline: true,
          });
        }
        return apiStatus;
      }
    } catch (error: any) {
      // Handle network errors
      if (error.networkError) {
        const statusCode = error.networkError.statusCode;
        
        if (statusCode === 401) {
          // Unauthorized - logout user
          await this.logout(false);
          this.setUser(ANONYMOUS_USER);
          return { status: 'UNAUTHORIZED', offline: false };
        }

        this.sdk.error(`Network Error: ${error.networkError.message}`, error);
        throw error.networkError;
      }

      // Handle GraphQL errors
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        error.graphQLErrors.forEach((gqlError: any) => {
          this.sdk.error(`GraphQL Error: ${gqlError.message}`, gqlError);
        });
      }

      this.sdk.error('Error fetching API status', error);
      return this.currentStatus;
    }
  }

  /**
   * Gets the current user
   */
  getUser(): User | null {
    return this.currentUser;
  }

  /**
   * Sets the current user
   */
  setUser(user: User | null): void {
    const previousUser = this.currentUser;
    this.currentUser = user;
    
    if (user !== previousUser) {
      this.sdk.emit('apiStatusManager.userChanged', { 
        user, 
        previousUser,
      });
    }
  }

  /**
   * Checks if a user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null && 
           this.currentUser.id !== 'anonymous' &&
           this.tokenValidated;
  }

  /**
   * Gets the current API status
   */
  getStatus(): IApiStatus | null {
    return this.currentStatus;
  }

  /**
   * Checks if the API is online
   */
  isOnline(): boolean {
    return this.currentStatus?.status === 'API OK' && !this.currentStatus?.offline;
  }

  /**
   * Gets the logged-in context
   */
  getLoggedInContext(): ILoggedInContext | null {
    return this.currentStatus?.loggedIn || null;
  }

  /**
   * Gets available menus
   */
  getMenus() {
    return this.currentStatus?.menus || [];
  }

  /**
   * Gets available routes
   */
  getRoutes() {
    return this.currentStatus?.routes || [];
  }

  /**
   * Gets available plugins
   */
  getPlugins() {
    return this.currentStatus?.plugins || [];
  }

  /**
   * Gets the active theme
   */
  getActiveTheme() {
    return this.currentStatus?.activeTheme || null;
  }

  /**
   * Gets available themes
   */
  getThemes() {
    return this.currentStatus?.themes || [];
  }

  /**
   * Validates the authentication token by refreshing status
   */
  async validateToken(): Promise<boolean> {
    try {
      const status = await this.status({ emitLogin: false, forceLogout: false });
      return status?.status === 'API OK' && this.isLoggedIn();
    } catch {
      return false;
    }
  }

  /**
   * Logs out the current user
   */
  async logout(emitEvent: boolean = true): Promise<void> {
    this.currentUser = ANONYMOUS_USER;
    this.tokenValidated = false;
    this.lastValidation = 0;
    
    if (emitEvent) {
      this.sdk.emit('apiStatusManager.logout', { user: ANONYMOUS_USER });
    }
  }

  /**
   * Starts auto-refresh timer
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        await this.status({ emitLogin: false, forceLogout: false });
      } catch (error) {
        this.sdk.error('Auto-refresh failed', error);
      }
    }, this.config.refreshInterval);
  }

  /**
   * Stops auto-refresh timer
   */
  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Destroys the manager and cleans up resources
   */
  async destroy(): Promise<void> {
    this.stopAutoRefresh();
    this.currentStatus = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.sdk.emit('apiStatusManager.destroyed');
  }

  /**
   * Merges config with defaults
   */
  private mergeConfig(config?: Partial<ApiStatusManagerConfig>): Required<ApiStatusManagerConfig> {
    return {
      refreshInterval: 0, // Disabled by default
      mobileScopes: MOBILE_API_STATUS_SCOPES,
      defaultTheme: 'default',
      defaultMode: 'light',
      autoValidateToken: true,
      ...config,
    };
  }
}

export default ApiStatusManager;
