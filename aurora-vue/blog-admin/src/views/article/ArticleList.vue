<template>
  <el-card class="article-list-container">
    <div class="page-title">{{ route.name }}</div>

    <AppStatusFilter v-model="activeStatus" :options="statusOptions" @change="changeStatus" />

    <div class="operation-container">
      <el-checkbox
        class="select-all"
        :model-value="isAllSelected"
        :indeterminate="isIndeterminate"
        @change="handleToggleSelectAll"
      >
        全选
      </el-checkbox>
      <el-button
        v-if="queryParams.isDelete === 0"
        type="danger"
        size="small"
        :disabled="selectedIds.length === 0"
        @click="showDeleteDialog = true"
      >
        批量删除
      </el-button>
      <el-button
        v-else
        type="danger"
        size="small"
        :disabled="selectedIds.length === 0"
        @click="showPermanentDeleteDialog = true"
      >
        批量删除
      </el-button>
      <el-button
        type="success"
        size="small"
        :disabled="selectedIds.length === 0"
        style="margin-right: 1rem"
        @click="showExportDialog = true"
      >
        批量导出
      </el-button>
      <el-upload
        :action="api.admin.article.import"
        multiple
        :limit="9"
        :show-file-list="false"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
      >
        <el-button type="primary" size="small"> 批量导入 </el-button>
      </el-upload>

      <div class="search-container">
        <el-select
          v-model="queryParams.type"
          clearable
          placeholder="请选择文章类型"
          size="small"
          style="margin-right: 1rem; width: 180px"
        >
          <el-option label="全部" :value="''" />
          <el-option
            v-for="item in articleTypes"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="queryParams.categoryId"
          clearable
          filterable
          placeholder="请选择分类"
          size="small"
          style="margin-right: 1rem; width: 180px"
        >
          <el-option label="全部" :value="''" />
          <el-option
            v-for="item in categories"
            :key="item.id"
            :label="item.categoryName"
            :value="item.id"
          />
        </el-select>
        <el-select
          v-model="queryParams.tagId"
          clearable
          filterable
          placeholder="请选择标签"
          size="small"
          style="margin-right: 1rem; width: 180px"
        >
          <el-option label="全部" :value="''" />
          <el-option v-for="item in tags" :key="item.id" :label="item.tagName" :value="item.id" />
        </el-select>
        <el-input
          v-model="queryParams.keywords"
          clearable
          size="small"
          placeholder="请输入文章名"
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="handleSearch">
          搜索
        </el-button>
      </div>
    </div>

    <el-empty v-if="!articleList.length && !loading" description="暂无文章" />

    <div v-else class="article-list" v-loading="loading">
      <el-checkbox-group v-model="selectedIds" class="article-group">
        <div v-for="article in articleList" :key="article.id" class="article-item">
          <div class="article-select">
            <el-checkbox :label="article.id" />
          </div>

          <div class="article-cover-wrapper">
            <el-image
              class="article-cover"
              fit="cover"
              :src="article.articleCover || defaultCover"
            />
            <div class="article-flags">
              <span v-if="article.isTop === 1" class="flag flag--top">置顶</span>
              <span v-if="article.isFeatured === 1" class="flag flag--featured">推荐</span>
            </div>
          </div>

          <div class="article-body">
            <div class="article-header">
              <div class="article-title-row">
                <span class="article-title">{{ article.articleTitle || '未命名文章' }}</span>
                <el-tag size="small" :type="getArticleTypeInfo(article.type).tagType">
                  {{ getArticleTypeInfo(article.type).name }}
                </el-tag>
                <el-tag v-if="article.status === 1" size="small" type="success">公开</el-tag>
                <el-tag v-else-if="article.status === 2" size="small" type="warning">私密</el-tag>
                <el-tag v-else size="small" type="info">草稿</el-tag>
                <el-tag v-if="article.isDelete === 1" size="small" type="danger">回收站</el-tag>
              </div>
              <div class="article-right">
                <div class="article-controls">
                  <div class="control-item">
                    <span>置顶</span>
                    <TopSwitch
                      v-model="article.isTop"
                      :disabled="article.isDelete === 1"
                      @change="handleToggleTopOrFeatured(article)"
                    />
                  </div>
                  <div class="control-item">
                    <span>推荐</span>
                    <el-switch
                      v-model="article.isFeatured"
                      :active-value="1"
                      :inactive-value="0"
                      :disabled="article.isDelete === 1"
                      @change="handleToggleTopOrFeatured(article)"
                    />
                  </div>
                </div>
                <div class="article-actions">
                  <el-button
                    v-if="article.isDelete === 0"
                    type="primary"
                    size="small"
                    @click="handleEdit(article.id)"
                  >
                    编辑
                  </el-button>
                  <el-popconfirm
                    v-if="article.isDelete === 0"
                    title="确定删除吗？"
                    @confirm="handleDeleteArticle(article.id)"
                  >
                    <template #reference>
                      <el-button size="small" type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                  <el-popconfirm
                    v-if="article.isDelete === 1"
                    title="确定恢复吗？"
                    @confirm="handleDeleteArticle(article.id)"
                  >
                    <template #reference>
                      <el-button size="small" type="success">恢复</el-button>
                    </template>
                  </el-popconfirm>
                  <el-popconfirm
                    v-if="article.isDelete === 1"
                    title="确定彻底删除吗？"
                    @confirm="handlePermanentDelete(article.id)"
                  >
                    <template #reference>
                      <el-button size="small" type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </div>

            <div v-if="article.tagDTOs?.length" class="article-tags">
              <el-tag
                v-for="item of article.tagDTOs"
                :key="item.tagId"
                size="small"
                style="margin-right: 0.3rem; margin-top: 0.3rem"
              >
                {{ item.tagName }}
              </el-tag>
            </div>

            <div class="article-meta">
              <span>{{ article.categoryName || '未分类' }}</span>
              <span>浏览量 {{ article.viewsCount ?? 0 }}</span>
              <span>发表时间 {{ formatDate(article.createTime) }}</span>
            </div>
          </div>
        </div>
      </el-checkbox-group>
    </div>

    <AppPagination
      class="pagination-container"
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.size"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

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
import { api, request, type ApiResponse, type PageData } from '@/api'
import AppPagination from '@/components/AppPagination.vue'
import AppStatusFilter from '@/components/AppStatusFilter.vue'
import TopSwitch from '@/components/TopSwitch.vue'

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

type ArticleListData = PageData<Article>
type UploadResponse = ApiResponse<unknown>

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const articleList = ref<Article[]>([])
const selectedIds = ref<number[]>([])
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

const activeStatus = ref<string | number | null>('all')
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
  { value: 'all', label: '全部' },
  { value: 'public', label: '公开' },
  { value: 'private', label: '私密' },
  { value: 'draft', label: '草稿箱' },
  { value: 'delete', label: '回收站' },
]

const queryParams = reactive({
  keywords: null as string | null,
  type: '' as number | '' | null,
  categoryId: '' as number | '' | null,
  tagId: '' as number | '' | null,
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

const changeStatus = (status: string | number | null) => {
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

const isAllSelected = computed(() => {
  return articleList.value.length > 0 && selectedIds.value.length === articleList.value.length
})

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < articleList.value.length
})

const handleToggleSelectAll = (value: boolean) => {
  selectedIds.value = value ? articleList.value.map((item) => item.id) : []
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
    const result = await request.put<null>(api.admin.article.list, params, undefined, {
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
    await fetchArticles()
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
    const result = await request.put<null>(api.admin.article.list, params, undefined, {
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
    await fetchArticles()
  } catch {
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
    const result = await request.delete<null>(
      api.admin.article.delete,
      {
        data: [id],
      },
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
    await fetchArticles()
  } catch {
    ElNotification.error({
      title: '失败',
      message: '删除失败',
    })
  }
}

const handleBatchPermanentDelete = async () => {
  try {
    const result = await request.delete<null>(
      api.admin.article.delete,
      {
        data: selectedIds.value,
      },
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
    await fetchArticles()
  } catch {
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
    const result = await request.post<string[]>(
      api.admin.article.export,
      selectedIds.value,
      undefined,
      {
        silent: true,
      },
    )
    if (!result.ok) {
      ElNotification.error({
        title: '失败',
        message: result.message || '导出失败',
      })
      return
    }
    ElNotification.success({
      title: '成功',
      message: result.message || '导出成功',
    })
    result.data?.forEach((url) => {
      downloadFile(url)
    })
    await fetchArticles()
  } catch {
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
  setTimeout(
    () => {
      iframe.remove()
    },
    5 * 60 * 1000,
  )
}

const handleUploadSuccess = (response: UploadResponse) => {
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
    const result = await request.put<null>(
      api.admin.article.topAndFeatured,
      {
        id: article.id,
        isTop: article.isTop,
        isFeatured: article.isFeatured,
      },
      undefined,
      { silent: true },
    )
    if (!result.ok) {
      ElNotification.error({
        title: '失败',
        message: result.message || '修改失败',
      })
      return
    }
    ElNotification.success({
      title: '成功',
      message: '修改成功',
    })
  } catch {
    ElNotification.error({
      title: '失败',
      message: '修改失败',
    })
  }
}

const normalizeSelectValue = <T,>(value: T | '' | null) => (value === '' ? null : value)

const fetchArticles = async () => {
  loading.value = true
  try {
    const result = await request.get<ArticleListData>(api.admin.article.list, {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: queryParams.keywords,
        categoryId: normalizeSelectValue(queryParams.categoryId),
        status: queryParams.status,
        tagId: normalizeSelectValue(queryParams.tagId),
        type: normalizeSelectValue(queryParams.type),
        isDelete: queryParams.isDelete,
      },
    })
    if (!result.ok) {
      return
    }
    articleList.value = result.data.records
    pagination.total = result.data.count
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  const result = await request.get<Category[]>(api.admin.category.search)
  if (!result.ok) {
    return
  }
  categories.value = (result.data || []).filter((item) => item.id != null)
}

const fetchTags = async () => {
  const result = await request.get<Tag[]>(api.admin.tag.search)
  if (!result.ok) {
    return
  }
  tags.value = (result.data || []).filter((item) => item.id != null)
}

watch(
  () => queryParams.type,
  () => {
    pagination.current = 1
    fetchArticles()
  },
)

watch(
  () => queryParams.categoryId,
  () => {
    pagination.current = 1
    fetchArticles()
  },
)

watch(
  () => queryParams.tagId,
  () => {
    pagination.current = 1
    fetchArticles()
  },
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

.operation-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.select-all {
  margin-right: 0.25rem;
}

.search-container {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.article-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.article-item {
  display: grid;
  grid-template-columns: auto 160px 1fr;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.article-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgba(15, 23, 42, 0.1);
}

.article-select {
  display: flex;
  align-items: flex-start;
  padding-top: 0.35rem;
}

.article-group :deep(.el-checkbox__label) {
  display: none;
}

.article-cover-wrapper {
  position: relative;
  width: 160px;
  height: 110px;
  border-radius: 12px;
  overflow: hidden;
}

.article-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-flags {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.flag {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(251, 146, 60, 0.15);
  color: #c2410c;
}

.flag--top {
  background: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
}

.flag--featured {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
}

.article-body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
  color: var(--ink-800);
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.article-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.article-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}

.article-title {
  flex: 1;
  min-width: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #000 !important;
  -webkit-text-fill-color: #000;
  text-shadow: none;
  opacity: 1;
  position: relative;
  z-index: 1;
  line-height: 1.5;
  word-break: break-word;
  max-width: 420px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.article-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  flex-shrink: 0;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--ink-500);
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.article-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.control-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--ink-600);
  font-size: 0.85rem;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: var(--surface-1);
  --el-pagination-hover-color: var(--primary);
}

@media (max-width: 900px) {
  .article-item {
    grid-template-columns: 1fr;
  }

  .article-select {
    justify-content: flex-end;
  }

  .article-cover-wrapper {
    width: 100%;
    height: 180px;
  }

  .article-title {
    max-width: 100%;
  }

  .article-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
