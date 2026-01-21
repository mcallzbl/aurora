import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
}

const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.dataset.theme = mode
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    mode: 'light',
  }),
  actions: {
    setMode(mode: ThemeMode) {
      this.mode = mode
      applyTheme(mode)
    },
    toggleMode() {
      const next = this.mode === 'light' ? 'dark' : 'light'
      this.setMode(next)
    },
    syncTheme() {
      applyTheme(this.mode)
    },
  },
})
