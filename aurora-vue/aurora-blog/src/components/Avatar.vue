<template>
  <div class="flex-shrink-0">
    <div class="rounded-full ring-2 ring-gray-100 overflow-hidden shadow-lg w-9 h-9 xl:w-10 xl:h-10">
      <img
        :alt="altText"
        :src="avatarUrl"
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

// 1. 定义 Props，使用 TypeScript 接口提供更好的类型提示
interface Props {
  url?: string | null;
  altText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  url: null,
  altText: 'user avatar'
})

const appStore = useAppStore()

// 2. 核心逻辑：使用 computed 统一处理头像来源
// 这样模板部分会非常干净，只需要绑定一个 avatarUrl 即可
const avatarUrl = computed(() => {
  // 优先级：传入的 url > 商店里的游客头像 > 备用硬编码头像
  return props.url ||
    appStore.websiteConfig?.touristAvatar ||
    'https://bucket.devillusion.asia/aurora/avatar/c80e915a1b7f235b17072419e4094abd.png'
})

// 3. 增强：处理图片加载失败的情况
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  // 如果主图加载失败，显示兜底图
  target.src = 'https://bucket.devillusion.asia/aurora/avatar/c80e915a1b7f235b17072419e4094abd.png'
}
</script>
<style lang="scss" scoped>
.avatar-img {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 800ms;
  transform: rotate(-360deg);
}

.avatar-img:hover {
  transform: rotate(360deg);
}
</style>
