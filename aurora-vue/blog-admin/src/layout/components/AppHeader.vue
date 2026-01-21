<template>
  <div class="header-shell">
    <div class="nav-bar">
      <button
        class="hamburger"
        :class="{ collapsed: isCollapsed }"
        type="button"
        @click="toggleCollapse"
        aria-label="Toggle sidebar"
      >
        <el-icon class="hamburger-icon">
          <component :is="isCollapsed ? Expand : Fold" />
        </el-icon>
      </button>

      <el-breadcrumb>
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          <span v-if="item.isCurrent">{{ item.label }}</span>
          <RouterLink v-else :to="item.path">{{ item.label }}</RouterLink>
        </el-breadcrumb-item>
      </el-breadcrumb>

      <div class="right-menu">
        <button
          class="icon-button"
          type="button"
          @click="toggleFullscreen"
          aria-label="Toggle fullscreen"
        >
          <el-icon class="icon-button__icon">
            <component :is="isFullscreen ? Close : FullScreen" />
          </el-icon>
        </button>
        <el-dropdown @command="handleCommand">
          <span class="user-trigger">
            <el-avatar :size="36" :src="avatarUrl">
              {{ avatarFallback }}
            </el-avatar>
            <span class="caret" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="setting">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="tabs-view">
      <div class="tabs-wrapper">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          class="tab-item"
          :class="{ active: tab.path === route.path }"
          type="button"
          @click="goTo(tab.path)"
        >
          <span>{{ tab.label }}</span>
          <span v-if="tab.closable" class="tab-close" @click.stop="removeTab(tab.path)">x</span>
        </button>
      </div>
      <button class="tabs-close" type="button" @click="closeAllTabs">全部关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { Close, Expand, Fold, FullScreen } from '@element-plus/icons-vue'
import { resetRouter } from '@/router'
import { useAppStore, type TabItem } from '@/stores/app'

interface BreadcrumbItem {
  path: string
  label: string
  isCurrent: boolean
}

defineOptions({
  name: 'AppHeader',
})

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const tabs = computed(() => appStore.tabs)
const avatarUrl = computed(() => appStore.userInfo?.avatar || '')
const avatarFallback = computed(() => (appStore.userInfo?.nickname || 'A').slice(0, 1))
const isCollapsed = computed(() => appStore.collapse)
const isFullscreen = ref(false)

const buildTab = (): TabItem => {
  const label =
    (route.meta?.title as string | undefined) ||
    (typeof route.name === 'string' ? route.name : '') ||
    route.path
  return {
    path: route.path,
    label,
    closable: route.path !== '/',
  }
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items = route.matched
    .filter((record) => record.path)
    .map((record, index, array) => ({
      path: record.path,
      label:
        (record.meta?.title as string | undefined) ||
        (typeof record.name === 'string' ? record.name : record.path),
      isCurrent: index === array.length - 1,
    }))

  if (items[0]?.path !== '/') {
    items.unshift({ path: '/', label: '首页', isCurrent: false })
  }
  return items
})

const goTo = (path: string) => {
  router.push({ path })
}

const removeTab = (path: string) => {
  appStore.removeTab(path)
  if (route.path === path) {
    const next = appStore.tabs[appStore.tabs.length - 1]
    router.push({ path: next?.path || '/' })
  }
}

const closeAllTabs = () => {
  appStore.resetTabs()
  router.push({ path: '/' })
}

const toggleCollapse = () => {
  appStore.toggleCollapse()
}

const handleCommand = async (command: string) => {
  if (command === 'setting') {
    router.push({ path: '/setting' })
    return
  }
  if (command === 'logout') {
    await axios.post('/api/users/logout').catch(() => {})
    appStore.logout()
    resetRouter()
    router.push({ path: '/login' })
  }
}

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  } else {
    document.documentElement.requestFullscreen().catch(() => {})
  }
}

const syncFullscreen = () => {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

onMounted(() => {
  syncFullscreen()
  document.addEventListener('fullscreenchange', syncFullscreen)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreen)
})

watch(
  () => route.path,
  () => {
    if (route.path !== '/login') {
      appStore.addTab(buildTab())
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.header-shell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid var(--border-soft);
  box-shadow: 0 12px 30px rgba(31, 24, 16, 0.08);
  backdrop-filter: blur(12px);
}

.nav-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
}

.hamburger {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(242, 247, 255, 0.7));
  border-radius: 14px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  box-shadow:
    0 10px 22px rgba(31, 24, 16, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.hamburger:hover {
  transform: translateY(-1px);
  box-shadow:
    0 16px 28px rgba(31, 24, 16, 0.16),
    inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.hamburger:active {
  transform: translateY(0);
  box-shadow:
    0 8px 18px rgba(31, 24, 16, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.hamburger-icon {
  font-size: 1.35rem;
  color: #0f172a;
  transition:
    transform 0.25s ease,
    color 0.2s ease;
}

.hamburger.collapsed .hamburger-icon {
  transform: rotate(-90deg);
  color: #0f766e;
}

.right-menu {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.75);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow:
    0 10px 20px rgba(31, 24, 16, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.icon-button:hover {
  transform: translateY(-1px);
  box-shadow:
    0 14px 24px rgba(31, 24, 16, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.65);
}

.icon-button__icon {
  font-size: 1.2rem;
  color: #0f172a;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

.caret {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--ink-500);
}

.tabs-view {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 1.5rem 0.65rem;
}

.tabs-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  flex: 1;
}

.tab-item {
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--ink-700);
}

.tab-item.active {
  background: linear-gradient(135deg, rgba(63, 159, 147, 0.9), rgba(112, 203, 192, 0.9));
  border-color: transparent;
  color: #0b2b28;
}

.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.75rem;
  background: rgba(15, 23, 42, 0.08);
}

.tabs-close {
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--ink-700);
}

@media (max-width: 768px) {
  .nav-bar {
    flex-wrap: wrap;
  }

  .tabs-view {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs-close {
    align-self: flex-end;
  }
}
</style>
