<template>
  <aside class="side-nav">
    <el-menu
      class="side-nav-menu"
      router
      :collapse="isCollapsed"
      :default-active="activePath"
      background-color="#1e293b"
      text-color="#cbd5f5"
      active-text-color="#5eead4"
    >
      <template v-for="routeItem in visibleMenus" :key="routeItem.path">
        <el-sub-menu v-if="isGroup(routeItem)" :index="routeItem.path">
          <template #title>
            <i v-if="routeItem.meta?.icon" :class="routeItem.meta.icon" />
            <span>{{ routeLabel(routeItem) }}</span>
          </template>
          <el-menu-item
            v-for="child in routeItem.children"
            :key="child.path"
            :index="resolveMenuPath(child.path, routeItem.path)"
          >
            <i v-if="child.meta?.icon" :class="child.meta.icon" />
            <span>{{ routeLabel(child) }}</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item v-else :index="singleMenuPath(routeItem)">
          <i v-if="singleMenuIcon(routeItem)" :class="singleMenuIcon(routeItem)" />
          <span>{{ singleMenuLabel(routeItem) }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useMenuStore } from '@/stores/menu'

defineOptions({
  name: 'AppSidebar',
})

const route = useRoute()
const appStore = useAppStore()
const menuStore = useMenuStore()

const isCollapsed = computed(() => appStore.collapse)
const activePath = computed(() => route.path)

const routeLabel = (item: RouteRecordRaw) => {
  return (
    (item.meta?.title as string | undefined) ||
    (typeof item.name === 'string' ? item.name : '') ||
    item.path
  )
}

const resolveMenuPath = (path: string, parentPath: string) => {
  if (!path) {
    return parentPath
  }
  if (path.startsWith('/')) {
    return path
  }
  const base = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
  return `${base}/${path}`.replace(/\/+/g, '/')
}

const normalizeRoute = (item: RouteRecordRaw): RouteRecordRaw | null => {
  if (item.meta?.hidden) {
    return null
  }
  const children = item.children ? item.children.map(normalizeRoute).filter(Boolean) : []
  if (children.length) {
    return { ...item, children: children as RouteRecordRaw[] }
  }
  return item
}

const visibleMenus = computed(
  () => menuStore.menus.map(normalizeRoute).filter(Boolean) as RouteRecordRaw[],
)

const isGroup = (routeItem: RouteRecordRaw) => {
  return Boolean(routeItem.name) && (routeItem.children?.length ?? 0) > 0
}

const singleMenuItem = (routeItem: RouteRecordRaw): RouteRecordRaw => {
  if (!routeItem.name && routeItem.children?.length) {
    return routeItem.children[0] ?? routeItem
  }
  return routeItem
}

const singleMenuLabel = (routeItem: RouteRecordRaw) => {
  return routeLabel(singleMenuItem(routeItem))
}

const singleMenuIcon = (routeItem: RouteRecordRaw) => {
  const item = singleMenuItem(routeItem)
  return (item.meta?.icon as string | undefined) || ''
}

const singleMenuPath = (routeItem: RouteRecordRaw) => {
  const child = routeItem.children?.[0]
  if (child) {
    return resolveMenuPath(child.path, routeItem.path)
  }
  return routeItem.path
}
</script>

<style scoped>
.side-nav {
  background: #1e293b;
  border-right: 1px solid rgba(15, 23, 42, 0.4);
  height: 100%;
  overflow: hidden;
}

.side-nav-menu {
  border-right: none;
  height: 100%;
  overflow-y: auto;
}

.side-nav-menu:not(.el-menu--collapse) {
  width: 220px;
}

.side-nav-menu i {
  margin-right: 0.75rem;
}

@media (max-width: 900px) {
  .side-nav-menu {
    height: auto;
  }
}
</style>
