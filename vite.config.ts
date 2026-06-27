import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { type Plugin, type ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

const crossOriginIsolationPlugin = (): Plugin => ({
  name: 'configure-server-headers',
  configureServer: (server: ViteDevServer) => {
    server.middlewares.use((_req: IncomingMessage, res: ServerResponse, next: () => void) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      next();
    });
  }
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crossOriginIsolationPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*.wasm','favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'AM Notes', // Ganti sama nama aplikasi lu
        short_name: 'AM',
        description: 'Aplikasi catatan spasial yang jalan 100% offline',
        theme_color: '#0f172a', // Warna header browser (sesuaikan warna slate lu)
        background_color: '#0f172a',
        display: 'standalone', // Bikin aplikasinya full-screen tanpa address bar pas diinstal
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 🔥 KUNCI UTAMA OFFLINE: Cache semua file penting, TERUTAMA .wasm untuk SQLite!
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // Naikkan batas ukuran cache karena file SQLite dan React Flow lumayan besar
        maximumFileSizeToCacheInBytes: 5000000 
      }
    })
  ],

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('react')) {
          return 'vendor-react';
        } else if (id.includes('@xyflow/react')) {
          return 'vendor-flow';
        } else if (id.includes('react-markdown') || id.includes('remark-gfm')) {
          return 'vendor-markdown';
        }
        return 'default';
      },
    },
  },
},


  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  worker: {
    format: 'es'
  },
    
})