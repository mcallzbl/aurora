<template>
  <div class="placeholder">
    <h2>Page not implemented</h2>
    <p>This view is missing: {{ viewPath }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({
  name: 'PlaceholderView',
})

const route = useRoute()
const viewPath = computed(() => (route.meta?.viewPath as string | undefined) || route.path)
</script>

<style scoped>
.placeholder {
  padding: 2rem;
  border-radius: 16px;
  background: var(--surface-1);
  border: 1px solid var(--border-soft);
  color: var(--ink-700);
}

.placeholder h2 {
  margin-bottom: 0.5rem;
  color: var(--ink-900);
}
</style>
