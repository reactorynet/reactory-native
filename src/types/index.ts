// Import Reactory types
import './reactory';

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Details: { title?: string };
};

// Redux types (re-exported from store)
export type { RootState, AppDispatch } from '../store';

// Common component props
export interface BaseScreenProps {
  testID?: string;
}

// API response types (example)
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
}

// User types (example)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    error: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}
