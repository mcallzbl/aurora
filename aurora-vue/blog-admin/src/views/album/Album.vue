<template>
  <div class="album-page">
    <el-card class="album-card">
      <div class="page-title">{{ pageTitle }}</div>

      <div class="operation-container">
        <el-button type="primary" size="small" @click="openEditor(null)">
          <el-icon><Plus /></el-icon>
          新建相册
        </el-button>
        <div class="search-container">
          <el-button class="link-button" size="small" style="margin-right: 1rem" @click="goRecycle">
            <el-icon><Delete /></el-icon>
            回收站
          </el-button>
          <el-input
            v-model="keywords"
            clearable
            size="small"
            placeholder="请输入相册名"
            style="width: 200px"
            @keyup.enter="searchAlbums"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="small" style="margin-left: 1rem" @click="searchAlbums">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>

      <el-row class="album-container" :gutter="16" v-loading="loading">
        <el-col v-if="!albums.length && !loading" :span="24">
          <el-empty description="暂无相册" />
        </el-col>
        <el-col v-for="item in albums" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="album-item" @click="openPhotos(item)">
            <div class="album-operation" @click.stop>
              <el-dropdown @command="handleCommand">
                <button class="more-button" type="button" aria-label="更多操作">
                  <el-icon><MoreFilled /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'edit', album: item }">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', album: item }" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="album-photo-count">
              <span>{{ item.photoCount }}</span>
              <el-icon v-if="item.status === 2"><Lock /></el-icon>
            </div>
            <div class="album-cover">
              <el-image fit="cover" :src="item.albumCover" />
            </div>
            <div class="album-name">{{ item.albumName }}</div>
          </div>
        </el-col>
      </el-row>

      <AppPagination
        class="pagination-container"
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        layout="prev, pager, next"
        :hide-on-single-page="true"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog v-model="showEditorDialog" :title="editorTitle" width="35%" top="10vh">
      <el-form label-width="80px" size="default" :model="albumForm">
        <el-form-item label="相册名称">
          <el-input v-model="albumForm.albumName" style="width: 220px" />
        </el-form-item>
        <el-form-item label="相册描述">
          <el-input v-model="albumForm.albumDesc" style="width: 220px" />
        </el-form-item>
        <el-form-item label="相册封面">
          <el-upload
            class="upload-cover"
            drag
            :headers="uploadHeaders"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :action="api.admin.photo.albumUpload"
            multiple
          >
            <el-icon v-if="!albumForm.albumCover"><UploadFilled /></el-icon>
            <div v-if="!albumForm.albumCover" class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <img v-else :src="albumForm.albumCover" width="360" height="180" alt="相册封面" />
          </el-upload>
        </el-form-item>
        <el-form-item label="发布形式">
          <el-radio-group v-model="albumForm.status">
            <el-radio :label="1">公开</el-radio>
            <el-radio :label="2">私密</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditorDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAlbum">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDeleteDialog" title="提示" width="30%">
      <div style="font-size: 1rem">是否删除该相册？</div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmDelete">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as imageConversion from 'image-conversion'
import { api, request, type ApiResponse, type PageData } from '@/api'
import { ElMessage, ElNotification } from 'element-plus'
import { Delete, Edit, Lock, MoreFilled, Plus, Search, UploadFilled } from '@element-plus/icons-vue'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'AlbumView',
})

interface AlbumItem {
  id: number
  albumName: string
  albumDesc: string
  albumCover: string
  photoCount: number
  status: 1 | 2
}

interface AlbumForm {
  id: number | null
  albumName: string
  albumDesc: string
  albumCover: string
  status: 1 | 2
}

type AlbumListData = PageData<AlbumItem>

const route = useRoute()
const router = useRouter()

const UPLOAD_SIZE = 1024 // 1MB

const pageTitle = computed(() => (route.name ? String(route.name) : '相册管理'))
const editorTitle = computed(() => (albumForm.id ? '修改相册' : '新建相册'))

const loading = ref(true)
const keywords = ref<string>('')
const albums = ref<AlbumItem[]>([])
const showEditorDialog = ref(false)
const showDeleteDialog = ref(false)
const pendingDeleteId = ref<number | null>(null)

const pagination = reactive({
  current: 1,
  size: 8,
  total: 0,
})

const albumForm = reactive<AlbumForm>({
  id: null,
  albumName: '',
  albumDesc: '',
  albumCover: '',
  status: 1,
})

const resetForm = () => {
  albumForm.id = null
  albumForm.albumName = ''
  albumForm.albumDesc = ''
  albumForm.albumCover = ''
  albumForm.status = 1
}

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
}))

const fetchAlbums = async () => {
  loading.value = true
  try {
    const result = await request.get<AlbumListData>(api.admin.photo.albums, {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: keywords.value || undefined,
      },
    })
    if (!result.ok) {
      return
    }
    const records = Array.isArray(result.data.records) ? result.data.records : []
    albums.value = records
    pagination.total = typeof result.data.count === 'number' ? result.data.count : 0
  } finally {
    loading.value = false
  }
}

const openEditor = (album: AlbumItem | null) => {
  if (album) {
    albumForm.id = album.id
    albumForm.albumName = album.albumName
    albumForm.albumDesc = album.albumDesc
    albumForm.albumCover = album.albumCover
    albumForm.status = album.status
  } else {
    resetForm()
  }
  showEditorDialog.value = true
}

const openPhotos = (album: AlbumItem) => {
  router.push({ path: `/albums/${album.id}` })
}

const goRecycle = () => {
  router.push({ path: '/photos/delete' })
}

const searchAlbums = () => {
  pagination.current = 1
  fetchAlbums()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchAlbums()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  fetchAlbums()
}

const handleBeforeUpload = async (file: File): Promise<File | Blob> => {
  if (file.size / 1024 < UPLOAD_SIZE) {
    return file
  }
  return await imageConversion.compressAccurately(file, UPLOAD_SIZE)
}

const handleUploadSuccess = (response: ApiResponse<string>) => {
  if (response.flag && response.data) {
    albumForm.albumCover = response.data
    return
  }
  ElMessage.error(response.message || '上传失败')
}

const submitAlbum = async () => {
  if (!albumForm.albumName.trim()) {
    ElMessage.error('相册名称不能为空')
    return
  }
  if (!albumForm.albumDesc.trim()) {
    ElMessage.error('相册描述不能为空')
    return
  }
  if (!albumForm.albumCover) {
    ElMessage.error('相册封面不能为空')
    return
  }
  const result = await request.post<null, AlbumForm>(api.admin.photo.albums, albumForm, undefined, {
    silent: true,
  })
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '操作失败',
    })
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '操作成功',
  })
  showEditorDialog.value = false
  fetchAlbums()
}

const handleCommand = (command: { action: 'edit' | 'delete'; album: AlbumItem }) => {
  if (command.action === 'delete') {
    pendingDeleteId.value = command.album.id
    showDeleteDialog.value = true
    return
  }
  openEditor(command.album)
}

const confirmDelete = async () => {
  if (!pendingDeleteId.value) {
    return
  }
  const result = await request.delete<null>(api.admin.photo.albumDetail(pendingDeleteId.value))
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '删除失败',
    })
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '删除成功',
  })
  showDeleteDialog.value = false
  pendingDeleteId.value = null
  fetchAlbums()
}

onMounted(() => {
  fetchAlbums()
})
</script>

<style scoped>
.album-card {
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

.operation-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.search-container {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.album-container {
  margin-top: 0.5rem;
}

.album-item {
  position: relative;
  padding: 0.75rem;
  border-radius: 16px;
  background: var(--surface-2);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.album-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.album-cover {
  position: relative;
  border-radius: 12px;
  width: 100%;
  height: 170px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.2);
}

.album-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.55));
}

.album-cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-operation {
  position: absolute;
  z-index: 2;
  top: 0.75rem;
  right: 0.85rem;
}

.album-photo-count {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 3.35rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.25rem;
  color: #fff;
  z-index: 2;
}

.album-name {
  text-align: center;
  margin-top: 0.75rem;
  font-weight: 600;
  color: var(--ink-700);
}

.more-button {
  border: none;
  background: rgba(15, 23, 42, 0.45);
  cursor: pointer;
  color: #fff;
  padding: 0.3rem;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.more-button:hover {
  background: rgba(15, 23, 42, 0.65);
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}
</style>
