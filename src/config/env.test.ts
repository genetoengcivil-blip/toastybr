import { describe, it, expect } from 'vitest';
import { validateEnvironmentPure } from './env';

// Mock import.meta.env for testing
const createMetaEnv = (overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> => ({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key-for-testing-only-12345', // clearly fake, not a real JWT
  ...overrides,
});

describe('validateEnvironmentPure', () => {
  it('passes with valid environment', () => {
    const metaEnv = createMetaEnv();
    expect(() => validateEnvironmentPure(metaEnv)).not.toThrow();
  });

  it('fails with missing VITE_SUPABASE_URL', () => {
    const metaEnv = createMetaEnv({ VITE_SUPABASE_URL: '' });
    expect(() => validateEnvironmentPure(metaEnv)).toThrow('VITE_SUPABASE_URL is required');
  });

  it('fails with invalid VITE_SUPABASE_URL (not HTTPS)', () => {
    const metaEnv = createMetaEnv({ VITE_SUPABASE_URL: 'http://example.supabase.co' });
    expect(() => validateEnvironmentPure(metaEnv)).toThrow('VITE_SUPABASE_URL must be a valid HTTPS URL');
  });

  it('fails with missing VITE_SUPABASE_ANON_KEY', () => {
    const metaEnv = createMetaEnv({ VITE_SUPABASE_ANON_KEY: '' });
    expect(() => validateEnvironmentPure(metaEnv)).toThrow('VITE_SUPABASE_ANON_KEY is required');
  });

  it('fails with too short VITE_SUPABASE_ANON_KEY', () => {
    const metaEnv = createMetaEnv({ VITE_SUPABASE_ANON_KEY: 'short' });
    expect(() => validateEnvironmentPure(metaEnv)).toThrow('VITE_SUPABASE_ANON_KEY appears to be too short');
  });
});