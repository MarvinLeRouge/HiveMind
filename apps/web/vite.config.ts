import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@hivemind/shared': fileURLToPath(
        new URL('../../packages/shared/src', import.meta.url),
      ),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['hivemind.marvinlerouge.local'],
  },
});
