import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./app/tests/setup.ts'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './'),
      '@/composables': resolve(__dirname, './app/composables'),
      '@/components': resolve(__dirname, './app/components'),
      '@/types': resolve(__dirname, './types'),
    },
  },
});
