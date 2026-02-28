import { isSupportedLocale, normalizeLocaleKey, resolvePreferredLocale, type SupportedLocale } from '@/config/i18n'

const getLocaleFromPath = (path: string): string => {
  const segment = path.split('/').filter(Boolean)[0]
  if (!segment) return ''
  return normalizeLocaleKey(segment)
}

const getSupportedLocaleFromPath = (path: string): SupportedLocale | '' => {
  const locale = getLocaleFromPath(path)
  return isSupportedLocale(locale) ? locale : ''
}

const getSystemLocaleCandidates = (): string[] => {
  if (import.meta.client) {
    return [...(navigator.languages || []), navigator.language].filter(Boolean)
  }

  const acceptLanguage = useRequestHeaders(['accept-language'])['accept-language'] || ''
  return acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0]?.trim() || '')
    .filter(Boolean)
}

export default defineNuxtRouteMiddleware((to, from) => {
  const localeFromTo = getSupportedLocaleFromPath(to.path)

  if (localeFromTo) {
    const originalSegment = to.path.split('/').filter(Boolean)[0] || ''
    if (localeFromTo !== originalSegment) {
      const normalizedPath = to.path.replace(`/${originalSegment}`, `/${localeFromTo}`)
      return navigateTo(`${normalizedPath}${to.fullPath.slice(to.path.length)}`)
    }
    return
  }

  const localeFromFrom = getSupportedLocaleFromPath(typeof from?.path === 'string' ? from.path : '')
  const targetLocale = localeFromFrom || resolvePreferredLocale(getSystemLocaleCandidates())
  const target = to.fullPath === '/' ? `/${targetLocale}` : `/${targetLocale}${to.fullPath}`

  return navigateTo(target, { redirectCode: 302 })
})
