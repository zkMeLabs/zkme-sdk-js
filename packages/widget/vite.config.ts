import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: [
        './lib/index.ts',
        './lib/verify.ts',
        './lib/widget.ts',
        './lib/style.css'
      ]
    },
    sourcemap: true,
    minify: false,
    cssMinify: 'lightningcss'
  }
})
