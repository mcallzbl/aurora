import SvgIcon from '@/components/SvgIcon/index.vue'
import type { App } from 'vue'
import 'virtual:svg-icons-register'

export const registerSvgIcon = (app: App): void => {
  app.component('svg-icon', SvgIcon)
}
