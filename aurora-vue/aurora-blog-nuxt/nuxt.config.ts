import { resolve } from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import prismjs from 'vite-plugin-prismjs'

const API_TARGET = process.env.VITE_API_BASE || 'https://www.devillusion.asia/api'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' },
  alias: {
    '@': resolve(__dirname, 'app')
  },
  css: [
    '@/styles/index.css'
  ],
  imports: {
    dirs: ['stores', 'composables', 'services']
  },
  runtimeConfig: {
    public: {
      apiBase: API_TARGET
    }
  },
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {}
    }
  },
  vite: {
    plugins: [
      createSvgIconsPlugin({
        iconDirs: [resolve(__dirname, 'app/icons/svg')],
        symbolId: 'icon-[name]'
      }),
      prismjs({
        languages: [
          'javascript',
          'typescript',
          'python',
          'kotlin',
          'go',
          'yaml',
          'css',
          'sql',
          'java',
          'c',
          'cpp',
          'nginx',
          'markup',
          'shell',
          'json'
        ],
        plugins: ['line-numbers', 'toolbar', 'copy-to-clipboard'],
        theme: 'okaidia',
        css: true
      })
    ],
    resolve: {
      alias: {
        'cytoscape/dist/cytoscape.umd.js': resolve(__dirname, 'node_modules/cytoscape/dist/cytoscape.umd.js')
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(API_TARGET)
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: (content: string, filePath: string) => {
            if (filePath.endsWith('.vue')) {
              return `@reference "${resolve(__dirname, 'app/styles/tailwind.css')}";\n${content}`
            }
            return content
          }
        }
      }
    }
  }
})
