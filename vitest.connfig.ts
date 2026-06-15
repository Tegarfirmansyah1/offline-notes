import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
  esbuild: {
    // Membabat habis console.log dan debugger khusus saat build production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
