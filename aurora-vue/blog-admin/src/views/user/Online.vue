<template>
  <el-card class="online-card">
    <div class="page-title">{{ pageTitle }}</div>

    <div class="operation-container">
      <div class="search-container">
        <el-input
          v-model="keywords"
          clearable
          size="small"
          placeholder="请输入用户昵称"
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <el-empty v-if="!onlineUsers.length && !loading" description="暂无在线用户" />

    <el-table v-else border :data="onlineUsers" v-loading="loading">
      <el-table-column prop="avatar" label="头像" align="center" width="100">
        <template #default="{ row }">
          <el-image class="avatar-image" :src="row.avatar" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" align="center" width="140" />
      <el-table-column prop="ipAddress" label="IP地址" align="center" width="140" />
      <el-table-column prop="ipSource" label="登录地址" align="center" width="200" />
      <el-table-column prop="browser" label="浏览器" align="center" width="160" />
      <el-table-column prop="os" label="操作系统" align="center" />
      <el-table-column prop="lastLoginTime" label="登录时间" align="center" width="180">
        <template #default="{ row }">
          <el-icon style="margin-right: 6px"><Clock /></el-icon>
          {{ formatDate(row.lastLoginTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120">
        <template #default="{ row }">
          <el-popconfirm title="确定下线吗？" @confirm="removeOnlineUser(row)">
            <template #reference>
              <el-button size="small" type="danger" text>下线</el-button>
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
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElNotification } from 'element-plus'
import { Clock, Search } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'OnlineUserView',
})

interface OnlineUser {
  userInfoId: number
  avatar: string
  nickname: string
  ipAddress: string
  ipSource: string
  browser: string
  os: string
  lastLoginTime: string
}

interface OnlineUserListResponse {
  flag: boolean
  message?: string
  data: {
    records: OnlineUser[]
    count: number
  }
}

interface CommonResponse {
  flag: boolean
  message?: string
}

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '在线用户'))

const loading = ref(true)
const keywords = ref<string | null>(null)
const onlineUsers = ref<OnlineUser[]>([])

const pagination = reactive({
  current: appStore.pageState.online || 1,
  size: 10,
  total: 0,
})

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

const fetchOnlineUsers = async () => {
  loading.value = true
  try {
    const { data } = await axios.get<OnlineUserListResponse>('/api/admin/users/online', {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: keywords.value,
      },
    })
    onlineUsers.value = data.data.records
    pagination.total = data.data.count
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  appStore.updateOnlinePageState(pagination.current)
  fetchOnlineUsers()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchOnlineUsers()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateOnlinePageState(current)
  fetchOnlineUsers()
}

const removeOnlineUser = async (user: OnlineUser) => {
  const { data } = await axios.delete<CommonResponse>(`/api/admin/users/${user.userInfoId}/online`)
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '下线成功',
    })
    if (user.userInfoId === appStore.userInfo?.id) {
      sessionStorage.removeItem('token')
      router.push({ path: '/login' })
    }
    await fetchOnlineUsers()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '下线失败',
    })
  }
}

onMounted(() => {
  fetchOnlineUsers()
})
</script>

<style scoped>
.online-card {
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
  margin-bottom: 1.5rem;
}

.search-container {
  margin-left: auto;
  display: flex;
  align-items: center;
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
