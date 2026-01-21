<template>
  <el-container class="layout-shell">
    <el-aside :width="isCollapsed ? '64px' : '220px'">
      <AppSidebar />
    </el-aside>
    <el-container class="main-container">
      <el-header height="84px" class="header-shell">
        <AppHeader :key="route.fullPath" />
      </el-header>
      <el-main class="main-content">
        <div class="fade-transform-box">
          <transition name="fade-transform" mode="out-in">
            <RouterView :key="route.fullPath" />
          </transition>
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
  min-height: 100vh;
}

.header-shell {
  padding: 0;
}

.main-content {
  background: #f7f9fb;
  padding: 1.25rem;
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
