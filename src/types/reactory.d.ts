// React Native specific imports
import EventEmitter from 'eventemitter3';

// Essential third-party types for React Native
export interface ApolloQueryResult<T = any> {
  data?: T;
  error?: any;
  loading: boolean;
  networkStatus: number;
}

export interface FetchResult<T = any> {
  data?: T;
  errors?: any[];
}

// I18n support
export interface I18nFormatOptions {
  [key: string]: any;
}

declare global {
  namespace Reactory {
    /**
     * A basic key value pair interface
     */
    export interface IKeyValuePair<K, V> {
      key: K;
      value: V;
    }

    /**
     * FQN is an alias for string, but we use it to
     * indicate that the string represented needs to adhere
     * to a fully qualified name for a reactory object.
     * @example "system.ComponentA@1.0.0"
     */
    export type FQN = string;

    /**
     * A version string that is used to represent a version.
     * @example "1.0.0" or "1.0.0-alpha" or "1.0.0-beta" etc.
     */
    export type VERSION = string;

    /**
     * FQN Key Value Pair
     */
    export type FQNKVP<V> = IKeyValuePair<FQN, V>;

    /**
     * These are the core roles that are used by the reactory.
     * The roles are used to provide access control to components and are 
     * used in the core system.
     */
    export type REACTORY_CORE_ROLES = "DEVELOPER" | "ADMIN" | "USER" | "ANON";

    /**
     * A user role type, this is essentially a string
     * but we use {@link REACTORY_CORE_ROLES} to provide
     * a set of predefined roles that can be used.
     *
     * The user role can also be a fully qualified name
     * that represents a role function that will be used
     * to determine if a user has access to a component.
     */
    export type USER_ROLE = string | REACTORY_CORE_ROLES | FQN;

    /**
     * A valid date type.
     */
    export type ValidDate = Date | number | string;

    /**
     * Transform an object from one shape to another.
     */
    export type TransformFunction<TIN, TOUT> = (
      sourceObject: TIN,
      sourceKey: string,
      targetObject: TOUT,
      targetKey: string,
    ) => TOUT | Promise<TOUT>;

    /**
     * Transform an object from one shape to another asynchronously.
     */
    export type TransformFunctionAsync<TIN, TOUT> = (
      sourceObject: TIN,
      sourceKey: string,
      targetObject: TOUT,
      targetKey: string,
    ) => Promise<TOUT>;

    export type TransformFunctionBuiltInId = "toInt" | "toString" | "toDate" | "toBoolean" | "toNumber" | "toFloat" | "toDouble" | "toLong" | "toShort" | "toByte" | "toChar";

    export type TransformFunctionDefinition = TransformFunction<any, any> | TransformFunctionAsync<any, any> | TransformFunctionBuiltInId;

    /**
     * Object Transform object is used for fine grained control over an object data set.
     */
    export interface ObjectTransform<TIN, TOUT> {
      key: string;
      transform: TransformFunctionDefinition;
      target: string;
      sourceType?: new () => TIN;
      targetType?: new () => TOUT;
    }

    /**
     * Object Map Entry is used to map a source object to a target object.
     */
    export type ObjectMapEntry = string | ObjectTransform<unknown, unknown>;

    /**
     * Object Map Multi Target Entry is used to map a source object to multiple target objects.
     */
    export type ObjectMapMultiTargetEntry = ObjectMapEntry[];

    /**
     * Object Map is used to map a source object to a target object.
     */
    export type ObjectMap = { [key: string]: ObjectMapEntry | ObjectMapMultiTargetEntry };

    /**
     * Basic construct of a fully qualified name
     */
    export interface IFQNObject {
      nameSpace: string;
      name: string;
      version: string;
    }

    /**
     * A struct representation of IComponentFqnDefinition
     */
    export interface IComponentFqnDefinition extends IFQNObject {
      id: FQN;
    }

    /**
     * A function decorator that can be used to decorate a function with a fully qualified name.
     */
    export type FqnDecorator = (nameSpace: string, name: string, version?: string) => void;

    /**
     * A component domain is an enum that is used to identify the
     * domain of function for the component
     */
    export enum ComponentDomain {
      "model",
      "service",
      "component",
      "plugin",
      "module",
      "function",
      "object",
      "enum",
      "interface",
      "type",
      "directive",
      "schema",
      "query",
      "mutation",
      "subscription",
      "resolver",
      "action",
      "event",
      "eventHandler",
      "eventListener",
      "eventEmitter",
      "eventDispatcher",
      "eventSubscriber",
      "eventPublisher",
      "eventProducer",
      "eventConsumer",
    }

    /**
     * A feature type
     */
    export enum FeatureType {
      "string",
      "number",
      "boolean",
      "date",
      "object",
      "array",
      "function",
      "symbol",
      "bigint",
    }

    /**
     * Defines a model feature for a given model
     */
    export interface IReactoryComponentFeature {
      key: string;
      name: string;
      description: string;
      type: FeatureType;
      args: string[];
      default: unknown;
      domain: ComponentDomain;
    }

    /**
     * Describes a activator keyword argument.
     */
    export interface IActivationKwarg {
      name: string;
      value: unknown;
      description: string;
      type: FeatureType;
    }

    /**
     * IReactoryComponentDefintion<T> is the interface definition for a reactory component
     * that is being registered within the reactory eco system.
     */
    export interface IReactoryComponentDefinition<T = unknown> extends IComponentFqnDefinition {
      component: T;
      description: string;
      version: string;
      domain: ComponentDomain;
      tags: string[];
      author: string;
      arguments: string[];
      kwargs: IActivationKwarg[];
      features: IReactoryComponentFeature[];
    }

    /**
     * Simple interface type that provides the reactory sdk as a property
     */
    export interface IReactoryComponentProps {
      [key: string]: unknown;
    }

    export namespace Client {
      export namespace Models {
        export type TObjectID = string | number;

        export interface IAuthentication<T> {
          id: TObjectID;
          provider: string;
          strategy: string;
          userId: TObjectID;
          user: T;
          profile: unknown;
          createdAt: ValidDate;
          updatedAt: ValidDate;
        }

        export interface IUser {
          id: TObjectID;
          firstName: string;
          lastName: string;
          email: string;
          roles: USER_ROLE[];
          avatar: string;
          createdAt: ValidDate;
          updatedAt: ValidDate;
        }

        export interface IOrganization {
          id: TObjectID;
          name: string;
          code: string;
          email: string;
          avatar: string;
          createdAt: ValidDate;
          updatedAt: ValidDate;
        }

        export interface IMembership {
          id: TObjectID;
          userId: TObjectID;
          organizationId: TObjectID;
          roles: USER_ROLE[];
          isActive: boolean;
          createdAt: ValidDate;
          updatedAt: ValidDate;
        }
      }

      export type AMQEventData<TEventData> = TEventData | TEventData[];
      export type AMQEventHandler<TEventData> = (data: AMQEventData<TEventData>) => void;

      export interface AsyncMessageQueue {
        name: string;
        subscribe: <TEventData>(event: string, handler: AMQEventHandler<TEventData>) => void;
        unsubscribe: <TEventData>(event: string, handler: AMQEventHandler<TEventData>) => void;
        publish: <TEventData>(event: string, data: AMQEventData<TEventData>) => void;
      }

      export interface NotificationProperties {
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
        actions?: Array<{
          text: string;
          action: () => void;
        }>;
      }

      export interface IReactoryImports {
        [key: string]: unknown;
      }

      export interface IReactoryComponentRegistryEntry<T> {
        component: T;
        definition: IReactoryComponentDefinition<T>;
      }

      export interface IReactoryComponentRegister {
        [key: FQN]: IReactoryComponentRegistryEntry<unknown>;
      }

      export interface IReactoryGroupedComponentRegister { 
        [nameSpace: string]: {
          [name: string]: { 
            [version: string]: IReactoryComponentRegistryEntry<unknown>
          }
        }
      }

      export interface ILoginResult {
        success: boolean;
        user?: Models.IUser;
        token?: string;
        refreshToken?: string;
        message?: string;
      }

      export interface IApiStatusRequestOptions {
        timeout?: number;
        retries?: number;
      }

      export type ComponentDependencyAlias = { fqn?: FQN, id?: FQN, alias: string };
      export type ComponentDependency = FQN | ComponentDependencyAlias;

      export interface IReactoryApi {
        [key: string]: unknown;
        user?: Models.IUser;
        organization?: Models.IOrganization;
        memberships?: Models.IMembership[];
        
        // Core API methods
        login: (credentials: { email: string; password: string }) => Promise<ILoginResult>;
        logout: () => Promise<void>;
        getUser: () => Promise<Models.IUser | null>;
        
        // GraphQL methods
        query: <T = any>(query: string, variables?: Record<string, any>) => Promise<ApolloQueryResult<T>>;
        mutate: <T = any>(mutation: string, variables?: Record<string, any>) => Promise<FetchResult<T>>;
        
        // Configuration methods
        getConfiguration: <T = any>(key: string, defaultValue?: T) => Promise<T>;
        setConfiguration: <T = any>(key: string, value: T) => Promise<void>;
        
        // Event handling
        on: (event: string, handler: (...args: any[]) => void) => void;
        off: (event: string, handler: (...args: any[]) => void) => void;
        emit: (event: string, ...args: any[]) => void;
        
        // Notification system
        notify: (notification: NotificationProperties) => void;
      }

      export class ReactorySDK extends EventEmitter implements IReactoryApi {      
        [key: string]: unknown;
        user?: Models.IUser;
        organization?: Models.IOrganization;
        memberships?: Models.IMembership[];
        
        // Core API methods
        login: (credentials: { email: string; password: string }) => Promise<ILoginResult>;
        logout: () => Promise<void>;
        getUser: () => Promise<Models.IUser | null>;
        
        // GraphQL methods
        query: <T = any>(query: string, variables?: Record<string, any>) => Promise<ApolloQueryResult<T>>;
        mutate: <T = any>(mutation: string, variables?: Record<string, any>) => Promise<FetchResult<T>>;
        
        // Configuration methods
        getConfiguration: <T = any>(key: string, defaultValue?: T) => Promise<T>;
        setConfiguration: <T = any>(key: string, value: T) => Promise<void>;
        
        // Event handling
        on: (event: string, handler: (...args: any[]) => void) => void;
        off: (event: string, handler: (...args: any[]) => void) => void;
        emit: (event: string, ...args: any[]) => void;
        
        // Notification system
        notify: (notification: NotificationProperties) => void;
      }

      export interface IReactoryWiredComponent {
        reactory: IReactoryApi;
      }

      export interface IReactoryFormContext<T> {
        [key: string | symbol]: unknown;
        formData: T;
        setFormData: (data: T) => void;
        reactory: IReactoryApi;
      }

      export type ValidationResult = {
        valid: boolean;
        errors: string[];
        errorSchema: Schema.IErrorSchema
      }

      export interface IReactoryFormProps<TData> {
        [key: string]: unknown;
        formData?: TData;
        onChange?: (data: TData) => void;
        onSubmit?: (data: TData) => void;
        schema?: Schema.ISchema;
        uiSchema?: Schema.IUISchema;
        formContext?: IReactoryFormContext<TData>;
        reactory?: IReactoryApi;
      }

      export interface IWidgetErrorSchema {
        [key: string]: unknown;
      }

      export interface IReactoryWidgetProps<
        T = unknown,
        TRoot = unknown,
        TSchema = Schema.ISchema,
        TUISchema = Schema.IUISchema,
      > extends IReactoryWiredComponent {
        [key: string]: unknown;
        formData?: T;
        onChange?: (data: T) => void;
        schema?: TSchema;
        uiSchema?: TUISchema;
        formContext?: IReactoryFormContext<TRoot>;
      }

      export interface IReactoryClientRoute {
        path: string;
        component: string | FQN;
        exact?: boolean;
        roles?: USER_ROLE[];
        title?: string;
        description?: string;
      }
    }

    export namespace Data {
      export enum Operator {
        "eq" = "eq",
        "ne" = "ne",
        "gt" = "gt",
        "gte" = "gte",
        "lt" = "lt",
        "lte" = "lte",
        "in" = "in",
        "nin" = "nin",
        "like" = "like",
        "ilike" = "ilike",
        "regex" = "regex",
        "exists" = "exists",
        "between" = "between",
      }

      export type SortDirection = "asc" | "ascending" | "desc" | "descending";

      export interface SQLFilter {
        field: string;
        operator: Operator;
        value: unknown;
      }

      export interface PagingRequest {
        page: number;
        pageSize: number;
      }

      export interface PagingResult {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
      }

      export type PagedDataResponse<TData, TQuery> = {
        paging: PagingResult;
        sort: string[];
        sortDirection: SortDirection[];
        query: TQuery;
        data: TData[];
      };
    }

    export namespace Forms {
      export interface IFieldProps<TData, TSchema = Schema.AnySchema, TUISchema = Schema.IUISchema> {
        [key: string]: unknown;
        formData?: TData;
        onChange?: (data: TData) => void;
        schema?: TSchema;
        uiSchema?: TUISchema;
        formContext?: Client.IReactoryFormContext<TData>;
        reactory?: Client.IReactoryApi;
      }

      export type ValidationTypes = "submit" | "blur" | "change";

      export type SchemaFormValidationResult = {
        valid: boolean; 
        errors: any[],
        errorSchema: Schema.IErrorSchema
      };

      export type SchemaFormValidationFunctionSync<TData> = (
        formData: TData, 
        schema: Schema.ISchema,
        validationType: ValidationTypes,
      ) => SchemaFormValidationResult;

      export type SchemaFormValidationFunctionAsync<TData> = (
        formData: TData, 
        schema: Schema.ISchema,
        validationType: ValidationTypes,
      ) => Promise<SchemaFormValidationResult>;

      export type TransformErrorsFunction = (errors: any[], schema: Schema.ISchema) => Promise<{ 
        errors: any[], 
        errorSchema: Schema.IErrorSchema, 
      }>;

      export interface ISchemaFormProps<TData> {
        [key: string]: any;
        formData?: TData;
        onChange?: (data: TData) => void;
        onSubmit?: (data: TData) => void;
        schema?: Schema.ISchema;
        uiSchema?: Schema.IUISchema;
        formContext?: Client.IReactoryFormContext<TData>;
        reactory?: Client.IReactoryApi;
      }

      export interface IReactoryNotification {
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
      }

      export interface IReactoryEvent {
        type: string;
        data: unknown;
        timestamp: Date;
      }

      export type ReactoryFormActionHandlerType =
        | "redirect"
        | "notification"
        | "function"
        | "refresh"
        | "none"
        | "component"
        | "event";

      export interface IReactoryFormQueryErrorHandlerDefinition {
        type: ReactoryFormActionHandlerType;
        target?: string;
        message?: string;
        function?: FQN;
      }

      export interface IReactoryFormGraphResultHandler {
        onError?: IReactoryFormQueryErrorHandlerDefinition;
        onSuccess?: IReactoryFormQueryErrorHandlerDefinition;
      }

      export interface IReactoryFormGraphElement extends IReactoryFormGraphResultHandler {
        id: string;
        query: string;
        variables?: Record<string, any>;
        fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only' | 'no-cache';
      }

      export interface IReactoryFormQuery extends IReactoryFormGraphElement {
        type: 'query';
      }

      export interface IReactoryFormMutation extends IReactoryFormGraphElement {
        type: 'mutation';
      }

      export type ElementSymbol = string | symbol;

      export interface IReactoryFormMutations {
        [key: ElementSymbol]: IReactoryFormMutation;
      }

      export interface IReactoryFormQueries {
        [key: ElementSymbol]: IReactoryFormQuery;
      }

      export interface IFormGraphDefinition {
        queries?: IReactoryFormQueries;
        mutations?: IReactoryFormMutations;
      }

      export interface IReactoryFormRESTCall {
        id: string;
        url: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        headers?: Record<string, string>;
        body?: unknown;
      }

      export interface IFormRESTDefinition {
        calls: Record<string, IReactoryFormRESTCall>;
      }

      export interface IWidgetMap {
        [key: string]: string | FQN;
      }

      export interface IFieldMap {
        [key: string]: string | FQN;
      }

      export interface IObjectMap {
        [key: string]: string | Array<unknown> | object;
      }

      export interface IReactoryFormComponent {
        id: FQN;
        title: string;
        description?: string;
      }

      export interface IEventBubbleAction {
        event: string;
        data?: unknown;
      }

      export interface IReactoryFormModule {
        id: FQN;
        name: string;
        version: string;
        enabled: boolean;
      }

      export interface IReactoryFormResource {
        id: string;
        type: 'css' | 'js' | 'font' | 'image';
        url: string;
        async?: boolean;
      }

      export interface IResourceLoaderOptions {
        resources: IReactoryFormResource[];
        timeout?: number;
      }

      export type ReactoryResourceLoader = (options: IResourceLoaderOptions) => Promise<void>;

      export interface IReactoryFormBase {
        id: FQN;
        name: string;
        nameSpace: string;
        version: string;
        title: string;
        description?: string;
        tags?: string[];
        author?: string;
        helpTopics?: string[];
        avatar?: string;
        icon?: string;
        backButton?: boolean;
        allowAnonymous?: boolean;
        roles?: USER_ROLE[];
        mode?: 'view' | 'edit' | 'create' | 'delete';
        defaultFormValue?: unknown;
      }

      export interface IReactoryFormArgs {
        arguments?: string[];
        kwargs?: IActivationKwarg[];
      }

      export interface IReactoryFormSchemas {
        schema: Schema.ISchema;
        uiSchema: Schema.IUISchema;
      }

      export interface IReactoryFormRuntime {
        modules?: IReactoryFormModule[];
        resources?: IReactoryFormResource[];
        components?: IReactoryFormComponent[];
        widgets?: IWidgetMap;
        fields?: IFieldMap;
        registerAsComponent?: boolean;
      }

      export type ReactoryFormDataProvider = FQN | 'graphql' | 'rest' | 'local' | 'grpc' | 'socket' | 'none'

      export interface IReactoryFormDataProviderOptions { 
        [key: string]: unknown;
      }

      export interface IReactoryFormDataProvider<TOptions extends IReactoryFormDataProviderOptions> {
        id: FQN;
        name: string;
        provider: ReactoryFormDataProvider;
        options: TOptions;
      }

      export interface IReactoryFormDataProviderConfig {
        dataProvider?: IReactoryFormDataProvider<any>;
        graphql?: IFormGraphDefinition;
        rest?: IFormRESTDefinition;
      }

      export interface IReactoryForm
        extends IReactoryFormBase,
          IReactoryFormArgs,
          IReactoryFormSchemas,
          IReactoryFormRuntime, 
          IReactoryFormDataProviderConfig {
        [key: string]: unknown;
      }

      export type ReactoryFormGeneratorFunction<TOptions> = (
        options: TOptions,
      ) => Promise<IReactoryForm[]>;

      export type ReactoryFormGeneratorFunctionSync<TOptions> = (
        options: TOptions,
      ) => IReactoryForm[];

      export interface IReactoryFormGeneratorConfig<TOptions> {
        id: FQN;
        generator: ReactoryFormGeneratorFunction<TOptions> | ReactoryFormGeneratorFunctionSync<TOptions>;
        options: TOptions;
      }

      export type ReactoryFormContext<TData, TAdditional extends Array<unknown>> = {
        signature: string;
        version: number;
        formDef: IReactoryForm;
        formData: TData;
        query: unknown;
        formInstanceId: string;
        setFormData: (data: TData, callback?: () => void) => void;
        refresh: () => void;
        graphql: IFormGraphDefinition;
        getData: (input?: Partial<TData>) => Promise<void>;
        reset: () => void;
        reactory: Client.IReactoryApi;
        [key: string]: unknown;
      } & TAdditional;

      export interface IReactoryFormComponent {
        [key: string]: unknown;
      }
    }

    export namespace Schema {
      export namespace Reflection {
        type Primitive = string | number | boolean | null;

        type JSONSchema =
          | PrimitiveSchema
          | ArraySchema
          | ObjectSchema
          | CombinedSchema
          | ReferenceSchema;

        interface PrimitiveSchema {
          type:
            | "string"
            | "number"
            | "bigint"
            | "boolean"
            | "symbol"
            | "undefined"
            | "object"
            | "function";
        }

        interface ArraySchema {
          type: "array";
          items: JSONSchema;
        }

        interface ObjectSchema {
          type: "object";
          properties: { [key: string]: JSONSchema };
          required?: string[];
        }

        interface CombinedSchema {
          type: "string" | "number" | "integer" | "boolean";
          enum: Primitive[];
        }

        interface ReferenceSchema {
          $ref: string;
        }
      }

      export interface IDSchema {
        $id: string;
      }

      export interface IErrorSchema {
        [key: string]: any
      }

      export type GridSize = number | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

      export interface IGridFieldLayout {
        xs?: GridSize;
        sm?: GridSize;
        md?: GridSize;
        lg?: GridSize;
        xl?: GridSize;
        style?: any;
        doShow?: (formData: unknown) => boolean;
      }

      export interface IGridLayout {
        [key: string]: IGridFieldLayout;
      }

      export interface IGridOptions {
        spacing?: number;
        container?: string | "Paper" | "div";
        containerStyles?: any;
        [key: string]: unknown;
      }

      export interface ITabLayout {
        field: string;
        icon?: string;
        title?: string;
        [key: string]: unknown;
      }

      export interface ITabOptions {
        textColor?: string | "primary" | "secondary";
        path?: string;
        useRouter?: boolean;
        tabsProps?: {
          variant?: string | "fullWidth" | "scrollable";
          style?: any;
          indicatorColor?: string | "primary" | "secondary";
          [key: string]: unknown;
        }      
      }

      export interface IAccordionLayout {
        [key: string]: unknown;
      }

      export interface IAccordionOptions {
        [key: string]: unknown;
      }

      export interface ISteppedLayout {
        [key: string]: unknown;
      }

      export interface ISteppedOptions {
        [key: string]: unknown;
      }

      export interface IListLayout {
        [key: string]: unknown;
      }

      export interface IListLayoutOptions {
        [key: string]: unknown;
      }

      export interface IPagedLayout {
        [key: string]: unknown;
      }

      export interface IPagedLayoutOptions {
        [key: string]: unknown;
      }

      export interface IColumnLayoutOptions {
        [fieldName: string]: {
          title: string;
          width: number;
          align?: "left" | "right" | "center";
          draggable?: boolean;
          resizable?: boolean;
          sortable?: boolean;
        };
      }

      export type TUIFormatProvider = (
        schema: ISchema,
        uiSchema: IUISchema,
        formData?: unknown,
        form?: Forms.IReactoryForm,
      ) => string;

      export type TUIJssProvider = (
        schema: ISchema,
        uiSchema: IUISchema,
        formData?: unknown,
        form?: Forms.IReactoryForm,
      ) => unknown;

      export interface IUISchemaOptions {
        [key: string | symbol]: unknown;
        format?: string | TUIFormatProvider;
        jss?: unknown | TUIJssProvider;
        style?: any;
        hidden?: boolean;
      }

      export interface IUINumberFieldUIOptions extends IUISchemaOptions {
        type?: string | "int" | "float" | "double";
      }

      export interface IUILabelWidgetOptions extends IUISchemaOptions {
        title?: string;
        icon?: unknown;
        iconType?: string;
        iconPosition?: string | "left" | "right";
        variant?: string | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "caption" | "button" | "overline" | "inherit";
        color?: "default" | "secondary" | "inherit" | "primary" | "error" | "info" | "success" | "warning";
      }

      export interface IUIArrayFieldOptions extends IUISchemaOptions {
        addable?: boolean;
        removable?: boolean;
        orderable?: boolean;
        copyable?: boolean;
      }

      export interface IUIObjectFieldOptions extends IUISchemaOptions {
        expandable?: boolean;
        expanded?: boolean;
      }

      export interface IUIDateFieldOptions extends IUISchemaOptions {
        format?: string;
        showTime?: boolean;
        use24Hour?: boolean;
      }

      export interface IUIBooleanFieldOptions extends IUISchemaOptions {
        widget?: string | "checkbox" | "radio" | "select" | "switch";
      }

      export interface IUIUTextFieldOptions extends IUISchemaOptions {
        widget?: string | "text" | "textarea" | "password" | "email" | "url" | "search";
        placeholder?: string;
        rows?: number;
        maxLength?: number;
        autoComplete?: string;
      }

      export type TReactoryFieldOptions =
        | IUIArrayFieldOptions
        | IUIObjectFieldOptions
        | IUIDateFieldOptions
        | IUIBooleanFieldOptions
        | IUIUTextFieldOptions
        | IUINumberFieldUIOptions
        | IUISchemaOptions
        | any;

      export type UISchemaStereotype =
        | "grid"
        | "tab"
        | "accordion"
        | "stepped"
        | "list"
        | "paged"
        | "default";

      export interface TextUIElementdOptions {
        title: string | { key: string; options: I18nFormatOptions };
        tooltip: string | { key: string; options: I18nFormatOptions };
        className?: string
        jss?: unknown;
        icon?: string;
        iconOptions?: Partial<{
          color: string;
          fontSize: number;
          position: "left" | "right" | "top" | "bottom";
          jss: unknown;
          [key: string]: unknown;
        }>;
        color?: "default" | "secondary" | "inherit" | "primary" | "error" | "info" | "success" | "warning";
        field?: string | FQN;
      }

      export interface UITitleFieldOptions extends TextUIElementdOptions {
        as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
      }

      export interface UIDescriptionFieldOptions extends TextUIElementdOptions {
        as?: "p" | "span" | "div" | "small";
      }

      export interface UIHelpFieldOptions extends TextUIElementdOptions {
        topics?: string[];
        placement?: "top" | "bottom" | "left" | "right";
      }

      export interface UIAIOptions {
        enabled?: boolean;
        provider?: string | FQN;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        userPrompt?: string;
        context?: Record<string, any>;
      }

      export interface IUISchema {
        "ui:field"?: string | FQN;
        "ui:widget"?: string | FQN;
        "ui:options"?: TReactoryFieldOptions;
        "ui:placeholder"?: string;
        "ui:title"?: string | UITitleFieldOptions;
        "ui:description"?: string | UIDescriptionFieldOptions;
        "ui:help"?: string | UIHelpFieldOptions;
        "ui:disabled"?: boolean;
        "ui:readonly"?: boolean;
        "ui:autofocus"?: boolean;
        "ui:enumDisabled"?: string[];
        "ui:order"?: string[];
        "ui:submitButtonOptions"?: {
          submitText?: string;
          norender?: boolean;
          props?: Record<string, any>;
        };
        "ui:stereotype"?: UISchemaStereotype;
        "ui:grid"?: IGridLayout;
        "ui:gridOptions"?: IGridOptions;
        "ui:tab"?: ITabLayout[];
        "ui:tabOptions"?: ITabOptions;
        "ui:accordion"?: IAccordionLayout;
        "ui:accordionOptions"?: IAccordionOptions;
        "ui:stepped"?: ISteppedLayout;
        "ui:steppedOptions"?: ISteppedOptions;
        "ui:list"?: IListLayout;
        "ui:listOptions"?: IListLayoutOptions;
        "ui:paged"?: IPagedLayout;
        "ui:pagedOptions"?: IPagedLayoutOptions;
        "ui:column"?: IColumnLayoutOptions;
        "ui:ai"?: UIAIOptions;
        [key: string]: IUISchema | unknown;
      }

      export interface IFormUISchema extends IUISchema {
        "ui:form"?: {
          submitText?: string;
          submitButtonOptions?: Record<string, any>;
          resetText?: string;
          resetButtonOptions?: Record<string, any>;
          showReset?: boolean;
          showSubmit?: boolean;
        };
      }

      export interface ISchemaObjectProperties {
        [key: string]: ISchema;
      }

      export interface IReferenceSchema {
        $ref: string;
      }

      export interface ISchema {
        type: string | "object" | "string" | "number" | "boolean" | "array" | "null" | string[];
        $type?: string;
        title?: string | undefined;
        description?: string | undefined;
        default?: unknown | undefined;
        required?: unknown | undefined;
        properties?: ISchemaObjectProperties | unknown | undefined;
        dependencies?: unknown | undefined;
        definitions?: unknown;
        format?: string | "email" | "password" | "date" | "date-time" | "phone" | "url" | "uri" | "uuid" | "ipv4" | "ipv6";
        enum?: string[];
        readonly?: boolean;
        fqn?: string;
        additionalProperties?: ISchema;
        oneOf?: Partial<ISchema>[] | undefined;
        anyOf?: Partial<ISchema>[] | undefined;
        allOf?: Partial<ISchema>[] | undefined;
      }

      export interface IStringSchema extends ISchema {
        type: string | "string";
        minLength?: number;
        maxLength?: number;
        pattern?: string | RegExp;
      }

      export interface IBooleanSchema extends ISchema {
        type: "boolean";
        default?: boolean;
      }

      export interface INumberSchema extends ISchema {
        type: "number";
        minimum?: number;
        maximum?: number;
        default?: number;
      }

      export interface IDateSchema extends ISchema {
        type: string | "string";
        format: "date";
        minimum?: number | string;
        maximum?: number | string;
        default?: number | string;
      }

      export interface IDateTimeSchema extends ISchema {
        type: "string";
        format: "date-time";
        minimum?: number | string;
        maximum?: number | string;
        default?: number | string;
      }

      export interface IObjectSchema extends ISchema {
        type: "object";
        properties: ISchemaObjectProperties;
        default?: object | unknown;
      }

      export interface IArraySchema extends ISchema {
        type: "array";
        items: IObjectSchema | IDateTimeSchema | IDateSchema | INumberSchema | IStringSchema | ISchema;
      }

      export interface IObjectProperties {
        [field: string]: AnySchema;
      }

      export type AnySchema =
        | ISchema
        | IStringSchema
        | INumberSchema
        | IDateSchema
        | IDateTimeSchema
        | IObjectSchema
        | IArraySchema;

      export type TClientSchemaResolver = (
        form: Forms.IReactoryForm,
        reactory: Client.IReactoryApi | Client.ReactorySDK,
      ) => Promise<AnySchema>;

      export type TClientUISchemaResolver = (
        form: Forms.IReactoryForm,
        reactory: Client.IReactoryApi,
      ) => Promise<IFormUISchema>;
    }

    export namespace Service {
      export interface IReactoryServiceProps {
        [key: string]: unknown;
        id: FQN;
        name: string;
        version: string;
        enabled: boolean;
      }

      export class ReactoryService<TProps extends IReactoryServiceProps, TContext> {
        props: TProps;
        context: TContext;
        
        constructor(props: TProps, context: TContext) {
          this.props = props;
          this.context = context;
        }

        async start(): Promise<void> {
          // Implementation in derived classes
        }

        async stop(): Promise<void> {
          // Implementation in derived classes
        }

        async getStatus(): Promise<{ running: boolean; [key: string]: any }> {
          return { running: true };
        }
      }
    }

    export namespace I18n {
      export enum Languages {
        "en" = "en",
        "af" = "af",
        "es" = "es",
        "fr" = "fr",
        "de" = "de",
        "it" = "it",
        "pt" = "pt",
        "ru" = "ru",
        "zh" = "zh",
        "ja" = "ja",
        "ko" = "ko",
        "ar" = "ar",
        "hi" = "hi",
      }
    }

    export namespace UX {
      export type UIFrameWork = 
        | "material-ui" 
        | "react-native" 
        | "bootstrap" 
        | "ant-design" 
        | "semantic-ui" 
        | "chakra-ui"
        | "native-base";

      export interface IReactoryTheme {
        id: FQN;
        name: string;
        framework: UIFrameWork;
        version: string;
        colors: {
          primary: string;
          secondary: string;
          background: string;
          surface: string;
          text: string;
          error: string;
          warning: string;
          info: string;
          success: string;
        };
        spacing: {
          xs: number;
          sm: number;
          md: number;
          lg: number;
          xl: number;
        };
        typography: {
          fontFamily: string;
          fontSize: {
            xs: number;
            sm: number;
            md: number;
            lg: number;
            xl: number;
          };
        };
      }
    }

    export namespace Platform {
      export interface IReactoryPlatformConfig {
        name: string;
        version: string;
        environment: 'development' | 'staging' | 'production';
        apiUrl: string;
        wsUrl?: string;
        graphqlUrl: string;
        features: {
          [key: string]: boolean;
        };
        themes: UX.IReactoryTheme[];
        defaultTheme: FQN;
      }

      export interface IReactoryEnvironment {
        platform: 'web' | 'mobile' | 'desktop' | 'server';
        runtime: 'browser' | 'react-native' | 'electron' | 'node';
        version: string;
        capabilities: string[];
      }
    }
  }
}

export {};
