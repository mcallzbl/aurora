import router from '@/router'
import { useAppStore } from '@/stores/app'

router.beforeEach(() => {
  const appStore = useAppStore()
  appStore.startLoading()
})

router.afterEach(() => {
  const appStore = useAppStore()
  appStore.endLoading()
  document.getElementById('App-Container')?.focus()
})
