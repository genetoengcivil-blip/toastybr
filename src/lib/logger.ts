// src/lib/logger.ts
// Simple logger for Toasty OS
// In development, logs to console.
// In production, logs to console with sensitive data redacted.
// Can be extended to send to an external service (e.g., Sentry) without exposing sensitive data.

const isDevelopment = import.meta.env.MODE === 'development';

// Regex to match keys that likely contain sensitive information
const SENSITIVE_KEY_REGEX = /password|passwd|pwd|secret|token|authorization|auth|jwt|session/i;

/**
 * Recursively redacts sensitive values from an object or array.
 * Primitive values are returned as is.
 * Functions and other non-serializable values are returned as is (but should not be logged).
 */
function sanitize(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    // Avoid sanitizing DOM nodes or other special objects that might break
    if (typeof value !== 'object' || value instanceof Date || value instanceof RegExp) return value;
    const sanitized: any = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof key === 'string' && SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(val);
      }
    }
    return sanitized;
  }
  // For functions, symbols, etc., return as is (caller should avoid logging these)
  return value;
}

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    } else {
      console.log(...args.map(sanitize));
    }
    // In production, you could send to an external service here.
    // Example: sendToExternalService('log', args.map(sanitize));
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    } else {
      console.info(...args.map(sanitize));
    }
    // Example: sendToExternalService('info', args.map(sanitize));
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    } else {
      console.warn(...args.map(sanitize));
    }
    // Example: sendToExternalService('warn', args.map(sanitize));
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      console.error(...args.map(sanitize));
    }
    // In production, you might want to always send errors to an external service.
    // Example: sendToExternalService('error', args.map(sanitize));
  },
};

// Example of a function that could send logs to an external service (not implemented)
// function sendToExternalService(level: LogLevel, args: any[]) {
//   // Be careful to not send sensitive data (passwords, tokens, etc.)
//   // You could transform the args to remove sensitive information before sending.
// }