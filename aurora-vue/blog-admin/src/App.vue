<script setup lang="ts">
import { onMounted } from 'vue'
import { api, request } from '@/api'
import { RouterView } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const elementLocale = zhCn

onMounted(() => {
  void request.post(api.report, undefined, undefined, { silent: true })
})
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />
  </ElConfigProvider>
</template>
