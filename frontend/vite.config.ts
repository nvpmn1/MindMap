import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('/node_modules/@xyflow/')) {
            return 'xyflow';
          }

          if (
            id.includes('/node_modules/@dnd-kit/') ||
            id.includes('/node_modules/framer-motion/')
          ) {
            return 'interaction';
          }

          if (id.includes('/node_modules/@radix-ui/')) {
            return 'ui';
          }

          if (id.includes('/node_modules/@supabase/') || id.includes('/node_modules/zustand/')) {
            return 'state-data';
          }

          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons';
          }

          return 'vendor';
        },
      },
    },
  },
});
