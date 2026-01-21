<template>
  <el-card class="article-list-container">
    <div class="page-title">{{ route.name }}</div>

    <div class="status-menu">
      <span class="menu-label">状态</span>
      <span
        v-for="item in statusOptions"
        :key="item.key"
        :class="['status-item', { active: activeStatus === item.key }]"
        @click="changeStatus(item.key)">
        {{ item.label }}
      </span>
    </div>

    <div class="operation-container">
      <el-button
        v-if="queryParams.isDelete === 0"
        type="danger"
        size="small"
        :disabled="selectedIds.length === 0"
        @click="showDeleteDialog = true">
        批量删除
      </el-button>
      <el-button
        v-else
        type="danger"
        size="small"
        :disabled="selectedIds.length === 0"
        @click="showPermanentDeleteDialog = true">
        批量删除
      </el-button>
      <el-button
        type="success"
        size="small"
        :disabled="selectedIds.length === 0"
        style="margin-right: 1rem"
        @click="showExportDialog = true">
        批量导出
      </el-button>
      <el-upload
        action="/api/admin/articles/import"
        multiple
        :limit="9"
        :show-file-list="false"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess">
        <el-button type="primary" size="small"> 批量导入 </el-button>
      </el-upload>

      <div class="search-container">
        <el-select
          v-model="queryParams.type"
          clearable
          placeholder="请选择文章类型"
          size="small"
          style="margin-right: 1rem; width: 180px">
          <el-option label="全部" :value="null" />
          <el-option v-for="item in articleTypes" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select
          v-model="queryParams.categoryId"
          clearable
          filterable
          placeholder="请选择分类"
          size="small"
          style="margin-right: 1rem; width: 180px">
          <el-option label="全部" :value="null" />
          <el-option v-for="item in categories" :key="item.id" :label="item.categoryName" :value="item.id" />
        </el-select>
        <el-select
          v-model="queryParams.tagId"
          clearable
          filterable
          placeholder="请选择标签"
          size="small"
          style="margin-right: 1rem; width: 180px">
          <el-option label="全部" :value="null" />
          <el-option v-for="item in tags" :key="item.id" :label="item.tagName" :value="item.id" />
        </el-select>
        <el-input
          v-model="queryParams.keywords"
          clearable
          size="small"
          placeholder="请输入文章名"
          style="width: 200px"
          @keyup.enter="handleSearch" />
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="handleSearch"> 搜索 </el-button>
      </div>
    </div>

    <el-table border :data="articleList" v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="articleCover" label="文章封面" width="180" align="center">
        <template #default="{ row }">
          <div class="cover-container">
            <el-image class="article-cover" fit="cover" :src="row.articleCover || defaultCover" />
            <i v-if="row.status === 1" class="status-icon public-icon" />
            <i v-if="row.status === 2" class="status-icon private-icon" />
            <i v-if="row.status === 3" class="status-icon draft-icon" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="articleTitle" label="标题" align="center" />
      <el-table-column prop="categoryName" label="分类" width="110" align="center" />
      <el-table-column prop="tagDTOs" label="标签" width="170" align="center">
        <template #default="{ row }">
          <el-tag v-for="item of row.tagDTOs" :key="item.tagId" style="margin-right: 0.2rem; margin-top: 0.2rem">
            {{ item.tagName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="viewsCount" label="浏览量" width="70" align="center">
        <template #default="{ row }">
          <span>{{ row.viewsCount ?? 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getArticleTypeInfo(row.type).tagType">
            {{ getArticleTypeInfo(row.type).name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="发表时间" width="150" align="center">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="isTop" label="置顶" width="80" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.isTop"
            :active-value="1"
            :inactive-value="0"
            :disabled="row.isDelete === 1"
            @change="handleToggleTopOrFeatured(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="isFeatured" label="推荐" width="80" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.isFeatured"
            :active-value="1"
            :inactive-value="0"
            :disabled="row.isDelete === 1"
            @change="handleToggleTopOrFeatured(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150">
        <template #default="{ row }">
          <el-button v-if="row.isDelete === 0" type="primary" size="small" @click="handleEdit(row.id)">
            编辑
          </el-button>
          <el-popconfirm
            v-if="row.isDelete === 0"
            title="确定删除吗？"
            @confirm="handleDeleteArticle(row.id)"
            style="margin-left: 10px">
            <template #reference>
              <el-button size="small" type="danger"> 删除 </el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm v-if="row.isDelete === 1" title="确定恢复吗？" @confirm="handleDeleteArticle(row.id)">
            <template #reference>
              <el-button size="small" type="success"> 恢复 </el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm
            v-if="row.isDelete === 1"
            title="确定彻底删除吗？"
            @confirm="handlePermanentDelete(row.id)"
            style="margin-left: 10px">
            <template #reference>
              <el-button size="small" type="danger"> 删除 </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pagination-container"
      background
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.size"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange" />

    <el-dialog v-model="showDeleteDialog" title="提示" width="30%">
      <div style="font-size: 1rem">是否删除选中项？</div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBatchDelete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPermanentDeleteDialog" title="提示" width="30%">
      <div style="font-size: 1rem">是否彻底删除选中项？</div>
      <template #footer>
        <el-button @click="showPermanentDeleteDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBatchPermanentDelete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showExportDialog" title="提示" width="30%">
      <div style="font-size: 1rem">是否导出选中文章？</div>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExport">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import axios from 'axios'

defineOptions({
  name: 'ArticleList',
})

interface TagDTO {
  tagId: number
  tagName: string
}

interface Article {
  id: number
  articleTitle: string
  articleCover: string
  categoryName: string
  tagDTOs: TagDTO[]
  viewsCount: number
  type: 1 | 2 | 3
  status: 1 | 2 | 3
  createTime: string
  isTop: 0 | 1
  isFeatured: 0 | 1
  isDelete: 0 | 1
}

interface Category {
  id: number
  categoryName: string
}

interface Tag {
  id: number
  tagName: string
}

interface ArticleListResponse {
  flag: boolean
  message?: string
  data: {
    records: Article[]
    count: number
  }
}

interface CommonResponse {
  flag: boolean
  message?: string
  data?: unknown
}

interface ExportResponse {
  flag: boolean
  message?: string
  data?: string[]
}

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const articleList = ref<Article[]>([])
const selectedIds = ref<number[]>([])
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

const activeStatus = ref('all')
const showDeleteDialog = ref(false)
const showPermanentDeleteDialog = ref(false)
const showExportDialog = ref(false)

const defaultCover = 'https://static.talkxj.com/articles/c5cc2b2561bd0e3060a500198a4ad37d.png'

const uploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + sessionStorage.getItem('token'),
}))

const articleTypes = [
  { value: 1, label: '原创' },
  { value: 2, label: '转载' },
  { value: 3, label: '翻译' },
]

const statusOptions = [
  { key: 'all', label: '全部' },
  { key: 'public', label: '公开' },
  { key: 'private', label: '私密' },
  { key: 'draft', label: '草稿箱' },
  { key: 'delete', label: '回收站' },
]

const queryParams = reactive({
  keywords: null as string | null,
  type: null as number | null,
  categoryId: null as number | null,
  tagId: null as number | null,
  status: null as number | null,
  isDelete: 0,
})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
})

const getArticleTypeInfo = (type: 1 | 2 | 3) => {
  const typeMap = {
    1: { tagType: 'danger', name: '原创' },
    2: { tagType: 'success', name: '转载' },
    3: { tagType: 'primary', name: '翻译' },
  }
  return typeMap[type] || { tagType: '', name: '' }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const changeStatus = (status: string) => {
  activeStatus.value = status
  pagination.current = 1

  switch (status) {
    case 'all':
      queryParams.isDelete = 0
      queryParams.status = null
      break
    case 'public':
      queryParams.isDelete = 0
      queryParams.status = 1
      break
    case 'private':
      queryParams.isDelete = 0
      queryParams.status = 2
      break
    case 'draft':
      queryParams.isDelete = 0
      queryParams.status = 3
      break
    case 'delete':
      queryParams.isDelete = 1
      queryParams.status = null
      break
  }

  fetchArticles()
}

const handleSearch = () => {
  pagination.current = 1
  fetchArticles()
}

const handleSelectionChange = (articles: Article[]) => {
  selectedIds.value = articles.map((item) => item.id)
}

const handleSizeChange = () => {
  fetchArticles()
}

const handleCurrentChange = () => {
  fetchArticles()
}

const handleEdit = (id: number) => {
  router.push({ path: `/articles/${id}` })
}

const handleDeleteArticle = async (id: number) => {
  try {
    const params = {
      ids: [id],
      isDelete: queryParams.isDelete === 0 ? 1 : 0,
    }
    const { data } = await axios.put<CommonResponse>('/api/admin/articles', params)
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: data.message || '操作成功',
      })
      await fetchArticles()
    } else {
      ElNotification.error({
        title: '失败',
        message: data.message || '操作失败',
      })
    }
  } catch {
    ElNotification.error({
      title: '失败',
      message: '操作失败',
    })
  }
}

const handleBatchDelete = async () => {
  try {
    const params = {
      ids: selectedIds.value,
      isDelete: queryParams.isDelete === 0 ? 1 : 0,
    }
    const { data } = await axios.put<CommonResponse>('/api/admin/articles', params)
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: data.message || '操作成功',
      })
      await fetchArticles()
    } else {
      ElNotification.error({
        title: '失败',
        message: data.message || '操作失败',
      })
    }
  } catch  {
    ElNotification.error({
      title: '失败',
      message: '操作失败',
    })
  } finally {
    showDeleteDialog.value = false
  }
}

const handlePermanentDelete = async (id: number) => {
  try {
    const { data } = await axios.delete<CommonResponse>('/api/admin/articles/delete', {
      data: [id],
    })
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: data.message || '删除成功',
      })
      await fetchArticles()
    } else {
      ElNotification.error({
        title: '失败',
        message: data.message || '删除失败',
      })
    }
  } catch  {
    ElNotification.error({
      title: '失败',
      message: '删除失败',
    })
  }
}

const handleBatchPermanentDelete = async () => {
  try {
    const { data } = await axios.delete<CommonResponse>('/api/admin/articles/delete', {
      data: selectedIds.value,
    })
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: data.message || '删除成功',
      })
      await fetchArticles()
    } else {
      ElNotification.error({
        title: '失败',
        message: data.message || '删除失败',
      })
    }
  } catch  {
    ElNotification.error({
      title: '失败',
      message: '删除失败',
    })
  } finally {
    showPermanentDeleteDialog.value = false
  }
}

const handleExport = async () => {
  try {
    const { data } = await axios.post<ExportResponse>('/api/admin/articles/export', selectedIds.value)
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: data.message || '导出成功',
      })
      data.data?.forEach((url) => {
        downloadFile(url)
      })
      await fetchArticles()
    } else {
      ElNotification.error({
        title: '失败',
        message: data.message || '导出失败',
      })
    }
  } catch  {
    ElNotification.error({
      title: '失败',
      message: '导出失败',
    })
  } finally {
    showExportDialog.value = false
  }
}

const downloadFile = (url: string) => {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.style.height = '0'
  iframe.src = url
  document.body.appendChild(iframe)
  setTimeout(() => {
    iframe.remove()
  }, 5 * 60 * 1000)
}

const handleUploadSuccess = (response: CommonResponse) => {
  if (response.flag) {
    ElNotification.success({
      title: '成功',
      message: '导入成功',
    })
    fetchArticles()
  } else {
    ElNotification.error({
      title: '失败',
      message: response.message || '导入失败',
    })
  }
}

const handleToggleTopOrFeatured = async (article: Article) => {
  try {
    const { data } = await axios.put<CommonResponse>('/api/admin/articles/topAndFeatured', {
      id: article.id,
      isTop: article.isTop,
      isFeatured: article.isFeatured,
    })
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: '修改成功',
      })
    } else {
      ElNotification.error({
        title: '失败',
        message: data.message || '修改失败',
      })
    }
  } catch  {
    ElNotification.error({
      title: '失败',
      message: '修改失败',
    })
  }
}

const fetchArticles = async () => {
  loading.value = true
  try {
    const { data } = await axios.get<ArticleListResponse>('/api/admin/articles', {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: queryParams.keywords,
        categoryId: queryParams.categoryId,
        status: queryParams.status,
        tagId: queryParams.tagId,
        type: queryParams.type,
        isDelete: queryParams.isDelete,
      },
    })
    articleList.value = data.data.records
    pagination.total = data.data.count
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  const { data } = await axios.get<{ data: Category[] }>('/api/admin/categories/search')
  categories.value = data.data
}

const fetchTags = async () => {
  const { data } = await axios.get<{ data: Tag[] }>('/api/admin/tags/search')
  tags.value = data.data
}

watch(
  () => queryParams.type,
  () => {
    pagination.current = 1
    fetchArticles()
  }
)

watch(
  () => queryParams.categoryId,
  () => {
    pagination.current = 1
    fetchArticles()
  }
)

watch(
  () => queryParams.tagId,
  () => {
    pagination.current = 1
    fetchArticles()
  }
)

onMounted(() => {
  fetchArticles()
  fetchCategories()
  fetchTags()
})
</script>

<style scoped>
.article-list-container {
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

.status-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 14px;
  color: var(--ink-500);
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-soft);
}

.menu-label {
  font-weight: 500;
  color: var(--ink-700);
}

.status-item {
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.status-item:hover {
  color: var(--ink-900);
  background: var(--surface-2);
}

.status-item.active {
  color: var(--primary);
  font-weight: 600;
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

.cover-container {
  position: relative;
  width: 100%;
  height: 90px;
}

.article-cover {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.article-cover::after {
  content: '';
  background: rgba(0, 0, 0, 0.3);
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 8px;
}

.status-icon {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  color: #fff;
  font-size: 1.25rem;
  z-index: 1;
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

:deep(.el-pagination) {
  --el-pagination-button-bg-color: var(--surface-1);
  --el-pagination-hover-color: var(--primary);
}
</style>