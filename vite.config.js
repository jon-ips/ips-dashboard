import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '5173'),
    host: '127.0.0.1',
    open: false,
    proxy: {
      '/payday-api': {
        target: 'https://api.payday.is',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/payday-api/, ''),
      },
    },
  },
});
