import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // --- CORRECCIÓN AQUÍ ---
  server: {
    proxy: {
      // Cualquier petición que empiece con /api
      '/api': {
        target: 'http://127.0.0.1:8000', // Tu backend de Django
        changeOrigin: true, // ¡Muy importante!
      },
      // Cualquier petición que empiece con /auth
      '/auth': {
        target: 'http://127.0.0.1:8000', // Tu backend de Django
        changeOrigin: true, // ¡Muy importante!
      }
    }
  },
  // --- FIN DE LA CORRECCIÓN ---

  optimizeDeps: {
    include: ['qrcode.react'],
  }
});