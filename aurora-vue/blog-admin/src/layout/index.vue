<template>
  <el-container class="layout-shell">
    <el-aside :width="isCollapsed ? '64px' : '220px'">
      <AppSidebar />
    </el-aside>
    <el-container class="main-container">
      <el-header class="header-shell">
        <AppHeader :key="route.fullPath" />
      </el-header>
      <el-main class="main-content">
        <div class="fade-transform-box">
          <RouterView :key="route.fullPath" v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </RouterView>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import { useAppStore } from '@/stores/app'

defineOptions({
  name: 'AppLayout',
})

const route = useRoute()
const appStore = useAppStore()
const isCollapsed = computed(() => appStore.collapse)
</script>

<style scoped>
.layout-shell {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.layout-shell :deep(.el-aside) {
  transition: width 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.main-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header-shell {
  padding: 0;
  height: auto !important;
}

.main-content {
  background: var(--surface-0);
  padding: 1.25rem;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.5s ease 0s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-box {
  width: 100%;
  overflow: hidden;
}

@media (max-width: 900px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
