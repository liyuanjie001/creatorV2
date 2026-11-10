import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const root = fileURLToPath(new URL('.', import.meta.url));
  const password = loadEnv(mode, root, 'password').password ?? '';
  return {
    base: './',
    plugins: [vue()],
    define: {
      __ACCESS_PASSWORD_HASH__: JSON.stringify(
        password ? createHash('sha256').update(password).digest('hex') : '',
      ),
    },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  };
});
