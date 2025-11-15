import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/SubApp_beta/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
