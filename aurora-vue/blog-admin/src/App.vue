<script setup lang="ts">
import { onMounted } from 'vue'
import axios from 'axios'
import { RouterView } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const elementLocale = zhCn

onMounted(() => {
  axios.post('/api/report').catch(() => {})
})
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />
  </ElConfigProvider>
</template>
