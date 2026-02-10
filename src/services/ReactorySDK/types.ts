/**
 * ReactorySDK Type Definitions
 * 
 * This file contains all TypeScript type definitions for the ReactorySDK
 * and its related interfaces, ensuring type safety throughout the application.
 * 
 * Based on the PWA ReactoryApi implementation but adapted for React Native
 * 
 * @version 1.0.0
 * @created August 17, 2025
 */

import { ComponentType as ReactComponentType } from 'react';
import { DocumentNode } from 'graphql';
import { ApolloClient, NormalizedCacheObject, ApolloQueryResult, FetchResult } from '@apollo/client';

// Re-export React types for easier access
export type { ReactComponentType };

// ============================================================================
// React Native Compatibility Types
// ============================================================================

/**
 * React Native compatible navigation function
 * Replaces React Router's NavigateFunction for mobile navigation
 */
export type ReactoryNavigateFunction = (to: string, options?: { replace?: boolean; state?: any }) => void;

/**
 * React Native compatible location object
 * Replaces React Router's Location for mobile routing
 */
export interface ReactoryLocation {
  pathname: string;
  search: string;
  hash: string;
  state?: any;
}

/**
 * Window size specification for mobile devices
 */
export interface IWindowSizeSpec {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  resolution: {
    width: number;
    height: number;
  };
  ratio: number;
  view: "landscape" | "portrait";
  size: "xl" | "lg" | "md" | "sm" | "xs";
}

/**
 * React Native compatible theme interface
 */
export interface ReactoryTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    text: string;
    onSurface: string;
    onBackground: string;
    disabled: string;
    placeholder: string;
    backdrop: string;
  };
  fonts: {
    regular: { fontFamily: string; fontWeight: string };
    medium: { fontFamily: string; fontWeight: string };
    light: { fontFamily: string; fontWeight: string };
    thin: { fontFamily: string; fontWeight: string };
  };
  [key: string]: any;
}

// ============================================================================
// Core Reactory Types (from PWA implementation)
// ============================================================================

/**
 * Reactory FQN (Fully Qualified Name) Format
 * 
 * Components in Reactory are identified using a Fully Qualified Name (FQN) format:
 * 
 * Format: nameSpace.name@version
 * 
 * Examples:
 * - "core.Button@1.0.0" - Button component in core namespace, version 1.0.0
 * - "ui.forms.TextInput@2.1.0" - TextInput component in ui.forms namespace, version 2.1.0
 * - "myapp.dashboard.Widget@1.5.2" - Custom Widget component
 * 
 * The FQN serves as the unique identifier for component registration, retrieval,
 * and management operations throughout the Reactory ecosystem.
 * 
 * Components:
 * - nameSpace: Organizational namespace (can include dots for hierarchy)
 * - name: Specific component name
 * - version: Semantic version string
 */

/**
 * Component definition for FQN resolution
 */
export interface IComponentFqnDefinition {
  nameSpace: string;
  name: string;
  version: string;
}

/**
 * Reactory component type enumeration
 */
export type ReactoryComponentType = "form" | "module" | "function" | "class" | "component" | "widget" | "form-widget";

/**
 * Component registry entry
 */
export interface IReactoryComponentRegistryEntry<T> {
  nameSpace: string;
  name: string;
  version: string;
  component: T;
  tags?: string[];
  roles?: string[];
  connectors?: unknown[];
  componentType?: ReactoryComponentType;
  title?: string;
  description?: string;
  useReactory?: boolean;
  useErrorBoundary?: boolean;
}

/**
 * Component registry interface
 */
export interface IReactoryComponentRegister {
  [key: string]: IReactoryComponentRegistryEntry<unknown>;
}

/**
 * Login result interface
 */
export interface ILoginResult {
  user: {
    firstName: string;
    lastName: string;
    token: string;
  };
}

/**
 * API Status request options
 */
export interface IApiStatusRequestOptions {
  emitLogin?: boolean;
  forceLogout?: boolean;
  theme?: string;
  mode?: string;
}

// ============================================================================
// API Status Types
// ============================================================================

/**
 * Server information from API status
 */
export interface IServerInfo {
  id: string;
  version: string;
  started: string;
  clients: Array<{
    id: string;
    clientKey: string;
    name: string;
    siteUrl: string;
  }>;
}

/**
 * Logged in user context
 */
export interface ILoggedInContext {
  user: User | null;
  organization: Organization | null;
  team: {
    id: string;
    name: string;
  } | null;
  businessUnit: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  roles: string[];
  altRoles?: string[];
  memberships: UserMembership[];
}

/**
 * Theme mode definition
 */
export interface IThemeMode {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

/**
 * Theme asset definition
 */
export interface IThemeAsset {
  id: string;
  name: string;
  assetType: string;
  url?: string;
  loader?: string;
  options?: Record<string, unknown>;
  data?: unknown;
}

/**
 * Active theme from API status
 */
export interface IActiveTheme {
  id: string;
  type: string;
  name: string;
  nameSpace: string;
  version: string;
  description?: string;
  modes?: IThemeMode[];
  options?: Record<string, unknown>;
  assets?: IThemeAsset[];
}

/**
 * Theme summary (for theme list)
 */
export interface IThemeSummary {
  id: string;
  type: string;
  name: string;
  nameSpace: string;
  version: string;
  description?: string;
}

/**
 * Route argument
 */
export interface IRouteArg {
  key: string;
  value: string;
}

/**
 * Route component definition
 */
export interface IRouteComponent {
  nameSpace: string;
  name: string;
  version: string;
  args?: IRouteArg[];
  title?: string;
  description?: string;
  roles?: string[];
}

/**
 * Application route definition
 */
export interface IRoute {
  id: string;
  path: string;
  public: boolean;
  roles?: string[];
  componentFqn: string;
  exact?: boolean;
  redirect?: string;
  componentProps?: Record<string, unknown>;
  args?: IRouteArg[];
  components?: IRouteComponent[];
}

/**
 * Menu entry item (nested)
 */
export interface IMenuEntryItem {
  id: string;
  ordinal: number;
  title: string;
  link: string;
  external?: boolean;
  icon?: string;
  roles?: string[];
}

/**
 * Menu entry definition
 */
export interface IMenuEntry {
  id: string;
  ordinal: number;
  title: string;
  link: string;
  external?: boolean;
  icon?: string;
  roles?: string[];
  items?: IMenuEntryItem[];
}

/**
 * Menu definition
 */
export interface IMenu {
  id: string;
  key: string;
  name: string;
  target?: string;
  roles?: string[];
  entries: IMenuEntry[];
}

/**
 * Message action definition
 */
export interface IMessageAction {
  id: string;
  action: string;
  icon?: string;
  componentFqn?: string;
  componentProps?: Record<string, unknown>;
  modal?: boolean;
  modalSize?: string;
  priority?: number;
}

/**
 * Application message
 */
export interface IMessage {
  id: string;
  title: string;
  text?: string;
  data?: unknown;
  via?: string;
  icon?: string;
  image?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: string;
  actions?: IMessageAction[];
}

/**
 * Navigation component definition
 */
export interface INavigationComponent {
  componentFqn: string;
  componentProps?: Record<string, unknown>;
  componentPropertyMap?: Record<string, string>;
  componentKey?: string;
  componentContext?: string;
  contextType?: string;
}

/**
 * Plugin definition
 */
export interface IPlugin {
  id: string;
  nameSpace: string;
  name: string;
  version: string;
  description?: string;
  platform?: string;
  uri?: string;
  mimeType?: string;
  loader?: string;
  options?: Record<string, unknown>;
  enabled?: boolean;
  roles?: string[];
}

/**
 * API Status response from the server
 */
export interface IApiStatus {
  // Application info
  id?: string;
  applicationName?: string;
  applicationAvatar?: string;
  applicationRoles?: string[];
  when?: string;
  status: string;
  
  // User context
  loggedIn?: ILoggedInContext;
  
  // Theme
  theme?: string;
  activeTheme?: IActiveTheme;
  themes?: IThemeSummary[];
  
  // Server
  server?: IServerInfo;
  
  // Configuration
  colorSchemes?: string[];
  
  // Navigation & UI
  routes?: IRoute[];
  menus?: IMenu[];
  messages?: IMessage[];
  navigationComponents?: INavigationComponent[];
  
  // Plugins
  plugins?: IPlugin[];
  
  // Offline indicator
  offline?: boolean;
}

/**
 * Async Message Queue events
 */
export type AMQEventData<TEventData> = TEventData | TEventData[];
export type AMQEventHandler<TEventData> = (data: AMQEventData<TEventData>) => void;

/**
 * Channel definition interface
 */
export interface IChannelDefinition<T> {
  name: string;
  data?: T;
}

/**
 * Async Message Queue interface (React Native compatible)
 */
export interface AsyncMessageQueue {
  $chan: (name: string) => IChannelDefinition<unknown>;
  $sub: {
    def: (eventId: string, func: AMQEventHandler<unknown>, channel?: string) => void;
    transactions: (eventId: string, func: AMQEventHandler<unknown>) => void;
    file: (eventId: string, func: AMQEventHandler<unknown>) => void;
    data: (eventId: string, func: AMQEventHandler<unknown>) => void;
    metrics: (eventId: string, func: AMQEventHandler<unknown>) => void;
    formCommand: (eventId: string, func: AMQEventHandler<unknown>) => void;
    workFlow: (eventId: string, func: AMQEventHandler<unknown>) => void;
    messageHandlerLoaded: (eventId: string, func: AMQEventHandler<unknown>) => void;
    pluginLoaded: (eventId: string, func: AMQEventHandler<unknown>) => void;
  };
  $pub: {
    def: (eventId: string, data: unknown, channel?: string) => void;
    transactions: (eventId: string, data?: AMQEventData<unknown>) => void;
    file: (eventId: string, data?: AMQEventData<unknown>) => void;
    data: (eventId: string, data?: AMQEventData<unknown>) => void;
    metrics: (eventId: string, data?: AMQEventData<unknown>) => void;
    formCommand: (eventId: string, formData: AMQEventData<unknown>) => void;
    workFlow: (eventId: string, data: AMQEventData<unknown>) => void;
    messageHandlerLoaded: (eventId: string, data: AMQEventData<unknown>) => void;
    pluginLoaded: (eventId: string, data: AMQEventData<unknown>) => void;
  };
  onTransactionEvent: (eventId: string, func: AMQEventHandler<unknown>) => void;
  onFileEvent: (eventId: string, func: AMQEventHandler<unknown>) => void;
  onDataEvent: (eventId: string, func: AMQEventHandler<unknown>) => void;
  onMetricEvent: (eventId: string, func: AMQEventHandler<unknown>) => void;
  onFormCommandEvent: (eventId: string, func: AMQEventHandler<unknown>) => void;
  onMessageHandlerLoaded: (eventId: string, func: AMQEventHandler<unknown>) => void;
  onReactoryPluginLoaded: (eventId: string, func: AMQEventHandler<unknown>) => void;
  onReactoryPluginEvent: (eventId: string, func: AMQEventHandler<unknown>) => void;
  raiseTransactionEvent: (eventId: string, data?: AMQEventData<unknown>) => void;
  raiseFileEvent: (eventId: string, data?: AMQEventData<unknown>) => void;
  raiseDataEvent: (eventId: string, data?: AMQEventData<unknown>) => void;
  raiseMetricEvent: (eventId: string, data?: AMQEventData<unknown>) => void;
  raiseFormCommand: (eventId: string, formData: AMQEventData<unknown>) => void;
  raiseWorkFlowEvent: (eventId: string, data: AMQEventData<unknown>) => void;
  raiseMessageHandlerLoadedEvent: (eventId: string, data: AMQEventData<unknown>) => void;
  raiseReactoryPluginEvent: (eventId: string, data: AMQEventData<unknown>) => void;
}

/**
 * Reactory API utilities interface (React Native compatible)
 */
export interface IReactoryApiUtils {
  omitDeep: (obj: unknown, key?: string) => unknown;
  queryString: {
    parse: (queryString: string) => object;
    stringify: (props: object) => string;
  };
  hashCode: (inputString: string) => number;
  componentPartsFromFqn: (fqn: string) => {
    name: string;
    nameSpace: string;
    version: string;
  };
  componentFqn: (component: IComponentFqnDefinition) => string;
  pluginDefinitionValid: (pluginDef: any) => boolean;
  moment: any; // moment library
  objectMapper: any; // object mapper utility
  template: (templateString: string, templateOptions?: any) => any;
  templateObject: <T>(objectMap: any, props: unknown) => T;
  humanNumber: any;
  nil: (o: unknown) => boolean;
  nilStr: (s: string) => boolean;
  inspector: {
    sanitize: (sanitizeSchema: unknown, data: unknown) => void;
    validate: (validationSchema: unknown, data: unknown) => unknown;
  };
  gql: any; // GraphQL tag function
  humanDate: any;
  slugify: (text: string, limit?: number) => string;
  deepEquals: (a: unknown, b: unknown, ca?: unknown[], cb?: unknown[]) => boolean;
  lodash: any; // Lodash library
  classNames: any; // classNames utility
  uuid: any; // UUID generator
  collectData: <T>(forms: unknown[], shape: unknown) => T;
  localForage: any; // LocalForage for storage
  isEmail: (email: string) => boolean;
  isValidPassword: (passw: string) => boolean;
}

/**
 * Main ReactorySDK interface - React Native compatible clone of PWA ReactoryApi
 */
export interface IReactorySDK {
  // Core properties
  $windowSize: IWindowSizeSpec | null;
  $user: any;
  history: any;
  params: any;
  queries: any;
  mutations: any;
  props: object;
  componentRegister: IReactoryComponentRegister;
  client: ApolloClient<NormalizedCacheObject>;
  
  // Navigation (React Native compatible)
  navigation: ReactoryNavigateFunction;
  location: ReactoryLocation;
  
  // Authentication methods
  login: (username: string, password: string) => Promise<ILoginResult>;
  register: (username: string, password: string) => void;
  reset: (email: string, password: string) => void;
  forgot: (email: string) => void;
  logout: (refreshStatus?: boolean) => Promise<void>;
  
  // Logging methods
  log: (message: string, params?: unknown, kind?: string) => void;
  debug: (message: string, params?: unknown) => void;
  warning: (message: string, params?: unknown) => void;
  error: (message: string, params?: unknown) => void;
  info: (message: string, params?: unknown) => void;
  
  // Utilities
  utils: IReactoryApiUtils;
  companyWithId: (id: string) => Promise<any>;
  $func: { [key: string]: (kwargs: unknown[]) => unknown; };
  rest: object | null;
  
  // Token management
  tokenValidated: boolean;
  lastValidation: number;
  tokenValid: boolean;
  getAuthToken: () => string | null;
  setAuthToken: (token: string) => void;
  validateToken: (token: string) => void;
  
  // User management
  getAvatar: (profile: any, alt?: string) => string;
  getOrganizationLogo: (organizationId: string, file: string) => string;
  getUserFullName: (user: any) => string;
  getUser: () => any;
  setUser: (user: any) => void;
  isAnon: () => boolean;
  
  // Application configuration
  CDN_ROOT: string;
  API_ROOT: string;
  CLIENT_KEY: string;
  CLIENT_PWD: string;
  
  // Forms and schemas
  formSchemas: any[];
  formSchemaMap: {
    [key: string]: { 
      form: any;
      lastFetch: Date;
      hash: number;
      index: number;
    }
  };
  formValidationMaps: any;
  formTranslationMaps: any;
  formSchemaLastFetch: Date | null;
  forms: (bypassCache?: boolean) => Promise<any[]>;
  form: (id: string, onFormUpdated?: (formDef: any, error?: Error) => void, options?: any) => any;
  
  // Assets
  assets: {
    logo: string;
    avatar: string;
    icons: {
      16: string;
      32: string;
      44: string;
      64: string;
      144: string;
      192: string;
      512: string;
    };
  } | null;
  
  // Message queue
  amq: AsyncMessageQueue | null;
  
  // Statistics
  statistics: any;
  stat: (key: string, statistic: unknown) => void;
  flushstats: (save: boolean) => void;
  publishstats: () => void;
  
  // Form instances
  __form_instances: any;
  trackFormInstance: (formInstance: unknown) => void;
  
  // Internal properties
  flushIntervalTimer: any;
  __REACTORYAPI: boolean;
  publishingStats: boolean;
  reduxStore: any;
  muiTheme: any; // Will be React Native Paper theme
  
  // Query handling
  queryObject: any;
  queryString: any;
  objectToQueryString: (obj: unknown) => string;
  
  // Cache management
  clearCache: () => void;
  clearStoreAndCache: () => void;
  
  // WebSocket/Network
  ws_link: any;
  $development_mode: boolean;
  __uuid: string;
  
  // Internationalization
  i18n: any;
  
  // Core SDK methods
  init: () => Promise<void>;
  getSizeSpec: () => IWindowSizeSpec;
  
  // Navigation
  goto: (where: string, state?: unknown) => void;
  
  // Notifications (React Native compatible)
  createNotification: (title: string, notificationProperties: any) => void;
  
  // Function registration
  registerFunction: (fqn: string, functionReference: Function, requiresApi?: boolean, signature?: string) => void;
  
  // GraphQL operations
  graphqlMutation: <T, V>(
    mutation: DocumentNode | string,
    variables: V,
    options?: any,
    refetchQueries?: any[]
  ) => Promise<FetchResult<T>>;
  
  graphqlQuery: <T, V>(
    query: DocumentNode | string,
    variables: V,
    options?: any,
    queryDefinition?: any
  ) => Promise<ApolloQueryResult<T>>;
  
  // Component management
  registerComponent: (
    fqn: string,
    component: any,
    options?: {
      tags?: string[];
      roles?: string[];
      wrapWithApi?: boolean;
      connectors?: any[];
      componentType?: string;
      errorBoundary?: boolean;
    }
  ) => void;
  
  getComponent: <T>(fqn: string) => T;
  getComponents: <TComponents>(componentFqns?: any[]) => TComponents;
  getComponentsByType: (componentType?: string) => IReactoryComponentRegister;
  getGlobalComponents: () => any;
  getNotFoundComponent: (notFoundComponent?: string) => any;
  getNotAllowedComponent: (notAllowedComponentFqn?: string) => any;
  
  // Component rendering (React Native compatible)
  loadComponent: (Component: any, props: unknown, target: unknown) => void;
  loadComponentWithFQN: (fqn: string, props: unknown, target: unknown) => void;
  renderForm: (componentView: unknown, wrap?: boolean) => unknown;
  reactoryForm: (form: any) => any; // React Native element
  
  // Modal management (React Native compatible)
  showModalWithComponent: (
    title: string,
    ComponentToMount: any,
    props: any,
    modalProps?: any,
    domNode?: any,
    theme?: boolean,
    callback?: any
  ) => void;
  
  showModalWithComponentFqn: (
    componentFqn: string,
    title?: string,
    props?: any,
    modalProps?: any,
    domNode?: any,
    theme?: boolean,
    callback?: any
  ) => void;
  
  // Storage management
  storeObjectWithKey: (key: string, objectToStore: any, indexDB?: boolean, cb?: (err: any) => void) => Promise<void>;
  readObjectWithKey: (key: string, indexDB?: boolean) => Promise<any>;
  deleteObjectWithKey: (key: string, indexDB?: boolean) => Promise<void>;
  
  // API status
  status: (options?: IApiStatusRequestOptions) => Promise<any>;
  afterLogin: (loginResult: ILoginResult) => Promise<any>;
  
  // Workflow and commands
  raiseFormCommand: (commandId: string, commandDef: any, formProps: any) => Promise<void>;
  startWorkFlow: (workFlowId: string, data: any) => void;
  onFormCommandEvent: (commandId: string, func: any) => void;
  
  // Role management
  hasRole: (
    itemRoles?: string[],
    userRoles?: string[] | null,
    organization?: any,
    business_unit?: any,
    user_memberships?: any[]
  ) => boolean;
  
  addRole: (user: any, organization: any, role?: string) => void;
  removeRole: (user: any, organization: any, role?: string) => void;
  
  // Theme and UI
  getTheme: () => any;
  getThemeMode: () => string;
  getRoutes: () => any;
  getMenus: () => any;
  getApplicationRoles: () => string[];
  
  // User credentials
  getLastUserEmail: () => string;
  setLastUserEmail: (email: string) => void;
  saveUserLoginCredentials: (provider: string, props: any) => void;
  getUserLoginCredentials: (provider: string) => any;
  
  // Development mode
  setDevelopmentMode: (mode?: boolean) => void;
  isDevelopmentMode: () => boolean;
  
  // Context management
  setViewContext: (context?: any) => void;
  getViewContext: () => any;
  
  // Plugin management
  injectResource: (resource: any) => void;
  injectPlugin: (plugin: any) => void;
  
  // Validation and forms
  setFormTranslationMaps: (maps: any) => void;
  setFormValidationMaps: (maps: any) => void;
  extendClientResolver: (resolvers: any) => void;
  
  // Password reset
  resetPassword: ({ password, confirmPassword }: { password: string; confirmPassword: string }) => void;
  
  // Hydration
  hydrate: () => Promise<void>;
  
  // Index signature for extensibility
  [key: string]: unknown;
}

// ============================================================================
// Core SDK Configuration
// ============================================================================

/**
 * Main configuration interface for ReactorySDK initialization
 */
export interface ReactorySDKConfig {
  /** GraphQL API endpoint URL */
  apiEndpoint: string;
  
  /** Client identifier for multi-tenant support */
  clientKey: string;
  
  /** Optional initial authentication token */
  authToken?: string;
  
  /** Theme identifier for UI styling */
  theme?: string;
  
  /** Enable debug logging and additional developer features */
  debug?: boolean;
  
  /** Enable offline mode and data synchronization */
  offline?: boolean;
  
  /** Plugin configurations for extending functionality */
  plugins?: PluginConfig[];
}

/**
 * Plugin configuration for extending SDK functionality
 */
export interface PluginConfig {
  /** Unique plugin identifier */
  id: string;
  
  /** Plugin name for display purposes */
  name: string;
  
  /** Plugin version */
  version: string;
  
  /** Plugin entry point or component */
  entry: string | ReactComponentType;
  
  /** Plugin dependencies */
  dependencies?: string[];
  
  /** Plugin-specific configuration */
  config?: Record<string, any>;
  
  /** Whether to load plugin immediately or on-demand */
  lazy?: boolean;
}

// ============================================================================
// User and Authentication
// ============================================================================

/**
 * User profile information
 */
export interface User {
  /** Unique user identifier */
  id: string;
  
  /** User email address */
  email: string;
  
  /** User first name */
  firstName: string;
  
  /** User last name */
  lastName: string;
  
  /** User roles for authorization */
  roles: string[];
  
  /** Specific permissions granted to user */
  permissions: string[];
  
  /** User avatar image URL */
  avatar?: string;
  
  /** User preferences and settings */
  preferences?: UserPreferences;
  
  /** User organization memberships */
  memberships?: UserMembership[];
  
  /** Active organization context */
  activeOrganization?: Organization;
  
  /** Active business unit context */
  activeBusinessUnit?: BusinessUnit;
}

/**
 * User preferences and personalization settings
 */
export interface UserPreferences {
  /** Preferred language/locale */
  language: string;
  
  /** Preferred timezone */
  timezone: string;
  
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto';
  
  /** Notification preferences */
  notifications: NotificationPreferences;
  
  /** Custom user settings */
  custom?: Record<string, any>;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  /** Enable email notifications */
  email: boolean;
  
  /** Enable push notifications */
  push: boolean;
  
  /** Enable in-app notifications */
  inApp: boolean;
  
  /** Specific notification type preferences */
  types: Record<string, boolean>;
}

/**
 * User membership in organization
 */
export interface UserMembership {
  /** Membership ID */
  id: string;
  
  /** Organization reference */
  organization: Organization;
  
  /** Business unit reference */
  businessUnit?: BusinessUnit;
  
  /** Membership roles */
  roles: string[];
  
  /** Membership status */
  status: 'active' | 'inactive' | 'pending';
}

/**
 * Organization entity
 */
export interface Organization {
  /** Organization ID */
  id: string;
  
  /** Organization name */
  name: string;
  
  /** Organization code/slug */
  code: string;
  
  /** Organization logo URL */
  logo?: string;
  
  /** Organization settings */
  settings?: Record<string, any>;
}

/**
 * Business unit entity
 */
export interface BusinessUnit {
  /** Business unit ID */
  id: string;
  
  /** Business unit name */
  name: string;
  
  /** Business unit code */
  code: string;
  
  /** Parent organization */
  organization: Organization;
}

/**
 * Authentication credentials for login
 */
export interface AuthCredentials {
  /** User email address */
  email: string;
  
  /** User password */
  password: string;
  
  /** Remember login for extended session */
  rememberMe?: boolean;
  
  /** Two-factor authentication code */
  twoFactorCode?: string;
}

/**
 * Authentication result after successful login
 */
export interface AuthResult {
  /** Authentication token */
  token: string;
  
  /** Token expiration timestamp */
  expiresAt: Date;
  
  /** Refresh token for token renewal */
  refreshToken?: string;
  
  /** Authenticated user profile */
  user: User;
}

// ============================================================================
// Component Management
// ============================================================================

/**
 * Options for component registration
 */
export interface ComponentOptions {
  /** Component namespace for organization */
  nameSpace?: string;
  
  /** Component version */
  version?: string;
  
  /** Required component dependencies */
  dependencies?: string[];
  
  /** Enable lazy loading for performance */
  lazy?: boolean;
  
  /** Additional component metadata */
  metadata?: Record<string, any>;
  
  /** Component description */
  description?: string;
  
  /** Component tags for categorization */
  tags?: string[];
}

/**
 * Registered component information
 */
export interface RegisteredComponent {
  /** Component namespace */
  nameSpace: string;
  /** Component name/identifier */
  name: string;
  /** Component version */
  version: string;
  
  /** React component */
  component: ReactComponentType;
  
  /** Registration options */
  options: ComponentOptions;
  
  /** Registration timestamp */
  registeredAt: Date;
  
  /** Whether component is currently loaded */
  loaded: boolean;
}

/**
 * Component registry interface
 */
export interface ComponentRegistry {
  /** Register a component using FQN (nameSpace.name@version) */
  register(fqn: string, component: ReactComponentType, options?: ComponentOptions): void;
  
  /** Get a registered component by FQN */
  get(fqn: string): ReactComponentType | null;
  
  /** Get multiple components */
  getAll(): Map<string, RegisteredComponent>;
  
  /** Check if component exists by FQN */
  has(fqn: string): boolean;
  
  /** Remove a component by FQN */
  unregister(fqn: string): boolean;
  
  /** Clear all components */
  clear(): void;
  
  /** Get components by namespace */
  getByNamespace(nameSpace: string): RegisteredComponent[];
  
  /** Get components by tag */
  getByTag(tag: string): RegisteredComponent[];
}

// ============================================================================
// Form Management
// ============================================================================

/**
 * JSON Schema definition for form fields
 */
export interface JSONSchema {
  /** Schema type */
  type: string;
  
  /** Schema properties for object types */
  properties?: Record<string, JSONSchema>;
  
  /** Required field names */
  required?: string[];
  
  /** Field title/label */
  title?: string;
  
  /** Field description */
  description?: string;
  
  /** Default value */
  default?: any;
  
  /** Enumerated values */
  enum?: any[];
  
  /** Minimum value/length */
  minimum?: number;
  
  /** Maximum value/length */
  maximum?: number;
  
  /** String pattern validation */
  pattern?: string;
  
  /** Additional schema properties */
  [key: string]: any;
}

/**
 * UI Schema for form field rendering
 */
export interface UISchema {
  /** UI widget type */
  'ui:widget'?: string;
  
  /** UI field options */
  'ui:options'?: Record<string, any>;
  
  /** Field order */
  'ui:order'?: string[];
  
  /** Field visibility */
  'ui:disabled'?: boolean;
  
  /** Field read-only status */
  'ui:readonly'?: boolean;
  
  /** Field placeholder text */
  'ui:placeholder'?: string;
  
  /** Field help text */
  'ui:help'?: string;
  
  /** Additional UI properties */
  [key: string]: any;
}

/**
 * Form validation rule
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string;
  
  /** Target field path */
  field: string;
  
  /** Validation type */
  type: 'required' | 'pattern' | 'range' | 'custom';
  
  /** Rule configuration */
  config: Record<string, any>;
  
  /** Error message template */
  message: string;
  
  /** Rule conditions */
  conditions?: ValidationCondition[];
}

/**
 * Validation condition for conditional rules
 */
export interface ValidationCondition {
  /** Field to check */
  field: string;
  
  /** Comparison operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  
  /** Value to compare against */
  value: any;
}

/**
 * Complete form schema definition
 */
export interface FormSchema {
  /** Unique form identifier */
  id: string;
  
  /** Form name/title */
  name: string;
  
  /** Form version */
  version: string;
  
  /** JSON Schema for form structure */
  schema: JSONSchema;
  
  /** UI Schema for form rendering */
  uiSchema?: UISchema;
  
  /** Form validation rules */
  validationRules?: ValidationRule[];
  
  /** Form dependencies */
  dependencies?: string[];
  
  /** Form metadata */
  metadata?: FormMetadata;
  
  /** Form submission configuration */
  submission?: FormSubmissionConfig;
}

/**
 * Form metadata information
 */
export interface FormMetadata {
  /** Form description */
  description?: string;
  
  /** Form tags */
  tags?: string[];
  
  /** Form category */
  category?: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Form author */
  author?: string;
  
  /** Form permissions */
  permissions?: FormPermissions;
}

/**
 * Form permissions configuration
 */
export interface FormPermissions {
  /** Roles that can view the form */
  view?: string[];
  
  /** Roles that can edit the form */
  edit?: string[];
  
  /** Roles that can submit the form */
  submit?: string[];
  
  /** Roles that can delete form data */
  delete?: string[];
}

/**
 * Form submission configuration
 */
export interface FormSubmissionConfig {
  /** GraphQL mutation for submission */
  mutation: string;
  
  /** Submission endpoint (alternative to mutation) */
  endpoint?: string;
  
  /** HTTP method for endpoint submission */
  method?: 'POST' | 'PUT' | 'PATCH';
  
  /** Data transformation before submission */
  transform?: string;
  
  /** Success redirect configuration */
  onSuccess?: FormActionConfig;
  
  /** Error handling configuration */
  onError?: FormActionConfig;
}

/**
 * Form action configuration
 */
export interface FormActionConfig {
  /** Action type */
  type: 'redirect' | 'message' | 'callback';
  
  /** Action configuration */
  config: Record<string, any>;
}

/**
 * Form data for submission
 */
export interface FormData {
  /** Field values */
  [fieldName: string]: any;
}

/**
 * Form submission result
 */
export interface SubmissionResult {
  /** Whether submission was successful */
  success: boolean;
  
  /** Returned data from submission */
  data?: any;
  
  /** Validation or submission errors */
  errors?: FormError[];
  
  /** Success message */
  message?: string;
  
  /** Submission metadata */
  metadata?: SubmissionMetadata;
}

/**
 * Form error information
 */
export interface FormError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Field path where error occurred */
  field?: string;
  
  /** Additional error context */
  context?: Record<string, any>;
}

/**
 * Form submission metadata
 */
export interface SubmissionMetadata {
  /** Submission timestamp */
  submittedAt: Date;
  
  /** Submission ID */
  submissionId?: string;
  
  /** User who submitted */
  submittedBy?: string;
  
  /** Processing time in milliseconds */
  processingTime?: number;
}

// ============================================================================
// Configuration Management
// ============================================================================

/**
 * Client-specific configuration
 */
export interface ClientConfig {
  /** Client key identifier */
  clientKey: string;
  
  /** Client display name */
  name: string;
  
  /** Client description */
  description?: string;
  
  /** Theme configuration */
  theme: ThemeConfig;
  
  /** Feature flags configuration */
  features: FeatureFlags;
  
  /** API configuration */
  api: ApiConfig;
  
  /** Plugin configurations */
  plugins: PluginConfig[];
  
  /** Navigation configuration */
  navigation?: NavigationConfig;
  
  /** Security configuration */
  security?: SecurityConfig;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Primary theme colors */
  primary: ColorPalette;
  
  /** Secondary theme colors */
  secondary: ColorPalette;
  
  /** Typography configuration */
  typography: TypographyConfig;
  
  /** Spacing configuration */
  spacing: SpacingConfig;
  
  /** Component overrides */
  components?: ComponentThemeOverrides;
  
  /** Custom theme properties */
  custom?: Record<string, any>;
}

/**
 * Color palette definition
 */
export interface ColorPalette {
  /** Light shade */
  light: string;
  
  /** Main color */
  main: string;
  
  /** Dark shade */
  dark: string;
  
  /** Contrast text color */
  contrastText: string;
}

/**
 * Typography configuration
 */
export interface TypographyConfig {
  /** Font family */
  fontFamily: string;
  
  /** Font size scale */
  fontSize: Record<string, number>;
  
  /** Font weight variants */
  fontWeight: Record<string, number>;
  
  /** Line height values */
  lineHeight: Record<string, number>;
}

/**
 * Spacing configuration
 */
export interface SpacingConfig {
  /** Base spacing unit */
  unit: number;
  
  /** Spacing scale multipliers */
  scale: number[];
}

/**
 * Component theme overrides
 */
export interface ComponentThemeOverrides {
  /** Button component overrides */
  Button?: Record<string, any>;
  
  /** Card component overrides */
  Card?: Record<string, any>;
  
  /** Additional component overrides */
  [componentName: string]: Record<string, any> | undefined;
}

/**
 * Feature flags configuration
 */
export interface FeatureFlags {
  /** Enable offline functionality */
  offline?: boolean;
  
  /** Enable push notifications */
  pushNotifications?: boolean;
  
  /** Enable biometric authentication */
  biometricAuth?: boolean;
  
  /** Enable analytics tracking */
  analytics?: boolean;
  
  /** Custom feature flags */
  [featureName: string]: boolean | undefined;
}

/**
 * API configuration
 */
export interface ApiConfig {
  /** Base API URL */
  baseUrl: string;
  
  /** GraphQL endpoint */
  graphqlEndpoint: string;
  
  /** WebSocket endpoint for subscriptions */
  websocketEndpoint?: string;
  
  /** API timeout in milliseconds */
  timeout: number;
  
  /** Retry configuration */
  retry: RetryConfig;
  
  /** Cache configuration */
  cache: CacheConfig;
}

/**
 * Retry configuration for API requests
 */
export interface RetryConfig {
  /** Maximum number of retries */
  maxRetries: number;
  
  /** Retry delay in milliseconds */
  delay: number;
  
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  
  /** HTTP status codes to retry */
  retryOn: number[];
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Default cache TTL in seconds */
  defaultTtl: number;
  
  /** Maximum cache size in bytes */
  maxSize: number;
  
  /** Cache strategy */
  strategy: 'memory' | 'storage' | 'hybrid';
  
  /** Cache invalidation rules */
  invalidation: CacheInvalidationConfig;
}

/**
 * Cache invalidation configuration
 */
export interface CacheInvalidationConfig {
  /** Auto-invalidate after TTL */
  autoInvalidate: boolean;
  
  /** Manual invalidation patterns */
  patterns: string[];
  
  /** Invalidation on app version change */
  onVersionChange: boolean;
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  /** Default route */
  defaultRoute: string;
  
  /** Route definitions */
  routes: RouteConfig[];
  
  /** Navigation theme */
  theme: NavigationTheme;
  
  /** Deep linking configuration */
  deepLinking: DeepLinkingConfig;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  /** Route path */
  path: string;
  
  /** Route name */
  name: string;
  
  /** Component to render */
  component: string;
  
  /** Required permissions */
  permissions?: string[];
  
  /** Route parameters */
  params?: Record<string, any>;
  
  /** Child routes */
  children?: RouteConfig[];
}

/**
 * Navigation theme configuration
 */
export interface NavigationTheme {
  /** Header background color */
  headerBackground: string;
  
  /** Header text color */
  headerText: string;
  
  /** Tab bar background */
  tabBarBackground: string;
  
  /** Active tab color */
  activeTabColor: string;
  
  /** Inactive tab color */
  inactiveTabColor: string;
}

/**
 * Deep linking configuration
 */
export interface DeepLinkingConfig {
  /** URL prefix for deep links */
  prefix: string;
  
  /** Supported URL schemes */
  schemes: string[];
  
  /** Route mapping for deep links */
  routes: Record<string, string>;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Token storage strategy */
  tokenStorage: 'keychain' | 'secure_storage';
  
  /** Session timeout in minutes */
  sessionTimeout: number;
  
  /** Require biometric authentication */
  requireBiometric: boolean;
  
  /** Certificate pinning configuration */
  certificatePinning?: CertificatePinningConfig;
}

/**
 * Certificate pinning configuration
 */
export interface CertificatePinningConfig {
  /** Enable certificate pinning */
  enabled: boolean;
  
  /** Pinned certificates */
  certificates: string[];
  
  /** Allow self-signed certificates in debug */
  allowSelfSigned: boolean;
}

// ============================================================================
// Network and Status Management
// ============================================================================

/**
 * Network connectivity status
 */
export interface NetworkStatus {
  /** Whether device is connected to network */
  isConnected: boolean;
  
  /** Type of network connection */
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  
  /** Whether internet is reachable */
  isInternetReachable: boolean;
  
  /** Connection strength (0-1) */
  strength?: number;
  
  /** Whether connection is expensive (cellular data) */
  isExpensive?: boolean;
}

/**
 * API service status
 */
export interface ApiStatus {
  /** Whether API is online and responding */
  online: boolean;
  
  /** API version information */
  version: string;
  
  /** API response latency in milliseconds */
  latency?: number;
  
  /** Last successful connection timestamp */
  lastUpdated: Date;
  
  /** Service health information */
  health?: ServiceHealth;
  
  /** Available features */
  features?: string[];
}

/**
 * Service health information
 */
export interface ServiceHealth {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** Individual service statuses */
  services: Record<string, ServiceStatus>;
  
  /** Health check timestamp */
  timestamp: Date;
}

/**
 * Individual service status
 */
export interface ServiceStatus {
  /** Service health status */
  status: 'up' | 'down' | 'degraded';
  
  /** Response time in milliseconds */
  responseTime?: number;
  
  /** Error message if down */
  error?: string;
}

// ============================================================================
// Error Management
// ============================================================================

/**
 * SDK error codes
 */
export enum ReactorySDKErrorCode {
  // Initialization errors
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CONFIGURATION_INVALID = 'CONFIGURATION_INVALID',
  
  // Authentication errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Component errors
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  COMPONENT_REGISTRATION_FAILED = 'COMPONENT_REGISTRATION_FAILED',
  COMPONENT_LOAD_FAILED = 'COMPONENT_LOAD_FAILED',
  
  // Form errors
  FORM_SCHEMA_NOT_FOUND = 'FORM_SCHEMA_NOT_FOUND',
  FORM_SCHEMA_INVALID = 'FORM_SCHEMA_INVALID',
  FORM_VALIDATION_FAILED = 'FORM_VALIDATION_FAILED',
  FORM_SUBMISSION_FAILED = 'FORM_SUBMISSION_FAILED',
  
  // Network errors
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  REQUEST_FAILED = 'REQUEST_FAILED',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  
  // Storage errors
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED'
}

/**
 * Custom SDK error class
 */
export interface ReactorySDKError extends Error {
  /** Error code for categorization */
  code: ReactorySDKErrorCode;
  
  /** Additional error context */
  context?: Record<string, any>;
  
  /** Whether error is recoverable */
  recoverable: boolean;
  
  /** Timestamp when error occurred */
  timestamp: Date;
  
  /** Original error if this wraps another error */
  originalError?: Error;
}

/**
 * Log levels for SDK logging
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

// ============================================================================
// Event System
// ============================================================================

/**
 * SDK event names - matches PWA client for compatibility
 */
export const ReactorySDKEvents = {
  // Lifecycle events
  INITIALIZING: 'initializing',
  INITIALIZED: 'initialized',
  INITIALIZATION_FAILED: 'initialization_failed',
  
  // Authentication events
  AUTHENTICATION_STARTED: 'authentication_started',
  AUTHENTICATION_SUCCESS: 'authentication_success',
  AUTHENTICATION_FAILED: 'authentication_failed',
  LOGOUT_STARTED: 'logout_started',
  LOGOUT_SUCCESS: 'logout_success',
  
  // Component events
  COMPONENT_REGISTERED: 'component_registered',
  COMPONENT_LOADED: 'component_loaded',
  COMPONENT_LOAD_FAILED: 'component_load_failed',
  
  // Form events
  FORM_SCHEMA_LOADED: 'form_schema_loaded',
  FORM_SCHEMA_LOAD_FAILED: 'form_schema_load_failed',
  FORM_SUBMISSION_STARTED: 'form_submission_started',
  FORM_SUBMISSION_SUCCESS: 'form_submission_success',
  FORM_SUBMISSION_FAILED: 'form_submission_failed',
  
  // Network events
  NETWORK_STATUS_CHANGED: 'network_status_changed',
  API_STATUS_UPDATED: 'api_status_updated',
  
  // Theme events
  THEME_CHANGED: 'theme_changed',
  
  // Navigation events
  ROUTE_CHANGED: 'route_changed',
  
  // Error events
  ERROR: 'error',
  WARNING: 'warning',
  
  // User events
  USER_UPDATED: 'user_updated',
  PERMISSIONS_CHANGED: 'permissions_changed',
  
  // Configuration events
  CONFIG_LOADED: 'config_loaded',
  CONFIG_UPDATED: 'config_updated'
} as const;

/**
 * Event listener function type
 */
export type EventListener<T = any> = (data?: T) => void;

/**
 * Event data interfaces for type safety
 */
export interface AuthenticationEventData {
  user?: User;
  error?: ReactorySDKError;
}

export interface ComponentEventData {
  name: string;
  component?: ReactComponentType;
  error?: ReactorySDKError;
}

export interface FormEventData {
  formId: string;
  schema?: FormSchema;
  data?: FormData;
  result?: SubmissionResult;
  error?: ReactorySDKError;
}

export interface NetworkEventData {
  status: NetworkStatus;
  previousStatus?: NetworkStatus;
}

export interface ApiStatusEventData {
  status: ApiStatus;
  previousStatus?: ApiStatus;
}

// ============================================================================
// Manager Interfaces
// ============================================================================

/**
 * Authentication manager interface
 */
export interface AuthenticationManager {
  /** Initialize the authentication manager */
  initialize(): Promise<void>;
  
  /** Authenticate user with credentials */
  authenticate(credentials: AuthCredentials): Promise<User>;
  
  /** Logout current user */
  logout(): Promise<void>;
  
  /** Refresh authentication token */
  refreshToken(): Promise<string>;
  
  /** Get stored authentication token */
  getStoredToken(): Promise<string | null>;
  
  /** Store authentication token securely */
  storeToken(token: string): Promise<void>;
  
  /** Clear stored authentication token */
  clearToken(): Promise<void>;
  
  /** Check if user is authenticated */
  isAuthenticated(): boolean;
  
  /** Get current user */
  getCurrentUser(): User | null;
}

/**
 * Form schema manager interface
 */
export interface FormSchemaManager {
  /** Initialize the form schema manager */
  initialize(): Promise<void>;
  
  /** Load form schema from server */
  loadSchema(formId: string): Promise<FormSchema>;
  
  /** Get cached form schema */
  getCachedSchema(formId: string): FormSchema | null;
  
  /** Cache form schema */
  cacheSchema(formId: string, schema: FormSchema): void;
  
  /** Clear schema cache */
  clearCache(): void;
  
  /** Validate form schema */
  validateSchema(schema: FormSchema): boolean;
  
  /** Submit form data */
  submitForm(formId: string, data: FormData): Promise<SubmissionResult>;
  
  /** Get all cached schemas */
  getAllSchemas(): FormSchema[];
}

/**
 * Configuration manager interface
 */
export interface ConfigurationManager {
  /** Initialize the configuration manager */
  initialize(): Promise<void>;
  
  /** Load client configuration */
  load(clientKey: string): Promise<ClientConfig>;
  
  /** Get configuration value */
  get<T>(key: string): T | undefined;
  
  /** Set configuration value */
  set(key: string, value: any): void;
  
  /** Persist configuration to storage */
  persist(): Promise<void>;
  
  /** Clear all configuration */
  clear(): Promise<void>;
  
  /** Get current client configuration */
  getClientConfig(): ClientConfig | null;
  
  /** Update client configuration */
  updateClientConfig(config: Partial<ClientConfig>): Promise<void>;
}

/**
 * Network manager interface
 */
export interface NetworkManager {
  /** Initialize the network manager */
  initialize(): Promise<void>;
  
  /** Get current network status */
  getNetworkStatus(): NetworkStatus;
  
  /** Get API status */
  getApiStatus(): ApiStatus;
  
  /** Check API connectivity */
  checkApiConnectivity(): Promise<boolean>;
  
  /** Start monitoring network changes */
  startMonitoring(): void;
  
  /** Stop monitoring network changes */
  stopMonitoring(): void;
  
  /** Execute GraphQL query */
  query<T>(query: DocumentNode, variables?: any): Promise<T>;
  
  /** Execute GraphQL mutation */
  mutate<T>(mutation: DocumentNode, variables?: any): Promise<T>;
  
  /** Get Apollo Client instance */
  getApolloClient(): ApolloClient<any>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract event names from ReactorySDKEvents
 */
export type ReactorySDKEventName = typeof ReactorySDKEvents[keyof typeof ReactorySDKEvents];

/**
 * Promise that can be cancelled
 */
export interface CancellablePromise<T> extends Promise<T> {
  cancel(): void;
  isCancelled(): boolean;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page number (0-based) */
  page: number;
  
  /** Number of items per page */
  limit: number;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Response data */
  data: T[];
  
  /** Pagination metadata */
  pagination: PaginationMetadata;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Current page number */
  page: number;
  
  /** Items per page */
  limit: number;
  
  /** Total number of items */
  total: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Whether there is a next page */
  hasNext: boolean;
  
  /** Whether there is a previous page */
  hasPrevious: boolean;
}

// ============================================================================
// ReactorySDK Class Definition
// ============================================================================

/**
 * React Native EventEmitter interface (compatible with React Native's EventEmitter)
 */
export interface ReactoryEventEmitter {
  on(eventName: string, listener: (...args: any[]) => void): this;
  off(eventName: string, listener: (...args: any[]) => void): this;
  emit(eventName: string, ...args: any[]): boolean;
  removeAllListeners(eventName?: string): this;
  listenerCount(eventName: string): number;
}

/**
 * ReactorySDK Event Names - Events that can be emitted by the SDK
 */
export const ReactorySDKEventNames = {
  onLogout: 'loggedOut',
  onLogin: 'loggedIn',
  onPluginLoaded: 'onPluginLoaded',
  onApiStatusUpdate: 'onApiStatusUpdate',
  onRouteChanged: 'onRouteChanged',
  onShowNotification: 'onShowNotification',
  onThemeChanged: 'onThemeChanged',
  onHideMenu: 'onHideMenu',
  onShowMenu: 'onShowMenu',
  onComponentRegistered: 'onComponentRegistered',
} as const;

/**
 * Main ReactorySDK class - React Native compatible implementation
 * 
 * This class serves as the main entry point for all Reactory functionality
 * in React Native applications. It extends EventEmitter for event-driven
 * communication and implements the IReactorySDK interface.
 * 
 * Key differences from PWA implementation:
 * - Uses React Native navigation instead of React Router
 * - Uses React Native Paper theme instead of Material-UI
 * - Uses React Native compatible storage (AsyncStorage)
 * - Uses React Native compatible notifications
 * - Excludes DOM-specific functionality
 */
export abstract class ReactorySDK implements IReactorySDK, ReactoryEventEmitter {
  // EventEmitter implementation
  abstract on(eventName: string, listener: (...args: any[]) => void): this;
  abstract off(eventName: string, listener: (...args: any[]) => void): this;
  abstract emit(eventName: string, ...args: any[]): boolean;
  abstract removeAllListeners(eventName?: string): this;
  abstract listenerCount(eventName: string): number;

  // Core properties
  abstract $windowSize: IWindowSizeSpec | null;
  abstract $user: any;
  abstract history: any;
  abstract params: any;
  abstract queries: any;
  abstract mutations: any;
  abstract props: object;
  abstract componentRegister: IReactoryComponentRegister;
  abstract client: ApolloClient<NormalizedCacheObject>;
  
  // Navigation (React Native compatible)
  abstract navigation: ReactoryNavigateFunction;
  abstract location: ReactoryLocation;
  
  // Authentication methods
  abstract login(username: string, password: string): Promise<ILoginResult>;
  abstract register(username: string, password: string): void;
  abstract reset(email: string, password: string): void;
  abstract forgot(email: string): void;
  abstract logout(refreshStatus?: boolean): Promise<void>;
  
  // Logging methods
  abstract log(message: string, params?: unknown, kind?: string): void;
  abstract debug(message: string, params?: unknown): void;
  abstract warning(message: string, params?: unknown): void;
  abstract error(message: string, params?: unknown): void;
  abstract info(message: string, params?: unknown): void;
  
  // Utilities
  abstract utils: IReactoryApiUtils;
  abstract companyWithId(id: string): Promise<any>;
  abstract $func: { [key: string]: (kwargs: unknown[]) => unknown; };
  abstract rest: object | null;
  
  // Token management
  abstract tokenValidated: boolean;
  abstract lastValidation: number;
  abstract tokenValid: boolean;
  abstract getAuthToken(): string | null;
  abstract setAuthToken(token: string): void;
  abstract validateToken(token: string): void;
  
  // User management
  abstract getAvatar(profile: any, alt?: string): string;
  abstract getOrganizationLogo(organizationId: string, file: string): string;
  abstract getUserFullName(user: any): string;
  abstract getUser(): any;
  abstract setUser(user: any): void;
  abstract isAnon(): boolean;
  
  // Application configuration
  abstract CDN_ROOT: string;
  abstract API_ROOT: string;
  abstract CLIENT_KEY: string;
  abstract CLIENT_PWD: string;
  
  // Forms and schemas
  abstract formSchemas: any[];
  abstract formSchemaMap: {
    [key: string]: { 
      form: any;
      lastFetch: Date;
      hash: number;
      index: number;
    }
  };
  abstract formValidationMaps: any;
  abstract formTranslationMaps: any;
  abstract formSchemaLastFetch: Date | null;
  abstract forms(bypassCache?: boolean): Promise<any[]>;
  abstract form(id: string, onFormUpdated?: (formDef: any, error?: Error) => void, options?: any): any;
  
  // Assets
  abstract assets: {
    logo: string;
    avatar: string;
    icons: {
      16: string;
      32: string;
      44: string;
      64: string;
      144: string;
      192: string;
      512: string;
    };
  } | null;
  
  // Message queue
  abstract amq: AsyncMessageQueue | null;
  
  // Statistics
  abstract statistics: any;
  abstract stat(key: string, statistic: unknown): void;
  abstract flushstats(save: boolean): void;
  abstract publishstats(): void;
  
  // Form instances
  abstract __form_instances: any;
  abstract trackFormInstance(formInstance: unknown): void;
  
  // Internal properties
  abstract flushIntervalTimer: any;
  abstract __REACTORYAPI: boolean;
  abstract publishingStats: boolean;
  abstract reduxStore: any;
  abstract muiTheme: any; // Will be React Native Paper theme
  
  // Query handling
  abstract queryObject: any;
  abstract queryString: any;
  abstract objectToQueryString(obj: unknown): string;
  
  // Cache management
  abstract clearCache(): void;
  abstract clearStoreAndCache(): void;
  
  // WebSocket/Network
  abstract ws_link: any;
  abstract $development_mode: boolean;
  abstract __uuid: string;
  
  // Internationalization
  abstract i18n: any;
  
  // Core SDK methods
  abstract init(): Promise<void>;
  abstract getSizeSpec(): IWindowSizeSpec;
  
  // Navigation
  abstract goto(where: string, state?: unknown): void;
  
  // Notifications (React Native compatible)
  abstract createNotification(title: string, notificationProperties: any): void;
  
  // Function registration
  abstract registerFunction(fqn: string, functionReference: Function, requiresApi?: boolean, signature?: string): void;
  
  // GraphQL operations
  abstract graphqlMutation<T, V>(
    mutation: DocumentNode | string,
    variables: V,
    options?: any,
    refetchQueries?: any[]
  ): Promise<FetchResult<T>>;
  
  abstract graphqlQuery<T, V>(
    query: DocumentNode | string,
    variables: V,
    options?: any,
    queryDefinition?: any
  ): Promise<ApolloQueryResult<T>>;
  
  // Component management
  abstract registerComponent(
    fqn: string,
    component: any,
    options?: {
      tags?: string[];
      roles?: string[];
      wrapWithApi?: boolean;
      connectors?: any[];
      componentType?: string;
      errorBoundary?: boolean;
    }
  ): void;
  
  abstract getComponent<T>(fqn: string): T;
  abstract getComponents<TComponents>(componentFqns?: any[]): TComponents;
  abstract getComponentsByType(componentType?: string): IReactoryComponentRegister;
  abstract getGlobalComponents(): any;
  abstract getNotFoundComponent(notFoundComponent?: string): any;
  abstract getNotAllowedComponent(notAllowedComponentFqn?: string): any;
  
  // Component rendering (React Native compatible)
  abstract loadComponent(Component: any, props: unknown, target: unknown): void;
  abstract loadComponentWithFQN(fqn: string, props: unknown, target: unknown): void;
  abstract renderForm(componentView: unknown, wrap?: boolean): unknown;
  abstract reactoryForm(form: any): any; // React Native element
  
  // Modal management (React Native compatible)
  abstract showModalWithComponent(
    title: string,
    ComponentToMount: any,
    props: any,
    modalProps?: any,
    domNode?: any,
    theme?: boolean,
    callback?: any
  ): void;
  
  abstract showModalWithComponentFqn(
    componentFqn: string,
    title?: string,
    props?: any,
    modalProps?: any,
    domNode?: any,
    theme?: boolean,
    callback?: any
  ): void;
  
  // Storage management
  abstract storeObjectWithKey(key: string, objectToStore: any, indexDB?: boolean, cb?: (err: any) => void): Promise<void>;
  abstract readObjectWithKey(key: string, indexDB?: boolean): Promise<any>;
  abstract deleteObjectWithKey(key: string, indexDB?: boolean): Promise<void>;
  
  // API status
  abstract status(options?: IApiStatusRequestOptions): Promise<any>;
  abstract afterLogin(loginResult: ILoginResult): Promise<any>;
  
  // Workflow and commands
  abstract raiseFormCommand(commandId: string, commandDef: any, formProps: any): Promise<void>;
  abstract startWorkFlow(workFlowId: string, data: any): void;
  abstract onFormCommandEvent(commandId: string, func: any): void;
  
  // Role management
  abstract hasRole(
    itemRoles?: string[],
    userRoles?: string[] | null,
    organization?: any,
    business_unit?: any,
    user_memberships?: any[]
  ): boolean;
  
  abstract addRole(user: any, organization: any, role?: string): void;
  abstract removeRole(user: any, organization: any, role?: string): void;
  
  // Theme and UI
  abstract getTheme(): any;
  abstract getThemeMode(): string;
  abstract getRoutes(): any;
  abstract getMenus(): any;
  abstract getApplicationRoles(): string[];
  
  // User credentials
  abstract getLastUserEmail(): string;
  abstract setLastUserEmail(email: string): void;
  abstract saveUserLoginCredentials(provider: string, props: any): void;
  abstract getUserLoginCredentials(provider: string): any;
  
  // Development mode
  abstract setDevelopmentMode(mode?: boolean): void;
  abstract isDevelopmentMode(): boolean;
  
  // Context management
  abstract setViewContext(context?: any): void;
  abstract getViewContext(): any;
  
  // Plugin management
  abstract injectResource(resource: any): void;
  abstract injectPlugin(plugin: any): void;
  
  // Validation and forms
  abstract setFormTranslationMaps(maps: any): void;
  abstract setFormValidationMaps(maps: any): void;
  abstract extendClientResolver(resolvers: any): void;
  
  // Password reset
  abstract resetPassword({ password, confirmPassword }: { password: string; confirmPassword: string }): void;
  
  // Hydration
  abstract hydrate(): Promise<void>;
  
  // Index signature for extensibility
  [key: string]: unknown;
}
