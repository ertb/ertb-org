/// <reference types="vitest" />
/// <reference types="vite/client" />

import { fileURLToPath, URL } from "url"
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/auth': 'http://localhost:3001',
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            id = id.split('node_modules')[1]
            if (id.startsWith('/@radix-ui/')) { return 'radix-ui' }
            if (id.startsWith('/react-dom/')) { return 'react-dom' }
            if (id.startsWith('/react/')) { return 'react' }
          }
        },
      },
    },
  },
})

