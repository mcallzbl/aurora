export const SUPPORTED_LOCALES = ['en', 'zh', 'ja', 'zh-TW'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const normalizeLocaleKey = (value: string): string => {
  const normalized = value === 'cn' ? 'zh' : value
  const lower = normalized.toLowerCase()
  if (lower === 'zh-tw' || lower === 'zh_tw') return 'zh-TW'
  return normalized
}

export const isSupportedLocale = (value: string): value is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}
