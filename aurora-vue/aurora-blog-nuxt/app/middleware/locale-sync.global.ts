import { isSupportedLocale, normalizeLocaleKey } from '@/config/i18n'

export default defineNuxtRouteMiddleware((to) => {
  const segment = to.path.split('/').filter(Boolean)[0] || ''
  const locale = normalizeLocaleKey(segment)

  if (!isSupportedLocale(locale)) return

  try {
    const appStore = useAppStore()
    appStore.changeLocale(locale)
  } catch (error) {
    console.warn('[locale-sync] failed to sync locale', error)
  }
})
