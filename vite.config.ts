import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('@mui/icons-material')) return 'vendor-mui-icons';
            if (id.includes('@mui/') || id.includes('@emotion/')) return 'vendor-mui';
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('react/')) return 'vendor-react';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
