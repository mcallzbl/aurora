<template>
  <div class="header-container">
    <header class="site-header">
      <Logo />
      <Navigation />
      <Controls />
    </header>
  </div>
</template>

<script lang="ts" setup>
import { Controls, Logo, Navigation } from '../index'

defineOptions({ name: 'SiteHeader' })

defineProps<{
  msg?: string
}>()
</script>

<style lang="scss" scoped>
.header-container {
  .site-header {
    max-width: var(--max-width);
    position: relative;
    z-index: 50;
    display: flex;
    width: 100%;
    align-items: center;
    margin: 0 auto;
    padding: 1rem 0;
    column-gap: 1rem;
  }
}
</style>
