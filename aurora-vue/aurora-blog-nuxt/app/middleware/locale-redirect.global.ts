import { isSupportedLocale, normalizeLocaleKey, resolvePreferredLocale } from '@/config/i18n'

const getLocaleFromPath = (path: string) => {
  const segment = path.split('/').filter(Boolean)[0]
  if (!segment) return ''
  return normalizeLocaleKey(segment)
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

export default defineNuxtRouteMiddleware((to) => {
  const localeFromTo = getLocaleFromPath(to.path)

  if (isSupportedLocale(localeFromTo)) {
    const originalSegment = to.path.split('/').filter(Boolean)[0] || ''
    if (localeFromTo !== originalSegment) {
      const normalizedPath = to.path.replace(`/${originalSegment}`, `/${localeFromTo}`)
      return navigateTo(`${normalizedPath}${to.fullPath.slice(to.path.length)}`)
    }
    return
  }

  const targetLocale = resolvePreferredLocale(getSystemLocaleCandidates())
  const target = to.fullPath === '/' ? `/${targetLocale}` : `/${targetLocale}${to.fullPath}`

  return navigateTo(target, { redirectCode: 302 })
})
