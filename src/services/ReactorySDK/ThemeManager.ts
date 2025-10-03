/**
 * ThemeManager - Theme Management and Switching
 * 
 * Handles theme loading, switching, persistence, and validation for the ReactorySDK.
 * Provides comprehensive theme management with dark/light mode support, custom themes,
 * and real-time theme updates across the application.
 * 
 * @version 1.0.0
 * @created August 20, 2025
 */

import { ReactorySDK } from './ReactorySDK';

// Theme Types
export interface ReactoryTheme {
  id: string;
  name: string;
  version: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    divider: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      extraLarge: number;
    };
    fontWeight: {
      light: string;
      regular: string;
      medium: string;
      bold: string;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  breakpoints?: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  customProperties?: Record<string, any>;
}

export interface ThemeVariant {
  id: string;
  name: string;
  baseThemeId: string;
  overrides: Partial<ReactoryTheme>;
  conditions?: {
    prefersDarkMode?: boolean;
    prefersReducedMotion?: boolean;
    prefersHighContrast?: boolean;
  };
}

// Theme Configuration
export interface ThemeManagerConfig {
  defaultTheme?: string;
  enableAutoThemeDetection?: boolean;
  enableSystemThemeSync?: boolean;
  enableThemePersistence?: boolean;
  enableCustomThemes?: boolean;
  enableThemeValidation?: boolean;
  cacheThemes?: boolean;
  maxCachedThemes?: number;
  themeTransitionDuration?: number;
  enableThemePreloading?: boolean;
  fallbackTheme?: string;
  endpoints?: {
    getThemes?: string;
    getTheme?: string;
    saveCustomTheme?: string;
    deleteCustomTheme?: string;
  };
}

// Theme Events
export type ThemeEventType = 
  | 'themeChanged'
  | 'themeLoaded'
  | 'themeValidated'
  | 'themeError'
  | 'systemThemeChanged'
  | 'customThemeCreated'
  | 'customThemeDeleted';

export interface ThemeChangeEvent {
  previousTheme?: ReactoryTheme;
  currentTheme: ReactoryTheme;
  variant?: ThemeVariant;
  source: 'user' | 'system' | 'auto';
  timestamp: Date;
}

// Theme Context for Components
export interface ThemeContext {
  theme: ReactoryTheme;
  variant?: ThemeVariant;
  isDarkMode: boolean;
  isLightMode: boolean;
  isSystemTheme: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
  accessibility: {
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
  };
}

/**
 * ThemeManager handles all theme-related operations
 */
export class ThemeManager {
  private reactory: ReactorySDK;
  private config: Required<ThemeManagerConfig>;
  private isInitialized: boolean = false;
  
  // Theme state
  private currentTheme: ReactoryTheme | null = null;
  private currentVariant: ThemeVariant | null = null;
  private availableThemes: Map<string, ReactoryTheme> = new Map();
  private themeVariants: Map<string, ThemeVariant> = new Map();
  private customThemes: Map<string, ReactoryTheme> = new Map();
  
  // System state
  private systemColorScheme: 'light' | 'dark' = 'light';
  private systemAccessibility = {
    prefersReducedMotion: false,
    prefersHighContrast: false,
  };
  
  // Theme listeners and observers
  private themeChangeListeners: Set<(event: ThemeChangeEvent) => void> = new Set();
  private systemThemeObserver?: any;
  private accessibilityObserver?: any;

  constructor(reactory: ReactorySDK, config?: Partial<ThemeManagerConfig>) {
    this.reactory = reactory;
    this.config = this.mergeConfig(config);

    // Bind methods to preserve context
    this.getCurrentTheme = this.getCurrentTheme.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.getAvailableThemes = this.getAvailableThemes.bind(this);
    this.createCustomTheme = this.createCustomTheme.bind(this);
    this.deleteCustomTheme = this.deleteCustomTheme.bind(this);
    this.validateTheme = this.validateTheme.bind(this);
    this.getThemeContext = this.getThemeContext.bind(this);
    this.onThemeChange = this.onThemeChange.bind(this);
  }

  /**
   * Initializes the ThemeManager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load built-in themes
      await this.loadBuiltInThemes();
      
      // Load available themes from server
      if (this.config.cacheThemes) {
        await this.loadAvailableThemes();
      }
      
      // Load custom themes
      if (this.config.enableCustomThemes) {
        await this.loadCustomThemes();
      }
      
      // Initialize system theme detection
      if (this.config.enableSystemThemeSync) {
        await this.initializeSystemThemeDetection();
      }
      
      // Load persisted theme or set default
      await this.loadPersistedTheme();
      
      // Setup accessibility monitoring
      await this.initializeAccessibilityMonitoring();

      this.isInitialized = true;
      this.reactory.emit('themeManager.initialized', {
        currentTheme: this.currentTheme,
        availableThemes: Array.from(this.availableThemes.keys()),
        systemColorScheme: this.systemColorScheme,
      });
    } catch (error) {
      this.reactory.emit('themeManager.initializationFailed', { error });
      throw error;
    }
  }

  /**
   * Gets the current active theme
   */
  getCurrentTheme(): ReactoryTheme | null {
    return this.currentTheme ? { ...this.currentTheme } : null;
  }

  /**
   * Gets the current theme variant if any
   */
  getCurrentVariant(): ThemeVariant | null {
    return this.currentVariant ? { ...this.currentVariant } : null;
  }

  /**
   * Sets the active theme
   */
  async setTheme(
    themeId: string,
    options?: {
      variant?: string;
      persist?: boolean;
      transition?: boolean;
      source?: 'user' | 'system' | 'auto';
    }
  ): Promise<void> {
    const source = options?.source || 'user';
    const previousTheme = this.currentTheme;

    try {
      // Find the theme
      let theme = this.availableThemes.get(themeId) || this.customThemes.get(themeId);
      
      if (!theme) {
        // Try to load from server
        theme = await this.loadThemeFromServer(themeId);
      }
      
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`);
      }

      // Validate theme if enabled
      if (this.config.enableThemeValidation) {
        const validationResult = this.validateTheme(theme);
        if (!validationResult.isValid) {
          throw new Error(`Invalid theme: ${validationResult.errors.join(', ')}`);
        }
      }

      // Apply variant if specified
      let variant: ThemeVariant | null = null;
      if (options?.variant) {
        variant = this.themeVariants.get(options.variant) || null;
        if (variant && variant.baseThemeId === themeId) {
          theme = this.applyThemeVariant(theme, variant);
        }
      }

      // Apply system-based variant if auto-detection is enabled
      if (this.config.enableAutoThemeDetection && !options?.variant) {
        variant = this.findSystemVariant(themeId);
        if (variant) {
          theme = this.applyThemeVariant(theme, variant);
        }
      }

      this.currentTheme = theme;
      this.currentVariant = variant;

      // Persist theme if enabled
      if ((options?.persist !== false) && this.config.enableThemePersistence) {
        await this.persistTheme(themeId, variant?.id);
      }

      // Emit theme change event
      const changeEvent: ThemeChangeEvent = {
        previousTheme: previousTheme || undefined,
        currentTheme: theme,
        variant: variant || undefined,
        source,
        timestamp: new Date(),
      };

      this.notifyThemeChange(changeEvent);
      this.reactory.emit('themeManager.themeChanged', changeEvent);

    } catch (error) {
      this.reactory.emit('themeManager.themeError', { 
        themeId, 
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets all available themes
   */
  getAvailableThemes(): Array<{
    id: string;
    name: string;
    description?: string;
    isCustom: boolean;
    variants: string[];
  }> {
    const themes: Array<{
      id: string;
      name: string;
      description?: string;
      isCustom: boolean;
      variants: string[];
    }> = [];

    // Add built-in and server themes
    this.availableThemes.forEach(theme => {
      const variants = Array.from(this.themeVariants.values())
        .filter(v => v.baseThemeId === theme.id)
        .map(v => v.id);

      themes.push({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        isCustom: false,
        variants,
      });
    });

    // Add custom themes
    this.customThemes.forEach(theme => {
      const variants = Array.from(this.themeVariants.values())
        .filter(v => v.baseThemeId === theme.id)
        .map(v => v.id);

      themes.push({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        isCustom: true,
        variants,
      });
    });

    return themes;
  }

  /**
   * Creates a custom theme
   */
  async createCustomTheme(
    theme: Omit<ReactoryTheme, 'id'> & { id?: string },
    options?: {
      persist?: boolean;
      setActive?: boolean;
    }
  ): Promise<string> {
    const themeId = theme.id || `custom_${Date.now()}`;
    const fullTheme: ReactoryTheme = {
      ...theme,
      id: themeId,
    };

    // Validate theme
    if (this.config.enableThemeValidation) {
      const validationResult = this.validateTheme(fullTheme);
      if (!validationResult.isValid) {
        throw new Error(`Invalid theme: ${validationResult.errors.join(', ')}`);
      }
    }

    // Add to custom themes
    this.customThemes.set(themeId, fullTheme);

    // Persist if enabled
    if ((options?.persist !== false) && this.config.enableCustomThemes) {
      await this.saveCustomThemeToServer(fullTheme);
    }

    // Set as active if requested
    if (options?.setActive) {
      await this.setTheme(themeId);
    }

    this.reactory.emit('themeManager.customThemeCreated', { 
      themeId, 
      theme: fullTheme,
    });

    return themeId;
  }

  /**
   * Deletes a custom theme
   */
  async deleteCustomTheme(themeId: string): Promise<void> {
    if (!this.customThemes.has(themeId)) {
      throw new Error(`Custom theme not found: ${themeId}`);
    }

    // Don't delete if it's the current theme
    if (this.currentTheme?.id === themeId) {
      throw new Error('Cannot delete the currently active theme');
    }

    this.customThemes.delete(themeId);

    // Delete from server if custom themes are enabled
    if (this.config.enableCustomThemes) {
      await this.deleteCustomThemeFromServer(themeId);
    }

    this.reactory.emit('themeManager.customThemeDeleted', { themeId });
  }

  /**
   * Validates a theme structure
   */
  validateTheme(theme: ReactoryTheme): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Handle null/undefined themes
    if (!theme) {
      errors.push('Theme object is required');
      return {
        isValid: false,
        errors,
      };
    }

    // Required fields
    if (!theme.id) errors.push('Theme ID is required');
    if (!theme.name) errors.push('Theme name is required');
    if (!theme.version) errors.push('Theme version is required');

    // Colors validation
    if (!theme.colors) {
      errors.push('Colors object is required');
    } else {
      const requiredColors = ['primary', 'secondary', 'background', 'surface', 'error'];
      requiredColors.forEach(color => {
        if (!theme.colors[color as keyof typeof theme.colors]) {
          errors.push(`Color '${color}' is required`);
        }
      });

      // Text colors
      if (!theme.colors.text) {
        errors.push('Text colors are required');
      } else {
        const requiredTextColors = ['primary', 'secondary'];
        requiredTextColors.forEach(color => {
          if (!theme.colors.text[color as keyof typeof theme.colors.text]) {
            errors.push(`Text color '${color}' is required`);
          }
        });
      }
    }

    // Typography validation
    if (!theme.typography) {
      errors.push('Typography object is required');
    } else {
      if (!theme.typography.fontFamily) errors.push('Font family is required');
      if (!theme.typography.fontSize) errors.push('Font sizes are required');
    }

    // Spacing validation
    if (!theme.spacing) {
      errors.push('Spacing object is required');
    }

    this.reactory.emit('themeManager.themeValidated', { 
      themeId: theme.id, 
      isValid: errors.length === 0,
      errors,
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Gets the current theme context for components
   */
  getThemeContext(): ThemeContext | null {
    if (!this.currentTheme) return null;

    const isDarkMode = this.isDarkTheme(this.currentTheme);
    const isSystemTheme = this.config.enableSystemThemeSync && 
      this.currentTheme.id.includes('system');

    return {
      theme: { ...this.currentTheme },
      variant: this.currentVariant ? { ...this.currentVariant } : undefined,
      isDarkMode,
      isLightMode: !isDarkMode,
      isSystemTheme,
      colorScheme: isSystemTheme ? 'auto' : (isDarkMode ? 'dark' : 'light'),
      accessibility: { ...this.systemAccessibility },
    };
  }

  /**
   * Adds a theme change listener
   */
  onThemeChange(listener: (event: ThemeChangeEvent) => void): () => void {
    this.themeChangeListeners.add(listener);
    return () => this.themeChangeListeners.delete(listener);
  }

  /**
   * Toggles between light and dark mode
   */
  async toggleColorScheme(): Promise<void> {
    if (!this.currentTheme) return;

    const isDark = this.isDarkTheme(this.currentTheme);
    const targetScheme = isDark ? 'light' : 'dark';
    
    // Find a theme variant or theme for the target scheme
    const targetTheme = this.findThemeForColorScheme(targetScheme);
    
    if (targetTheme) {
      await this.setTheme(targetTheme, { source: 'user' });
    }
  }

  /**
   * Preloads themes for better performance
   */
  async preloadThemes(themeIds: string[]): Promise<void> {
    const loadPromises = themeIds.map(async themeId => {
      if (!this.availableThemes.has(themeId) && !this.customThemes.has(themeId)) {
        try {
          await this.loadThemeFromServer(themeId);
        } catch (error) {
          // Ignore preload errors
        }
      }
    });

    await Promise.all(loadPromises);
    this.reactory.emit('themeManager.themesPreloaded', { themeIds });
  }

  /**
   * Destroys the ThemeManager and cleans up resources
   */
  async destroy(): Promise<void> {
    // Clear all themes
    this.availableThemes.clear();
    this.themeVariants.clear();
    this.customThemes.clear();
    
    // Clear listeners
    this.themeChangeListeners.clear();
    
    // Stop system observers
    if (this.systemThemeObserver) {
      this.systemThemeObserver.disconnect();
      this.systemThemeObserver = null;
    }
    
    if (this.accessibilityObserver) {
      this.accessibilityObserver.disconnect();
      this.accessibilityObserver = null;
    }
    
    // Reset state
    this.currentTheme = null;
    this.currentVariant = null;
    this.isInitialized = false;
    
    this.reactory.emit('themeManager.destroyed');
  }

  // Private helper methods

  private mergeConfig(config?: Partial<ThemeManagerConfig>): Required<ThemeManagerConfig> {
    return {
      defaultTheme: 'reactory-light',
      enableAutoThemeDetection: true,
      enableSystemThemeSync: true,
      enableThemePersistence: true,
      enableCustomThemes: true,
      enableThemeValidation: true,
      cacheThemes: true,
      maxCachedThemes: 10,
      themeTransitionDuration: 300,
      enableThemePreloading: true,
      fallbackTheme: 'reactory-light',
      endpoints: {
        getThemes: 'getThemes',
        getTheme: 'getTheme',
        saveCustomTheme: 'saveCustomTheme',
        deleteCustomTheme: 'deleteCustomTheme',
      },
      ...config,
    };
  }

  private async loadBuiltInThemes(): Promise<void> {
    // Load default light theme
    const lightTheme = this.createDefaultLightTheme();
    this.availableThemes.set(lightTheme.id, lightTheme);

    // Load default dark theme
    const darkTheme = this.createDefaultDarkTheme();
    this.availableThemes.set(darkTheme.id, darkTheme);

    // Create system variants
    this.createSystemVariants();
  }

  private createDefaultLightTheme(): ReactoryTheme {
    return {
      id: 'reactory-light',
      name: 'Reactory Light',
      version: '1.0.0',
      description: 'Default light theme for Reactory applications',
      colors: {
        primary: '#2196F3',
        secondary: '#FF9800',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        error: '#F44336',
        warning: '#FF9800',
        success: '#4CAF50',
        info: '#2196F3',
        text: {
          primary: '#212121',
          secondary: '#757575',
          disabled: '#BDBDBD',
        },
        divider: '#E0E0E0',
        border: '#E0E0E0',
      },
      typography: {
        fontFamily: 'System',
        fontSize: {
          small: 12,
          medium: 14,
          large: 16,
          extraLarge: 20,
        },
        fontWeight: {
          light: '300',
          regular: '400',
          medium: '500',
          bold: '700',
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.4,
          relaxed: 1.6,
        },
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        full: 9999,
      },
      shadows: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
        md: '0 2px 4px rgba(0, 0, 0, 0.1)',
        lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
        xl: '0 8px 16px rgba(0, 0, 0, 0.1)',
      },
      animations: {
        duration: {
          fast: 150,
          normal: 300,
          slow: 500,
        },
        easing: {
          linear: 'linear',
          easeIn: 'ease-in',
          easeOut: 'ease-out',
          easeInOut: 'ease-in-out',
        },
      },
    };
  }

  private createDefaultDarkTheme(): ReactoryTheme {
    const lightTheme = this.createDefaultLightTheme();
    return {
      ...lightTheme,
      id: 'reactory-dark',
      name: 'Reactory Dark',
      description: 'Default dark theme for Reactory applications',
      colors: {
        ...lightTheme.colors,
        primary: '#64B5F6',
        background: '#121212',
        surface: '#1E1E1E',
        text: {
          primary: '#FFFFFF',
          secondary: '#BDBDBD',
          disabled: '#616161',
        },
        divider: '#424242',
        border: '#424242',
      },
    };
  }

  private createSystemVariants(): void {
    // System light variant
    this.themeVariants.set('system-light', {
      id: 'system-light',
      name: 'System Light',
      baseThemeId: 'reactory-light',
      overrides: {},
      conditions: { prefersDarkMode: false },
    });

    // System dark variant
    this.themeVariants.set('system-dark', {
      id: 'system-dark',
      name: 'System Dark',
      baseThemeId: 'reactory-dark',
      overrides: {},
      conditions: { prefersDarkMode: true },
    });
  }

  private async loadAvailableThemes(): Promise<void> {
    // Stubbed implementation - would load from server
    this.reactory.emit('themeManager.themesLoaded', { 
      count: this.availableThemes.size,
    });
  }

  private async loadCustomThemes(): Promise<void> {
    // Stubbed implementation - would load from persistent storage
    this.reactory.emit('themeManager.customThemesLoaded', { 
      count: this.customThemes.size,
    });
  }

  private async initializeSystemThemeDetection(): Promise<void> {
    // Stubbed implementation - would integrate with system theme detection
    this.systemColorScheme = 'light'; // Default
    this.reactory.emit('themeManager.systemThemeDetectionInitialized');
  }

  private async loadPersistedTheme(): Promise<void> {
    // Try to load persisted theme, fall back to default
    const defaultThemeId = this.config.defaultTheme;
    await this.setTheme(defaultThemeId, { source: 'auto', persist: false });
  }

  private async initializeAccessibilityMonitoring(): Promise<void> {
    // Stubbed implementation - would monitor accessibility preferences
    this.systemAccessibility = {
      prefersReducedMotion: false,
      prefersHighContrast: false,
    };
  }

  private async loadThemeFromServer(_themeId: string): Promise<ReactoryTheme | null> {
    // Stubbed implementation - would load from server
    await this.delay(100);
    return null;
  }

  private applyThemeVariant(theme: ReactoryTheme, variant: ThemeVariant): ReactoryTheme {
    // Deep merge variant overrides with base theme
    return {
      ...theme,
      ...variant.overrides,
      colors: {
        ...theme.colors,
        ...variant.overrides.colors,
        text: {
          ...theme.colors.text,
          ...variant.overrides.colors?.text,
        },
      },
      typography: {
        ...theme.typography,
        ...variant.overrides.typography,
      },
    };
  }

  private findSystemVariant(themeId: string): ThemeVariant | null {
    const isDarkMode = this.systemColorScheme === 'dark';
    const variants = Array.from(this.themeVariants.values())
      .filter(v => v.baseThemeId === themeId);

    return variants.find(v => v.conditions?.prefersDarkMode === isDarkMode) || null;
  }

  private async persistTheme(themeId: string, variantId?: string): Promise<void> {
    // Stubbed implementation - would persist to storage
    this.reactory.emit('themeManager.themePersisted', { themeId, variantId });
  }

  private async saveCustomThemeToServer(theme: ReactoryTheme): Promise<void> {
    // Stubbed implementation - would save to server
    await this.delay(100);
    this.reactory.emit('themeManager.customThemeSaved', { themeId: theme.id });
  }

  private async deleteCustomThemeFromServer(themeId: string): Promise<void> {
    // Stubbed implementation - would delete from server
    await this.delay(50);
    this.reactory.emit('themeManager.customThemeDeletedFromServer', { themeId });
  }

  private isDarkTheme(theme: ReactoryTheme): boolean {
    // Simple heuristic: check if background is darker than text
    // For now, just check if it's the dark theme
    return theme.id.includes('dark');
  }

  private findThemeForColorScheme(colorScheme: 'light' | 'dark'): string | null {
    const themes = Array.from(this.availableThemes.values());
    const targetTheme = themes.find(t => 
      colorScheme === 'dark' ? t.id.includes('dark') : t.id.includes('light')
    );
    
    return targetTheme?.id || null;
  }

  private notifyThemeChange(event: ThemeChangeEvent): void {
    this.themeChangeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        // Ignore listener errors
      }
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
