import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'architecture-flow.js',
    },
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
