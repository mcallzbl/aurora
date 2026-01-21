import { defineStore } from 'pinia'

export interface TabItem {
  path: string
  label: string
  closable: boolean
}

interface UserInfo {
  token?: string
  avatar?: string
  nickname?: string
  intro?: string
  webSite?: string
  [key: string]: unknown
}

interface PageState {
  articleList: number
  category: number
  tag: number
  comment: number
  talkList: number
  user: number
  online: number
  role: number
  quartz: number
  friendLink: number
  operationLog: number
  exceptionLog: number
  quartzLog: {
    jobId: number
    current: number
  }
  photo: {
    albumId: number
    current: number
  }
}

interface AppState {
  collapse: boolean
  tabs: TabItem[]
  userInfo: UserInfo | null
  pageState: PageState
}

const defaultTabs: TabItem[] = [{ path: '/', label: '首页', closable: false }]

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    collapse: false,
    tabs: [...defaultTabs],
    userInfo: null,
    pageState: {
      articleList: 1,
      category: 1,
      tag: 1,
      comment: 1,
      talkList: 1,
      user: 1,
      online: 1,
      role: 1,
      quartz: 1,
      friendLink: 1,
      operationLog: 1,
      exceptionLog: 1,
      quartzLog: {
        jobId: -1,
        current: 1,
      },
      photo: {
        albumId: -1,
        current: 1,
      },
    },
  }),
  actions: {
    toggleCollapse() {
      this.collapse = !this.collapse
    },
    addTab(tab: TabItem) {
      if (!this.tabs.some((item) => item.path === tab.path)) {
        this.tabs.push(tab)
      }
    },
    removeTab(path: string) {
      this.tabs = this.tabs.filter((item) => item.path !== path)
    },
    resetTabs() {
      this.tabs = [...defaultTabs]
    },
    login(user: UserInfo) {
      this.userInfo = user
      if (user.token) {
        sessionStorage.setItem('token', user.token)
      }
    },
    logout() {
      this.userInfo = null
      this.tabs = [...defaultTabs]
      sessionStorage.removeItem('token')
    },
    updateAvatar(avatar: string) {
      if (!this.userInfo) {
        this.userInfo = { avatar }
        return
      }
      this.userInfo.avatar = avatar
    },
    updateUserInfo(payload: Pick<UserInfo, 'nickname' | 'intro' | 'webSite'>) {
      if (!this.userInfo) {
        this.userInfo = { ...payload }
        return
      }
      this.userInfo.nickname = payload.nickname
      this.userInfo.intro = payload.intro
      this.userInfo.webSite = payload.webSite
    },
    updateArticleListPageState(current: number) {
      this.pageState.articleList = current
    },
    updateCategoryPageState(current: number) {
      this.pageState.category = current
    },
    updateTagPageState(current: number) {
      this.pageState.tag = current
    },
    updateCommentPageState(current: number) {
      this.pageState.comment = current
    },
    updateTalkListPageState(current: number) {
      this.pageState.talkList = current
    },
    updateUserPageState(current: number) {
      this.pageState.user = current
    },
    updateOnlinePageState(current: number) {
      this.pageState.online = current
    },
    updateRolePageState(current: number) {
      this.pageState.role = current
    },
    updateQuartzPageState(current: number) {
      this.pageState.quartz = current
    },
    updateFriendLinkPageState(current: number) {
      this.pageState.friendLink = current
    },
    updateOperationLogPageState(current: number) {
      this.pageState.operationLog = current
    },
    updateExceptionLogPageState(current: number) {
      this.pageState.exceptionLog = current
    },
    updateQuartzLogPageState(payload: { jobId: number; current: number }) {
      this.pageState.quartzLog.jobId = payload.jobId
      this.pageState.quartzLog.current = payload.current
    },
    updatePhotoPageState(payload: { albumId: number; current: number }) {
      this.pageState.photo.albumId = payload.albumId
      this.pageState.photo.current = payload.current
    },
  },
})
