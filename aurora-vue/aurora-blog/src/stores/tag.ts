import { defineStore } from 'pinia'

type TagItem = {
  id?: number | string
  count?: number
  tagName?: string
  [key: string]: unknown
}

type TagStoreState = {
  homeTags: TagItem[]
  tags: TagItem[]
}

export const useTagStore = defineStore('tagStore', {
  state: (): TagStoreState => ({
    homeTags: [],
    tags: []
  }),
  actions: {}
})
