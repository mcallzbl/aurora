import { defineStore } from 'pinia'
const ssrSafeSessionStorage: Storage | undefined =
  typeof window !== 'undefined' ? window.sessionStorage : undefined

export const useUserStore = defineStore('userStore', {
  state: () => {
    return {
      currentUrl: '' as any,
      userVisible: false,
      userInfo: '' as any,
      token: '' as any,
      accessArticles: [] as any,
      tab: 0 as any,
      page: 1 as any
    }
  },
  actions: {},
  persist: ssrSafeSessionStorage ? { storage: ssrSafeSessionStorage } : false as any
})
