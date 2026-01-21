<template>
  <el-pagination
    class="app-pagination"
    background
    :current-page="currentPage"
    :page-size="pageSize"
    :page-sizes="pageSizes"
    :total="total"
    :layout="layout"
    :hide-on-single-page="hideOnSinglePage"
    @current-change="handleCurrentChange"
    @size-change="handleSizeChange"
  />
</template>

<script setup lang="ts">
import { toRefs } from 'vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    pageSize: number
    total: number
    pageSizes?: number[]
    layout?: string
    hideOnSinglePage?: boolean
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
    hideOnSinglePage: false,
  },
)

const emit = defineEmits<{
  (event: 'update:currentPage', value: number): void
  (event: 'update:pageSize', value: number): void
  (event: 'current-change', value: number): void
  (event: 'size-change', value: number): void
}>()

const handleCurrentChange = (value: number) => {
  emit('update:currentPage', value)
  emit('current-change', value)
}

const handleSizeChange = (value: number) => {
  emit('update:pageSize', value)
  emit('size-change', value)
}

const { currentPage, pageSize, total, pageSizes, layout, hideOnSinglePage } = toRefs(props)
</script>

<style scoped>
.app-pagination {
  --el-pagination-bg-color: var(--surface-1);
  --el-pagination-text-color: var(--ink-700);
  --el-pagination-button-color: var(--ink-700);
  --el-pagination-button-bg-color: var(--surface-2);
  --el-pagination-hover-color: var(--accent-primary);
}
</style>
