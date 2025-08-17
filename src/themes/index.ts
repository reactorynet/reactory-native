// React Native Paper theme configuration
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    primaryContainer: '#bb86fc',
    secondary: '#03dac6',
    secondaryContainer: '#018786',
    surface: '#ffffff',
    background: '#f5f5f5',
    error: '#cf6679',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    primaryContainer: '#6200ee',
    secondary: '#03dac6',
    secondaryContainer: '#018786',
    surface: '#121212',
    background: '#1a1a1a',
    error: '#cf6679',
  },
};

export type AppTheme = typeof lightTheme;
