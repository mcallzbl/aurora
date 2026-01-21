<template>
  <el-card class="user-container">
    <div class="page-title">{{ pageTitle }}</div>

    <div class="operation-container">
      <div class="search-container">
        <el-select
          v-model="loginType"
          clearable
          placeholder="请选择登录方式"
          size="small"
          style="margin-right: 1rem; width: 160px"
        >
          <el-option
            v-for="item in typeList"
            :key="item.type"
            :label="item.desc"
            :value="item.type"
          />
        </el-select>
        <el-input
          v-model="keywords"
          clearable
          size="small"
          placeholder="请输入昵称"
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="handleSearch">
          搜索
        </el-button>
      </div>
    </div>

    <el-table border :data="userList" v-loading="loading">
      <el-table-column prop="avatar" label="头像" align="center" width="100">
        <template #default="{ row }">
          <el-image :src="row.avatar" fit="cover" class="avatar-image" />
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" align="center" width="140" />
      <el-table-column prop="loginType" label="登录方式" align="center" width="90">
        <template #default="{ row }">
          <el-tag type="success" v-if="row.loginType === 1">邮箱</el-tag>
          <el-tag v-else-if="row.loginType === 2">QQ</el-tag>
          <el-tag type="danger" v-else-if="row.loginType === 3">微博</el-tag>
          <el-tag v-else>未知</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="roles" label="用户角色" align="center">
        <template #default="{ row }">
          <el-tag
            v-for="item in row.roles"
            :key="item.id"
            style="margin-right: 4px; margin-top: 4px"
          >
            {{ item.roleName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isDisable" label="禁用" align="center" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.isDisable"
            :active-value="1"
            :inactive-value="0"
            @change="handleToggleDisable(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="ipAddress" label="登录IP" align="center" width="140" />
      <el-table-column prop="ipSource" label="登录地址" align="center" width="140" />
      <el-table-column prop="createTime" label="创建时间" width="160" align="center">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginTime" label="上次登录时间" width="160" align="center">
        <template #default="{ row }">
          {{ formatDate(row.lastLoginTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
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

    <el-dialog v-model="isEdit" width="30%">
      <template #header>
        <div class="dialog-title">修改用户</div>
      </template>
      <el-form label-width="60px" size="default" :model="userForm">
        <el-form-item label="昵称">
          <el-input v-model="userForm.nickname" style="width: 220px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-checkbox-group v-model="roleIds">
            <el-checkbox v-for="item in userRoles" :key="item.id" :value="item.id">
              {{ item.roleName }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isEdit = false">取消</el-button>
        <el-button type="primary" @click="handleEditUserRole">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElNotification } from 'element-plus'
import axios from 'axios'
import { useAppStore } from '@/stores/app'
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  name: 'UserView',
})

interface Role {
  id: number
  roleName: string
}

interface User {
  userInfoId: number
  nickname: string
  avatar: string
  loginType: number
  roles: Role[]
  isDisable: 0 | 1
  ipAddress: string
  ipSource: string
  createTime: string
  lastLoginTime: string
}

type UserForm = User & {
  roleIds?: number[]
}

interface UserListResponse {
  flag: boolean
  message?: string
  data: {
    records: User[]
    count: number
  }
}

interface CommonResponse {
  flag: boolean
  message?: string
}

const appStore = useAppStore()
const route = useRoute()

const pageTitle = computed(() => (route.name ? String(route.name) : '用户管理'))

const loading = ref(true)
const isEdit = ref(false)
const userForm = reactive<UserForm>({
  userInfoId: 0,
  nickname: '',
  avatar: '',
  loginType: 1,
  roles: [],
  isDisable: 0,
  ipAddress: '',
  ipSource: '',
  createTime: '',
  lastLoginTime: '',
  roleIds: [],
})

const loginType = ref<number | null>(null)
const userRoles = ref<Role[]>([])
const roleIds = ref<number[]>([])
const userList = ref<User[]>([])
const keywords = ref<string | null>(null)

const typeList = [
  { type: 1, desc: '邮箱' },
  { type: 2, desc: 'QQ' },
]

const pagination = reactive({
  current: appStore.pageState.user,
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

const handleSearch = () => {
  pagination.current = 1
  fetchUsers()
}

const handleSizeChange = () => {
  fetchUsers()
}

const handleCurrentChange = () => {
  appStore.updateUserPageState(pagination.current)
  fetchUsers()
}

const handleToggleDisable = async (user: User) => {
  try {
    const { data } = await axios.put<CommonResponse>('/api/admin/users/disable', {
      id: user.userInfoId,
      isDisable: user.isDisable,
    })
    if (!data.flag) {
      throw new Error(data.message || '修改失败')
    }
    ElNotification.success({
      title: '成功',
      message: data.message || '修改成功',
    })
  } catch {
    user.isDisable = user.isDisable === 1 ? 0 : 1
    ElNotification.error({
      title: '失败',
      message: '修改失败',
    })
  }
}

const openEditDialog = (user: User) => {
  roleIds.value = user.roles.map((item) => item.id)
  Object.assign(userForm, JSON.parse(JSON.stringify(user)))
  isEdit.value = true
}

const handleEditUserRole = async () => {
  userForm.roleIds = roleIds.value
  try {
    const { data } = await axios.put<CommonResponse>('/api/admin/users/role', userForm)
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: data.message || '修改成功',
      })
      await fetchUsers()
    } else {
      ElNotification.error({
        title: '失败',
        message: data.message || '修改失败',
      })
    }
  } catch {
    ElNotification.error({
      title: '失败',
      message: '修改失败',
    })
  } finally {
    isEdit.value = false
  }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data } = await axios.get<UserListResponse>('/api/admin/users', {
      params: {
        current: pagination.current,
        size: pagination.size,
        keywords: keywords.value,
        loginType: loginType.value,
      },
    })
    userList.value = data.data.records
    pagination.total = data.data.count
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  const { data } = await axios.get<{ data: Role[] }>('/api/admin/users/role')
  userRoles.value = data.data
}

watch(
  () => loginType.value,
  () => {
    pagination.current = 1
    fetchUsers()
  },
)

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<style scoped>
.user-container {
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

:deep(.el-pagination) {
  --el-pagination-button-bg-color: var(--surface-1);
  --el-pagination-hover-color: var(--primary);
}
</style>
