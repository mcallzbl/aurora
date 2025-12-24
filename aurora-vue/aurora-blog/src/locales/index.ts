import { createI18n } from 'vue-i18n'
import cookies from 'js-cookie'

type LocaleMessages = Record<string, Record<string, Record<string, string>>>

function loadLocaleMessages(): LocaleMessages {
  const locales = import.meta.glob<{ default: Record<string, Record<string, string>> }>(
    '../locales/languages/*.json',
    {
      eager: true
    }
  )
  const messages: LocaleMessages = {}
  Object.keys(locales).forEach((key) => {
    const matched = key.match(/([A-Za-z0-9-_]+)\.json$/i)
    if (matched && matched[1]) {
      messages[matched[1]] = locales[key].default
    }
  })
  return messages
}

export const i18n = createI18n({
  locale: cookies.get('locale') ? String(cookies.get('locale')) : 'en',
  fallbackLocale: cookies.get('locale') ? String(cookies.get('locale')) : 'en',
  messages: loadLocaleMessages(),
  legacy:false,
  globalInjection: true
})
