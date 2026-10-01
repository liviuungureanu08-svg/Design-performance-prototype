import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    // INLINE=1 (used by scripts/pack-artifact.mjs) embeds fonts as data: URIs so the whole page is one self-contained file
    assetsInlineLimit: process.env.INLINE ? 100_000_000 : 4096,
    // index.html = Flagship 01 (closed, preserved); exp02.html = Experiment 02; exp03.html = Experiment 03. PAGE=exp02 builds one page only (artifact packer).
    rollupOptions: { input: process.env.PAGE ? { [process.env.PAGE]: `${process.env.PAGE}.html` } : { index: 'index.html', exp02: 'exp02.html', exp03: 'exp03.html' } },
  },
});
