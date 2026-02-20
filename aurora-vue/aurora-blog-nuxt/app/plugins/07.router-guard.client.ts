import { installRouterGuards } from '@/router/guard'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  installRouterGuards(router)
})
