import SvgIcon from '@/components/SvgIcon/index.vue'
import type { App } from 'vue'

export const registerSvgIcon = (app: App): void => {
  // virtual:svg-icons-register should only be imported on client
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    import('virtual:svg-icons-register')
  }
  app.component('svg-icon', SvgIcon)
}
