<template>
  <div class="comment-page">
    <el-card class="comment-card">
      <div class="page-title">{{ pageTitle }}</div>

      <div class="review-menu">
        <span>状态</span>
        <button
          type="button"
          class="review-button"
          :class="{ 'is-active': activeReview === null }"
          @click="changeReview(null)"
        >
          全部
        </button>
        <button
          type="button"
          class="review-button"
          :class="{ 'is-active': activeReview === 1 }"
          @click="changeReview(1)"
        >
          正常
        </button>
        <button
          type="button"
          class="review-button"
          :class="{ 'is-active': activeReview === 0 }"
          @click="changeReview(0)"
        >
          审核中
        </button>
      </div>

      <div class="operation-container">
        <el-button
          type="danger"
          size="small"
          :disabled="selectedIds.length === 0"
          @click="showDeleteDialog = true"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button
          type="success"
          size="small"
          :disabled="selectedIds.length === 0"
          @click="updateCommentReview(null)"
        >
          <el-icon><CircleCheck /></el-icon>
          批量通过
        </el-button>
        <div class="search-container">
          <el-select
            v-model="activeType"
            clearable
            placeholder="请选择来源"
            size="small"
            style="margin-right: 1rem; width: 160px"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-model="keywords"
            clearable
            size="small"
            placeholder="请输入用户昵称"
            style="width: 200px"
            @keyup.enter="searchComments"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="small" style="margin-left: 1rem" @click="searchComments">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>

      <el-empty v-if="!comments.length && !loading" description="暂无评论" />

      <el-table
        v-else
        border
        :data="comments"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="avatar" label="头像" align="center" width="120">
          <template #default="{ row }">
            <el-image class="avatar-image" :src="row.avatar" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="评论人" align="center" width="120" />
        <el-table-column prop="replyNickname" label="回复人" align="center" width="120">
          <template #default="{ row }">
            <span v-if="row.replyNickname">{{ row.replyNickname }}</span>
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column prop="articleTitle" label="文章标题" align="center">
          <template #default="{ row }">
            <span v-if="row.articleTitle">{{ row.articleTitle }}</span>
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column prop="commentContent" label="评论内容" align="center">
          <template #default="{ row }">
            <span class="comment-content" v-html="row.commentContent" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="评论时间" width="150" align="center">
          <template #default="{ row }">
            <el-icon style="margin-right: 6px"><Clock /></el-icon>
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="isReview" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isReview === 0" type="warning">审核中</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" align="center" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1">文章</el-tag>
            <el-tag v-else-if="row.type === 2" type="danger">留言</el-tag>
            <el-tag v-else-if="row.type === 3" type="success">关于我</el-tag>
            <el-tag v-else-if="row.type === 4" type="warning">友链</el-tag>
            <el-tag v-else-if="row.type === 5" type="warning">说说</el-tag>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.isReview === 0"
              size="small"
              type="success"
              @click="updateCommentReview(row.id)"
            >
              通过
            </el-button>
            <el-popconfirm title="确定删除吗？" @confirm="deleteComments(row.id)">
              <template #reference>
                <el-button size="small" type="danger" style="margin-left: 0.5rem">删除</el-button>
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
      <div style="font-size: 1rem">是否彻底删除选中项？</div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="primary" @click="deleteComments(null)">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { ElNotification } from 'element-plus'
import { CircleCheck, Clock, Delete, Search } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'CommentView',
})

interface CommentItem {
  id: number
  avatar: string
  nickname: string
  replyNickname?: string | null
  articleTitle?: string | null
  commentContent: string
  createTime: string
  isReview: 0 | 1
  type: number
}

interface CommentListResponse {
  flag: boolean
  message?: string
  data: {
    records: CommentItem[]
    count: number
  }
}

interface CommonResponse {
  flag: boolean
  message?: string
}

const route = useRoute()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '评论管理'))

const loading = ref(true)
const keywords = ref<string | null>(null)
const comments = ref<CommentItem[]>([])
const selectedIds = ref<number[]>([])
const activeType = ref<number | null>(null)
const activeReview = ref<number | null>(null)
const showDeleteDialog = ref(false)

const typeOptions = [
  { value: 1, label: '文章' },
  { value: 2, label: '留言' },
  { value: 3, label: '关于我' },
  { value: 4, label: '友链' },
  { value: 5, label: '说说' },
]

const pagination = reactive({
  current: appStore.pageState.comment || 1,
  size: 10,
  total: 0,
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const fetchComments = async () => {
  loading.value = true
  try {
    const { data } = await axios.get<CommentListResponse>('/api/admin/comments', {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: keywords.value,
        type: activeType.value,
        isReview: activeReview.value,
      },
    })
    comments.value = data.data.records
    pagination.total = data.data.count
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: CommentItem[]) => {
  selectedIds.value = rows.map((item) => item.id)
}

const searchComments = () => {
  pagination.current = 1
  fetchComments()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchComments()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateCommentPageState(current)
  fetchComments()
}

const changeReview = (review: number | null) => {
  activeReview.value = review
}

const updateCommentReview = async (id: number | null) => {
  const ids = id ? [id] : selectedIds.value
  if (!ids.length) return
  const { data } = await axios.put<CommonResponse>('/api/admin/comments/review', {
    ids,
    isReview: 1,
  })
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '操作成功',
    })
    await fetchComments()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '操作失败',
    })
  }
}

const deleteComments = async (id: number | null) => {
  const ids = id ? [id] : selectedIds.value
  if (!ids.length) {
    showDeleteDialog.value = false
    return
  }
  const { data } = await axios.delete<CommonResponse>('/api/admin/comments', {
    data: ids,
  })
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '删除成功',
    })
    await fetchComments()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '删除失败',
    })
  }
  showDeleteDialog.value = false
}

watch(
  () => activeReview.value,
  () => {
    pagination.current = 1
    fetchComments()
  },
)

watch(
  () => activeType.value,
  () => {
    pagination.current = 1
    fetchComments()
  },
)

onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comment-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-card {
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

.review-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 14px;
  color: var(--ink-500);
  margin: 1.5rem 0 0.5rem;
}

.review-button {
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
  font-size: 14px;
  padding: 0;
}

.review-button.is-active {
  color: var(--ink-900);
  font-weight: 600;
}

.operation-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.search-container {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.comment-content {
  display: inline-block;
}

.avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
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
