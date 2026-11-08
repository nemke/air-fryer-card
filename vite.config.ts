import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

export default defineConfig({
  define: { __AIR_FRYER_CARD_VERSION__: JSON.stringify(version) },
  build: {
    target: 'es2022',
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'air-fryer-card.js' },
    sourcemap: false,
    emptyOutDir: true,
  },
});
