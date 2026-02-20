import type { Router } from 'vue-router'
import { useAppStore } from '@/stores/app'

export function installRouterGuards(router: Router) {
  if (typeof window === 'undefined') return

  router.beforeEach(() => {
    const appStore = useAppStore()
    appStore.startLoading()
  })

  router.afterEach(() => {
    const appStore = useAppStore()
    appStore.endLoading()
    document.getElementById('App-Container')?.focus()
  })
}
