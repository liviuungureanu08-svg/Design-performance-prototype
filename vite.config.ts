import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    // INLINE=1 (used by scripts/pack-artifact.mjs) embeds fonts as data: URIs so the whole page is one self-contained file
    assetsInlineLimit: process.env.INLINE ? 100_000_000 : 4096,
  },
});
