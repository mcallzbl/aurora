<template>
  <div ref="wrapperRef" class="tag-cloud" @dblclick="toggleMotion">
    <p
      v-for="(tag, index) in data"
      :key="tag.id ?? tag.name ?? index"
      :ref="(el) => setTagRef(el, index)"
      class="tag-item"
      @click="emit('clickTag', tag)"
    >
      {{ tag.name }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue'

interface TagItem {
  id?: number | string
  name: string
}

interface TagCloudOptions {
  radius: number
  maxFont: number
  color: string | null
  rotateAngleXbase: number
  rotateAngleYbase: number
  hover: boolean
}

const props = defineProps<{
  data: TagItem[]
  config?: Partial<TagCloudOptions> | null
}>()

const emit = defineEmits<{
  (event: 'clickTag', tag: TagItem): void
}>()

const option = reactive<TagCloudOptions>({
  radius: 120,
  maxFont: 24,
  color: null,
  rotateAngleXbase: 500,
  rotateAngleYbase: 500,
  hover: false,
})

const wrapperRef = ref<HTMLDivElement | null>(null)
const tagRefs = ref<HTMLElement[]>([])
const tagList = ref<Array<{ x: number; y: number; z: number; el: HTMLElement }>>([])
const running = ref(true)

let timer: number | null = null
let rotateAngleX = Math.PI / option.rotateAngleXbase
let rotateAngleY = Math.PI / option.rotateAngleYbase

const setTagRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  if (!el || !(el instanceof HTMLElement)) return
  tagRefs.value[index] = el
}

const stopTimer = () => {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
}

const startTimer = () => {
  stopTimer()
  timer = window.setInterval(() => {
    tagList.value.forEach((tag) => {
      rotateX(tag)
      rotateY(tag)
      setPosition(tag)
    })
  }, 20)
}

const toggleMotion = () => {
  running.value = !running.value
  if (running.value) {
    startTimer()
  } else {
    stopTimer()
  }
}

const setPosition = (tag: { x: number; y: number; z: number; el: HTMLElement }) => {
  const wrapper = wrapperRef.value
  if (!wrapper) return
  const { offsetWidth, offsetHeight } = wrapper
  tag.el.style.transform = `translate(${tag.x + offsetWidth / 2 - tag.el.offsetWidth / 2}px, ${
    tag.y + offsetHeight / 2 - tag.el.offsetHeight / 2
  }px)`
  tag.el.style.opacity = `${tag.z / option.radius / 2 + 0.7}`
  tag.el.style.fontSize = `${(tag.z / option.radius / 2 + 0.5) * option.maxFont}px`
}

const rotateX = (tag: { x: number; y: number; z: number }) => {
  const cos = Math.cos(rotateAngleX)
  const sin = Math.sin(rotateAngleX)
  const y = tag.y * cos - tag.z * sin
  const z = tag.y * sin + tag.z * cos
  tag.y = y
  tag.z = z
}

const rotateY = (tag: { x: number; y: number; z: number }) => {
  const cos = Math.cos(rotateAngleY)
  const sin = Math.sin(rotateAngleY)
  const x = tag.z * sin + tag.x * cos
  const z = tag.z * cos - tag.x * sin
  tag.x = x
  tag.z = z
}

const initTags = async () => {
  stopTimer()
  tagList.value = []
  await nextTick()
  const wrapper = wrapperRef.value
  if (!wrapper || props.data.length === 0) return

  rotateAngleX = Math.PI / option.rotateAngleXbase
  rotateAngleY = Math.PI / option.rotateAngleYbase

  if (option.hover) {
    wrapper.onmousemove = (event) => {
      const rect = wrapper.getBoundingClientRect()
      rotateAngleY = (event.clientX - rect.left - rect.width / 2) / 10000
      rotateAngleX = -(event.clientY - rect.top - rect.height / 2) / 10000
    }
  } else {
    wrapper.onmousemove = null
  }

  const total = props.data.length
  for (let i = 0; i < total; i += 1) {
    const phi = Math.acos((2 * (i + 1) - 1) / total - 1)
    const theta = phi * Math.sqrt(total * Math.PI)
    const x = option.radius * Math.sin(phi) * Math.cos(theta)
    const y = option.radius * Math.sin(phi) * Math.sin(theta)
    const z = option.radius * Math.cos(phi)
    const el = tagRefs.value[i]
    if (!el) continue
    el.style.color = option.color || randomColor()
    tagList.value.push({ x, y, z, el })
  }

  if (running.value) {
    startTimer()
  }
}

const randomColor = () => {
  const r = Math.round(255 * Math.random())
  const g = Math.round(255 * Math.random())
  const b = Math.round(255 * Math.random())
  return `rgb(${r},${g},${b})`
}

watch(
  () => props.config,
  (value) => {
    Object.assign(option, {
      radius: 120,
      maxFont: 24,
      color: null,
      rotateAngleXbase: 500,
      rotateAngleYbase: 500,
      hover: false,
      ...(value ?? {}),
    })
    initTags()
  },
  { deep: true, immediate: true },
)

watch(
  () => props.data,
  () => {
    tagRefs.value = []
    initTags()
  },
  { deep: true },
)

onMounted(() => {
  initTags()
})

onBeforeUnmount(() => {
  stopTimer()
  if (wrapperRef.value) {
    wrapperRef.value.onmousemove = null
  }
})
</script>

<style scoped>
.tag-cloud {
  position: relative;
  width: min(100%, 320px);
  height: min(100%, 320px);
  margin: 0 auto;
}

.tag-item {
  position: absolute;
  top: 0;
  left: 0;
  font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
  text-decoration: none;
  line-height: 1.1;
  text-align: center;
  padding: 4px 9px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}
</style>
