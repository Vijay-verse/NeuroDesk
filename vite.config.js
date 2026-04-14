import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://neurodesk-production-4355.up.railway.app',
        changeOrigin: true,
      },
    },
  },
});
