import type { RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api, request } from '@/api'
import router from './index'
import Layout from '@/layout/index.vue'
import PlaceholderView from '@/views/_shared/PlaceholderView.vue'
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

const viewModules = import.meta.glob('/src/views/**/*.vue')

const normalizeIcon = (icon?: string) => {
  if (!icon) {
    return undefined
  }
  return icon.startsWith('iconfont') ? icon : `iconfont ${icon}`
}

const normalizeRoutePath = (path: string) => {
  if (!path.includes('*') || path.includes(':pathMatch')) {
    return path
  }
  if (path === '*') {
    return '/:pathMatch(.*)*'
  }
  if (path.endsWith('/*')) {
    return path.replace(/\/\*$/, '/:id')
  }
  return path.replace(/\*$/, ':pathMatch(.*)*')
}

const resolveViewComponent = (component?: string) => {
  if (!component) {
    return { component: undefined, viewPath: undefined }
  }
  if (component === 'Layout') {
    return { component: Layout, viewPath: undefined }
  }

  const trimmed = component
    .replace(/^\/+/, '')
    .replace(/^@?\/?views\//, '')
    .replace(/\.vue$/, '')
  const viewKey = `/src/views/${trimmed}.vue`
  const loader = viewModules[viewKey]
  if (!loader) {
    console.warn(`[menu] view not found: ${viewKey}`)
    return { component: PlaceholderView, viewPath: viewKey }
  }
  return { component: loader, viewPath: undefined }
}

const mapMenuToRoute = (item: RawMenu): RouteRecordRaw | null => {
  const children = item.children?.map(mapMenuToRoute).filter(Boolean) as
    | RouteRecordRaw[]
    | undefined
  const { component, viewPath } = resolveViewComponent(item.component)
  const resolvedComponent = component ?? (children?.length ? Layout : undefined)

  if (!resolvedComponent) {
    console.warn('[menu] route skipped due to missing component:', item)
    return null
  }

  if (children && children.length) {
    return {
      path: normalizeRoutePath(item.path),
      name: item.name,
      component: resolvedComponent,
      redirect: item.redirect,
      children,
      meta: {
        ...(item.meta ?? {}),
        title: item.name,
        icon: normalizeIcon(item.icon),
        hidden: item.hidden,
        viewPath,
      },
    } satisfies RouteRecordRaw
  }

  return {
    path: normalizeRoutePath(item.path),
    name: item.name,
    component: resolvedComponent,
    meta: {
      ...(item.meta ?? {}),
      title: item.name,
      icon: normalizeIcon(item.icon),
      hidden: item.hidden,
      viewPath,
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
    const result = await request.get<RawMenu[]>(api.admin.menu.userMenus, undefined, {
      silent: true,
    })
    if (!result.ok) {
      ElMessage.error(result.message || '菜单加载失败')
      await router.push({ path: '/login' })
      return false
    }

    const routes = (result.data ?? []).map(mapMenuToRoute).filter(Boolean) as RouteRecordRaw[]

    useMenuStore().setMenus(routes)
    addDynamicRoutes(routes)
    return true
  } catch {
    ElMessage.error('菜单加载失败')
    await router.push({ path: '/login' })
    return false
  }
}
