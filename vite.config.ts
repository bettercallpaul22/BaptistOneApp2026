import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react-router-dom')) return 'router';
          if (id.includes('node_modules/@reduxjs/toolkit') || id.includes('node_modules/react-redux')) return 'redux';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor';
          return undefined;
        },
      },
    },
  },
});
