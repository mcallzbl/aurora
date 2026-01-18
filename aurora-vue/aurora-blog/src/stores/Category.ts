import { defineStore } from 'pinia'

type CategoryItem = {
  id: string | number
  categoryName?: string
  articleCount?: number
  [key: string]: unknown
}

export const useCategoryStore = defineStore('categoryStore', {
  state: () => {
    return {
      categories: [] as CategoryItem[]
    }
  },
  actions: {}
})
