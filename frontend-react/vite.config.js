import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Tailwind CSS integration
import path from "path"
import { readFileSync, existsSync } from 'node:fs'
import { parseEnv } from 'node:util'

import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Local development must survive stale variables inherited from old terminals.
  const savedEnv = {}
  for (const name of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    const file = path.join(__dirname, name)
    if (existsSync(file)) Object.assign(savedEnv, parseEnv(readFileSync(file, 'utf8')))
  }
  return {
  ...(command === 'serve' && mode === 'development' ? {
    define: { 'import.meta.env.VITE_MAP_API_URL': JSON.stringify(savedEnv.VITE_MAP_API_URL || 'http://localhost:9090/api/map/search') },
  } : {}),
  plugins: [
    react(),
    tailwindcss(), // Tailwind Vite plugin integration
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react-router-dom') || id.includes('@remix-run')) return 'router';
            if (id.includes('react')) return 'react';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react-leaflet') || id.includes('react-leaflet-cluster') || id.includes('leaflet')) return 'map-vendor';
            if (id.includes('axios')) return 'http';
            return 'deps';
          }
        }
      }
    }
  },
  test: {
    // This package declares only a module entry; resolve it explicitly for Node tests.
    alias: {
      'react-photo-sphere-viewer': path.resolve(__dirname, 'node_modules/react-photo-sphere-viewer/dist/index.js'),
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js',
  }
  }
})
