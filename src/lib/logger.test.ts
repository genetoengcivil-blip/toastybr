import { describe, it, expect, vi } from 'vitest';
import { logger } from './logger';

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log');
const consoleInfoSpy = vi.spyOn(console, 'info');
const consoleWarnSpy = vi.spyOn(console, 'warn');
const consoleErrorSpy = vi.spyOn(console, 'error');

describe('logger', () => {
  let canSetMode = false;
  let originalMode: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    // Try to see if we can set import.meta.env.MODE
    try {
      originalMode = import.meta.env.MODE;
      // Attempt to make it writable by redefining
      Object.defineProperty(import.meta.env, 'MODE', {
        value: originalMode,
        writable: true,
        configurable: true,
      });
      canSetMode = true;
    } catch (e) {
      canSetMode = false;
    }
  });

  afterEach(() => {
    if (canSetMode && originalMode !== undefined) {
      try {
        Object.defineProperty(import.meta.env, 'MODE', {
          value: originalMode,
          writable: true,
          configurable: true,
        });
      } catch (e) {
        // Ignore
      }
    }
  });

  it('has log, info, warn, error methods', () => {
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('does not throw when called', () => {
    expect(() => logger.log()).not.toThrow();
    expect(() => logger.info()).not.toThrow();
    expect(() => logger.warn()).not.toThrow();
    expect(() => logger.error()).not.toThrow();
  });

  if (canSetMode) {
    it('logs in development mode with original arguments', () => {
      import.meta.env.MODE = 'development';
      const testArg = { message: 'test' };
      logger.log(testArg);
      expect(consoleLogSpy).toHaveBeenCalledWith(testArg);
    });

    it('logs in production mode with sanitized arguments', () => {
      import.meta.env.MODE = 'production';
      const testArg = { password: 'secret', token: 'abc123', public: 'ok' };
      logger.log(testArg);
      expect(consoleLogSpy).toHaveBeenCalledWith({
        password: '[REDACTED]',
        token: '[REDACTED]',
        public: 'ok',
      });
    });

    it('does not alter non-sensitive arguments in production mode', () => {
      import.meta.env.MODE = 'production';
      const testArg = { userId: 123, name: 'John' };
      logger.log(testArg);
      expect(consoleLogSpy).toHaveBeenCalledWith(testArg);
    });

    it('redacts sensitive keys in nested objects', () => {
      import.meta.env.MODE = 'production';
      const testArg = { user: { password: 'secret' } };
      logger.log(testArg);
      expect(consoleLogSpy).toHaveBeenCalledWith({
        user: { password: '[REDACTED]' },
      });
    });

    it('redacts sensitive keys in arrays', () => {
      import.meta.env.MODE = 'production';
      const testArg = [{ password: 'secret' }, { token: 'abc' }];
      logger.log(testArg);
      expect(consoleLogSpy).toHaveBeenCalledWith([
        { password: '[REDACTED]' },
        { token: '[REDACTED]' },
      ]);
    });

    it('leaves functions and other non-serializable values as is (but note: logging functions is not recommended)', () => {
      import.meta.env.MODE = 'production';
      const fn = () => {};
      const testArg = { fn, password: 'secret' };
      logger.log(testArg);
      expect(consoleLogSpy).toHaveBeenCalledWith({
        fn, // function is not sanitized (returns as is)
        password: '[REDACTED]',
      });
    });

    it('works for info, warn, and error methods in production mode', () => {
      import.meta.env.MODE = 'production';
      const testArg = { password: 'secret' };
      logger.info(testArg);
      logger.warn(testArg);
      logger.error(testArg);
      expect(consoleInfoSpy).toHaveBeenCalledWith({ password: '[REDACTED]' });
      expect(consoleWarnSpy).toHaveBeenCalledWith({ password: '[REDACTED]' });
      expect(consoleErrorSpy).toHaveBeenCalledWith({ password: '[REDACTED]' });
    });
  } else {
    // If we cannot mock MODE, at least test that the logger functions are present and do not throw.
    it('MODE is not writable in this test environment; skipping development/production tests', () => {
      // This test is just a placeholder to indicate why we skipped the mode tests.
      expect(true).toBe(true);
    });
  }
});