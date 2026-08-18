import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/features/**/*.ts',
        'src/features/**/*.tsx',
        'src/lib/**/*.ts',
        'src/app/**/*.ts',
        'src/app/**/*.tsx',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/types.ts',
        '**/demo.ts',
        'src/app/router.tsx',
      ],
    },
    testTimeout: 10000,
    server: {
      deps: {
        inline: ['zod'],
      },
    },
  },
})