// Common utility functions

/**
 * Formats a number as currency
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formats a date string to a human-readable format
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Capitalizes the first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncates a string to a specified length
 */
export const truncate = (str: string, length: number): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

/**
 * Delays execution for a specified number of milliseconds
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generates a random ID string
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

/**
 * Validates an email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Removes all non-numeric characters from a string
 */
export const numbersOnly = (str: string): string => {
  return str.replace(/\D/g, '');
};

/**
 * Formats a phone number (US format)
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = numbersOnly(phone);
  const phoneRegex = /^(\d{3})(\d{3})(\d{4})$/;
  const match = phoneRegex.exec(cleaned);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};
