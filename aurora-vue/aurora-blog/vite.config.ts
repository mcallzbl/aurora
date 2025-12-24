import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import prismjs from 'vite-plugin-prismjs'

export default defineConfig({
  plugins: [
    vue(),
    createSvgIconsPlugin({
      iconDirs: [resolve(__dirname, 'src/icons/svg')],
      symbolId: 'icon-[name]'
    }),
    prismjs({
      languages: ['javascript', 'css', 'sql', 'java', 'c', 'cpp', 'nginx', 'markup', 'shell', 'json'],
      plugins: ['line-numbers', 'toolbar', 'copy-to-clipboard'],
      theme: 'okaidia',
      css: true
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'cytoscape/dist/cytoscape.umd.js': resolve(
        __dirname,
        'node_modules/cytoscape/dist/cytoscape.umd.js'
      )
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://www.devillusion.asia/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    sourcemap: false
  }
})
