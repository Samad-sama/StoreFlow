import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
    ],
  },
  server: {
    port: 3000,
  },
});
