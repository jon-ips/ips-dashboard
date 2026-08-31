import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Two entry pages: the main app and the stevedore's standalone
      // no-PIN overview (own manifest so Android installs reopen it).
      input: {
        main: resolve(__dirname, 'index.html'),
        stevedore: resolve(__dirname, 'stevedore.html'),
      },
    },
  },
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
