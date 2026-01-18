import { createI18n, IntlDateTimeFormats } from 'vue-i18n'

type LocaleMessages = Record<string, Record<string, Record<string, string>>>

const datetimeFormats: IntlDateTimeFormats = {
  en: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric'
    },
    monthYear: {
      year: 'numeric',
      month: 'short'
    }
  },
  zh: {
    short: {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    },
    monthYear: {
      year: 'numeric',
      month: 'long'
    }
  },
  'zh-TW': {
    short: {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    },
    monthYear: {
      year: 'numeric',
      month: 'long'
    }
  }
}

const normalizeLocaleKey = (value: string) => {
  const normalized = value === 'cn' ? 'zh' : value
  const lower = normalized.toLowerCase()
  if (lower === 'zh-tw' || lower === 'zh_tw') return 'zh-TW'
  return normalized
}

function loadLocaleMessages(): LocaleMessages {
  const locales = import.meta.glob<{ default: Record<string, Record<string, string>> }>('../locales/languages/*.json', {
    eager: true
  })
  const messages: LocaleMessages = {}
  Object.keys(locales).forEach((key) => {
    const matched = key.match(/([A-Za-z0-9-_]+)\.json$/i)
    if (matched && matched[1]) {
      const localeKey = normalizeLocaleKey(matched[1])
      messages[localeKey] = locales[key].default
    }
  })
  return messages
}

const isClient = typeof window !== 'undefined'
const storedLocale = isClient ? window.localStorage.getItem('locale') : null
const rawLocale = storedLocale ? String(storedLocale) : 'en'
const normalizedLocale = normalizeLocaleKey(rawLocale)
const localeKey = normalizedLocale

export const i18n = createI18n({
  locale: localeKey,
  fallbackLocale: localeKey,
  messages: loadLocaleMessages(),
  datetimeFormats: datetimeFormats,
  legacy: false,
  globalInjection: true
})
