import { setHeader } from 'h3'
import { SUPPORTED_LOCALES } from '../../app/config/i18n'

const PAGE_SIZE = 100
const MAX_PAGE = 80
const SITEMAP_STATIC_PATHS = ['/', '/archives', '/tags', '/about', '/message', '/friends', '/talks']

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

const collectPagedIds = async (apiBase: string, path: string): Promise<string[]> => {
  const ids = new Set<string>()
  for (let current = 1; current <= MAX_PAGE; current++) {
    const payload = await fetchJson(buildApiUrl(apiBase, path, { current: String(current), size: String(PAGE_SIZE) }))
    if (!payload) break
    const records = extractPageRecords(payload)
    if (records.length === 0) break
    records.forEach((item) => {
      const idValue = normalizeId(item.id)
      if (idValue) ids.add(idValue)
    })
    const total = extractPageTotal(payload)
    if (records.length < PAGE_SIZE) break
    if (typeof total === 'number' && current * PAGE_SIZE >= total) break
  }
  return Array.from(ids)
}

const collectSimpleIds = async (apiBase: string, path: string): Promise<string[]> => {
  const payload = await fetchJson(buildApiUrl(apiBase, path))
  if (!payload) return []
  const records = extractCollection(payload)
  const ids = new Set<string>()
  records.forEach((item) => {
    const idValue = normalizeId(item.id)
    if (idValue) ids.add(idValue)
  })
  return Array.from(ids)
}

const localizePath = (locale: string, path: string): string => {
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiBase = String(config.public.apiBase || 'https://www.devillusion.asia/api')
  const siteUrl = trimTrailingSlash(String(config.public.siteUrl || 'https://www.devillusion.asia'))

  const [articleIds, talkIds, tagIds, albumIds] = await Promise.all([
    collectPagedIds(apiBase, '/articles/all'),
    collectPagedIds(apiBase, '/talks'),
    collectSimpleIds(apiBase, '/tags/all'),
    collectSimpleIds(apiBase, '/photos/albums')
  ])

  const dynamicPaths = new Set<string>()
  articleIds.forEach((id) => dynamicPaths.add(`/articles/${id}`))
  talkIds.forEach((id) => dynamicPaths.add(`/talks/${id}`))
  tagIds.forEach((id) => dynamicPaths.add(`/article-list/${id}`))
  albumIds.forEach((id) => dynamicPaths.add(`/photos/${id}`))

  const localizedPaths = new Set<string>()
  localizedPaths.add('/')
  for (const locale of SUPPORTED_LOCALES) {
    for (const path of SITEMAP_STATIC_PATHS) {
      localizedPaths.add(localizePath(locale, path))
    }
    for (const path of dynamicPaths) {
      localizedPaths.add(localizePath(locale, path))
    }
  }

  const urls = Array.from(localizedPaths).map((path) => `${siteUrl}${path}`)
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`),
    '</urlset>'
  ].join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'no-store')

  return body
})
