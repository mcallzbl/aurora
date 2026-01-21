<template>
  <el-switch
    v-model="localValue"
    class="top-switch"
    :active-value="1"
    :inactive-value="0"
    :disabled="disabled"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'TopSwitch',
})

const props = withDefaults(
  defineProps<{
    modelValue: 0 | 1
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: 0 | 1): void
  (event: 'change', value: 0 | 1): void
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const handleChange = (value: 0 | 1) => {
  emit('change', value)
}
</script>

<style scoped>
.top-switch {
  --switch-height: 22px;
  --switch-width: 44px;
}

.top-switch:deep(.el-switch__core) {
  width: var(--switch-width);
  height: var(--switch-height);
  border-radius: 999px;
  border: 1px solid rgba(31, 27, 22, 0.16);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.top-switch.is-checked:deep(.el-switch__core) {
  border-color: transparent;
  background: linear-gradient(135deg, rgba(63, 159, 147, 0.9), rgba(242, 163, 92, 0.9));
  box-shadow: 0 8px 16px rgba(31, 27, 22, 0.18);
}

.top-switch:deep(.el-switch__action) {
  width: 18px;
  height: 18px;
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(31, 27, 22, 0.2);
}

.top-switch.is-checked:deep(.el-switch__action) {
  background: #fffaf5;
}
</style>
