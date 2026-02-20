import { createI18n } from 'vue-i18n'
import { DEFAULT_LOCALE, isSupportedLocale, normalizeLocaleKey } from '@/config/i18n'

type LocaleMessages = Record<string, Record<string, Record<string, string>>>

const datetimeFormats = {
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
  'zh-CN': {
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
  },
  ja: {
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
  }
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
const rawLocale = storedLocale ? String(storedLocale) : DEFAULT_LOCALE
const normalizedLocale = normalizeLocaleKey(rawLocale)
const localeKey = isSupportedLocale(normalizedLocale) ? normalizedLocale : DEFAULT_LOCALE

export const i18n = createI18n({
  locale: localeKey,
  fallbackLocale: localeKey,
  messages: loadLocaleMessages(),
  datetimeFormats: datetimeFormats,
  legacy: false,
  globalInjection: true
})
