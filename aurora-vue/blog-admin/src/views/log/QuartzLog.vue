<template>
  <el-card class="quartz-log-card">
    <div class="page-title">{{ pageTitle }}</div>

    <el-form :inline="true" label-width="68px" class="search-form">
      <el-row>
        <el-form-item label="任务名称">
          <el-input
            v-model="searchParams.jobName"
            style="width: 200px"
            size="small"
            placeholder="请输入任务名称"
            @keyup.enter="searchLogs"
          />
        </el-form-item>
        <el-form-item label="任务组名">
          <el-select
            v-model="searchParams.jobGroup"
            size="small"
            clearable
            style="margin-left: 5px"
            placeholder="请选择组名"
            @change="fetchLogs"
          >
            <el-option v-for="group in jobGroups" :key="group" :label="group" :value="group" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select
            v-model="searchParams.status"
            size="small"
            clearable
            style="margin-left: 5px"
            placeholder="请选择任务状态"
            @change="fetchLogs"
          >
            <el-option :value="1" label="成功" />
            <el-option :value="0" label="失败" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间">
          <el-date-picker
            v-model="dateRange"
            size="small"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="searchLogs">
            <el-icon><Search /></el-icon>
            查找
          </el-button>
          <el-button size="small" @click="clearSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-row>
    </el-form>

    <div class="operation-container">
      <el-button
        type="danger"
        size="small"
        :disabled="!selectedIds.length"
        @click="deleteLogs(null)"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
      <el-button type="danger" size="small" @click="cleanLogs">
        <el-icon><Delete /></el-icon>
        清空
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="jobLogs"
      :default-sort="{ prop: 'createTime', order: 'descending' }"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="日志编号" width="80" align="center">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column
        prop="jobName"
        label="任务名称"
        align="center"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="jobGroup"
        label="任务组名"
        align="center"
        :show-overflow-tooltip="true"
      >
        <template #default="{ row }">
          <el-tag>{{ row.jobGroup }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="invokeTarget"
        label="调用目标字符串"
        align="center"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="jobMessage"
        label="日志信息"
        align="center"
        :show-overflow-tooltip="true"
      />
      <el-table-column prop="status" label="执行状态" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">成功</el-tag>
          <el-tag v-else-if="row.status === 0" type="danger">失败</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="执行时间" align="center" width="180">
        <template #default="{ row }">
          <el-icon style="margin-right: 6px"><Clock /></el-icon>
          {{ formatDate(row.startTime || row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120">
        <template #default="{ row }">
          <el-button size="small" type="primary" text @click="openDetail(row)">
            <el-icon><View /></el-icon>
            详细
          </el-button>
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

  <el-dialog v-model="showDetailDialog" title="调度日志详细" :width="detailWidth" destroy-on-close>
    <el-form :model="detailLog" label-width="100px" size="default" class="detail-form">
      <el-row>
        <el-col :span="12">
          <el-form-item label="日志序号：">{{ detailLog?.id ?? '-' }}</el-form-item>
          <el-form-item label="任务名称：">{{ detailLog?.jobName ?? '-' }}</el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任务分组：">{{ detailLog?.jobGroup ?? '-' }}</el-form-item>
          <el-form-item label="执行时间：">
            {{ formatDate(detailLog?.startTime || detailLog?.createTime) || '-' }}
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="调用方法：">{{ detailLog?.invokeTarget ?? '-' }}</el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="日志信息：">{{ detailLog?.jobMessage ?? '-' }}</el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="执行状态：">
            <span v-if="detailLog?.status === 1">成功</span>
            <span v-else-if="detailLog?.status === 0">失败</span>
            <span v-else>-</span>
          </el-form-item>
        </el-col>
        <el-col v-if="detailLog?.status === 0" :span="24">
          <pre class="detail-pre"><code>{{ detailLog?.exceptionInfo || '-' }}</code></pre>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="showDetailDialog = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, request, type PageData } from '@/api'
import { ElNotification } from 'element-plus'
import { Clock, Delete, Refresh, Search, View } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'QuartzLogView',
})

interface JobLog {
  id: number
  jobName: string
  jobGroup: string
  invokeTarget: string
  jobMessage: string
  status: number
  startTime?: string
  createTime?: string
  exceptionInfo?: string
}

type JobLogListData = PageData<JobLog>

const route = useRoute()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '调度日志'))

const loading = ref(true)
const jobGroups = ref<string[]>([])
const jobLogs = ref<JobLog[]>([])
const selectedIds = ref<number[]>([])
const showDetailDialog = ref(false)
const detailLog = ref<JobLog | null>(null)
const dateRange = ref<[Date, Date] | []>([])

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
})

const searchParams = reactive<{
  jobName?: string
  jobGroup?: string
  status?: number | null
}>({
  jobName: '',
  jobGroup: '',
  status: null,
})

const jobId = ref(0)

const detailWidth = computed(() => (detailLog.value?.status === 1 ? '700px' : '80%'))

const formatDate = (dateStr?: string) => {
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

const syncJobId = () => {
  const param = route.params.quartzId as string | undefined
  if (!param || param === 'all') {
    jobId.value = 0
    return
  }
  const parsed = Number(param)
  jobId.value = Number.isNaN(parsed) ? 0 : parsed
}

const syncPageState = () => {
  const state = appStore.pageState.quartzLog
  if (state.jobId === jobId.value && state.current > 0) {
    pagination.current = state.current
    return
  }
  pagination.current = 1
  appStore.updateQuartzLogPageState({ jobId: jobId.value, current: pagination.current })
}

const buildQuery = () => {
  const [startTime, endTime] = dateRange.value as [Date, Date]
  return {
    jobId: jobId.value === 0 ? null : jobId.value,
    jobName: searchParams.jobName || undefined,
    jobGroup: searchParams.jobGroup || undefined,
    status: searchParams.status ?? undefined,
    current: pagination.current,
    size: pagination.size,
    startTime,
    endTime,
  }
}

const fetchJobGroups = async () => {
  const result = await request.get<string[]>(api.admin.jobLog.groups)
  if (!result.ok) {
    return
  }
  jobGroups.value = Array.isArray(result.data) ? result.data : []
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const result = await request.get<JobLogListData>(api.admin.jobLog.list, {
      params: buildQuery(),
    })
    if (!result.ok) {
      return
    }
    jobLogs.value = result.data.records ?? []
    pagination.total = result.data.count ?? 0
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const searchLogs = () => {
  pagination.current = 1
  appStore.updateQuartzLogPageState({ jobId: jobId.value, current: pagination.current })
  fetchLogs()
}

const clearSearch = () => {
  searchParams.jobName = ''
  searchParams.jobGroup = ''
  searchParams.status = null
  dateRange.value = []
  pagination.current = 1
  appStore.updateQuartzLogPageState({ jobId: jobId.value, current: pagination.current })
  fetchLogs()
}

const handleSelectionChange = (rows: JobLog[]) => {
  selectedIds.value = rows.map((item) => item.id)
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchLogs()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateQuartzLogPageState({ jobId: jobId.value, current })
  fetchLogs()
}

const deleteLogs = async (id: number | null) => {
  const payload = id ? [id] : selectedIds.value
  if (!payload.length) {
    return
  }
  const result = await request.delete<null>(
    api.admin.jobLog.list,
    {
      data: payload,
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
  fetchLogs()
}

const cleanLogs = async () => {
  const result = await request.delete<null>(api.admin.jobLog.clean, undefined, { silent: true })
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '清空失败',
    })
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '清空成功',
  })
  fetchLogs()
}

const openDetail = (log: JobLog) => {
  detailLog.value = log
  showDetailDialog.value = true
}

const boot = () => {
  syncJobId()
  syncPageState()
  fetchLogs()
  fetchJobGroups()
}

watch(
  () => route.params.quartzId,
  () => {
    boot()
  },
)

onMounted(() => {
  boot()
})
</script>

<style scoped>
.quartz-log-card {
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

.search-form {
  margin-bottom: 1rem;
}

.operation-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.detail-form {
  max-height: 70vh;
  overflow: auto;
}

.detail-pre {
  margin: 0;
  padding: 0.75rem;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
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
