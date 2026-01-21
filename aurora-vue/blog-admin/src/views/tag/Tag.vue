<template>
  <el-card class="tag-card">
    <div class="page-title">{{ pageTitle }}</div>

    <div class="operation-container">
      <el-button type="primary" size="small" @click="openEditor(null)">
        <el-icon><Plus /></el-icon>
        新增
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
      <div class="search-container">
        <el-input
          v-model="keywords"
          clearable
          size="small"
          placeholder="请输入标签名"
          style="width: 200px"
          @keyup.enter="searchTags"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="searchTags">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <el-table border :data="tags" v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="tagName" label="标签名" align="center">
        <template #default="{ row }">
          <el-tag>{{ row.tagName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="articleCount" label="文章量" align="center" />
      <el-table-column prop="createTime" label="创建时间" align="center" width="160">
        <template #default="{ row }">
          <el-icon style="margin-right: 6px"><Clock /></el-icon>
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openEditor(row)">编辑</el-button>
          <el-popconfirm title="确定删除吗？" @confirm="deleteTag(row.id)">
            <template #reference>
              <el-button size="small" type="danger" style="margin-left: 0.75rem">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <AppPagination
      class="pagination-container"
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.size"
      :total="pagination.total"
      :page-sizes="[10, 20]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </el-card>

  <el-dialog v-model="showDeleteDialog" title="提示" width="30%">
    <div style="font-size: 1rem">是否删除选中项？</div>
    <template #footer>
      <el-button @click="showDeleteDialog = false">取消</el-button>
      <el-button type="primary" @click="deleteTag(null)">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showEditorDialog" :title="editorTitle" width="30%">
    <el-form label-width="80px" size="default" :model="tagForm">
      <el-form-item label="标签名">
        <el-input v-model="tagForm.tagName" style="width: 220px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditorDialog = false">取消</el-button>
      <el-button type="primary" @click="submitTag">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import { Clock, Delete, Plus, Search } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'TagView',
})

interface TagItem {
  id: number
  tagName: string
  articleCount: number
  createTime: string
}

interface TagListResponse {
  flag: boolean
  message?: string
  data: {
    records: TagItem[]
    count: number
  }
}

interface TagForm {
  id: number | null
  tagName: string
}

interface CommonResponse {
  flag: boolean
  message?: string
}

const route = useRoute()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '标签管理'))
const editorTitle = computed(() => (tagForm.id ? '修改标签' : '添加标签'))

const loading = ref(true)
const keywords = ref<string | null>(null)
const tags = ref<TagItem[]>([])
const selectedIds = ref<number[]>([])
const showDeleteDialog = ref(false)
const showEditorDialog = ref(false)

const pagination = reactive({
  current: appStore.pageState.tag || 1,
  size: 10,
  total: 0,
})

const tagForm = reactive<TagForm>({
  id: null,
  tagName: '',
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const fetchTags = async () => {
  loading.value = true
  try {
    const { data } = await axios.get<TagListResponse>('/api/admin/tags', {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: keywords.value,
      },
    })
    tags.value = data.data.records
    pagination.total = data.data.count
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: TagItem[]) => {
  selectedIds.value = rows.map((item) => item.id)
}

const searchTags = () => {
  pagination.current = 1
  fetchTags()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchTags()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateTagPageState(current)
  fetchTags()
}

const openEditor = (tag: TagItem | null) => {
  if (tag) {
    tagForm.id = tag.id
    tagForm.tagName = tag.tagName
  } else {
    tagForm.id = null
    tagForm.tagName = ''
  }
  showEditorDialog.value = true
}

const submitTag = async () => {
  if (!tagForm.tagName.trim()) {
    ElMessage.error('标签名不能为空')
    return
  }
  const { data } = await axios.post<CommonResponse>('/api/admin/tags', tagForm)
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '操作成功',
    })
    await fetchTags()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '操作失败',
    })
  }
  showEditorDialog.value = false
}

const deleteTag = async (id: number | null) => {
  const payload = id ? [id] : selectedIds.value
  const { data } = await axios.delete<CommonResponse>('/api/admin/tags', { data: payload })
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '删除成功',
    })
    await fetchTags()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '删除失败',
    })
  }
  showDeleteDialog.value = false
}

onMounted(() => {
  fetchTags()
})
</script>

<style scoped>
.tag-card {
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

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: var(--surface-2);
  color: var(--ink-700);
  font-weight: 600;
}
</style>
