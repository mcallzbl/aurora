<template>
  <div class="crontab-panel">
    <div class="panel-title">Cron 表达式</div>
    <el-input
      v-model="localExpression"
      placeholder="请输入 Cron 表达式"
      size="small"
      class="expression-input"
    />
    <div class="panel-actions">
      <el-button size="small" @click="emitHide">取消</el-button>
      <el-button type="primary" size="small" @click="emitFill">应用</el-button>
    </div>
    <div class="panel-tip">提示：当前仅提供手动输入模式。</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

defineOptions({
  name: 'CronTabPanel',
})

const props = defineProps<{
  expression?: string
}>()

const emit = defineEmits<{
  (event: 'fill', value: string): void
  (event: 'hide'): void
}>()

const localExpression = ref(props.expression || '')

watch(
  () => props.expression,
  (value) => {
    localExpression.value = value || ''
  },
)

const emitFill = () => {
  emit('fill', localExpression.value)
}

const emitHide = () => {
  emit('hide')
}
</script>

<style scoped>
.crontab-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel-title {
  font-weight: 600;
  color: var(--ink-900);
}

.expression-input {
  width: 100%;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.panel-tip {
  font-size: 0.85rem;
  color: var(--ink-500);
}
</style>
