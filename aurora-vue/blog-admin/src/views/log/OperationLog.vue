<template>
  <el-card class="operation-log-card">
    <div class="page-title">{{ pageTitle }}</div>

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
      <div class="search-container">
        <el-input
          v-model="keywords"
          clearable
          size="small"
          placeholder="请输入模块名或描述"
          style="width: 200px"
          @keyup.enter="searchLogs"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="searchLogs">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="logs" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="optModule" label="系统模块" align="center" width="120" />
      <el-table-column prop="optType" label="操作类型" align="center" width="100" />
      <el-table-column prop="optDesc" label="操作描述" align="center" width="150" />
      <el-table-column prop="requestMethod" label="请求方式" align="center" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.requestMethod" :type="tagType(row.requestMethod)">
            {{ row.requestMethod }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="操作人员" align="center" />
      <el-table-column prop="ipAddress" label="登录IP" align="center" width="130" />
      <el-table-column prop="ipSource" label="登录地址" align="center" width="150" />
      <el-table-column prop="createTime" label="操作日期" align="center" width="190">
        <template #default="{ row }">
          <el-icon style="margin-right: 6px"><Clock /></el-icon>
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150">
        <template #default="{ row }">
          <el-button size="small" type="primary" text @click="openDetail(row)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-popconfirm title="确定删除吗？" @confirm="deleteLog(row.id)">
            <template #reference>
              <el-button size="small" type="danger" text style="margin-left: 0.5rem">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
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

  <el-dialog v-model="showDetailDialog" title="详细信息" width="40%" destroy-on-close>
    <el-form :model="detailLog" label-width="100px" size="default" class="detail-form">
      <el-form-item label="操作模块：">{{ detailLog?.optModule || '-' }}</el-form-item>
      <el-form-item label="请求地址：">{{ detailLog?.optUri || '-' }}</el-form-item>
      <el-form-item label="请求方式：">
        <el-tag v-if="detailLog?.requestMethod" :type="tagType(detailLog.requestMethod)">
          {{ detailLog.requestMethod }}
        </el-tag>
        <span v-else>-</span>
      </el-form-item>
      <el-form-item label="操作方法：">{{ detailLog?.optMethod || '-' }}</el-form-item>
      <el-form-item label="请求参数：">{{ detailLog?.requestParam || '-' }}</el-form-item>
      <el-form-item label="返回数据：">{{ detailLog?.responseData || '-' }}</el-form-item>
      <el-form-item label="操作人员：">{{ detailLog?.nickname || '-' }}</el-form-item>
    </el-form>
  </el-dialog>

  <el-dialog v-model="showDeleteDialog" title="提示" width="30%">
    <div style="font-size: 1rem">是否删除选中项？</div>
    <template #footer>
      <el-button @click="showDeleteDialog = false">取消</el-button>
      <el-button type="primary" @click="deleteLog(null)">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, request, type PageData } from '@/api'
import { ElNotification } from 'element-plus'
import { Clock, Delete, Search, View } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'OperationLogView',
})

interface OperationLog {
  id: number
  optModule: string
  optType: string
  optDesc: string
  requestMethod: string
  optMethod: string
  optUri: string
  requestParam?: string
  responseData?: string
  nickname: string
  ipAddress: string
  ipSource: string
  createTime: string
}

type OperationLogListData = PageData<OperationLog>

const route = useRoute()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '操作日志'))

const loading = ref(true)
const logs = ref<OperationLog[]>([])
const selectedIds = ref<number[]>([])
const keywords = ref<string | null>(null)
const showDetailDialog = ref(false)
const showDeleteDialog = ref(false)
const detailLog = ref<OperationLog | null>(null)

const pagination = reactive({
  current: appStore.pageState.operationLog || 1,
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

const tagType = (type: string) => {
  switch (type) {
    case 'POST':
      return 'success'
    case 'PUT':
      return 'warning'
    case 'DELETE':
      return 'danger'
    default:
      return undefined
  }
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const result = await request.get<OperationLogListData>(api.admin.operationLog.list, {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: keywords.value,
      },
    })
    if (!result.ok) {
      return
    }
    logs.value = result.data.records ?? []
    pagination.total = result.data.count ?? 0
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: OperationLog[]) => {
  selectedIds.value = rows.map((item) => item.id)
}

const searchLogs = () => {
  pagination.current = 1
  appStore.updateOperationLogPageState(pagination.current)
  fetchLogs()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchLogs()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateOperationLogPageState(current)
  fetchLogs()
}

const deleteLog = async (id: number | null) => {
  const payload = id ? [id] : selectedIds.value
  if (!payload.length) {
    showDeleteDialog.value = false
    return
  }
  const result = await request.delete<null>(
    api.admin.operationLog.list,
    { data: payload },
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
  await fetchLogs()
  showDeleteDialog.value = false
}

const openDetail = (log: OperationLog) => {
  detailLog.value = log
  showDetailDialog.value = true
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.operation-log-card {
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
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.detail-form :deep(label) {
  font-weight: 600;
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
