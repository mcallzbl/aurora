<template>
  <div class="tag-cloud">
    <span
      v-for="tag in computedTags"
      :key="tag.id"
      class="tag-item"
      :style="{ fontSize: tag.fontSize + 'px' }"
    >
      {{ tag.name }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Tag {
  id: number
  name: string
  count?: number
}

interface Props {
  data: Tag[]
}

const props = defineProps<Props>()

const computedTags = computed(() => {
  if (!props.data || props.data.length === 0) return []

  // 计算标签的字体大小，基于标签的数量或者随机大小
  const minSize = 14
  const maxSize = 32

  return props.data.map((tag) => {
    // 如果有 count 字段，根据 count 计算大小；否则随机生成
    let fontSize = minSize
    if (tag.count !== undefined) {
      const counts = props.data.map((t) => t.count || 0)
      const minCount = Math.min(...counts)
      const maxCount = Math.max(...counts)

      if (maxCount > minCount) {
        fontSize = minSize + ((tag.count - minCount) / (maxCount - minCount)) * (maxSize - minSize)
      }
    } else {
      fontSize = minSize + Math.random() * (maxSize - minSize)
    }

    return {
      ...tag,
      fontSize: Math.round(fontSize),
    }
  })
})
</script>

<style scoped>
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  justify-content: center;
  align-items: center;
}

.tag-item {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tag-item:nth-child(2n) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.tag-item:nth-child(3n) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.tag-item:nth-child(4n) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.tag-item:nth-child(5n) {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.tag-item:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
