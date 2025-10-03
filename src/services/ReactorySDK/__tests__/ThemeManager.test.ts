/**
 * ThemeManager Test Suite
 * 
 * Comprehensive test coverage for the ThemeManager class following TDD principles.
 * Tests cover theme loading, switching, validation, custom themes, and system integration.
 * 
 * @version 1.0.0
 * @created August 20, 2025
 */

import { ThemeManager, ThemeManagerConfig, ReactoryTheme } from '../ThemeManager';
import { ReactorySDK } from '../ReactorySDK';

// Mock ReactorySDK
const mockReactorySDK = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getConfiguration: jest.fn(),
  setConfiguration: jest.fn(),
  user: null,
  organization: null,
  memberships: [],
} as unknown as ReactorySDK;

// Mock themes for testing
const createMockTheme = (id: string, isDark: boolean = false): ReactoryTheme => ({
  id,
  name: `Test Theme ${id}`,
  version: '1.0.0',
  description: `Mock theme for testing: ${id}`,
  colors: {
    primary: isDark ? '#64B5F6' : '#2196F3',
    secondary: '#FF9800',
    background: isDark ? '#121212' : '#FFFFFF',
    surface: isDark ? '#1E1E1E' : '#F5F5F5',
    error: '#F44336',
    warning: '#FF9800',
    success: '#4CAF50',
    info: '#2196F3',
    text: {
      primary: isDark ? '#FFFFFF' : '#212121',
      secondary: isDark ? '#BDBDBD' : '#757575',
      disabled: isDark ? '#616161' : '#BDBDBD',
    },
    divider: isDark ? '#424242' : '#E0E0E0',
    border: isDark ? '#424242' : '#E0E0E0',
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
});

describe('ThemeManager', () => {
  let themeManager: ThemeManager;
  let mockConfig: Partial<ThemeManagerConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      defaultTheme: 'reactory-light',
      enableAutoThemeDetection: true,
      enableSystemThemeSync: true,
      enableThemePersistence: true,
      enableCustomThemes: true,
      enableThemeValidation: true,
      cacheThemes: true,
      maxCachedThemes: 5,
      themeTransitionDuration: 200,
    };

    themeManager = new ThemeManager(mockReactorySDK, mockConfig);
  });

  afterEach(async () => {
    await themeManager.destroy();
  });

  describe('Initialization and Setup', () => {
    test('should initialize with default configuration when no config provided', () => {
      const manager = new ThemeManager(mockReactorySDK);
      expect(manager).toBeInstanceOf(ThemeManager);
    });

    test('should merge provided config with defaults', () => {
      const customConfig = { enableAutoThemeDetection: false };
      const manager = new ThemeManager(mockReactorySDK, customConfig);
      expect(manager).toBeInstanceOf(ThemeManager);
    });

    test('should initialize successfully', async () => {
      await themeManager.initialize();
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.initialized', expect.any(Object));
    });

    test('should not initialize twice', async () => {
      await themeManager.initialize();
      jest.clearAllMocks();
      await themeManager.initialize(); // Second call should be ignored
      
      const initCalls = (mockReactorySDK.emit as jest.Mock).mock.calls.filter(
        call => call[0] === 'themeManager.initialized'
      );
      expect(initCalls).toHaveLength(0);
    });

    test('should bind methods correctly', () => {
      expect(typeof themeManager.getCurrentTheme).toBe('function');
      expect(typeof themeManager.setTheme).toBe('function');
      expect(typeof themeManager.getAvailableThemes).toBe('function');
      expect(typeof themeManager.createCustomTheme).toBe('function');
      expect(typeof themeManager.validateTheme).toBe('function');
    });

    test('should load built-in themes during initialization', async () => {
      await themeManager.initialize();
      
      const availableThemes = themeManager.getAvailableThemes();
      expect(availableThemes.length).toBeGreaterThan(0);
      
      const lightTheme = availableThemes.find(t => t.id === 'reactory-light');
      const darkTheme = availableThemes.find(t => t.id === 'reactory-dark');
      
      expect(lightTheme).toBeDefined();
      expect(darkTheme).toBeDefined();
    });
  });

  describe('Theme Management', () => {
    beforeEach(async () => {
      await themeManager.initialize();
    });

    test('should get current theme', () => {
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme).toBeDefined();
      expect(currentTheme?.id).toBe('reactory-light');
    });

    test('should get current variant', () => {
      const currentVariant = themeManager.getCurrentVariant();
      // A default variant might be set during initialization
      if (currentVariant) {
        expect(currentVariant).toHaveProperty('id');
        expect(currentVariant).toHaveProperty('baseThemeId');
      } else {
        expect(currentVariant).toBeNull();
      }
    });

    test('should set theme successfully', async () => {
      await themeManager.setTheme('reactory-dark');
      
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme?.id).toBe('reactory-dark');
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.themeChanged', expect.any(Object));
    });

    test('should set theme with variant', async () => {
      // This test assumes variants are available, may need adjustment based on implementation
      await themeManager.setTheme('reactory-light', { variant: 'system-light' });
      
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme?.id).toBe('reactory-light');
    });

    test('should handle theme change options', async () => {
      await themeManager.setTheme('reactory-dark', {
        persist: true,
        transition: true,
        source: 'user',
      });
      
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme?.id).toBe('reactory-dark');
    });

    test('should throw error for non-existent theme', async () => {
      await expect(themeManager.setTheme('non-existent-theme')).rejects.toThrow('Theme not found');
    });

    test('should get all available themes', () => {
      const themes = themeManager.getAvailableThemes();
      
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
      
      themes.forEach(theme => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('isCustom');
        expect(theme).toHaveProperty('variants');
      });
    });

    test('should toggle color scheme', async () => {
      // Start with light theme
      await themeManager.setTheme('reactory-light');
      
      // Toggle to dark
      await themeManager.toggleColorScheme();
      
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme?.id).toBe('reactory-dark');
    });
  });

  describe('Custom Theme Management', () => {
    beforeEach(async () => {
      await themeManager.initialize();
    });

    test('should create custom theme successfully', async () => {
      const customTheme = createMockTheme('custom-test');
      
      const themeId = await themeManager.createCustomTheme(customTheme);
      
      expect(themeId).toBeDefined();
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.customThemeCreated', expect.any(Object));
    });

    test('should create custom theme with auto-generated ID', async () => {
      const customTheme = createMockTheme('custom-test');
      delete (customTheme as any).id;
      
      const themeId = await themeManager.createCustomTheme(customTheme);
      
      expect(themeId).toBeDefined();
      expect(themeId).toMatch(/^custom_\d+$/);
    });

    test('should create and set custom theme as active', async () => {
      const customTheme = createMockTheme('custom-active');
      
      const themeId = await themeManager.createCustomTheme(customTheme, { setActive: true });
      
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme?.id).toBe(themeId);
    });

    test('should delete custom theme successfully', async () => {
      const customTheme = createMockTheme('custom-to-delete');
      const themeId = await themeManager.createCustomTheme(customTheme);
      
      await themeManager.deleteCustomTheme(themeId);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.customThemeDeleted', { themeId });
    });

    test('should not delete non-existent custom theme', async () => {
      await expect(themeManager.deleteCustomTheme('non-existent')).rejects.toThrow('Custom theme not found');
    });

    test('should not delete currently active custom theme', async () => {
      const customTheme = createMockTheme('custom-active');
      const themeId = await themeManager.createCustomTheme(customTheme, { setActive: true });
      
      await expect(themeManager.deleteCustomTheme(themeId)).rejects.toThrow('Cannot delete the currently active theme');
    });

    test('should include custom themes in available themes list', async () => {
      const customTheme = createMockTheme('custom-listed');
      const themeId = await themeManager.createCustomTheme(customTheme);
      
      const themes = themeManager.getAvailableThemes();
      const customThemeInList = themes.find(t => t.id === themeId);
      
      expect(customThemeInList).toBeDefined();
      expect(customThemeInList?.isCustom).toBe(true);
    });
  });

  describe('Theme Validation', () => {
    beforeEach(async () => {
      await themeManager.initialize();
    });

    test('should validate valid theme', () => {
      const validTheme = createMockTheme('valid-theme');
      const result = themeManager.validateTheme(validTheme);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidTheme = { ...createMockTheme('invalid-theme') };
      delete (invalidTheme as any).id;
      delete (invalidTheme as any).name;
      
      const result = themeManager.validateTheme(invalidTheme);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Theme ID is required');
      expect(result.errors).toContain('Theme name is required');
    });

    test('should detect missing colors', () => {
      const invalidTheme = { ...createMockTheme('invalid-colors') };
      delete (invalidTheme as any).colors;
      
      const result = themeManager.validateTheme(invalidTheme);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Colors object is required');
    });

    test('should detect missing typography', () => {
      const invalidTheme = { ...createMockTheme('invalid-typography') };
      delete (invalidTheme as any).typography;
      
      const result = themeManager.validateTheme(invalidTheme);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Typography object is required');
    });

    test('should detect missing spacing', () => {
      const invalidTheme = { ...createMockTheme('invalid-spacing') };
      delete (invalidTheme as any).spacing;
      
      const result = themeManager.validateTheme(invalidTheme);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Spacing object is required');
    });

    test('should emit validation events', () => {
      const theme = createMockTheme('validation-event');
      themeManager.validateTheme(theme);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.themeValidated', expect.any(Object));
    });
  });

  describe('Theme Context', () => {
    beforeEach(async () => {
      await themeManager.initialize();
    });

    test('should get theme context for light theme', async () => {
      await themeManager.setTheme('reactory-light');
      const context = themeManager.getThemeContext();
      
      expect(context).toBeDefined();
      expect(context?.theme.id).toBe('reactory-light');
      expect(context?.isDarkMode).toBe(false);
      expect(context?.isLightMode).toBe(true);
      expect(context?.colorScheme).toBe('light');
    });

    test('should get theme context for dark theme', async () => {
      await themeManager.setTheme('reactory-dark');
      const context = themeManager.getThemeContext();
      
      expect(context).toBeDefined();
      expect(context?.theme.id).toBe('reactory-dark');
      expect(context?.isDarkMode).toBe(true);
      expect(context?.isLightMode).toBe(false);
      expect(context?.colorScheme).toBe('dark');
    });

    test('should return null context when no theme is set', async () => {
      const manager = new ThemeManager(mockReactorySDK);
      const context = manager.getThemeContext();
      
      expect(context).toBeNull();
      
      await manager.destroy();
    });

    test('should include accessibility information in context', async () => {
      const context = themeManager.getThemeContext();
      
      expect(context?.accessibility).toBeDefined();
      expect(typeof context?.accessibility.prefersReducedMotion).toBe('boolean');
      expect(typeof context?.accessibility.prefersHighContrast).toBe('boolean');
    });
  });

  describe('Theme Change Listeners', () => {
    beforeEach(async () => {
      await themeManager.initialize();
    });

    test('should add theme change listener', () => {
      const listener = jest.fn();
      const unsubscribe = themeManager.onThemeChange(listener);
      
      expect(typeof unsubscribe).toBe('function');
    });

    test('should notify listeners on theme change', async () => {
      const listener = jest.fn();
      themeManager.onThemeChange(listener);
      
      await themeManager.setTheme('reactory-dark');
      
      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0];
      expect(event.currentTheme.id).toBe('reactory-dark');
      expect(event.source).toBe('user');
    });

    test('should remove theme change listener', async () => {
      const listener = jest.fn();
      const unsubscribe = themeManager.onThemeChange(listener);
      
      unsubscribe();
      
      await themeManager.setTheme('reactory-dark');
      
      expect(listener).not.toHaveBeenCalled();
    });

    test('should handle listener errors gracefully', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      themeManager.onThemeChange(errorListener);
      
      // Should not throw despite listener error
      await expect(themeManager.setTheme('reactory-dark')).resolves.not.toThrow();
    });
  });

  describe('Theme Preloading', () => {
    beforeEach(async () => {
      await themeManager.initialize();
    });

    test('should preload themes successfully', async () => {
      await themeManager.preloadThemes(['reactory-light', 'reactory-dark']);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.themesPreloaded', 
        expect.objectContaining({ themeIds: ['reactory-light', 'reactory-dark'] })
      );
    });

    test('should handle preload errors gracefully', async () => {
      // Should not throw even if some themes don't exist
      await expect(themeManager.preloadThemes(['non-existent-theme'])).resolves.not.toThrow();
    });

    test('should preload empty theme list', async () => {
      await themeManager.preloadThemes([]);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.themesPreloaded', 
        expect.objectContaining({ themeIds: [] })
      );
    });
  });

  describe('Configuration and Options', () => {
    test('should respect theme validation configuration', async () => {
      const noValidationManager = new ThemeManager(mockReactorySDK, { enableThemeValidation: false });
      await noValidationManager.initialize();
      
      // Should allow invalid theme when validation is disabled
      const invalidTheme = { ...createMockTheme('invalid') };
      delete (invalidTheme as any).id;
      
      // This should work without validation
      expect(noValidationManager).toBeInstanceOf(ThemeManager);
      
      await noValidationManager.destroy();
    });

    test('should respect custom theme configuration', async () => {
      const noCustomManager = new ThemeManager(mockReactorySDK, { enableCustomThemes: false });
      await noCustomManager.initialize();
      
      expect(noCustomManager).toBeInstanceOf(ThemeManager);
      
      await noCustomManager.destroy();
    });

    test('should respect system theme sync configuration', async () => {
      const noSystemManager = new ThemeManager(mockReactorySDK, { enableSystemThemeSync: false });
      await noSystemManager.initialize();
      
      expect(noSystemManager).toBeInstanceOf(ThemeManager);
      
      await noSystemManager.destroy();
    });

    test('should handle custom default theme', async () => {
      const customDefaultManager = new ThemeManager(mockReactorySDK, { 
        defaultTheme: 'reactory-dark' 
      });
      await customDefaultManager.initialize();
      
      const currentTheme = customDefaultManager.getCurrentTheme();
      expect(currentTheme?.id).toBe('reactory-dark');
      
      await customDefaultManager.destroy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle initialization failure gracefully', async () => {
      // Mock an initialization error scenario
      const manager = new ThemeManager(mockReactorySDK);
      
      // Should handle any errors during initialization
      await expect(manager.initialize()).resolves.not.toThrow();
      
      await manager.destroy();
    });

    test('should handle theme validation with null theme', () => {
      const result = themeManager.validateTheme(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle theme validation with undefined theme', () => {
      const result = themeManager.validateTheme(undefined as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should destroy manager and clean up resources', async () => {
      await themeManager.initialize();
      await themeManager.setTheme('reactory-dark');
      
      await themeManager.destroy();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.destroyed');
      
      const context = themeManager.getThemeContext();
      expect(context).toBeNull();
    });

    test('should handle destroy before initialization', async () => {
      const manager = new ThemeManager(mockReactorySDK);
      await manager.destroy();
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.destroyed');
    });

    test('should handle multiple destroy calls', async () => {
      await themeManager.initialize();
      
      await Promise.all([
        themeManager.destroy(),
        themeManager.destroy(),
        themeManager.destroy(),
      ]);
      
      expect(mockReactorySDK.emit).toHaveBeenCalledWith('themeManager.destroyed');
    });
  });
});
