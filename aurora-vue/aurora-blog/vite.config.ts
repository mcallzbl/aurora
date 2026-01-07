import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path, { resolve } from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import prismjs from 'vite-plugin-prismjs'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Single source of truth for API base used by dev proxy, SSR/SSG fetching, and app env
  const API_TARGET = env.VITE_API_BASE || 'https://www.devillusion.asia/api'
  
  return {
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: 'src/auto-import.d.ts' // 生成类型定义文件
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: 'src/components.d.ts' // 生成组件类型定义
    }),
    createSvgIconsPlugin({
      iconDirs: [resolve(__dirname, 'src/icons/svg')],
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
    }),
    tailwindcss()
  ],
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    includedRoutes: async () => {
      const staticRoutes = [
        '/',
        '/archives',
        '/tags',
        '/about',
        '/message',
        '/friends'
      ]
      const API_BASE = API_TARGET
      const results: string[] = [...staticRoutes]
      try {
        // Tag -> Article list pages
        const res = await fetch(`${API_BASE}/tags/all`)
        const json = await res.json()
        const tags = Array.isArray(json?.data) ? json.data : []
        const tagRoutes = tags.map((t: any) => `/article-list/${encodeURIComponent(t.id)}?tagName=${encodeURIComponent(t.tagName || '')}`)
        results.push(...tagRoutes)
      } catch (e) {
        console.warn('[ssg] fetch tags failed, skipping tag routes')
      }

      try {
        // Article detail pages (paginate)
        const size = 50
        let current = 1
        while (true) {
          const resp = await fetch(`${API_BASE}/articles/all?current=${current}&size=${size}`)
          const j = await resp.json()
          const rec = Array.isArray(j?.data?.records) ? j.data.records : []
          if (rec.length === 0) break
          const published = rec.filter((a: any) => a && a.status !== 2)
          results.push(...published.map((a: any) => `/articles/${encodeURIComponent(a.id)}`))
          if (rec.length < size) break
          current += 1
        }
      } catch (e) {
        console.warn('[ssg] fetch articles failed, skipping article routes')
      }
      return results
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'cytoscape/dist/cytoscape.umd.js': resolve(
        __dirname,
        'node_modules/cytoscape/dist/cytoscape.umd.js'
      )
    }
  },
  define: {
    // Make sure import.meta.env.VITE_API_BASE is always defined in both client and SSR builds
    'import.meta.env.VITE_API_BASE': JSON.stringify(API_TARGET)
  },
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
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
 }
})
