<template>
  <el-card class="category-card">
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
          placeholder="请输入分类名"
          style="width: 200px"
          @keyup.enter="searchCategories"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="searchCategories">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <el-table
      border
      :data="categories"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="categoryName" label="分类名" align="center" />
      <el-table-column prop="articleCount" label="文章量" align="center" />
      <el-table-column prop="createTime" label="创建时间" align="center" width="160">
        <template #default="{ row }">
          <el-icon style="margin-right: 6px"><Clock /></el-icon>
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openEditor(row)">编辑</el-button>
          <el-popconfirm title="确定删除吗？" @confirm="deleteCategory(row.id)">
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
      <el-button type="primary" @click="deleteCategory(null)">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showEditorDialog" :title="editorTitle" width="30%">
    <el-form label-width="80px" size="default" :model="categoryForm">
      <el-form-item label="分类名">
        <el-input v-model="categoryForm.categoryName" style="width: 220px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditorDialog = false">取消</el-button>
      <el-button type="primary" @click="submitCategory">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, request, type PageData } from '@/api'
import { ElMessage, ElNotification } from 'element-plus'
import { Clock, Delete, Plus, Search } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'CategoryView',
})

interface CategoryItem {
  id: number
  categoryName: string
  articleCount: number
  createTime: string
}

interface CategoryForm {
  id: number | null
  categoryName: string
}

type CategoryListData = PageData<CategoryItem>

const route = useRoute()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '分类管理'))
const editorTitle = computed(() => (categoryForm.id ? '修改分类' : '添加分类'))

const loading = ref(true)
const keywords = ref<string | null>(null)
const categories = ref<CategoryItem[]>([])
const selectedIds = ref<number[]>([])
const showDeleteDialog = ref(false)
const showEditorDialog = ref(false)

const pagination = reactive({
  current: appStore.pageState.category || 1,
  size: 10,
  total: 0,
})

const categoryForm = reactive<CategoryForm>({
  id: null,
  categoryName: '',
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const result = await request.get<CategoryListData>(api.admin.category.list, {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: keywords.value,
      },
    })
    if (!result.ok) {
      return
    }
    categories.value = result.data.records
    pagination.total = result.data.count
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: CategoryItem[]) => {
  selectedIds.value = rows.map((item) => item.id)
}

const searchCategories = () => {
  pagination.current = 1
  fetchCategories()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchCategories()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateCategoryPageState(current)
  fetchCategories()
}

const openEditor = (category: CategoryItem | null) => {
  if (category) {
    categoryForm.id = category.id
    categoryForm.categoryName = category.categoryName
  } else {
    categoryForm.id = null
    categoryForm.categoryName = ''
  }
  showEditorDialog.value = true
}

const submitCategory = async () => {
  if (!categoryForm.categoryName.trim()) {
    ElMessage.error('分类名不能为空')
    return
  }
  const result = await request.post<null>(api.admin.category.list, categoryForm)
  if (!result.ok) {
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '操作成功',
  })
  await fetchCategories()
  showEditorDialog.value = false
}

const deleteCategory = async (id: number | null) => {
  const payload = id ? [id] : selectedIds.value
  const result = await request.delete<null>(api.admin.category.list, { data: payload })
  if (!result.ok) {
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '删除成功',
  })
  await fetchCategories()
  showDeleteDialog.value = false
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-card {
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
