<template>
  <el-card class="resource-card">
    <div class="page-title">{{ pageTitle }}</div>

    <div class="operation-container">
      <el-button type="primary" size="small" @click="openModuleEditor(null)">
        <el-icon><Plus /></el-icon>
        新增模块
      </el-button>
      <div class="search-container">
        <el-input
          v-model="keywords"
          clearable
          size="small"
          placeholder="请输入资源名"
          style="width: 200px"
          @keyup.enter="fetchResources"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="fetchResources">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <el-empty v-if="!resources.length && !loading" description="暂无资源" />

    <el-table
      v-else
      v-loading="loading"
      :data="resources"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="resourceName" label="资源名" width="220" />
      <el-table-column prop="url" label="资源路径" width="300" />
      <el-table-column label="请求方式" align="center" width="150">
        <template #default="{ row }">
          <el-tag v-if="getRequestMethod(row)" :type="tagType(getRequestMethod(row))">
            {{ getRequestMethod(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isAnonymous" label="匿名访问" align="center" width="120">
        <template #default="{ row }">
          <el-switch
            v-if="row.url"
            v-model="row.isAnonymous"
            :active-value="1"
            :inactive-value="0"
            @change="handleToggleAnonymous(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center" width="160">
        <template #default="{ row }">
          <el-icon style="margin-right: 6px"><Clock /></el-icon>
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200">
        <template #default="{ row }">
          <el-button
            v-if="row.children"
            type="primary"
            text
            size="small"
            @click="openAddResource(row)"
          >
            新增
          </el-button>
          <el-button type="primary" text size="small" @click="openEditResource(row)"
            >修改</el-button
          >
          <el-popconfirm title="确定删除吗？" @confirm="deleteResource(row.id)">
            <template #reference>
              <el-button size="small" type="danger" text style="margin-left: 0.5rem"
                >删除</el-button
              >
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="showModuleDialog" width="30%">
    <template #title>
      <div class="dialog-title">{{ moduleDialogTitle }}</div>
    </template>
    <el-form label-width="80px" size="default" :model="resourceForm">
      <el-form-item label="模块名">
        <el-input v-model="resourceForm.resourceName" style="width: 220px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showModuleDialog = false">取消</el-button>
      <el-button type="primary" @click="submitResource">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showResourceDialog" width="30%">
    <template #title>
      <div class="dialog-title">{{ resourceDialogTitle }}</div>
    </template>
    <el-form label-width="80px" size="default" :model="resourceForm">
      <el-form-item label="资源名">
        <el-input v-model="resourceForm.resourceName" style="width: 220px" />
      </el-form-item>
      <el-form-item label="资源路径">
        <el-input v-model="resourceForm.url" style="width: 220px" />
      </el-form-item>
      <el-form-item label="请求方式">
        <el-radio-group v-model="resourceForm.requestMethod">
          <el-radio v-for="item in requestMethods" :key="item" :value="item">{{ item }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showResourceDialog = false">取消</el-button>
      <el-button type="primary" @click="submitResource">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import { Clock, Plus, Search } from '@element-plus/icons-vue'

defineOptions({
  name: 'ResourceView',
})

interface ResourceItem {
  id: number
  resourceName: string
  url?: string | null
  requestMethod?: string | null
  requetMethod?: string | null
  isAnonymous?: 0 | 1
  parentId?: number | null
  createTime?: string
  children?: ResourceItem[]
}

interface ResourceListResponse {
  flag: boolean
  message?: string
  data: ResourceItem[]
}

interface CommonResponse {
  flag: boolean
  message?: string
}

interface ResourceForm {
  id: number | null
  resourceName: string
  url: string
  requestMethod: string
  parentId: number | null
  isAnonymous: 0 | 1
}

const route = useRoute()

const pageTitle = computed(() => (route.name ? String(route.name) : '资源管理'))

const loading = ref(true)
const keywords = ref('')
const resources = ref<ResourceItem[]>([])
const showModuleDialog = ref(false)
const showResourceDialog = ref(false)
const moduleDialogTitle = ref('添加模块')
const resourceDialogTitle = ref('添加资源')

const requestMethods = ['GET', 'POST', 'PUT', 'DELETE']

const resourceForm = reactive<ResourceForm>({
  id: null,
  resourceName: '',
  url: '',
  requestMethod: 'GET',
  parentId: null,
  isAnonymous: 0,
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const getRequestMethod = (resource?: ResourceItem | null) =>
  resource?.requestMethod || resource?.requetMethod || ''

const tagType = (type: string) => {
  switch (type) {
    case 'GET':
      return ''
    case 'POST':
      return 'success'
    case 'PUT':
      return 'warning'
    case 'DELETE':
      return 'danger'
    default:
      return ''
  }
}

const fetchResources = async () => {
  loading.value = true
  try {
    const { data } = await axios.get<ResourceListResponse>('/api/admin/resources', {
      params: {
        keywords: keywords.value,
      },
    })
    resources.value = data.data ?? []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  resourceForm.id = null
  resourceForm.resourceName = ''
  resourceForm.url = ''
  resourceForm.requestMethod = 'GET'
  resourceForm.parentId = null
  resourceForm.isAnonymous = 0
}

const fillForm = (resource: ResourceItem) => {
  resourceForm.id = resource.id
  resourceForm.resourceName = resource.resourceName ?? ''
  resourceForm.url = resource.url ?? ''
  resourceForm.requestMethod = getRequestMethod(resource) || 'GET'
  resourceForm.parentId = resource.parentId ?? null
  resourceForm.isAnonymous = resource.isAnonymous ?? 0
}

const openModuleEditor = (resource: ResourceItem | null) => {
  if (resource) {
    moduleDialogTitle.value = '修改模块'
    fillForm(resource)
  } else {
    moduleDialogTitle.value = '添加模块'
    resetForm()
  }
  showModuleDialog.value = true
}

const openAddResource = (resource: ResourceItem) => {
  resetForm()
  resourceForm.parentId = resource.id
  resourceDialogTitle.value = '添加资源'
  showResourceDialog.value = true
}

const openEditResource = (resource: ResourceItem) => {
  if (!resource.url) {
    openModuleEditor(resource)
    return
  }
  resourceDialogTitle.value = '修改资源'
  fillForm(resource)
  showResourceDialog.value = true
}

const submitResource = async () => {
  if (!resourceForm.resourceName.trim()) {
    ElMessage.error('资源名不能为空')
    return
  }
  if (showResourceDialog.value && !resourceForm.url.trim()) {
    ElMessage.error('资源路径不能为空')
    return
  }
  const payload = showModuleDialog.value
    ? {
        id: resourceForm.id,
        resourceName: resourceForm.resourceName,
        parentId: resourceForm.parentId,
      }
    : {
        id: resourceForm.id,
        resourceName: resourceForm.resourceName,
        url: resourceForm.url,
        requestMethod: resourceForm.requestMethod,
        parentId: resourceForm.parentId,
        isAnonymous: resourceForm.isAnonymous,
      }
  const { data } = await axios.post<CommonResponse>('/api/admin/resources', payload)
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '操作成功',
    })
    await fetchResources()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '操作失败',
    })
  }
  showModuleDialog.value = false
  showResourceDialog.value = false
}

const handleToggleAnonymous = async (resource: ResourceItem, value: number) => {
  const previous = value === 1 ? 0 : 1
  try {
    const { data } = await axios.post<CommonResponse>('/api/admin/resources', resource)
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: data.message || '修改成功',
      })
      await fetchResources()
    } else {
      resource.isAnonymous = previous
      ElNotification.error({
        title: '失败',
        message: data.message || '修改失败',
      })
    }
  } catch {
    resource.isAnonymous = previous
    ElNotification.error({
      title: '失败',
      message: '修改失败',
    })
  }
}

const deleteResource = async (id: number) => {
  const { data } = await axios.delete<CommonResponse>(`/api/admin/resources/${id}`)
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '删除成功',
    })
    await fetchResources()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '删除失败',
    })
  }
}

onMounted(() => {
  fetchResources()
})
</script>

<style scoped>
.resource-card {
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

.search-container {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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
