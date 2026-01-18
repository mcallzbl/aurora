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
      messages[matched[1]] = locales[key].default
    }
  })
  return messages
}

const isClient = typeof window !== 'undefined'
const storedLocale = isClient ? window.localStorage.getItem('locale') : null
const rawLocale = storedLocale ? String(storedLocale) : 'en'
// normalize legacy 'cn' to 'zh'
const normalizedLocale = rawLocale === 'cn' ? 'zh' : rawLocale

export const i18n = createI18n({
  locale: normalizedLocale,
  fallbackLocale: normalizedLocale,
  messages: loadLocaleMessages(),
  datetimeFormats: datetimeFormats,
  legacy: false,
  globalInjection: true
})
