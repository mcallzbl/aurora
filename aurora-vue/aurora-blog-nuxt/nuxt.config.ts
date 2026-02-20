import { resolve } from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import prismjs from 'vite-plugin-prismjs'
import { SUPPORTED_LOCALES } from './app/config/i18n'

const API_TARGET = process.env.VITE_API_BASE || 'https://www.devillusion.asia/api'
const SITE_TARGET = process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || ''
const PAGE_SIZE = 100
const MAX_PAGE = 80
const SEO_CACHE_CONTROL = 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600'
const STATIC_PAGE_PATHS = ['/', '/archives', '/tags', '/about', '/message', '/friends', '/talks', '/oauth/login/qq', '/404']

type RecordLike = Record<string, unknown>

const isRecord = (value: unknown): value is RecordLike => {
  return typeof value === 'object' && value !== null
}

const unwrapData = (value: unknown): unknown => {
  if (isRecord(value) && 'data' in value) {
    return value.data
  }
  return value
}

const normalizeId = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return encodeURIComponent(String(value))
  if (typeof value === 'string' && value.trim().length > 0) return encodeURIComponent(value.trim())
  return null
}

const toRecordList = (value: unknown): RecordLike[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is RecordLike => isRecord(item))
}

const buildApiUrl = (apiBase: string, path: string, query?: Record<string, string>): string => {
  const base = apiBase.replace(/\/$/, '')
  const queryString = query ? new URLSearchParams(query).toString() : ''
  return `${base}${path}${queryString ? `?${queryString}` : ''}`
}

const extractPageRecords = (payload: unknown): RecordLike[] => {
  const data = unwrapData(payload)
  if (isRecord(data) && Array.isArray(data.records)) return toRecordList(data.records)
  if (isRecord(payload) && Array.isArray(payload.records)) return toRecordList(payload.records)
  return []
}

const extractPageTotal = (payload: unknown): number | null => {
  const data = unwrapData(payload)
  if (isRecord(data) && typeof data.count === 'number') return data.count
  if (isRecord(payload) && typeof payload.count === 'number') return payload.count
  return null
}

const extractCollection = (payload: unknown): RecordLike[] => {
  const data = unwrapData(payload)
  if (Array.isArray(data)) return toRecordList(data)
  if (isRecord(data) && Array.isArray(data.records)) return toRecordList(data.records)
  if (isRecord(data) && Array.isArray(data.list)) return toRecordList(data.list)
  if (isRecord(payload) && Array.isArray(payload.records)) return toRecordList(payload.records)
  return []
}

const fetchJson = async (url: string): Promise<unknown | null> => {
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

const collectPagedIds = async (apiBase: string, path: string, idKey: string): Promise<string[]> => {
  const ids = new Set<string>()
  for (let current = 1; current <= MAX_PAGE; current++) {
    const payload = await fetchJson(buildApiUrl(apiBase, path, { current: String(current), size: String(PAGE_SIZE) }))
    if (!payload) break
    const records = extractPageRecords(payload)
    if (records.length === 0) break
    records.forEach((item) => {
      const idValue = normalizeId(item[idKey] ?? item.id)
      if (idValue) ids.add(idValue)
    })
    const total = extractPageTotal(payload)
    if (records.length < PAGE_SIZE) break
    if (typeof total === 'number' && current * PAGE_SIZE >= total) break
  }
  return Array.from(ids)
}

const collectSimpleIds = async (apiBase: string, path: string, idKey: string): Promise<string[]> => {
  const payload = await fetchJson(buildApiUrl(apiBase, path))
  if (!payload) return []
  const records = extractCollection(payload)
  const ids = new Set<string>()
  records.forEach((item) => {
    const idValue = normalizeId(item[idKey] ?? item.id)
    if (idValue) ids.add(idValue)
  })
  return Array.from(ids)
}

const collectFeaturedArticleIds = async (apiBase: string): Promise<string[]> => {
  const payload = await fetchJson(buildApiUrl(apiBase, '/articles/topAndFeatured'))
  if (!payload) return []
  const data = unwrapData(payload)
  if (!isRecord(data)) return []
  const ids = new Set<string>()
  const topArticle = isRecord(data.topArticle) ? data.topArticle : null
  if (topArticle) {
    const idValue = normalizeId(topArticle.id)
    if (idValue) ids.add(idValue)
  }
  const featuredArticles = toRecordList(data.featuredArticles)
  featuredArticles.forEach((item) => {
    const idValue = normalizeId(item.id)
    if (idValue) ids.add(idValue)
  })
  return Array.from(ids)
}

const localizeRoute = (locale: string, path: string): string => {
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

const localizeRoutes = (paths: Iterable<string>): string[] => {
  const routes = new Set<string>()
  for (const locale of SUPPORTED_LOCALES) {
    for (const path of paths) {
      routes.add(localizeRoute(locale, path))
    }
  }
  return Array.from(routes)
}

const STATIC_LOCALIZED_ROUTES = localizeRoutes(STATIC_PAGE_PATHS)

const collectDynamicPrerenderRoutes = async (apiBase: string): Promise<string[]> => {
  const [articleIds, featuredIds, talkIds, albumIds, tagIds] = await Promise.all([
    collectPagedIds(apiBase, '/articles/all', 'id'),
    collectFeaturedArticleIds(apiBase),
    collectPagedIds(apiBase, '/talks', 'id'),
    collectSimpleIds(apiBase, '/photos/albums', 'id'),
    collectSimpleIds(apiBase, '/tags/all', 'id')
  ])

  const dynamicPaths = new Set<string>()
  articleIds.forEach((id) => dynamicPaths.add(`/articles/${id}`))
  featuredIds.forEach((id) => dynamicPaths.add(`/articles/${id}`))
  talkIds.forEach((id) => dynamicPaths.add(`/talks/${id}`))
  albumIds.forEach((id) => dynamicPaths.add(`/photos/${id}`))
  tagIds.forEach((id) => dynamicPaths.add(`/article-list/${id}`))

  return localizeRoutes(dynamicPaths)
}

const localeRouteRules = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [
    `/${locale}/**`,
    {
      prerender: true,
      headers: {
        'cache-control': SEO_CACHE_CONTROL
      }
    }
  ])
)

const svgIconsPlugin = createSvgIconsPlugin({
  iconDirs: [resolve(__dirname, 'app/icons/svg')],
  symbolId: 'icon-[name]'
})

const prismPlugin = prismjs({
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
      apiBase: API_TARGET,
      siteUrl: SITE_TARGET
    }
  },
  routeRules: {
    '/': { prerender: true },
    ...localeRouteRules,
    '/robots.txt': {
      headers: {
        'cache-control': 'public, max-age=3600, s-maxage=86400'
      }
    },
    '/sitemap.xml': {
      prerender: false,
      headers: {
        'cache-control': 'no-store'
      }
    }
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', ...STATIC_LOCALIZED_ROUTES]
    }
  },
  hooks: {
    async 'nitro:config'(nitroConfig) {
      nitroConfig.prerender = nitroConfig.prerender || {}
      nitroConfig.prerender.crawlLinks = true
      const prerenderRoutes = (nitroConfig.prerender.routes || []).filter((route): route is string => typeof route === 'string')
      const routeSet = new Set<string>([...prerenderRoutes, '/', ...STATIC_LOCALIZED_ROUTES])
      const dynamicRoutes = await collectDynamicPrerenderRoutes(API_TARGET)
      dynamicRoutes.forEach((route) => routeSet.add(route))
      nitroConfig.prerender.routes = Array.from(routeSet)
    }
  },
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {}
    }
  },
  vite: {
    plugins: [
      svgIconsPlugin as any,
      prismPlugin as any
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
