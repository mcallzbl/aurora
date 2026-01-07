import { createRouter as _createRouter, createWebHistory, createMemoryHistory } from 'vue-router'

export const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/articles/:articleId',
    name: 'Articles',
    component: () => import('../views/Article.vue')
  },
  {
    path: '/talks',
    name: 'talkList',
    component: () => import('../views/TalkList.vue')
  },
  {
    path: '/talks/:talkId',
    name: 'talks',
    component: () => import('../views/Talk.vue')
  },
  {
    path: '/archives',
    name: 'Archives',
    component: () => import('../views/Archives.vue')
  },
  {
    path: '/article-list/:tagId',
    name: 'ArticleList',
    component: () => import('../views/ArticleList.vue')
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('../views/Tags.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/message',
    name: 'Message',
    component: () => import('../views/Message.vue')
  },
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('../views/FriendLink.vue')
  },
  {
    path: '/photos/:albumId',
    name: 'Photos',
    component: () => import('../views/Photos.vue')
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../views/404.vue')
  },
  {
    path: '/oauth/login/qq',
    name: 'qqLogin',
    component: () => import('../components/OauthLogin.vue')
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/404',
    hidden: true
  }
]

// Factory for CSR usage (not used by SSG entry). Avoids creating history during SSR.
// Factory used by ViteSSG (expects a named export `createRouter`)
export function createRouter() {
  const history = import.meta.env.SSR
    ? createMemoryHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL)
  return _createRouter({ history, routes })
}
