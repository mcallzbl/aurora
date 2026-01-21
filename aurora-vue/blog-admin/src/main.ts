import 'element-plus/dist/index.css'
import 'nprogress/nprogress.css'
import 'md-editor-v3/lib/style.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { generateMenu } from './router/menu'
import i18n from './i18n'
import ElementPlus, { ElMessage } from 'element-plus'
import axios, { AxiosHeaders } from 'axios'
import NProgress from 'nprogress'
import dayjs from 'dayjs'
import { persistedStatePlugin } from './stores/plugins/persistedState'
import { useMenuStore } from './stores/menu'
import { useThemeStore } from './stores/theme'

import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, HeatmapChart, LineChart, MapChart, PieChart } from 'echarts/charts'
import {
  CalendarComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'

import { MdEditor } from 'md-editor-v3'

use([
  CanvasRenderer,
  BarChart,
  HeatmapChart,
  LineChart,
  PieChart,
  MapChart,
  CalendarComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
])

const app = createApp(App)
const pinia = createPinia()
pinia.use(persistedStatePlugin)

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus)

useThemeStore().syncTheme()

app.component('VChart', VChart)
app.component('MdEditor', MdEditor)

app.config.globalProperties.$axios = axios
app.config.globalProperties.$moment = dayjs
app.config.globalProperties.$filters = {
  date(value: string | number | Date, formatStr = 'YYYY-MM-DD') {
    return dayjs(value).format(formatStr)
  },
  dateTime(value: string | number | Date, formatStr = 'YYYY-MM-DD HH:mm:ss') {
    return dayjs(value).format(formatStr)
  },
}

NProgress.configure({
  easing: 'ease',
  speed: 500,
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.3,
})

router.beforeEach(async (to) => {
  NProgress.start()
  if (to.path === '/login') {
    return true
  }
  const token = sessionStorage.getItem('token')
  if (!token) {
    return { path: '/login' }
  }
  const menuStore = useMenuStore()
  if (!menuStore.menus.length) {
    const menuReady = await generateMenu()
    if (!menuReady) {
      return false
    }
    return to.fullPath
  }
  return true
})

router.afterEach(() => {
  NProgress.done()
})

axios.interceptors.request.use((request) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    const headers = AxiosHeaders.from(request.headers ?? {})
    headers.set('Authorization', `Bearer ${token}`)
    request.headers = headers
  }
  return request
})

axios.interceptors.response.use(
  (response) => {
    const { code, message } = (response.data ?? {}) as { code?: number; message?: string }
    if (code === 40001) {
      ElMessage.error(message || 'Unauthorized')
      router.push({ path: '/login' })
    } else if (code === 50000) {
      ElMessage.error(message || 'Server error')
    }
    return response
  },
  (error) => Promise.reject(error),
)

app.mount('#app')
