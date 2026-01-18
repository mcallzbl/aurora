import { defineStore } from 'pinia'

type SearchResult = {
  id?: number | string
  weight?: number
  articleTitle?: string
  articleContent?: string
  [key: string]: unknown
}

type LocalStoreState = {
  weight: number
  recentSearch: SearchResult[]
}

export const useLocalStore = defineStore('localStore', {
  state: (): LocalStoreState => ({
    weight: 1,
    recentSearch: []
  }),
  actions: {},
  persist: true
})
