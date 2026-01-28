<template>
  <div class="talk-page">
    <el-card class="talk-list-card">
      <div class="page-title">{{ pageTitle }}</div>

      <AppStatusFilter v-model="activeStatus" :options="statusOptions" @change="changeStatus" />

      <el-empty v-if="!talks.length && !loading" description="暂无说说" />

      <div v-else class="talk-list" v-loading="loading">
        <div v-for="item in talks" :key="item.id" class="talk-item">
          <el-avatar :src="item.avatar" :size="40" class="user-avatar" />
          <div class="talk-body">
            <div class="talk-header">
              <div class="talk-title">
                <span class="nickname">{{ item.nickname }}</span>
                <span v-if="item.isTop === 1" class="flag">
                  <el-icon><Top /></el-icon>
                  置顶
                </span>
                <span v-if="item.status === 2" class="flag flag--secret">
                  <el-icon><Lock /></el-icon>
                  私密
                </span>
              </div>
              <el-dropdown @command="handleCommand">
                <button class="more-button" type="button" aria-label="更多操作">
                  <el-icon><MoreFilled /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="`edit:${item.id}`">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item :command="`delete:${item.id}`" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="talk-meta">{{ formatDate(item.createTime) }}</div>
            <div class="talk-content" v-html="item.content" />

            <el-row v-if="item.imgs?.length" :gutter="8" class="talk-images">
              <el-col v-for="(img, index) in item.imgs" :key="index" :xs="12" :sm="8" :md="6">
                <el-image class="talk-image" :src="img" :preview-src-list="item.imgs" fit="cover" />
              </el-col>
            </el-row>
          </div>
        </div>
      </div>

      <AppPagination
        class="pagination-container"
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        layout="prev, pager, next"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog v-model="showDeleteDialog" title="提示" width="30%">
      <div style="font-size: 1rem">是否删除该说说？</div>
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
import { api, request, type PageData } from '@/api'
import { ElNotification } from 'element-plus'
import { Delete, Edit, Lock, MoreFilled, Top } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'
import AppStatusFilter from '@/components/AppStatusFilter.vue'

defineOptions({
  name: 'TalkList',
})

interface Talk {
  id: number
  avatar: string
  nickname: string
  content: string
  createTime: string
  isTop: 0 | 1
  status: 1 | 2
  imgs?: string[] | null
}

type TalkListData = PageData<Talk>

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '说说列表'))

const loading = ref(false)
const talks = ref<Talk[]>([])
const activeStatus = ref<string | number | null>(null)
const showDeleteDialog = ref(false)
const pendingDeleteId = ref<number | null>(null)

const pagination = reactive({
  current: appStore.pageState.talkList || 1,
  size: 5,
  total: 0,
})

const statusOptions = [
  { label: '全部', value: null },
  { label: '公开', value: 1 },
  { label: '私密', value: 2 },
]

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

const fetchTalks = async () => {
  loading.value = true
  try {
    const result = await request.get<TalkListData>(api.admin.talk.list, {
      params: {
        current: pagination.current,
        size: pagination.size,
        status: activeStatus.value,
      },
    })
    if (!result.ok) {
      return
    }
    talks.value = result.data.records ?? []
    pagination.total = result.data.count ?? 0
  } finally {
    loading.value = false
  }
}

const handleCommand = (command: string) => {
  const [action, idText] = command.split(':')
  const id = Number(idText)
  if (!id) return
  if (action === 'edit') {
    router.push({ path: `/talks/${id}` })
    return
  }
  if (action === 'delete') {
    pendingDeleteId.value = id
    showDeleteDialog.value = true
  }
}

const confirmDelete = async () => {
  if (!pendingDeleteId.value) return
  const result = await request.delete<null>(
    api.admin.talk.list,
    {
      data: [pendingDeleteId.value],
    },
    { silent: true },
  )
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '删除失败',
    })
    showDeleteDialog.value = false
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '删除成功',
  })
  await fetchTalks()
  showDeleteDialog.value = false
}

const changeStatus = (status: string | number | null) => {
  activeStatus.value = status
  pagination.current = 1
  fetchTalks()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateTalkListPageState(current)
  fetchTalks()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchTalks()
}

onMounted(() => {
  fetchTalks()
})
</script>

<style scoped>
.talk-list-card {
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

.talk-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.talk-item {
  display: grid;
  grid-template-columns: auto 1fr;
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

.talk-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgba(15, 23, 42, 0.1);
}

.user-avatar {
  border-radius: 50%;
}

.talk-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.talk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.talk-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nickname {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink-900);
}

.flag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(251, 146, 60, 0.15);
  color: #c2410c;
}

.flag--secret {
  background: rgba(148, 163, 184, 0.25);
  color: #475569;
}

.more-button {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--ink-500);
  padding: 0.25rem;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.more-button:hover {
  background: rgba(15, 23, 42, 0.08);
}

.talk-meta {
  font-size: 0.8rem;
  color: var(--ink-500);
}

.talk-content {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--ink-700);
  white-space: pre-line;
  word-break: break-word;
}

.talk-images {
  margin-top: 0.5rem;
}

.talk-image {
  width: 100%;
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .talk-item {
    grid-template-columns: 1fr;
  }
}
</style>
