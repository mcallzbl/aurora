<template>
  <div class="delete-page">
    <el-card class="delete-card">
      <div class="page-title">{{ pageTitle }}</div>

      <div class="operation-container">
        <div class="check-summary">
          <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAll">
            全选
          </el-checkbox>
          <span class="check-count">已选择{{ selectedIds.length }}张</span>
        </div>
        <el-button
          type="success"
          size="small"
          :disabled="selectedIds.length === 0"
          @click="restorePhotos(null)"
        >
          <el-icon><RefreshLeft /></el-icon>
          批量恢复
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

      <el-row class="photo-container" :gutter="12" v-loading="loading">
        <el-col v-if="!photos.length && !loading" :span="24">
          <el-empty description="暂无照片" />
        </el-col>
        <el-checkbox-group v-model="selectedIds" class="photo-group" @change="handleCheckedChange">
          <el-col v-for="(item, index) in photos" :key="item.id" :xs="12" :sm="8" :md="6">
            <el-checkbox :label="item.id" class="photo-check">
              <div class="photo-item">
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

    <el-dialog v-model="showDeleteDialog" title="提示" width="30%">
      <div style="font-size: 1rem">是否删除选中照片？</div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="primary" @click="deletePhotos">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, request, type PageData } from '@/api'
import { ElNotification } from 'element-plus'
import { Delete, RefreshLeft } from '@element-plus/icons-vue'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'AlbumDelete',
})

interface PhotoItem {
  id: number
  photoName: string
  photoSrc: string
}

type PhotoListData = PageData<PhotoItem>

const route = useRoute()

const pageTitle = computed(() => (route.name ? String(route.name) : '回收站'))

const loading = ref(true)
const photos = ref<PhotoItem[]>([])
const selectedIds = ref<number[]>([])
const checkAll = ref(false)
const isIndeterminate = ref(false)
const showDeleteDialog = ref(false)

const pagination = reactive({
  current: 1,
  size: 18,
  total: 0,
})

const photoIds = computed(() => photos.value.map((item) => item.id))
const previewSources = computed(() => photos.value.map((item) => item.photoSrc))

const fetchPhotos = async () => {
  loading.value = true
  try {
    const result = await request.get<PhotoListData>(api.admin.photo.photos, {
      params: {
        current: pagination.current,
        size: pagination.size,
        isDelete: 1,
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

const handleCheckAll = (value: boolean) => {
  selectedIds.value = value ? [...photoIds.value] : []
  isIndeterminate.value = false
}

const handleCheckedChange = (value: number[]) => {
  const checkedCount = value.length
  const total = photoIds.value.length
  checkAll.value = checkedCount === total && total > 0
  isIndeterminate.value = checkedCount > 0 && checkedCount < total
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchPhotos()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  fetchPhotos()
}

const restorePhotos = async (id: number | null) => {
  const ids = id ? [id] : selectedIds.value
  if (!ids.length) {
    return
  }
  const result = await request.put<null, { ids: number[]; isDelete: number }>(
    api.admin.photo.updateDelete,
    { ids, isDelete: 0 },
    undefined,
    { silent: true },
  )
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '恢复失败',
    })
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '恢复成功',
  })
  showDeleteDialog.value = false
  fetchPhotos()
}

const deletePhotos = async () => {
  if (!selectedIds.value.length) {
    return
  }
  const result = await request.delete<null, number[]>(
    api.admin.photo.photos,
    { data: selectedIds.value },
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
  fetchPhotos()
}

onMounted(() => {
  fetchPhotos()
})
</script>

<style scoped>
.delete-card {
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

.check-summary {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin-right: auto;
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

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}
</style>
