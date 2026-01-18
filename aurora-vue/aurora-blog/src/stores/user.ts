import { defineStore } from 'pinia'
const ssrSafeSessionStorage: Storage | undefined = typeof window !== 'undefined' ? window.sessionStorage : undefined

type UserInfo = {
  userInfoId?: number | string
  avatar?: string
  nickname?: string
  website?: string
  intro?: string
  email?: string | null
  isSubscribe?: number
  [key: string]: unknown
}

type UserStoreState = {
  currentUrl: string
  userVisible: boolean
  userInfo: UserInfo | ''
  token: string
  accessArticles: Array<number | string>
  tab: number
  page: number
}

export const useUserStore = defineStore('userStore', {
  state: (): UserStoreState => ({
    currentUrl: '',
    userVisible: false,
    userInfo: '',
    token: '',
    accessArticles: [],
    tab: 0,
    page: 1
  }),
  actions: {},
  persist: ssrSafeSessionStorage ? { storage: ssrSafeSessionStorage } : false
})
