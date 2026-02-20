import { DEFAULT_LOCALE, isSupportedLocale, normalizeLocaleKey } from '@/config/i18n'

const getLocaleFromPath = (path: string) => {
  const segment = path.split('/').filter(Boolean)[0]
  if (!segment) return ''
  return normalizeLocaleKey(segment)
}

export default defineNuxtRouteMiddleware((to, from) => {
  const localeFromTo = getLocaleFromPath(to.path)

  if (isSupportedLocale(localeFromTo)) {
    const originalSegment = to.path.split('/').filter(Boolean)[0] || ''
    if (localeFromTo !== originalSegment) {
      const normalizedPath = to.path.replace(`/${originalSegment}`, `/${localeFromTo}`)
      return navigateTo(`${normalizedPath}${to.fullPath.slice(to.path.length)}`)
    }
    return
  }

  const localeFromFrom = getLocaleFromPath(from.path)
  const localeFromStorage = import.meta.client ? normalizeLocaleKey(localStorage.getItem('locale') || '') : ''
  const preferredLocale = [localeFromFrom, localeFromStorage, DEFAULT_LOCALE].find((item) => isSupportedLocale(item))

  const fallbackLocale = preferredLocale || DEFAULT_LOCALE
  const target = to.fullPath === '/' ? `/${fallbackLocale}` : `/${fallbackLocale}${to.fullPath}`

  return navigateTo(target, { redirectCode: 302 })
})
