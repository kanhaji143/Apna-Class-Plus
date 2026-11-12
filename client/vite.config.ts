import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true, // tunnel hosts (serveo/localhost.run) allow karo dev mein
    proxy: {
      // dev mein API calls server pe bhejo (CORS-less)
      '/v1': 'http://localhost:4000',
      '/v2': 'http://localhost:4000',
      '/v3': 'http://localhost:4000',
      '/lp': 'http://localhost:4000',
    },
  },
});
