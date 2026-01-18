import { defineStore } from 'pinia'

type ArticleSummary = {
  id?: number | string
  status?: number
  articleTitle?: string
  articleContent?: string
  createTime?: string | number | Date
  [key: string]: unknown
}

type ArchiveItem = {
  time: string
  articles: ArticleSummary[]
  [key: string]: unknown
}

type ArticleStoreState = {
  topArticle: ArticleSummary
  featuredArticles: ArticleSummary[]
  articles: ArticleSummary[]
  categories: Array<Record<string, unknown>>
  archives: ArchiveItem[]
}

export const useArticleStore = defineStore('articleStore', {
  state: (): ArticleStoreState => ({
    topArticle: {},
    featuredArticles: [],
    articles: [],
    categories: [],
    archives: []
  }),
  actions: {}
})
