import { createApp } from 'vue'
import App from './App.vue'

import 'normalize.css/normalize.css'
import '@/styles/index.css'
import 'element-plus/theme-chalk/index.css'
import 'prismjs/themes/prism.css'
import 'mavon-editor/dist/css/index.css'
import 'katex/dist/katex.min.css'

import router from './router'
import './router/guard'
import { createPinia } from 'pinia'
import { i18n } from './locales'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import 'prismjs'
import VueClickAway from 'vue3-click-away'
import lazyPlugin from 'vue3-lazy'
import infiniteScroll from 'vue3-infinite-scroll-better'
import v3ImgPreview from 'v3-img-preview'
import { components, plugins } from './plugins/element-plus'

import { registerSvgIcon } from '@/icons'
import { registerObSkeleton } from '@/components/LoadingSkeleton'
import api from './api/api'
import axios from 'axios'

import { useUserStore } from '@/stores/user'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
export const app = createApp(App)
  .use(router)
  .use(pinia)
  .use(i18n)
  .use(VueClickAway)
  .use(infiniteScroll)
  .use(v3ImgPreview, {})
  .use(lazyPlugin, {
    loading: '@/assets/default-cover.jpg', // 使用默认封面作为加载图
    error: '@/assets/default-cover.jpg'
  })
const userStore = useUserStore()
axios.interceptors.request.use((config: any) => {
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
        proxy.$notify({
          title: 'Error',
          message: '系统异常',
          type: 'error'
        })
        break
      }
      case 40001: {
        proxy.$notify({
          title: 'Error',
          message: '用户未登录',
          type: 'error'
        })
        if (userStore.userInfo !== '') {
          userStore.userInfo = ''
          userStore.token = ''
          userStore.accessArticles = []
          sessionStorage.removeItem('token')
        }
        break
      }
      default: {
        proxy.$notify({
          title: 'Error',
          message: response.data.message,
          type: 'error'
        })
        break
      }
    }
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)
components.forEach((component) => {
  app.component(component.name, component)
})
plugins.forEach((plugin) => {
  app.use(plugin)
})
registerSvgIcon(app)
registerObSkeleton(app)
app.mount('#app')
console.log('%c 网站原作者:花未眠', 'color:#bada55')
console.log('%c 原作者qq:1909925152', 'color:#bada55')
api.report()
