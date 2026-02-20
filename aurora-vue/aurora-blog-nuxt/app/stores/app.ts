import { defineStore } from 'pinia'
import { i18n } from '@/locales'
import { isSupportedLocale, normalizeLocaleKey } from '@/config/i18n'
import nProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Base config; parent is set dynamically at runtime
nProgress.configure({
  showSpinner: false,
  trickleSpeed: 100
})

const setTheme = (theme: string) => {
  const root = document.documentElement
  if (theme === 'theme-dark') {
    root.classList.remove('theme-light')
    root.classList.add('theme-dark')
  } else {
    root.classList.remove('theme-dark')
    root.classList.add('theme-light')
  }
}

type WebsiteConfig = {
  websiteTitle?: string
  name?: string
  englishName?: string
  logo?: string
  author?: string
  authorAvatar?: string
  authorIntro?: string
  beianNumber?: string
  gonganBeianNumber?: string
  github?: string
  gitee?: string
  twitter?: string
  stackoverflow?: string
  wechat?: string
  qq?: string
  weibo?: string
  csdn?: string
  zhihu?: string
  juejin?: string
  notice?: string
  websiteCreateTime?: string
  touristAvatar?: string
  multiLanguage?: boolean
  isCommentReview?: boolean
  [key: string]: unknown
}

type I18nLocaleTarget = { value: string }
type I18nGlobals = {
  locale: string | I18nLocaleTarget
  fallbackLocale?: string | I18nLocaleTarget
}

const setI18nLocale = (locale: string) => {
  const global = i18n.global as unknown as I18nGlobals
  if (typeof global.locale === 'object' && global.locale && 'value' in global.locale) {
    global.locale.value = locale
  } else {
    global.locale = locale
  }
  if (global.fallbackLocale) {
    if (typeof global.fallbackLocale === 'object' && 'value' in global.fallbackLocale) {
      global.fallbackLocale.value = locale
    } else {
      global.fallbackLocale = locale
    }
  }
}

export const useAppStore = defineStore('appStore', {
  state: () => {
    const storedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null
    return {
      themeConfig: {
        theme: storedTheme || 'theme-dark',
        profile_shape: 'circle-avatar',
        feature: true,
        gradient: {
          color_1: '#24c6dc',
          color_2: '#5433ff',
          color_3: '#ff0099'
        },
        header_gradient_css: 'linear-gradient(130deg, #24c6dc, #5433ff 41.07%, #ff0099 76.05%)',
        background_gradient_style: {
          background: 'linear-gradient(130deg, #24c6dc, #5433ff 41.07%, #ff0099 76.05%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          '-webkit-box-decoration-break': 'clone',
          'box-decoration-break': 'clone'
        }
      },
      appLoading: false,
      websiteConfig: {} as WebsiteConfig,
      viewCount: 0,
      articleCount: 0,
      talkCount: 0,
      categoryCount: 0,
      tagCount: 0,
      NPTimeout: null as ReturnType<typeof setTimeout> | null,
      loadingTimeout: null as ReturnType<typeof setTimeout> | null,
      aurora_bot_enable: true
    }
  },
  actions: {
    changeLocale(locale: string) {
      const normalized = normalizeLocaleKey(locale)
      if (!isSupportedLocale(normalized)) return
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('locale', normalized)
      }
      setI18nLocale(normalized)
    },
    initializeTheme(mode: string) {
      setTheme(mode)
    },
    toggleTheme(isDark?: boolean) {
      this.themeConfig.theme =
        isDark === true || this.themeConfig.theme === 'theme-light' ? 'theme-dark' : 'theme-light'
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', this.themeConfig.theme)
      }
      setTheme(this.themeConfig.theme)
    },
    startLoading() {
      if (typeof document === 'undefined') return
      if (this.appLoading === true) return
      if (this.NPTimeout !== null) clearTimeout(this.NPTimeout)
      if (this.loadingTimeout !== null) clearTimeout(this.loadingTimeout)
      const parentEl = document.getElementById('loading-bar-wrapper')
      if (parentEl) nProgress.configure({ parent: '#loading-bar-wrapper' })
      else nProgress.configure({ parent: 'body' })
      nProgress.start()
      this.appLoading = true
    },
    endLoading() {
      if (typeof document === 'undefined') return
      this.NPTimeout = window.setTimeout(() => {
        nProgress.done()
      }, 100)

      this.loadingTimeout = window.setTimeout(() => {
        this.appLoading = false
      }, 300)
    }
  }
})
