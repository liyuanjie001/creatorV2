import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __ACCESS_PASSWORD_HASH__: JSON.stringify(createHash('sha256').update('test-password').digest('hex')),
  },
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/**/*.unit.ts'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
  },
});
