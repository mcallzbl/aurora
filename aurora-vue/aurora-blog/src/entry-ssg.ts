import App from './App.vue'

import { ViteSSG } from 'vite-ssg'
import type { Directive } from 'vue'
import { routes } from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from './locales'

import { registerSvgIcon } from '@/icons'
import { registerObSkeleton } from '@/components/LoadingSkeleton'
import { installRouterGuards } from '@/router/guard'

import axios, { type InternalAxiosRequestConfig } from 'axios'
import { ElNotification } from 'element-plus'
import { useUserStore } from '@/stores/user'

export const createApp = ViteSSG(App, { routes }, async ({ app, router }) => {
  const pinia = createPinia()
  if (!import.meta.env.SSR) {
    pinia.use(piniaPluginPersistedstate)
  }
  app.use(pinia)
  app.use(i18n)

  const resolveAsset = (asset: unknown): string => {
    if (typeof asset === 'string') return asset
    if (asset && typeof asset === 'object' && 'default' in asset) {
      const maybeDefault = (asset as { default?: unknown }).default
      return typeof maybeDefault === 'string' ? maybeDefault : ''
    }
    return ''
  }

  const noopDirective: Directive = {}
  const ssrDirective: Directive = { getSSRProps: () => ({}) }

  if (!import.meta.env.SSR) {
    // load global styles only in client
    await Promise.all([
      import('normalize.css/normalize.css'),
      import('@/styles/index.css'),
      import('element-plus/theme-chalk/index.css'),
      import('prismjs/themes/prism.css'),
      import('mavon-editor/dist/css/index.css'),
      import('katex/dist/katex.min.css')
    ])

    const [
      { default: VueClickAway },
      { default: infiniteScroll },
      { default: v3ImgPreview },
      { default: lazyPlugin },
      cover
    ] = await Promise.all([
      import('vue3-click-away'),
      import('vue3-infinite-scroll-better'),
      import('v3-img-preview'),
      import('vue3-lazy'),
      import('@/assets/default-cover.jpg')
    ])
    const defaultCover = resolveAsset(cover)

    app.use(VueClickAway)
    app.use(infiniteScroll)
    app.use(v3ImgPreview, {})
    app.use(lazyPlugin, {
      loading: defaultCover,
      error: defaultCover
    })
  } else {
    // SSR: register no-op directives used in templates so SSR won't fail
    // v-lazy and v-infinite-scroll are client-only behaviors
    app.directive('lazy', noopDirective)
    app.directive('infinite-scroll', noopDirective)
  }

  if (import.meta.env.SSR) {
    // SSR stubs for client-only directives to avoid SSR renderer errors
    // v-lazy
    app.directive('lazy', ssrDirective)
    // v-infinite-scroll
    app.directive('infinite-scroll', ssrDirective)
    // v-click-away
    app.directive('click-away', ssrDirective)
  }

  // SVG icons and skeleton components
  if (!import.meta.env.SSR) {
    registerSvgIcon(app)
    registerObSkeleton(app)
  }

  // Guards (client only, due to nprogress DOM usage)
  if (!import.meta.env.SSR) installRouterGuards(router)

  if (!import.meta.env.SSR) {
    // expose Element Plus notification as $notify
    app.config.globalProperties.$notify = ElNotification
    const userStore = useUserStore()
    axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      config.headers['Authorization'] = 'Bearer ' + sessionStorage.getItem('token')
      return config
    })
    const proxy = app.config.globalProperties
    axios.interceptors.response.use(
      (response) => {
        if (response.data.flag) {
          return response
        }
        switch (response.data.code) {
          case 50000: {
            proxy.$notify({ title: 'Error', message: '系统异常', type: 'error' })
            break
          }
          case 40001: {
            proxy.$notify({ title: 'Error', message: '用户未登录', type: 'error' })
            if (userStore.userInfo !== '') {
              userStore.userInfo = ''
              userStore.token = ''
              userStore.accessArticles = []
              sessionStorage.removeItem('token')
            }
            break
          }
          default: {
            proxy.$notify({ title: 'Error', message: response.data.message, type: 'error' })
            break
          }
        }
        return response
      },
      (error) => Promise.reject(error)
    )

    // console credits
    console.log('%c 网站原作者:花未眠', 'color:#bada55')
    console.log('%c 原作者qq:1909925152', 'color:#bada55')
  }
})
