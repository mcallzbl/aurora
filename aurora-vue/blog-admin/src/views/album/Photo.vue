<template>
  <div class="photo-page">
    <el-card class="photo-card">
      <div class="page-title">{{ pageTitle }}</div>

      <div class="album-info">
        <el-image fit="cover" class="album-cover" :src="albumInfo.albumCover" />
        <div class="album-detail">
          <div class="album-meta">
            <span class="album-name">{{ albumInfo.albumName || '-' }}</span>
            <span class="photo-count">{{ albumInfo.photoCount }}张</span>
          </div>
          <div class="album-actions">
            <span v-if="albumInfo.albumDesc" class="album-desc">{{ albumInfo.albumDesc }}</span>
            <el-button type="primary" size="small" @click="showUploadDialog = true">
              <el-icon><Picture /></el-icon>
              上传照片
            </el-button>
          </div>
        </div>

        <div class="operation-container">
          <div class="check-summary">
            <el-checkbox
              :indeterminate="isIndeterminate"
              v-model="checkAll"
              @change="handleCheckAll"
            >
              全选
            </el-checkbox>
            <span class="check-count">已选择{{ selectedIds.length }}张</span>
          </div>
          <el-button
            type="success"
            size="small"
            :disabled="selectedIds.length === 0"
            @click="openMoveDialog"
          >
            <el-icon><Switch /></el-icon>
            移动到
          </el-button>
          <el-button
            type="danger"
            size="small"
            :disabled="selectedIds.length === 0"
            @click="showDeleteDialog = true"
          >
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
        </div>
      </div>

      <el-row class="photo-container" :gutter="12" v-loading="loading">
        <el-col v-if="!photos.length && !loading" :span="24">
          <el-empty description="暂无照片" />
        </el-col>
        <el-checkbox-group v-model="selectedIds" class="photo-group" @change="handleCheckedChange">
          <el-col v-for="(item, index) in photos" :key="item.id" :xs="12" :sm="8" :md="6">
            <el-checkbox :label="item.id" class="photo-check">
              <div class="photo-item">
                <div class="photo-operation" @click.stop>
                  <el-dropdown @command="handleCommand">
                    <button class="more-button" type="button" aria-label="更多操作">
                      <el-icon><MoreFilled /></el-icon>
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="{ action: 'edit', photo: item }">
                          <el-icon><Edit /></el-icon>
                          编辑
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <el-image
                  fit="cover"
                  class="photo-img"
                  :src="item.photoSrc"
                  :preview-src-list="previewSources"
                  :initial-index="index"
                />
                <div class="photo-name">{{ item.photoName }}</div>
              </div>
            </el-checkbox>
          </el-col>
        </el-checkbox-group>
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

    <el-dialog v-model="showUploadDialog" title="上传照片" width="70%" top="10vh">
      <div class="upload-container">
        <el-upload
          v-show="uploads.length > 0"
          class="photo-upload"
          :action="api.admin.photo.upload"
          list-type="picture-card"
          :file-list="uploads"
          multiple
          :headers="uploadHeaders"
          :before-upload="handleBeforeUpload"
          :on-success="handleUploadSuccess"
          :on-remove="handleRemove"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <div class="upload-dragger">
          <el-upload
            v-show="uploads.length === 0"
            drag
            :action="api.admin.photo.upload"
            multiple
            :headers="uploadHeaders"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :show-file-list="false"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持上传 jpg/png 文件</div>
            </template>
          </el-upload>
        </div>
      </div>
      <template #footer>
        <div class="upload-footer">
          <div class="upload-count">共上传{{ uploads.length }}张照片</div>
          <div class="upload-actions">
            <el-button @click="showUploadDialog = false">取消</el-button>
            <el-button type="primary" :disabled="uploads.length === 0" @click="savePhotos">
              开始上传
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showEditDialog" title="修改信息" width="30%">
      <el-form label-width="80px" size="default" :model="photoForm">
        <el-form-item label="照片名称">
          <el-input v-model="photoForm.photoName" style="width: 220px" />
        </el-form-item>
        <el-form-item label="照片描述">
          <el-input v-model="photoForm.photoDesc" style="width: 220px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updatePhoto">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDeleteDialog" title="提示" width="30%">
      <div style="font-size: 1rem">是否删除选中照片？</div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="primary" @click="updatePhotoDelete(null)">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showMoveDialog" title="移动照片" width="30%">
      <el-empty v-if="!availableAlbums.length" description="暂无其他相册" />
      <el-form v-else label-width="80px" size="default">
        <el-radio-group v-model="targetAlbumId">
          <div class="album-check-list">
            <el-radio
              v-for="item in availableAlbums"
              :key="item.id"
              :label="item.id"
              style="margin-bottom: 1rem"
            >
              <div class="album-check">
                <el-image fit="cover" class="album-check-cover" :src="item.albumCover" />
                <div class="album-check-name">{{ item.albumName }}</div>
              </div>
            </el-radio>
          </div>
        </el-radio-group>
      </el-form>
      <template #footer>
        <el-button @click="showMoveDialog = false">取消</el-button>
        <el-button :disabled="targetAlbumId == null" type="primary" @click="updatePhotoAlbum">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { UploadFile, UploadUserFile } from 'element-plus'
import { ElMessage, ElNotification } from 'element-plus'
import * as imageConversion from 'image-conversion'
import { api, request, type ApiResponse, type PageData } from '@/api'
import {
  Delete,
  Edit,
  MoreFilled,
  Picture,
  Plus,
  Switch,
  UploadFilled,
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'AlbumPhoto',
})

interface AlbumInfo {
  id: number | null
  albumName: string
  albumDesc: string
  albumCover: string
  photoCount: number
}

interface AlbumItem {
  id: number
  albumName: string
  albumCover: string
}

interface PhotoItem {
  id: number
  photoName: string
  photoDesc?: string
  photoSrc: string
}

interface PhotoForm {
  id: number | null
  photoName: string
  photoDesc: string
}

type PhotoListData = PageData<PhotoItem>

const route = useRoute()
const appStore = useAppStore()

const UPLOAD_SIZE = 1024 // 1MB

const pageTitle = computed(() => (route.name ? String(route.name) : '相册详情'))

const loading = ref(true)
const checkAll = ref(false)
const isIndeterminate = ref(false)
const showUploadDialog = ref(false)
const showEditDialog = ref(false)
const showMoveDialog = ref(false)
const showDeleteDialog = ref(false)

const uploads = ref<UploadUserFile[]>([])
const photos = ref<PhotoItem[]>([])
const selectedIds = ref<number[]>([])
const albumList = ref<AlbumItem[]>([])
const targetAlbumId = ref<number | null>(null)

const albumInfo = reactive<AlbumInfo>({
  id: null,
  albumName: '',
  albumDesc: '',
  albumCover: '',
  photoCount: 0,
})

const photoForm = reactive<PhotoForm>({
  id: null,
  photoName: '',
  photoDesc: '',
})

const pagination = reactive({
  current: 1,
  size: 18,
  total: 0,
})

const albumId = computed(() => {
  const id = Number(route.params.albumId)
  return Number.isNaN(id) ? null : id
})

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
}))

const previewSources = computed(() => photos.value.map((item) => item.photoSrc))

const availableAlbums = computed(() => albumList.value.filter((item) => item.id !== albumInfo.id))

const syncPageState = (currentAlbumId: number) => {
  const state = appStore.pageState.photo
  if (state.albumId === currentAlbumId && state.current > 0) {
    pagination.current = state.current
  } else {
    pagination.current = 1
    appStore.updatePhotoPageState({ albumId: currentAlbumId, current: 1 })
  }
}

const fetchAlbumInfo = async () => {
  if (!albumId.value) return
  const result = await request.get<AlbumInfo>(api.admin.photo.albumInfo(albumId.value))
  if (!result.ok) return
  Object.assign(albumInfo, result.data)
}

const fetchAlbumList = async () => {
  const result = await request.get<AlbumItem[]>(api.admin.photo.albumListInfo)
  if (!result.ok) return
  albumList.value = Array.isArray(result.data) ? result.data : []
}

const fetchPhotos = async () => {
  if (!albumId.value) return
  loading.value = true
  try {
    const result = await request.get<PhotoListData>(api.admin.photo.photos, {
      params: {
        current: pagination.current,
        size: pagination.size,
        albumId: albumId.value,
        isDelete: 0,
      },
    })
    if (!result.ok) {
      return
    }
    const records = Array.isArray(result.data.records) ? result.data.records : []
    photos.value = records
    pagination.total = typeof result.data.count === 'number' ? result.data.count : 0
    selectedIds.value = []
    checkAll.value = false
    isIndeterminate.value = false
  } finally {
    loading.value = false
  }
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  if (albumId.value != null) {
    appStore.updatePhotoPageState({ albumId: albumId.value, current })
  }
  fetchPhotos()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchPhotos()
}

const savePhotos = async () => {
  if (!albumId.value) return
  const photoUrls = uploads.value.map((item) => item.url).filter(Boolean) as string[]
  if (!photoUrls.length) return
  const result = await request.post<null, { albumId: number; photoUrls: string[] }>(
    api.admin.photo.photos,
    {
      albumId: albumId.value,
      photoUrls,
    },
    undefined,
    { silent: true },
  )
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '上传失败',
    })
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '上传成功',
  })
  uploads.value = []
  showUploadDialog.value = false
  fetchPhotos()
  fetchAlbumInfo()
}

const updatePhoto = async () => {
  if (!photoForm.photoName.trim()) {
    ElMessage.error('照片名称不能为空')
    return
  }
  const result = await request.put<null, PhotoForm>(api.admin.photo.photos, photoForm, undefined, {
    silent: true,
  })
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '修改失败',
    })
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '修改成功',
  })
  showEditDialog.value = false
  fetchPhotos()
}

const updatePhotoAlbum = async () => {
  if (!targetAlbumId.value) return
  const result = await request.put<null, { albumId: number; photoIds: number[] }>(
    api.admin.photo.moveAlbum,
    {
      albumId: targetAlbumId.value,
      photoIds: selectedIds.value,
    },
    undefined,
    { silent: true },
  )
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '移动失败',
    })
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '移动成功',
  })
  showMoveDialog.value = false
  fetchAlbumInfo()
  fetchPhotos()
}

const updatePhotoDelete = async (id: number | null) => {
  const ids = id ? [id] : selectedIds.value
  if (!ids.length) return
  const result = await request.put<null, { ids: number[]; isDelete: number }>(
    api.admin.photo.updateDelete,
    { ids, isDelete: 1 },
    undefined,
    { silent: true },
  )
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
  fetchAlbumInfo()
  fetchPhotos()
}

const openMoveDialog = () => {
  targetAlbumId.value = null
  showMoveDialog.value = true
}

const handleCheckAll = (value: boolean) => {
  selectedIds.value = value ? photos.value.map((item) => item.id) : []
  isIndeterminate.value = false
}

const handleCheckedChange = (value: number[]) => {
  const checkedCount = value.length
  const total = photos.value.length
  checkAll.value = checkedCount === total && total > 0
  isIndeterminate.value = checkedCount > 0 && checkedCount < total
}

const handleCommand = (command: { action: 'edit'; photo: PhotoItem }) => {
  if (command.action !== 'edit') return
  photoForm.id = command.photo.id
  photoForm.photoName = command.photo.photoName
  photoForm.photoDesc = command.photo.photoDesc || ''
  showEditDialog.value = true
}

const handleRemove = (file: UploadFile) => {
  uploads.value = uploads.value.filter((item) => item.url !== file.url)
}

const handleUploadSuccess = (response: ApiResponse<string>) => {
  if (response.flag && response.data) {
    uploads.value.push({
      name: `photo-${Date.now()}`,
      url: response.data,
    })
    return
  }
  ElMessage.error(response.message || '上传失败')
}

const handleBeforeUpload = async (file: File): Promise<File | Blob> => {
  if (file.size / 1024 < UPLOAD_SIZE) {
    return file
  }
  return await imageConversion.compressAccurately(file, UPLOAD_SIZE)
}

const boot = () => {
  if (!albumId.value) return
  syncPageState(albumId.value)
  fetchAlbumInfo()
  fetchAlbumList()
  fetchPhotos()
}

watch(
  () => route.params.albumId,
  () => {
    boot()
  },
)

onMounted(() => {
  boot()
})
</script>

<style scoped>
.photo-card {
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

.album-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.album-cover {
  border-radius: 12px;
  width: 5.5rem;
  height: 5.5rem;
  flex-shrink: 0;
  overflow: hidden;
}

.album-detail {
  flex: 1;
  min-width: 0;
}

.album-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.album-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ink-900);
}

.photo-count {
  font-size: 0.75rem;
  color: var(--ink-500);
}

.album-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.album-desc {
  font-size: 0.9rem;
  color: var(--ink-700);
}

.operation-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.check-summary {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.check-count {
  font-size: 0.75rem;
  color: var(--ink-500);
}

.photo-group {
  width: 100%;
}

.photo-check {
  width: 100%;
}

.photo-item {
  width: 100%;
  position: relative;
  cursor: pointer;
  margin-bottom: 1rem;
  padding: 0.6rem;
  border-radius: 12px;
  background: var(--surface-2);
  box-shadow: var(--shadow-card);
}

.photo-img {
  width: 100%;
  height: 7.5rem;
  border-radius: 10px;
  overflow: hidden;
}

.photo-name {
  font-size: 0.85rem;
  margin-top: 0.45rem;
  text-align: center;
  color: var(--ink-700);
}

.photo-operation {
  position: absolute;
  z-index: 2;
  top: 0.6rem;
  right: 0.6rem;
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

.photo-container {
  margin-top: 0.5rem;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.upload-container {
  height: 400px;
}

.upload-dragger {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.upload-actions {
  margin-left: auto;
  display: flex;
  gap: 0.75rem;
}

.album-check-list {
  display: flex;
  flex-direction: column;
}

.album-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.album-check-cover {
  border-radius: 10px;
  width: 4rem;
  height: 4rem;
}

.album-check-name {
  color: var(--ink-700);
}
</style>
