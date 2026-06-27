import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
//import { VitePWA } from 'vite-plugin-pwa'
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
    
})