<template>
  <el-dialog v-model="visible" :title="title" width="460px" @closed="handleClosed">
    <div class="cropper-body">
      <div class="cropper-preview" :style="previewStyle" @pointerdown="handlePointerDown">
        <img
          v-if="imageUrl"
          ref="imageEl"
          :src="imageUrl"
          class="cropper-image"
          :style="imageStyle"
          @load="handleImageLoad"
          draggable="false"
        />
        <div v-else class="cropper-placeholder">请选择图片</div>
      </div>

      <div class="cropper-tools">
        <span class="tool-label">缩放</span>
        <el-slider v-model="zoom" :min="1" :max="3" :step="0.05" />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!imageReady" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    ratio: [number, number]
    size: number
    fixedBox?: boolean
    title?: string
  }>(),
  {
    ratio: () => [1, 1],
    size: 200,
    fixedBox: true,
    title: '裁剪图片',
  },
)

const emit = defineEmits<{
  (event: 'confirm', payload: { blob: Blob; mime: string }): void
}>()

const visible = ref(false)
const imageUrl = ref('')
const imageEl = ref<HTMLImageElement | null>(null)
const imageNatural = reactive({ width: 0, height: 0 })
const baseScale = ref(1)
const zoom = ref(1)
const offset = reactive({ x: 0, y: 0 })
const currentMime = ref('image/jpeg')

const dragState = reactive({
  active: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  pointerId: -1,
})

const ratioValue = computed(() => props.ratio[0] / props.ratio[1])
const previewWidth = computed(() => props.size)
const previewHeight = computed(() => Math.round(props.size / ratioValue.value))
const imageReady = computed(() => imageNatural.width > 0 && imageNatural.height > 0)
const displayScale = computed(() => baseScale.value * zoom.value)

const previewStyle = computed(() => ({
  width: `${previewWidth.value}px`,
  height: `${previewHeight.value}px`,
}))

const imageStyle = computed(() => ({
  width: `${imageNatural.width}px`,
  height: `${imageNatural.height}px`,
  transform: `translate(${offset.x}px, ${offset.y}px) scale(${displayScale.value})`,
}))

const clampOffset = () => {
  const scaledWidth = imageNatural.width * displayScale.value
  const scaledHeight = imageNatural.height * displayScale.value
  const minX = previewWidth.value - scaledWidth
  const minY = previewHeight.value - scaledHeight
  offset.x = Math.min(0, Math.max(minX, offset.x))
  offset.y = Math.min(0, Math.max(minY, offset.y))
}

const resetPosition = () => {
  if (!imageReady.value) {
    return
  }
  const scaleX = previewWidth.value / imageNatural.width
  const scaleY = previewHeight.value / imageNatural.height
  baseScale.value = Math.max(scaleX, scaleY)
  zoom.value = 1
  offset.x = (previewWidth.value - imageNatural.width * baseScale.value) / 2
  offset.y = (previewHeight.value - imageNatural.height * baseScale.value) / 2
  clampOffset()
}

const handleImageLoad = () => {
  if (!imageEl.value) return
  imageNatural.width = imageEl.value.naturalWidth
  imageNatural.height = imageEl.value.naturalHeight
  resetPosition()
}

const handlePointerDown = (event: PointerEvent) => {
  if (!imageReady.value) {
    return
  }
  dragState.active = true
  dragState.pointerId = event.pointerId
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.originX = offset.x
  dragState.originY = offset.y
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!dragState.active || event.pointerId !== dragState.pointerId) {
    return
  }
  offset.x = dragState.originX + (event.clientX - dragState.startX)
  offset.y = dragState.originY + (event.clientY - dragState.startY)
  clampOffset()
}

const handlePointerUp = (event: PointerEvent) => {
  if (event.pointerId !== dragState.pointerId) {
    return
  }
  dragState.active = false
  dragState.pointerId = -1
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
}

const handleConfirm = async () => {
  if (!imageReady.value || !imageEl.value) {
    return
  }
  const canvas = document.createElement('canvas')
  canvas.width = previewWidth.value
  canvas.height = previewHeight.value
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }
  const sourceX = -offset.x / displayScale.value
  const sourceY = -offset.y / displayScale.value
  const sourceWidth = previewWidth.value / displayScale.value
  const sourceHeight = previewHeight.value / displayScale.value

  ctx.drawImage(
    imageEl.value,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  const mime = currentMime.value || 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mime, 0.92)
  })
  if (!blob) {
    return
  }
  emit('confirm', { blob, mime })
  visible.value = false
}

const handleClosed = () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  imageUrl.value = ''
  imageNatural.width = 0
  imageNatural.height = 0
  baseScale.value = 1
  zoom.value = 1
  offset.x = 0
  offset.y = 0
}

const open = (file: File) => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  currentMime.value = file.type || 'image/jpeg'
  imageUrl.value = URL.createObjectURL(file)
  visible.value = true
}

watch(zoom, (next, prev) => {
  if (!imageReady.value || prev === 0) {
    return
  }
  const ratio = next / prev
  offset.x = (offset.x - previewWidth.value / 2) * ratio + previewWidth.value / 2
  offset.y = (offset.y - previewHeight.value / 2) * ratio + previewHeight.value / 2
  clampOffset()
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
})

defineExpose({
  open,
})
</script>

<style scoped>
.cropper-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cropper-preview {
  position: relative;
  border-radius: 12px;
  background: var(--surface-2);
  overflow: hidden;
  border: 1px solid var(--border-soft);
  margin: 0 auto;
  user-select: none;
  touch-action: none;
}

.cropper-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--ink-500);
  font-size: 0.9rem;
}

.cropper-image {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
}

.cropper-tools {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tool-label {
  min-width: 3rem;
  color: var(--ink-600);
  font-size: 0.9rem;
}
</style>
