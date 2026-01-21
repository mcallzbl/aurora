<template>
  <div class="status-filter">
    <span class="status-label">{{ label }}</span>
    <button
      v-for="item in options"
      :key="String(item.value)"
      type="button"
      class="status-button"
      :class="{ active: modelValue === item.value }"
      @click="handleClick(item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
type StatusValue = string | number | null

interface StatusOption {
  label: string
  value: StatusValue
}

const props = withDefaults(
  defineProps<{
    modelValue: StatusValue
    options: StatusOption[]
    label?: string
  }>(),
  {
    label: '状态',
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: StatusValue): void
  (event: 'change', value: StatusValue): void
}>()

const handleClick = (value: StatusValue) => {
  if (value === props.modelValue) {
    return
  }
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.status-filter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-soft);
  color: var(--ink-500);
  font-size: 0.9rem;
}

.status-label {
  font-weight: 600;
  color: var(--ink-700);
}

.status-button {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--ink-500);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.status-button:hover {
  background: var(--surface-2);
  color: var(--ink-900);
}

.status-button.active {
  background: var(--accent-primary-soft);
  color: var(--accent-primary-strong);
  font-weight: 600;
}
</style>
