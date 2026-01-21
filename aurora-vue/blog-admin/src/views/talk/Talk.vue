<template>
  <div class="talk-editor-page">
    <el-card class="talk-editor-card">
      <div class="page-title">{{ pageTitle }}</div>

      <div class="editor-shell">
        <MdEditor
          v-model="talk.content"
          :toolbars-exclude="['github']"
          :preview-theme="'github'"
          :code-theme="'atom'"
          placeholder="说点什么吧"
        />
      </div>

      <div class="operation-row">
        <div class="left-actions">
          <el-upload
            action="/api/admin/talks/images"
            :headers="uploadHeaders"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :show-file-list="false"
          >
            <button class="icon-button" type="button">
              <el-icon><Picture /></el-icon>
            </button>
          </el-upload>
        </div>
        <div class="right-actions">
          <div class="switch-item">
            <span>置顶</span>
            <el-switch v-model="talk.isTop" :active-value="1" :inactive-value="0" />
          </div>
          <el-dropdown trigger="click" @command="handleStatusCommand">
            <button class="status-button" type="button">
              {{ dropdownTitle }}
              <el-icon><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in statuses"
                  :key="item.status"
                  :command="item.status"
                >
                  {{ item.desc }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            type="primary"
            size="small"
            :disabled="!talk.content.trim()"
            @click="saveOrUpdateTalk"
          >
            发布
          </el-button>
        </div>
      </div>

      <el-upload
        v-show="uploads.length > 0"
        class="talk-image-upload"
        action="/api/admin/talks/images"
        list-type="picture-card"
        multiple
        :headers="uploadHeaders"
        :file-list="uploads"
        :before-upload="handleBeforeUpload"
        :on-success="handleUploadSuccess"
        :on-remove="handleRemove"
      >
        <el-icon><Plus /></el-icon>
      </el-upload>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import type { UploadFile, UploadUserFile } from 'element-plus'
import { ArrowDown, Picture, Plus } from '@element-plus/icons-vue'
import * as imageConversion from 'image-conversion'

defineOptions({
  name: 'TalkEditor',
})

interface Talk {
  id: number | null
  content: string
  isTop: 0 | 1
  status: 1 | 2
  images: string
  imgs?: string[] | null
}

interface TalkResponse {
  flag: boolean
  message?: string
  data: Talk
}

interface CommonResponse {
  flag: boolean
  message?: string
  data?: string
}

const UPLOAD_SIZE = 1024 // 1MB

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => (route.name ? String(route.name) : '发布说说'))

const talk = reactive<Talk>({
  id: null,
  content: '',
  isTop: 0,
  status: 1,
  images: '',
})

const statuses = [
  { status: 1, desc: '公开' },
  { status: 2, desc: '私密' },
]

const uploads = ref<UploadUserFile[]>([])

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
}))

const dropdownTitle = computed(() => {
  return statuses.find((item) => item.status === talk.status)?.desc || '公开'
})

const handleStatusCommand = (command: number) => {
  talk.status = command as 1 | 2
}

const handleRemove = (file: UploadFile) => {
  uploads.value = uploads.value.filter((item) => item.url !== file.url)
}

const handleUploadSuccess = (response: CommonResponse) => {
  if (response.data) {
    uploads.value.push({
      name: `talk-${Date.now()}`,
      url: response.data,
    })
  }
}

const handleBeforeUpload = async (file: File): Promise<File | Blob> => {
  if (file.size / 1024 < UPLOAD_SIZE) {
    return file
  }
  return await imageConversion.compressAccurately(file, UPLOAD_SIZE)
}

const hydrateUploads = (images: string[]) => {
  uploads.value = images.map((url, index) => ({
    name: `talk-${index + 1}`,
    url,
  }))
}

const loadTalk = async () => {
  const talkId = route.params.talkId as string | undefined
  if (!talkId) return
  const { data } = await axios.get<TalkResponse>(`/api/admin/talks/${talkId}`)
  Object.assign(talk, data.data)

  const imagesFromArray = Array.isArray(data.data.imgs) ? data.data.imgs : []
  if (imagesFromArray.length) {
    hydrateUploads(imagesFromArray)
    return
  }

  if (data.data.images) {
    try {
      const parsed = JSON.parse(data.data.images) as string[]
      if (Array.isArray(parsed)) {
        hydrateUploads(parsed)
      }
    } catch {
      // ignore invalid json
    }
  }
}

const saveOrUpdateTalk = async () => {
  if (!talk.content.trim()) {
    ElMessage.error('说说内容不能为空')
    return
  }
  talk.images = uploads.value.length
    ? JSON.stringify(uploads.value.map((item) => item.url).filter(Boolean))
    : ''

  const { data } = await axios.post<CommonResponse>('/api/admin/talks', talk)
  if (data.flag) {
    talk.content = ''
    uploads.value = []
    ElNotification.success({
      title: '成功',
      message: data.message || '发布成功',
    })
    router.push({ path: '/talk-list' })
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '发布失败',
    })
  }
}

onMounted(() => {
  loadTalk()
})
</script>

<style scoped>
.talk-editor-page {
  width: 100%;
}

.talk-editor-card {
  border-radius: 20px;
  border: 1px solid var(--border-soft);
  background: var(--surface-1);
  box-shadow: var(--shadow-card);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ink-900);
  margin-bottom: 1.5rem;
}

.editor-shell {
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--border-soft);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.operation-row {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.8);
  display: grid;
  place-items: center;
  cursor: pointer;
  color: var(--ink-700);
}

.switch-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ink-700);
  font-size: 0.9rem;
}

.status-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  color: var(--ink-700);
  font-size: 0.85rem;
}

.talk-image-upload {
  margin-top: 1rem;
}

.talk-image-upload :deep(.el-upload--picture-card) {
  border-radius: 14px;
  border: 1px dashed rgba(71, 59, 47, 0.3);
  background: rgba(255, 255, 255, 0.65);
}

@media (max-width: 768px) {
  .operation-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
