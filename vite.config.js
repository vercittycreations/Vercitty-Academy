import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase split into own chunk — heaviest dependency
          'firebase-app':       ['firebase/app'],
          'firebase-auth':      ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          // React ecosystem
          'react-vendor':       ['react', 'react-dom', 'react-router-dom'],
          // UI icons — large but tree-shakeable
          'lucide':             ['lucide-react'],
        },
      },
    },
    // Raise warning limit slightly — firebase is inherently large
    chunkSizeWarningLimit: 600,
    // Enable source maps only in dev
    sourcemap: false,
    // Minify
    minify: 'esbuild',
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
})