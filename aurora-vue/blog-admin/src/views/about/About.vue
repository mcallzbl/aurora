<template>
  <el-card class="about-editor-container">
    <div class="page-title">{{ route.name || '关于我' }}</div>

    <MdEditor
      v-model="aboutContent"
      :toolbars-exclude="['github']"
      :preview-theme="'github'"
      :code-theme="'atom'"
      @on-upload-img="handleUploadImg"
      style="height: calc(100vh - 280px)"
    />

    <div class="action-container">
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">
        保存修改
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElNotification } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { api, request } from '@/api'
import * as imageConversion from 'image-conversion'

defineOptions({
  name: 'AboutEditor',
})

interface AboutContent {
  content: string
}

const UPLOAD_SIZE = 1024 // 1MB

const route = useRoute()
const aboutContent = ref('')
const saving = ref(false)

const handleUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData()
    let fileToUpload: File | Blob = file

    if (file.size / 1024 >= UPLOAD_SIZE) {
      const compressed = await imageConversion.compressAccurately(file, UPLOAD_SIZE)
      fileToUpload = new File([compressed], file.name, { type: file.type })
    }

    formData.append('file', fileToUpload)
    const result = await request.post<string>(api.admin.article.images, formData, undefined, {
      silent: true,
    })
    if (!result.ok) {
      return ''
    }
    return result.data || ''
  })

  const urls = await Promise.all(uploadPromises)
  callback(urls)
}

const fetchAbout = async () => {
  try {
    const result = await request.get<AboutContent>(api.about)
    if (!result.ok) {
      return
    }
    aboutContent.value = result.data.content
  } catch {
    ElNotification.error({
      title: '失败',
      message: '加载内容失败',
    })
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const result = await request.put<null>(
      api.admin.about,
      {
        content: aboutContent.value,
      },
      undefined,
      { silent: true },
    )
    if (!result.ok) {
      ElNotification.error({
        title: '失败',
        message: result.message || '保存失败',
      })
      return
    }
    ElNotification.success({
      title: '成功',
      message: result.message || '保存成功',
    })
  } catch {
    ElNotification.error({
      title: '失败',
      message: '保存失败',
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchAbout()
})
</script>

<style scoped>
.about-editor-container {
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

.action-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-soft);
}

:deep(.md-editor) {
  border-radius: 12px;
  border: 1px solid var(--border-soft);
}
</style>
