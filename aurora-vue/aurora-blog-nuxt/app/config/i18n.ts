export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'ja', 'zh-TW'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const normalizeLocaleKey = (value: string): string => {
  const normalized = value.replace('_', '-')
  const lower = normalized.toLowerCase()
  if (lower === 'zh-cn') return 'zh-CN'
  if (lower === 'zh-tw') return 'zh-TW'
  if (lower === 'en') return 'en'
  if (lower === 'ja') return 'ja'
  return normalized
}

export const isSupportedLocale = (value: string): value is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

const BASE_LANGUAGE_LOCALE_MAP: Record<string, SupportedLocale> = {
  en: 'en',
  ja: 'ja',
  zh: 'zh-CN'
}

export const resolvePreferredLocale = (candidates: readonly string[]): SupportedLocale => {
  for (const candidate of candidates) {
    const raw = String(candidate || '').trim()
    if (!raw) continue

    const normalized = normalizeLocaleKey(raw)
    if (isSupportedLocale(normalized)) return normalized

    const base = raw.replace('_', '-').toLowerCase().split('-')[0]
    const mapped = BASE_LANGUAGE_LOCALE_MAP[base]
    if (mapped) return mapped
  }

  return DEFAULT_LOCALE
}
