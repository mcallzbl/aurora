import { getRequestURL, sendRedirect } from 'h3'
import { isSupportedLocale, normalizeLocaleKey, resolvePreferredLocale, type SupportedLocale } from '../../app/config/i18n'

const BYPASS_PATHS = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico'
])

const BYPASS_PREFIXES = [
  '/_nuxt/',
  '/api/',
  '/__nuxt_error'
]

const shouldBypass = (path: string): boolean => {
  if (BYPASS_PATHS.has(path)) return true
  if (BYPASS_PREFIXES.some((prefix) => path.startsWith(prefix))) return true
  const lastSegment = path.split('/').filter(Boolean).at(-1) || ''
  return lastSegment.includes('.')
}

const getSupportedLocaleFromPath = (path: string): SupportedLocale | '' => {
  const segment = path.split('/').filter(Boolean)[0] || ''
  const locale = normalizeLocaleKey(segment)
  return isSupportedLocale(locale) ? locale : ''
}

const extractPreferredLocale = (acceptLanguageHeader: string | undefined): SupportedLocale => {
  const candidates = String(acceptLanguageHeader || '')
    .split(',')
    .map((part) => part.split(';')[0]?.trim() || '')
    .filter(Boolean)
  return resolvePreferredLocale(candidates)
}

const extractLocaleFromReferer = (refererHeader: string | undefined, requestHost: string | undefined): SupportedLocale | '' => {
  if (!refererHeader) return ''

  try {
    const refererUrl = new URL(refererHeader)
    const hostHeader = String(requestHost || '').split(',')[0]?.trim() || ''
    if (hostHeader && refererUrl.host !== hostHeader) return ''
    return getSupportedLocaleFromPath(refererUrl.pathname)
  } catch {
    return ''
  }
}

export default defineEventHandler((event) => {
  const method = event.node.req.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') return

  const requestUrl = getRequestURL(event)
  const pathname = requestUrl.pathname
  if (!pathname || shouldBypass(pathname)) return

  const localeFromPath = getSupportedLocaleFromPath(pathname)
  if (localeFromPath) return

  const requestHost = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host')
  const localeFromReferer = extractLocaleFromReferer(getRequestHeader(event, 'referer'), requestHost)
  const targetLocale = localeFromReferer || extractPreferredLocale(getRequestHeader(event, 'accept-language'))
  const localizedPath = pathname === '/' ? `/${targetLocale}` : `/${targetLocale}${pathname}`
  const target = `${localizedPath}${requestUrl.search}`
  return sendRedirect(event, target, 302)
})
