import { getRequestURL, setHeader, type H3Event } from 'h3'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../../app/config/i18n'

const PAGE_SIZE = 100
const MAX_PAGE = 80
const SITEMAP_STATIC_PATHS = ['/', '/archives', '/tags', '/about', '/message', '/friends', '/talks']
const LASTMOD_KEYS = [
  'updateTime',
  'updatedTime',
  'update_time',
  'updated_time',
  'modifyTime',
  'modifiedTime',
  'modify_time',
  'modified_time',
  'createTime',
  'createdTime',
  'create_time',
  'created_time'
]

type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
type SitemapMeta = {
  lastmod?: string
  changefreq: ChangeFreq
  priority: string
}
type DynamicPathEntry = {
  id: string
  lastmod?: string
}
type SitemapAlternate = {
  hreflang: string
  href: string
}
type SitemapUrlEntry = {
  loc: string
  alternates: SitemapAlternate[]
  lastmod?: string
  changefreq?: ChangeFreq
  priority?: string
}

type RecordLike = Record<string, unknown>

const isRecord = (value: unknown): value is RecordLike => {
  return typeof value === 'object' && value !== null
}

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

const xmlEscape = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const normalizeId = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return encodeURIComponent(String(value))
  if (typeof value === 'string' && value.trim().length > 0) return encodeURIComponent(value.trim())
  return null
}

const normalizeDate = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()

  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = value > 1_000_000_000_000 ? value : value > 1_000_000_000 ? value * 1000 : value
    const date = new Date(normalized)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
    return null
  }

  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return null
    if (/^\d+$/.test(raw)) return normalizeDate(Number(raw))
    const date = new Date(raw)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
    return null
  }

  return null
}

const pickLatestDate = (current?: string, next?: string): string | undefined => {
  if (!next) return current
  if (!current) return next
  return Date.parse(next) > Date.parse(current) ? next : current
}

const extractLastmod = (item: RecordLike): string | undefined => {
  for (const key of LASTMOD_KEYS) {
    const date = normalizeDate(item[key])
    if (date) return date
  }
  return undefined
}

const toRecordList = (value: unknown): RecordLike[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is RecordLike => isRecord(item))
}

const unwrapData = (value: unknown): unknown => {
  if (isRecord(value) && 'data' in value) return value.data
  return value
}

const buildApiUrl = (apiBase: string, path: string, query?: Record<string, string>): string => {
  const queryString = query ? new URLSearchParams(query).toString() : ''
  return `${trimTrailingSlash(apiBase)}${path}${queryString ? `?${queryString}` : ''}`
}

const fetchJson = async (url: string): Promise<unknown | null> => {
  try {
    return await $fetch<unknown>(url, {
      headers: {
        accept: 'application/json'
      }
    })
  } catch {
    return null
  }
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

const collectPagedEntries = async (apiBase: string, path: string): Promise<DynamicPathEntry[]> => {
  const entries = new Map<string, string | undefined>()
  for (let current = 1; current <= MAX_PAGE; current++) {
    const payload = await fetchJson(buildApiUrl(apiBase, path, { current: String(current), size: String(PAGE_SIZE) }))
    if (!payload) break
    const records = extractPageRecords(payload)
    if (records.length === 0) break
    records.forEach((item) => {
      const idValue = normalizeId(item.id)
      if (!idValue) return
      const lastmod = extractLastmod(item)
      entries.set(idValue, pickLatestDate(entries.get(idValue), lastmod))
    })
    const total = extractPageTotal(payload)
    if (records.length < PAGE_SIZE) break
    if (typeof total === 'number' && current * PAGE_SIZE >= total) break
  }
  return Array.from(entries.entries()).map(([id, lastmod]) => ({ id, lastmod }))
}

const collectSimpleEntries = async (apiBase: string, path: string): Promise<DynamicPathEntry[]> => {
  const payload = await fetchJson(buildApiUrl(apiBase, path))
  if (!payload) return []
  const records = extractCollection(payload)
  const entries = new Map<string, string | undefined>()
  records.forEach((item) => {
    const idValue = normalizeId(item.id)
    if (!idValue) return
    const lastmod = extractLastmod(item)
    entries.set(idValue, pickLatestDate(entries.get(idValue), lastmod))
  })
  return Array.from(entries.entries()).map(([id, lastmod]) => ({ id, lastmod }))
}

const getMetaByPath = (path: string): SitemapMeta => {
  if (path === '/') return { changefreq: 'daily', priority: '1.0' }
  if (path === '/archives') return { changefreq: 'daily', priority: '0.8' }
  if (path === '/tags') return { changefreq: 'weekly', priority: '0.7' }
  if (path === '/talks') return { changefreq: 'daily', priority: '0.8' }
  if (path === '/about') return { changefreq: 'monthly', priority: '0.6' }
  if (path === '/message') return { changefreq: 'weekly', priority: '0.6' }
  if (path === '/friends') return { changefreq: 'weekly', priority: '0.6' }
  if (path.startsWith('/articles/')) return { changefreq: 'weekly', priority: '0.8' }
  if (path.startsWith('/talks/')) return { changefreq: 'weekly', priority: '0.7' }
  if (path.startsWith('/article-list/')) return { changefreq: 'weekly', priority: '0.7' }
  if (path.startsWith('/photos/')) return { changefreq: 'weekly', priority: '0.7' }
  return { changefreq: 'monthly', priority: '0.5' }
}

const localizePath = (locale: string, path: string): string => {
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

const buildAlternates = (siteUrl: string, path: string): SitemapAlternate[] => {
  const localizedAlternates = SUPPORTED_LOCALES.map((locale) => ({
    hreflang: locale,
    href: `${siteUrl}${localizePath(locale, path)}`
  }))
  const xDefaultHref = path === '/' ? `${siteUrl}/` : `${siteUrl}${localizePath(DEFAULT_LOCALE, path)}`
  return [...localizedAlternates, { hreflang: 'x-default', href: xDefaultHref }]
}

const renderUrlNode = (item: SitemapUrlEntry): string => {
  const lines = [
    '  <url>',
    `    <loc>${xmlEscape(item.loc)}</loc>`
  ]

  item.alternates.forEach((alternate) => {
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alternate.hreflang)}" href="${xmlEscape(alternate.href)}" />`
    )
  })
  if (item.lastmod) lines.push(`    <lastmod>${xmlEscape(item.lastmod)}</lastmod>`)
  if (item.changefreq) lines.push(`    <changefreq>${xmlEscape(item.changefreq)}</changefreq>`)
  if (item.priority) lines.push(`    <priority>${xmlEscape(item.priority)}</priority>`)
  lines.push('  </url>')
  return lines.join('\n')
}

const resolveSiteUrl = (event: H3Event, configuredSiteUrl: unknown): string => {
  const configured = trimTrailingSlash(String(configuredSiteUrl || '').trim())
  if (configured) return configured
  const runtimePublicSiteUrl = trimTrailingSlash(String(process.env.NUXT_PUBLIC_SITE_URL || '').trim())
  if (runtimePublicSiteUrl) return runtimePublicSiteUrl
  const runtimeSiteUrl = trimTrailingSlash(String(process.env.SITE_URL || '').trim())
  if (runtimeSiteUrl) return runtimeSiteUrl
  const requestUrl = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true })
  return trimTrailingSlash(requestUrl.origin)
}

const mergePathMeta = (target: Map<string, SitemapMeta>, path: string, patch: Partial<SitemapMeta>) => {
  const meta = target.get(path) || getMetaByPath(path)
  meta.lastmod = pickLatestDate(meta.lastmod, patch.lastmod)
  if (patch.changefreq) meta.changefreq = patch.changefreq
  if (patch.priority) meta.priority = patch.priority
  target.set(path, meta)
}

const getLatestDateFromEntries = (entries: DynamicPathEntry[]): string | undefined => {
  return entries.reduce<string | undefined>((acc, entry) => pickLatestDate(acc, entry.lastmod), undefined)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiBase = String(config.public.apiBase || 'https://www.devillusion.asia/api')
  const siteUrl = resolveSiteUrl(event, config.public.siteUrl)

  const [articleEntries, talkEntries, tagEntries, albumEntries] = await Promise.all([
    collectPagedEntries(apiBase, '/articles/all'),
    collectPagedEntries(apiBase, '/talks'),
    collectSimpleEntries(apiBase, '/tags/all'),
    collectSimpleEntries(apiBase, '/photos/albums')
  ])

  const pathMetaMap = new Map<string, SitemapMeta>()
  SITEMAP_STATIC_PATHS.forEach((path) => mergePathMeta(pathMetaMap, path, {}))
  articleEntries.forEach((entry) => mergePathMeta(pathMetaMap, `/articles/${entry.id}`, { lastmod: entry.lastmod }))
  talkEntries.forEach((entry) => mergePathMeta(pathMetaMap, `/talks/${entry.id}`, { lastmod: entry.lastmod }))
  tagEntries.forEach((entry) => mergePathMeta(pathMetaMap, `/article-list/${entry.id}`, { lastmod: entry.lastmod }))
  albumEntries.forEach((entry) => mergePathMeta(pathMetaMap, `/photos/${entry.id}`, { lastmod: entry.lastmod }))

  const latestArticleDate = getLatestDateFromEntries(articleEntries)
  const latestTalkDate = getLatestDateFromEntries(talkEntries)
  mergePathMeta(pathMetaMap, '/', { lastmod: latestArticleDate })
  mergePathMeta(pathMetaMap, '/archives', { lastmod: latestArticleDate })
  mergePathMeta(pathMetaMap, '/talks', { lastmod: latestTalkDate })

  const sortedPaths = Array.from(pathMetaMap.keys()).sort((a, b) => a.localeCompare(b))
  const urlEntries: SitemapUrlEntry[] = []
  sortedPaths.forEach((path) => {
    const meta = pathMetaMap.get(path)
    if (!meta) return
    const alternates = buildAlternates(siteUrl, path)
    for (const locale of SUPPORTED_LOCALES) {
      urlEntries.push({
        loc: `${siteUrl}${localizePath(locale, path)}`,
        alternates,
        lastmod: meta.lastmod,
        changefreq: meta.changefreq,
        priority: meta.priority
      })
    }
    if (path === '/') {
      urlEntries.push({
        loc: `${siteUrl}/`,
        alternates,
        lastmod: meta.lastmod,
        changefreq: meta.changefreq,
        priority: meta.priority
      })
    }
  })

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urlEntries.map(renderUrlNode),
    '</urlset>'
  ].join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'no-store')

  return body
})
