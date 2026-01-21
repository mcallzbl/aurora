<template>
  <div class="role-page">
    <el-card class="role-card">
      <div class="page-title">{{ pageTitle }}</div>

      <div class="operation-container">
        <el-button type="primary" size="small" @click="openRoleDialog(null)">
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
            placeholder="请输入角色名"
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

      <el-empty v-if="!roles.length && !loading" description="暂无角色" />

      <el-table
        v-else
        border
        :data="roles"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="roleName" label="角色名" align="center" />
        <el-table-column prop="roleLabel" label="权限标签" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.roleLabel || row.roleName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            <el-icon style="margin-right: 6px"><Clock /></el-icon>
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="openRoleDialog(row)">
              菜单权限
            </el-button>
            <el-button type="primary" text size="small" @click="openResourceDialog(row)">
              资源权限
            </el-button>
            <el-popconfirm title="确定删除吗？" @confirm="deleteRoles(row.id)">
              <template #reference>
                <el-button size="small" type="danger" text style="margin-left: 0.5rem">
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

    <el-dialog v-model="showRoleDialog" width="30%">
      <template #title>
        <div class="dialog-title">{{ roleDialogTitle }}</div>
      </template>
      <el-form label-width="80px" size="default" :model="roleForm">
        <el-form-item label="角色名">
          <el-input v-model="roleForm.roleName" style="width: 250px" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tree
            ref="menuTreeRef"
            :data="menus"
            :default-checked-keys="roleForm.menuIds"
            show-checkbox
            node-key="id"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveOrUpdateRoleMenu">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResourceDialog" width="30%" top="9vh">
      <template #title>
        <div class="dialog-title">修改资源权限</div>
      </template>
      <el-form label-width="80px" size="default" :model="roleForm">
        <el-form-item label="角色名">
          <el-input v-model="roleForm.roleName" style="width: 250px" />
        </el-form-item>
        <el-form-item label="资源权限">
          <el-tree
            ref="resourceTreeRef"
            :data="resources"
            :default-checked-keys="roleForm.resourceIds"
            show-checkbox
            node-key="id"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResourceDialog = false">取消</el-button>
        <el-button type="primary" @click="saveOrUpdateRoleResource">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDeleteDialog" title="提示" width="30%">
      <div style="font-size: 1rem">是否删除选中项？</div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="primary" @click="deleteRoles(null)">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import { Clock, Delete, Plus, Search } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'RoleView',
})

interface RoleItem {
  id: number
  roleName: string
  roleLabel: string
  createTime?: string
  menuIds?: number[]
  resourceIds?: number[]
}

interface TreeItem {
  id: number
  label?: string
  name?: string
  children?: TreeItem[]
}

interface RoleListResponse {
  flag: boolean
  message?: string
  data: {
    records: RoleItem[]
    count: number
  }
}

interface CommonResponse {
  flag: boolean
  message?: string
}

const route = useRoute()
const appStore = useAppStore()

const pageTitle = computed(() => (route.name ? String(route.name) : '角色管理'))

const loading = ref(true)
const roles = ref<RoleItem[]>([])
const selectedIds = ref<number[]>([])
const keywords = ref<string | null>(null)

const showDeleteDialog = ref(false)
const showRoleDialog = ref(false)
const showResourceDialog = ref(false)
const roleDialogTitle = ref('新增角色')

const menus = ref<TreeItem[]>([])
const resources = ref<TreeItem[]>([])

const menuTreeRef = ref()
const resourceTreeRef = ref()

const pagination = reactive({
  current: appStore.pageState.role || 1,
  size: 10,
  total: 0,
})

const roleForm = reactive<RoleItem>({
  id: 0,
  roleName: '',
  roleLabel: '',
  menuIds: [],
  resourceIds: [],
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const { data } = await axios.get<RoleListResponse>('/api/admin/roles', {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: keywords.value,
      },
    })
    roles.value = data.data.records
    pagination.total = data.data.count
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const fetchRoleTrees = async () => {
  const [resourceRes, menuRes] = await Promise.all([
    axios.get<{ data: TreeItem[] }>('/api/admin/role/resources'),
    axios.get<{ data: TreeItem[] }>('/api/admin/role/menus'),
  ])
  resources.value = resourceRes.data.data
  menus.value = menuRes.data.data
}

const handleSelectionChange = (rows: RoleItem[]) => {
  selectedIds.value = rows.map((item) => item.id)
}

const handleSearch = () => {
  pagination.current = 1
  appStore.updateRolePageState(pagination.current)
  fetchRoles()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchRoles()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  appStore.updateRolePageState(current)
  fetchRoles()
}

const resetRoleForm = () => {
  roleForm.id = 0
  roleForm.roleName = ''
  roleForm.roleLabel = ''
  roleForm.menuIds = []
  roleForm.resourceIds = []
}

const fillRoleForm = (role: RoleItem) => {
  roleForm.id = role.id
  roleForm.roleName = role.roleName ?? ''
  roleForm.roleLabel = role.roleLabel ?? ''
  roleForm.menuIds = role.menuIds ? [...role.menuIds] : []
  roleForm.resourceIds = role.resourceIds ? [...role.resourceIds] : []
}

const openRoleDialog = async (role: RoleItem | null) => {
  roleDialogTitle.value = role ? '修改角色' : '新增角色'
  if (role) {
    fillRoleForm(role)
  } else {
    resetRoleForm()
  }
  showRoleDialog.value = true
  await nextTick()
  menuTreeRef.value?.setCheckedKeys(roleForm.menuIds || [])
}

const openResourceDialog = async (role: RoleItem) => {
  fillRoleForm(role)
  showResourceDialog.value = true
  await nextTick()
  resourceTreeRef.value?.setCheckedKeys(roleForm.resourceIds || [])
}

const deleteRoles = async (id: number | null) => {
  const ids = id ? [id] : selectedIds.value
  if (!ids.length) {
    showDeleteDialog.value = false
    return
  }
  const { data } = await axios.delete<CommonResponse>('/api/admin/roles', {
    data: ids,
  })
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '删除成功',
    })
    await fetchRoles()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '删除失败',
    })
  }
  showDeleteDialog.value = false
}

const saveOrUpdateRoleMenu = async () => {
  if (!roleForm.roleName.trim()) {
    ElMessage.error('角色名不能为空')
    return
  }
  roleForm.resourceIds = null
  const checkedKeys = menuTreeRef.value?.getCheckedKeys?.() || []
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys?.() || []
  roleForm.menuIds = [...checkedKeys, ...halfCheckedKeys]
  const { data } = await axios.post<CommonResponse>('/api/admin/role', roleForm)
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '操作成功',
    })
    await fetchRoles()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '操作失败',
    })
  }
  showRoleDialog.value = false
}

const saveOrUpdateRoleResource = async () => {
  roleForm.menuIds = null
  roleForm.resourceIds = resourceTreeRef.value?.getCheckedKeys?.() || []
  const { data } = await axios.post<CommonResponse>('/api/admin/role', roleForm)
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: data.message || '操作成功',
    })
    await fetchRoles()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '操作失败',
    })
  }
  showResourceDialog.value = false
}

onMounted(() => {
  fetchRoles()
  fetchRoleTrees()
})
</script>

<style scoped>
.role-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.role-card {
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

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.dialog-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink-900);
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
