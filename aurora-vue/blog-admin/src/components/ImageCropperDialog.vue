<template>
  <el-dialog v-model="visible" :title="title" width="460px" @closed="handleClosed">
    <div class="cropper-body">
      <div ref="previewRef" class="cropper-preview" :style="previewStyle">
        <Cropper
          ref="cropperRef"
          class="cropper-core"
          :src="imageUrl || null"
          :stencil-props="stencilProps"
          image-restriction="stencil"
          :move-image="false"
          :resize-image="{ adjustStencil: false, wheel: { ratio: 0.2 }, touch: true }"
          :auto-zoom="true"
        />
        <div v-if="!imageUrl" class="cropper-placeholder">请选择图片</div>
      </div>

      <div class="cropper-tools">
        <span class="tool-label">拖动裁剪框选择区域，滚轮/触控缩放</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!imageUrl" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

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
const currentMime = ref('image/jpeg')
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const previewRef = ref<HTMLDivElement | null>(null)
const previewWidthRaw = ref(0)
let resizeObserver: ResizeObserver | null = null

const ratioValue = computed(() => props.ratio[0] / props.ratio[1])
const previewWidth = computed(() =>
  previewWidthRaw.value > 0 ? previewWidthRaw.value : props.size,
)
const previewStyle = computed(() => ({
  height: `${Math.round(previewWidth.value / ratioValue.value)}px`,
}))

const stencilProps = computed(() =>
  props.fixedBox
    ? {
        aspectRatio: ratioValue.value,
        movable: true,
        resizable: false,
        handlers: false,
        lines: false,
      }
    : {},
)

const handleConfirm = async () => {
  const result = cropperRef.value?.getResult?.()
  const canvas = result?.canvas
  if (!canvas) {
    return
  }
  const mime = currentMime.value || 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value: Blob | null) => resolve(value), mime, 1)
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
}

const updatePreviewWidth = () => {
  if (previewRef.value) {
    previewWidthRaw.value = previewRef.value.clientWidth
  }
}

const open = (file: File) => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  currentMime.value = file.type || 'image/jpeg'
  imageUrl.value = URL.createObjectURL(file)
  visible.value = true
}

watch(
  () => visible.value,
  (next) => {
    if (!next) return
    nextTick(() => {
      updatePreviewWidth()
      cropperRef.value?.refresh?.()
    })
  },
)

onMounted(() => {
  updatePreviewWidth()
  if (previewRef.value) {
    resizeObserver = new ResizeObserver(() => updatePreviewWidth())
    resizeObserver.observe(previewRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
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
  width: 100%;
}

.cropper-core {
  width: 100%;
  height: 100%;
}

.cropper-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--ink-500);
  font-size: 0.9rem;
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
