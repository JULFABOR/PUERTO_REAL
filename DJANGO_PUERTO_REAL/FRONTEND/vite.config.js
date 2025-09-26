import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Cualquier petición que empiece con /api o /auth...
      '/api': 'http://127.0.0.1:8000', // ...se redirige a Django.
      '/auth': 'http://127.0.0.1:8000',
    }
  }
});