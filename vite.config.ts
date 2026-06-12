import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

const crossOriginIsolationPlugin = () => ({
  name: 'configure-server-headers',
  configureServer: (server: any) => {
    server.middlewares.use((_req: any, res: any, next: any) => {
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
      workbox: {
        // Cache semua aset statis agar bisa dibuka offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'] 
      },
      manifest: {
        name: 'Anti-Mainstream Notes',
        short_name: 'AM Notes',
        description: 'Hardcore Local-First Note Taking App',
        theme_color: '#ffffff',
        display: 'standalone',
        // (Nantinya kamu perlu menyiapkan ikon berukuran 192x192 dan 512x512 di folder public)
      },
    })
  ],

  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
    
})