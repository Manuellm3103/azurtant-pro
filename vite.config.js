import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src',
  base: './',
  server: {
    port: 5173
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Sin manualChunks: causa "React is null" cuando un componente
        // en index.jsx evalúa antes de que termine de cargar el chunk
        // separado de react-vendor. Vite hace chunking automático
        // correcto sin esto.
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom', 'react-toastify']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})