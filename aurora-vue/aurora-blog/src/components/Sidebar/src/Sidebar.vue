<template>
  <div v-show="!isMobile">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useCommonStore } from '@/stores/common'
import { computed } from 'vue'

const commonStore = useCommonStore()
const isMobile = computed(() => commonStore.isMobile)
</script>
