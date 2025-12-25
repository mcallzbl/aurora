import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path, { resolve } from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import prismjs from 'vite-plugin-prismjs'
import tailwindcss from '@tailwindcss/vite'

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
    }),
    tailwindcss()
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
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 自动为每个 scss 样式块注入 reference
        additionalData: (content, filePath) => {
          // 只给 Vue 组件里的 <style> 块自动注入
          if (filePath.endsWith('.vue')) {
            return `@reference "${path.resolve(__dirname, 'src/styles/tailwind.css')}";\n${content}`
          }
          return content
        }

      }
    }
  }
})
