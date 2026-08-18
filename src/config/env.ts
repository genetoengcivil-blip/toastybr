// src/config/env.ts
// Centralized environment validation for Toasty OS

/**
 * Validates required environment variables for the application.
 * This is a pure function that can be easily tested.
 *
 * @param env - The environment variables object (like import.meta.env)
 * @throws {Error} if any required variable is missing or invalid.
 */
export function validateEnvironmentPure(env: Record<string, string | undefined>): void {
  const errors: string[] = [];

  // Validate VITE_SUPABASE_URL
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must be a valid HTTPS URL');
  }

  // Validate VITE_SUPABASE_ANON_KEY
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  } else if (supabaseAnonKey.length < 10) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be too short');
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

/**
 * Validates required environment variables for the application.
 * Call this once at application startup (e.g., in main.tsx).
 *
 * Throws an error if any required variable is missing or invalid.
 */
export function validateEnvironment(): void {
  validateEnvironmentPure(import.meta.env as Record<string, string | undefined>);
}

/**
 * Gets the Supabase URL from environment variables.
 * Throws if not validated or missing.
 */
export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'VITE_SUPABASE_URL is not available. Call validateEnvironment() first.'
    );
  }
  return url;
}

/**
 * Gets the Supabase anon key from environment variables.
 * Throws if not validated or missing.
 */
export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is not available. Call validateEnvironment() first.'
    );
  }
  return key;
}