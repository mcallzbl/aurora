import { defineStore } from 'pinia'
import { i18n } from '@/locales'
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
      websiteConfig: '' as any,
      viewCount: 0,
      articleCount: 0,
      talkCount: 0,
      categoryCount: 0,
      tagCount: 0,
      NPTimeout: -1,
      loadingTimeout: -1,
      aurora_bot_enable: true
    }
  },
  actions: {
    changeLocale(locale: string) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('locale', locale)
      }
      if ('value' in i18n.global.locale) {
        ;(i18n.global.locale as any).value = locale
      } else {
        // fallback for legacy mode
        ;(i18n.global.locale as any) = locale
      }
      if ('fallbackLocale' in i18n.global && 'value' in (i18n.global as any).fallbackLocale) {
        ;((i18n.global as any).fallbackLocale as any).value = locale
      } else if ('fallbackLocale' in i18n.global) {
        ;(i18n.global as any).fallbackLocale = locale
      }
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
      if (this.NPTimeout !== -1) clearTimeout(this.NPTimeout)
      if (this.loadingTimeout !== -1) clearTimeout(this.loadingTimeout)
      const parentEl = document.getElementById('loading-bar-wrapper')
      if (parentEl) nProgress.configure({ parent: '#loading-bar-wrapper' })
      else nProgress.configure({ parent: 'body' })
      nProgress.start()
      this.appLoading = true
    },
    endLoading() {
      this.NPTimeout = <any>setTimeout(() => {
        nProgress.done()
      }, 100)

      this.loadingTimeout = <any>setTimeout(() => {
        this.appLoading = false
      }, 300)
    }
  }
})
