import { registerSvgIcon } from '@/icons'
import { registerObSkeleton } from '@/components/LoadingSkeleton'

export default defineNuxtPlugin((nuxtApp) => {
  registerSvgIcon(nuxtApp.vueApp)
  registerObSkeleton(nuxtApp.vueApp)
})
