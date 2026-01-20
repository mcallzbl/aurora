import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    meta: { hidden: true },
    component: () => import('../views/login/Login.vue'),
  },
  {
    path: '/',
    redirect: '/login',
  },
]

const createAppRouter = () =>
  createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  })

const router = createAppRouter()

const staticRouteNames = new Set<string>(['login'])

export const resetRouter = () => {
  router.getRoutes().forEach((route) => {
    if (route.name && !staticRouteNames.has(String(route.name))) {
      router.removeRoute(route.name)
    }
  })
}

export default router
