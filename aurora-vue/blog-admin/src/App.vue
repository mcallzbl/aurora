<script setup lang="ts">
import { onMounted } from 'vue'
import axios from 'axios'
import { RouterView } from 'vue-router'

onMounted(() => {
  axios.post('/api/report').catch(() => {})
})
</script>

<template>
  <RouterView />
</template>
