import { defineStore } from 'pinia'

type CommentSummary = {
  id?: number | string
  avatar?: string | null
  nickname?: string
  createTime?: string | number | Date
  commentContent?: string
  [key: string]: unknown
}

type CommentStoreState = {
  recentComment: CommentSummary[]
  type: number
}

export const useCommentStore = defineStore('commentStore', {
  state: (): CommentStoreState => ({
    recentComment: [],
    type: 0
  }),
  actions: {}
})
