import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    replace({
      'preventAssignment': true,
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    react(),
  ],
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
