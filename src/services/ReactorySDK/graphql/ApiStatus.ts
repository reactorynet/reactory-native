/**
 * API Status GraphQL Queries
 * 
 * GraphQL query fragments and query builder for fetching API status
 * from the Reactory backend. Based on the PWA implementation.
 * 
 * @version 1.0.0
 * @created February 1, 2026
 */

/**
 * Available scopes for API status query
 */
export type ApiStatusQueryScope = 
  | 'application' 
  | 'loggedIn' 
  | 'theme' 
  | 'server' 
  | 'colorSchemes' 
  | 'routes' 
  | 'menus' 
  | 'messages' 
  | 'navigationComponents' 
  | 'plugins';

/**
 * GraphQL fragments for each API status scope
 */
const FRAGMENTS: Record<ApiStatusQueryScope, string> = {
  application: `
    id
    applicationName
    applicationAvatar
    applicationRoles
    when
    status
  `,
  loggedIn: `
    loggedIn {
      user {
        id
        firstName
        lastName
        avatar
      }
      organization {
        id
        name
        logo
      }
      team {
        id
        name
      }
      businessUnit {
        id
        name
        avatar
      }
      roles
      altRoles
      memberships {
        id
        client {
          id
          name
        }
        organization {
          id
          name
          logo
        }
        businessUnit {
          id
          name
          avatar
        }
        roles
      }
    }
  `,
  theme: `
    theme
    activeTheme(mode: $mode) {
      id
      type
      name
      nameSpace
      version
      description
      modes {
        id
        name
        description
        icon
      }
      options
      assets {
        id
        name
        assetType
        url
        loader
        options
        data
      }        
    }
    themes {
      id
      type
      name
      nameSpace
      version
      description        
    }
  `,
  server: `
    server {
      id
      version
      started
      clients {
        id
        clientKey
        name
        siteUrl
      }
    }
  `,
  colorSchemes: `
    colorSchemes
  `,
  routes: `
    routes {
      id
      path
      public
      roles
      componentFqn
      exact
      redirect
      componentProps
      args {
        key
        value
      }
      components {
        nameSpace
        name
        version
        args {
          key
          value
        }
        title
        description
        roles
      }
    }
  `,
  menus: `
    menus {
      id
      key
      name
      target
      roles
      entries {
        id
        ordinal
        title
        link
        external
        icon
        roles
        items {
          id
          ordinal
          title
          link
          external
          icon
          roles
        }
      }
    }
  `,
  messages: `
    messages {
      id
      title
      text
      data
      via
      icon
      image
      requireInteraction
      silent
      timestamp
      actions {
        id
        action
        icon
        componentFqn
        componentProps
        modal
        modalSize
        priority
      }
    }
  `,
  navigationComponents: `
    navigationComponents {
      componentFqn
      componentProps
      componentPropertyMap
      componentKey
      componentContext
      contextType
    }
  `,
  plugins: `
    plugins {
      id
      nameSpace
      name
      version
      description
      platform
      uri
      mimeType
      loader
      options
      enabled
      roles
    }
  `
};

/**
 * Builds an API status query with the specified scopes
 * 
 * @param scope - Array of scopes to include in the query
 * @returns GraphQL query string
 */
export function buildApiStatusQuery(scope: ApiStatusQueryScope[]): string {
  const fragments = scope.map(s => FRAGMENTS[s]).join('\n');
  return `
    query ApiStatus($theme: String, $mode: String) {
      apiStatus(theme: $theme, mode: $mode) {
        ${fragments}
      }
    }
  `;
}

/**
 * Default scopes for initial API status check (minimal for startup)
 */
export const DEFAULT_STARTUP_SCOPES: ApiStatusQueryScope[] = [
  'application',
  'server'
];

/**
 * Full scopes for logged-in user
 */
export const FULL_API_STATUS_SCOPES: ApiStatusQueryScope[] = [
  'application',
  'loggedIn',
  'colorSchemes',
  'menus',
  'messages',
  'routes',
  'theme',
  'navigationComponents',
  'plugins'
];

/**
 * Mobile-optimized scopes (excludes some web-specific data)
 */
export const MOBILE_API_STATUS_SCOPES: ApiStatusQueryScope[] = [
  'application',
  'loggedIn',
  'menus',
  'theme',
  'messages'
];

export default buildApiStatusQuery;
