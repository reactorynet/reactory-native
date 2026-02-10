/**
 * ReactorySDK Event Names
 * 
 * Constants for all events emitted by the ReactorySDK and its managers.
 * Based on the PWA ReactoryApiEventNames.
 * 
 * @version 1.0.0
 * @created February 1, 2026
 */

/**
 * Event names for the ReactorySDK
 */
export const ReactoryEventNames = {
  // SDK Lifecycle Events
  onInitializing: 'initializing',
  onInitialized: 'initialized',
  onDestroyed: 'destroyed',
  
  // Authentication Events
  onLogin: 'onLogin',
  onLogout: 'onLogout',
  onAuthenticationRequired: 'onAuthenticationRequired',
  onTokenValidated: 'onTokenValidated',
  onTokenInvalid: 'onTokenInvalid',
  
  // API Status Events
  onApiStatusUpdate: 'onApiStatusUpdate',
  onServerOnline: 'onServerOnline',
  onServerOffline: 'onServerOffline',
  
  // User Events
  onUserChanged: 'onUserChanged',
  onUserProfileUpdated: 'onUserProfileUpdated',
  
  // Theme Events
  onThemeChanged: 'onThemeChanged',
  onThemeModeChanged: 'onThemeModeChanged',
  
  // Navigation Events
  onRouteChanged: 'onRouteChanged',
  onNavigationReady: 'onNavigationReady',
  
  // Network Events
  onNetworkOnline: 'onNetworkOnline',
  onNetworkOffline: 'onNetworkOffline',
  onNetworkError: 'onNetworkError',
  
  // Form Events
  onFormLoaded: 'onFormLoaded',
  onFormSubmit: 'onFormSubmit',
  onFormError: 'onFormError',
  
  // Component Events
  onComponentRegistered: 'onComponentRegistered',
  onComponentUnregistered: 'onComponentUnregistered',
  
  // Configuration Events
  onConfigurationChanged: 'onConfigurationChanged',
  
  // Notification Events
  onNotification: 'onNotification',
  
  // Error Events
  onError: 'onError',
  
  // Plugin Events
  onPluginLoaded: 'onPluginLoaded',
  onPluginError: 'onPluginError',
} as const;

/**
 * Type for event names
 */
export type ReactoryEventName = typeof ReactoryEventNames[keyof typeof ReactoryEventNames];

/**
 * ApiStatusManager specific event names
 */
export const ApiStatusEventNames = {
  onInitializing: 'apiStatusManager.initializing',
  onInitialized: 'apiStatusManager.initialized',
  onInitializationFailed: 'apiStatusManager.initializationFailed',
  onServerOnline: 'apiStatusManager.serverOnline',
  onServerOffline: 'apiStatusManager.serverOffline',
  onStatusReceived: 'apiStatusManager.statusReceived',
  onStatusUpdate: 'apiStatusManager.statusUpdate',
  onLogin: 'apiStatusManager.login',
  onLogout: 'apiStatusManager.logout',
  onUserChanged: 'apiStatusManager.userChanged',
  onNotification: 'apiStatusManager.notification',
  onDestroyed: 'apiStatusManager.destroyed',
} as const;

export type ApiStatusEventName = typeof ApiStatusEventNames[keyof typeof ApiStatusEventNames];

export default ReactoryEventNames;
