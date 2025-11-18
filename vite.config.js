import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  publicDir: 'public',
  server: {
    open: true, // Automatically open the app in the browser
  },
  build: {
    outDir: 'dist', // Output directory for the build
    sourcemap: true, // Generate source maps for easier debugging
  },
  resolve: {
    alias: {
      '@': '/src', // Alias for easier imports
    },
  },
});