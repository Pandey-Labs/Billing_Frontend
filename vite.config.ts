import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // ← change to your backend port if different
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Increase warning limit to reduce noisy warnings for larger apps
    chunkSizeWarningLimit: 1024, // in KB (default 500)
    rollupOptions: {
      output: {
        // Improve chunking by grouping large vendor libraries
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor_react';
            if (id.includes('react-router-dom')) return 'vendor_router';
            if (id.includes('@reduxjs') || id.includes('redux')) return 'vendor_redux';
            if (id.includes('recharts')) return 'vendor_recharts';
            if (id.includes('bootstrap') || id.includes('react-bootstrap')) return 'vendor_bootstrap';
            if (id.includes('xlsx') || id.includes('jspdf') || id.includes('jspdf-autotable')) return 'vendor_docs';
            if (id.includes('axios')) return 'vendor_axios';
            return 'vendor_misc';
          }
        },
      },
    },
  },
})