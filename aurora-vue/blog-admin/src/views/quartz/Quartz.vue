<template>
  <div class="quartz-page">
    <el-card class="quartz-card">
      <div class="page-title">{{ pageTitle }}</div>

      <el-form class="query-form" :inline="true" label-width="68px">
        <el-form-item label="任务名称">
          <el-input
            v-model="searchParams.jobName"
            placeholder="请输入任务名称"
            clearable
            size="small"
            @keyup.enter="listJobs"
          />
        </el-form-item>
        <el-form-item label="任务组名">
          <el-select
            v-model="searchParams.jobGroup"
            placeholder="请选择任务组名"
            clearable
            size="small"
            @change="listJobs"
          >
            <el-option
              v-for="jobGroup in jobGroups"
              :key="jobGroup"
              :label="jobGroup"
              :value="jobGroup"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select
            v-model="searchParams.status"
            placeholder="请选择任务状态"
            clearable
            size="small"
            @change="listJobs"
          >
            <el-option label="正常" :value="1" />
            <el-option label="暂停" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="listJobs">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button size="small" @click="reset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <div class="action-row">
        <el-button type="primary" size="small" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button type="info" size="small" @click="openLog">
          <el-icon><Operation /></el-icon>
          日志
        </el-button>
        <el-button
          type="danger"
          size="small"
          :disabled="jobIds.length === 0"
          @click="showDeleteDialog = true"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>

      <el-table border :data="jobs" v-loading="loading" @selection-change="selectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column
          label="任务名称"
          width="160"
          align="center"
          prop="jobName"
          :show-overflow-tooltip="true"
        />
        <el-table-column label="任务组名" align="center" prop="jobGroup">
          <template #default="{ row }">
            <el-tag>{{ row.jobGroup }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="调用目标字符串"
          align="center"
          prop="invokeTarget"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          label="cron执行表达式"
          align="center"
          prop="cronExpression"
          :show-overflow-tooltip="true"
        />
        <el-table-column label="状态" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-color="#13ce66"
              inactive-color="#f4f4f5"
              @change="changeStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" width="160">
          <template #default="{ row }">
            {{ row.remark }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="{ row }">
            <el-button size="small" type="text" @click="handleChange(row.id)">编辑</el-button>
            <el-popconfirm title="确定删除吗？" @confirm="deleteJobs(row.id)">
              <template #reference>
                <el-button size="small" type="text" style="margin-left: 10px">删除</el-button>
              </template>
            </el-popconfirm>
            <el-dropdown size="small" @command="handleDropdownCommand">
              <el-button size="small" type="text" style="margin-left: 9px">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'handleRun', row }">
                    <el-icon><CaretRight /></el-icon>
                    执行一次
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'handleView', row }">
                    <el-icon><View /></el-icon>
                    任务详细
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'handleJobLog', row }">
                    <el-icon><Operation /></el-icon>
                    调度日志
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
        <el-button type="primary" @click="deleteJobs(null)">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogFormVisible" :title="dialogTitle" width="800px" append-to-body>
      <el-form ref="dataForm" :model="job" :rules="rules" label-width="120px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="任务名称" prop="jobName">
              <el-input v-model="job.jobName" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务分组" prop="jobGroup">
              <el-input v-model="job.jobGroup" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="invokeTarget">
              <template #label>
                调用方法
                <el-tooltip placement="top">
                  <template #content>
                    Bean调用示例：auroraQuartz.blogParams('blog')
                    <br />Class类调用示例：com.aurora.quartz.AuroraQuartz.blogParams('blog')
                    <br />参数说明：支持字符串，布尔类型，长整型，浮点型，整型
                  </template>
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="job.invokeTarget" placeholder="请输入调用目标字符串" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="cron表达式" prop="cronExpression">
              <el-input v-model="job.cronExpression" placeholder="请输入cron执行表达式">
                <template #append>
                  <el-button type="primary" @click="handleShowCron">
                    生成表达式
                    <el-icon class="el-icon--right"><Clock /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="错误策略" prop="misfirePolicy">
              <el-radio-group v-model="job.misfirePolicy">
                <el-radio-button :value="0">默认策略</el-radio-button>
                <el-radio-button :value="1">立即执行</el-radio-button>
                <el-radio-button :value="2">执行一次</el-radio-button>
                <el-radio-button :value="3">放弃执行</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否并发" prop="concurrent">
              <el-radio-group v-model="job.concurrent" size="small">
                <el-radio-button :value="0">允许</el-radio-button>
                <el-radio-button :value="1">禁止</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="job.status">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="0">暂停</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="job.remark" placeholder="备注信息" type="textarea" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditOrUpdate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="openCron" title="Cron表达式生成器" append-to-body destroy-on-close>
      <Crontab @hide="openCron = false" @fill="crontabFill" :expression="expression" />
    </el-dialog>

    <el-dialog
      v-model="openView"
      title="任务详细"
      width="700px"
      append-to-body
      @closed="afterClosed"
    >
      <el-form :model="job" label-width="120px" size="small">
        <el-row>
          <el-col :span="12">
            <el-form-item label="任务编号：">{{ job.id }}</el-form-item>
            <el-form-item label="任务名称：">{{ job.jobName }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务分组：">{{ job.jobGroup }}</el-form-item>
            <el-form-item label="创建时间：">{{ formatDateTime(job.createTime) }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="cron表达式：">{{ job.cronExpression }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下次执行时间：">{{
              formatDateTime(job.nextValidTime)
            }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="调用目标方法：">{{ job.invokeTarget }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务状态：">
              <div v-if="job.status === 1">正常</div>
              <div v-else-if="job.status === 0">暂停</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否并发：">
              <div v-if="job.concurrent === 1">允许</div>
              <div v-else-if="job.concurrent === 0">禁止</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行策略：">
              <div v-if="job.concurrent === 0">默认策略</div>
              <div v-else-if="job.concurrent === 1">立即执行</div>
              <div v-else-if="job.concurrent === 2">执行一次</div>
              <div v-else-if="job.concurrent === 3">放弃执行</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="备注：">
              <div>{{ job.remark }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="openView = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, request, type PageData } from '@/api'
import { ElNotification } from 'element-plus'
import {
  CaretRight,
  Clock,
  Delete,
  Operation,
  Plus,
  QuestionFilled,
  Refresh,
  Search,
  View,
} from '@element-plus/icons-vue'
import AppPagination from '@/components/AppPagination.vue'
import Crontab from '@/components/Crontab.vue'
import { useAppStore } from '@/stores/app'

defineOptions({
  name: 'QuartzView',
})

interface JobItem {
  id?: number
  jobName?: string
  jobGroup?: string
  invokeTarget?: string
  cronExpression?: string
  status?: number
  misfirePolicy?: number
  concurrent?: number
  remark?: string
  createTime?: string
  nextValidTime?: string
}

type JobListData = PageData<JobItem>

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '定时任务'))

const loading = ref(true)
const showDeleteDialog = ref(false)
const dialogFormVisible = ref(false)
const openCron = ref(false)
const openView = ref(false)
const expression = ref('')
const editOrUpdate = ref(true)

const pagination = reactive({
  current: appStore.pageState.quartz || 1,
  size: 10,
  total: 0,
})

const searchParams = reactive<{ jobName?: string; jobGroup?: string; status?: number | null }>({
  jobName: '',
  jobGroup: '',
  status: null,
})

const jobGroups = ref<string[]>([])
const jobs = ref<JobItem[]>([])
const jobIds = ref<number[]>([])

const job = reactive<JobItem>({
  jobName: '',
  jobGroup: '',
  invokeTarget: '',
  cronExpression: '',
  status: 1,
  misfirePolicy: 0,
  concurrent: 0,
  remark: '',
})

const dialogTitle = computed(() => (editOrUpdate.value ? '编辑任务' : '新增任务'))

const rules = {
  jobName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  invokeTarget: [{ required: true, message: '调用目标字符串不能为空', trigger: 'blur' }],
  cronExpression: [{ required: true, message: 'cron执行表达式不能为空', trigger: 'blur' }],
}

const formatDateTime = (dateStr?: string) => {
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

const handleSizeChange = (size: number) => {
  pagination.size = size
  listJobs()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateQuartzPageState(current)
  listJobs()
}

const listJobGroups = async () => {
  const result = await request.get<string[]>(api.admin.job.groups)
  if (!result.ok) {
    return
  }
  jobGroups.value = result.data || []
}

const buildQueryParams = () => {
  const params: Record<string, string | number> = {
    current: pagination.current,
    size: pagination.size,
  }
  if (searchParams.jobName) {
    params.jobName = searchParams.jobName
  }
  if (searchParams.jobGroup) {
    params.jobGroup = searchParams.jobGroup
  }
  if (searchParams.status !== null && searchParams.status !== undefined) {
    params.status = searchParams.status
  }
  return params
}

const listJobs = async () => {
  loading.value = true
  try {
    const result = await request.get<JobListData>(api.admin.job.list, {
      params: buildQueryParams(),
    })
    if (!result.ok) {
      return
    }
    jobs.value = result.data.records
    pagination.total = result.data.count
  } finally {
    loading.value = false
  }
}

const reset = () => {
  searchParams.jobName = ''
  searchParams.jobGroup = ''
  searchParams.status = null
  pagination.current = 1
  listJobs()
}

const selectionChange = (items: JobItem[]) => {
  jobIds.value = items.map((item) => item.id).filter(Boolean) as number[]
}

const changeStatus = async (item: JobItem) => {
  const result = await request.put<null>(api.admin.job.status, {
    id: item.id,
    status: item.status,
  })
  if (!result.ok) {
    return
  }
  ElNotification.success({
    title: '成功',
    message: '修改成功',
  })
  listJobs()
}

const deleteJobs = async (id: number | null) => {
  const payload = id ? [id] : jobIds.value
  const result = await request.delete<null>(api.admin.job.list, { data: payload })
  if (!result.ok) {
    return
  }
  ElNotification.success({
    title: '成功',
    message: '删除成功',
  })
  listJobs()
  showDeleteDialog.value = false
}

const handleShowCron = () => {
  expression.value = job.cronExpression || ''
  openCron.value = true
}

const handleAdd = () => {
  editOrUpdate.value = false
  Object.assign(job, {
    id: undefined,
    jobName: '',
    jobGroup: '',
    invokeTarget: '',
    cronExpression: '',
    status: 1,
    misfirePolicy: 0,
    concurrent: 0,
    remark: '',
  })
  dialogFormVisible.value = true
}

const handleChange = async (jobId?: number) => {
  if (!jobId) return
  editOrUpdate.value = true
  const result = await request.get<JobItem>(api.admin.job.detail(jobId))
  if (!result.ok) {
    return
  }
  Object.assign(job, result.data)
  dialogFormVisible.value = true
}

const crontabFill = (value: string) => {
  job.cronExpression = value
}

const handleEditOrUpdate = async () => {
  if (editOrUpdate.value) {
    const result = await request.put<null>(api.admin.job.list, job)
    if (!result.ok) {
      return
    }
    ElNotification.success({
      title: '修改成功',
      message: result.message || '修改成功',
    })
    listJobs()
  } else {
    const result = await request.post<null>(api.admin.job.list, job)
    if (!result.ok) {
      return
    }
    ElNotification.success({
      title: '添加成功',
      message: result.message || '添加成功',
    })
    listJobs()
  }
  dialogFormVisible.value = false
}

const handleDropdownCommand = (payload: { action: string; row: JobItem }) => {
  switch (payload.action) {
    case 'handleRun':
      handleRun(payload.row)
      break
    case 'handleView':
      handleView(payload.row)
      break
    case 'handleJobLog':
      handleJobLog(payload.row.id)
      break
    default:
      break
  }
}

const handleRun = async (item: JobItem) => {
  const result = await request.put<null>(api.admin.job.run, {
    id: item.id,
    jobGroup: item.jobGroup,
  })
  if (!result.ok) {
    return
  }
  ElNotification.success({
    title: '执行成功',
    message: result.message || '执行成功',
  })
}

const handleView = (item: JobItem) => {
  Object.assign(job, item)
  openView.value = true
}

const handleJobLog = (jobId?: number) => {
  if (!jobId) return
  router.push({ path: `/quartz/log/${jobId}` })
}

const openLog = () => {
  router.push({ path: '/quartz/log/all' })
}

const afterClosed = () => {
  Object.assign(job, {
    id: undefined,
    jobName: '',
    jobGroup: '',
    invokeTarget: '',
    cronExpression: '',
    status: 1,
    misfirePolicy: 0,
    concurrent: 0,
    remark: '',
  })
}

onMounted(() => {
  listJobGroups()
  listJobs()
})
</script>

<style scoped>
.quartz-card {
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

.query-form {
  margin-bottom: 1rem;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.help-icon {
  margin-left: 0.35rem;
  color: var(--ink-500);
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
