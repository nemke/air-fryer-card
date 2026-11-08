import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'air-fryer-card.js' },
    sourcemap: false,
    emptyOutDir: true,
  },
});
