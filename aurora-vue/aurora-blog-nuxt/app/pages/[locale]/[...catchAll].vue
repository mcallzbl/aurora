<script lang="ts" setup>
const route = useRoute()
const locale = String(route.params.locale || 'en')
await navigateTo(`/${locale}/404`, { replace: true })
</script>

<template>
  <div />
</template>
