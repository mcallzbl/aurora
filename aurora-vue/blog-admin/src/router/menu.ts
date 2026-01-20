import type { RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import router from './index'
import Layout from '@/layout/index.vue'
import { useMenuStore } from '@/stores/menu'

interface RawMenu {
  path: string
  name?: string
  component?: string
  redirect?: string
  icon?: string
  hidden?: boolean
  meta?: Record<string, unknown>
  children?: RawMenu[]
}

interface MenuResponse {
  flag: boolean
  message?: string
  data?: RawMenu[]
}

const viewModules = import.meta.glob('/src/views/**/*.vue')

const normalizeIcon = (icon?: string) => {
  if (!icon) {
    return undefined
  }
  return icon.startsWith('iconfont') ? icon : `iconfont ${icon}`
}

const resolveViewComponent = (component?: string) => {
  if (!component) {
    return undefined
  }
  if (component === 'Layout') {
    return Layout
  }

  const trimmed = component
    .replace(/^\/+/, '')
    .replace(/^@?\/?views\//, '')
    .replace(/\.vue$/, '')
  const viewKey = `/src/views/${trimmed}.vue`
  const loader = viewModules[viewKey]
  if (!loader) {
    console.warn(`[menu] view not found: ${viewKey}`)
    return undefined
  }
  return loader
}

const mapMenuToRoute = (item: RawMenu): RouteRecordRaw | null => {
  const children = item.children?.map(mapMenuToRoute).filter(Boolean) as
    | RouteRecordRaw[]
    | undefined
  const component = resolveViewComponent(item.component) ?? (children?.length ? Layout : undefined)

  if (!component) {
    console.warn('[menu] route skipped due to missing component:', item)
    return null
  }

  if (children && children.length) {
    return {
      path: item.path,
      name: item.name,
      component,
      redirect: item.redirect,
      children,
      meta: {
        ...(item.meta ?? {}),
        icon: normalizeIcon(item.icon),
        hidden: item.hidden,
      },
    } satisfies RouteRecordRaw
  }

  return {
    path: item.path,
    name: item.name,
    component,
    meta: {
      ...(item.meta ?? {}),
      icon: normalizeIcon(item.icon),
      hidden: item.hidden,
    },
  } satisfies RouteRecordRaw
}

const addDynamicRoutes = (routes: RouteRecordRaw[]) => {
  routes.forEach((route) => {
    if (route.name && router.hasRoute(route.name)) {
      return
    }
    router.addRoute(route)
  })
}

export const generateMenu = async () => {
  try {
    const { data } = await axios.get<MenuResponse>('/api/admin/user/menus')
    if (!data.flag) {
      ElMessage.error(data.message || '菜单加载失败')
      await router.push({ path: '/login' })
      return false
    }

    const routes = (data.data ?? []).map(mapMenuToRoute).filter(Boolean) as RouteRecordRaw[]

    useMenuStore().setMenus(routes)
    addDynamicRoutes(routes)
    return true
  } catch {
    ElMessage.error('菜单加载失败')
    await router.push({ path: '/login' })
    return false
  }
}
