<template>
  <el-card class="menu-card">
    <div class="page-title">{{ pageTitle }}</div>

    <div class="operation-container">
      <el-button type="primary" size="small" @click="openEditor(null)">
        <el-icon><Plus /></el-icon>
        新增菜单
      </el-button>
      <div class="search-container">
        <el-input
          v-model="keywords"
          clearable
          size="small"
          placeholder="请输入菜单名"
          style="width: 200px"
          @keyup.enter="fetchMenus"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="small" style="margin-left: 1rem" @click="fetchMenus">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="menus"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="name" label="菜单名称" width="140" />
      <el-table-column prop="icon" label="图标" align="center" width="100">
        <template #default="{ row }">
          <i :class="['iconfont', row.icon]" />
        </template>
      </el-table-column>
      <el-table-column prop="orderNum" align="center" label="排序" width="100" />
      <el-table-column prop="path" label="访问路径" min-width="160" />
      <el-table-column prop="component" label="组件路径" min-width="180" />
      <el-table-column prop="isHidden" label="隐藏" align="center" width="80">
        <template #default="{ row }">
          <el-switch
            v-model="row.isHidden"
            :active-value="1"
            :inactive-value="0"
            @change="handleToggleHidden(row, $event)"
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
            @click="openEditor(row, 'child')"
          >
            新增
          </el-button>
          <el-button type="primary" text size="small" @click="openEditor(row, 'edit')"
            >修改</el-button
          >
          <el-popconfirm title="确定删除吗？" @confirm="deleteMenu(row.id)">
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

  <el-dialog v-model="showEditorDialog" width="30%" top="12vh">
    <template #title>
      <div class="dialog-title">{{ dialogTitle }}</div>
    </template>
    <el-form label-width="80px" size="default" :model="menuForm">
      <el-form-item label="菜单类型" v-if="showTypeToggle">
        <el-radio-group v-model="isCatalog">
          <el-radio :value="true">目录</el-radio>
          <el-radio :value="false">一级菜单</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="菜单名称">
        <el-input v-model="menuForm.name" style="width: 220px" />
      </el-form-item>
      <el-form-item label="菜单图标">
        <el-popover placement="bottom-start" width="300" trigger="click">
          <el-row>
            <el-col v-for="(item, index) in icons" :key="index" :md="12" :gutter="10">
              <div class="icon-item" @click="selectIcon(item)">
                <i :class="['iconfont', item]" />
                {{ item }}
              </div>
            </el-col>
          </el-row>
          <template #reference>
            <el-input v-model="menuForm.icon" style="width: 220px">
              <template #prefix>
                <i v-if="menuForm.icon" :class="['iconfont', menuForm.icon]" />
              </template>
            </el-input>
          </template>
        </el-popover>
      </el-form-item>
      <el-form-item label="组件路径" v-show="!isCatalog">
        <el-input v-model="menuForm.component" style="width: 220px" />
      </el-form-item>
      <el-form-item label="访问路径">
        <el-input v-model="menuForm.path" style="width: 220px" />
      </el-form-item>
      <el-form-item label="显示排序">
        <el-input-number v-model="menuForm.orderNum" controls-position="right" :min="1" :max="10" />
      </el-form-item>
      <el-form-item label="显示状态">
        <el-radio-group v-model="menuForm.isHidden">
          <el-radio :value="0">显示</el-radio>
          <el-radio :value="1">隐藏</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditorDialog = false">取消</el-button>
      <el-button type="primary" @click="submitMenu">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import { Clock, Plus, Search } from '@element-plus/icons-vue'

defineOptions({
  name: 'MenuView',
})

interface MenuItem {
  id: number
  name: string
  icon: string
  component: string
  path: string
  orderNum: number
  parentId: number | null
  isHidden: 0 | 1
  createTime?: string
  children?: MenuItem[]
}

interface MenuListResponse {
  flag: boolean
  message?: string
  data: MenuItem[]
}

interface CommonResponse {
  flag: boolean
  message?: string
}

const route = useRoute()

const pageTitle = computed(() => (route.name ? String(route.name) : '菜单管理'))

const keywords = ref('')
const loading = ref(true)
const showEditorDialog = ref(false)
const showTypeToggle = ref(true)
const isCatalog = ref(true)
const dialogTitle = ref('新增菜单')

const menus = ref<MenuItem[]>([])

const menuForm = reactive<MenuItem>({
  id: 0,
  name: '',
  icon: '',
  component: 'Layout',
  path: '',
  orderNum: 1,
  parentId: null,
  isHidden: 0,
})

const icons = [
  'el-icon-myshouye',
  'el-icon-myfabiaowenzhang',
  'el-icon-myyonghuliebiao',
  'el-icon-myxiaoxi',
  'el-icon-myliuyan',
  'el-icon-myshouye',
  'el-icon-myfabiaowenzhang',
  'el-icon-myyonghuliebiao',
  'el-icon-myxiaoxi',
  'el-icon-myliuyan',
]

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const fetchMenus = async () => {
  loading.value = true
  try {
    const { data } = await axios.get<MenuListResponse>('/api/admin/menus', {
      params: {
        keywords: keywords.value,
      },
    })
    menus.value = data.data ?? []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  menuForm.id = 0
  menuForm.name = ''
  menuForm.icon = ''
  menuForm.component = 'Layout'
  menuForm.path = ''
  menuForm.orderNum = 1
  menuForm.parentId = null
  menuForm.isHidden = 0
}

const fillForm = (menu: MenuItem) => {
  menuForm.id = menu.id
  menuForm.name = menu.name ?? ''
  menuForm.icon = menu.icon ?? ''
  menuForm.component = menu.component ?? ''
  menuForm.path = menu.path ?? ''
  menuForm.orderNum = menu.orderNum ?? 1
  menuForm.parentId = menu.parentId ?? null
  menuForm.isHidden = menu.isHidden ?? 0
}

const openEditor = (menu: MenuItem | null, mode?: 'child' | 'edit') => {
  if (menu) {
    showTypeToggle.value = false
    isCatalog.value = false
    if (mode === 'child') {
      dialogTitle.value = '新增菜单'
      resetForm()
      menuForm.parentId = menu.id
      menuForm.component = ''
    } else {
      dialogTitle.value = '修改菜单'
      fillForm(menu)
    }
  } else {
    dialogTitle.value = '新增菜单'
    showTypeToggle.value = true
    isCatalog.value = true
    resetForm()
  }
  showEditorDialog.value = true
}

const selectIcon = (icon: string) => {
  menuForm.icon = icon
}

const handleToggleHidden = async (menu: MenuItem, value: number) => {
  const previous = value === 1 ? 0 : 1
  try {
    const { data } = await axios.put<CommonResponse>('/api/admin/menus/isHidden', {
      id: menu.id,
      isHidden: value,
    })
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: '修改成功',
      })
    } else {
      menu.isHidden = previous
      ElNotification.error({
        title: '失败',
        message: data.message || '修改失败',
      })
    }
  } catch {
    menu.isHidden = previous
    ElNotification.error({
      title: '失败',
      message: '修改失败',
    })
  }
}

const submitMenu = async () => {
  if (!menuForm.name.trim()) {
    ElMessage.error('菜单名不能为空')
    return
  }
  if (!menuForm.icon.trim()) {
    ElMessage.error('菜单icon不能为空')
    return
  }
  if (!menuForm.component.trim()) {
    ElMessage.error('菜单组件路径不能为空')
    return
  }
  if (!menuForm.path.trim()) {
    ElMessage.error('菜单访问路径不能为空')
    return
  }
  const { data } = await axios.post<CommonResponse>('/api/admin/menus', menuForm)
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: '操作成功',
    })
    await fetchMenus()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '操作失败',
    })
  }
  showEditorDialog.value = false
}

const deleteMenu = async (id: number) => {
  const { data } = await axios.delete<CommonResponse>(`/api/admin/menus/${id}`)
  if (data.flag) {
    ElNotification.success({
      title: '成功',
      message: '删除成功',
    })
    await fetchMenus()
  } else {
    ElNotification.error({
      title: '失败',
      message: data.message || '删除失败',
    })
  }
}

watch(
  () => isCatalog.value,
  (value) => {
    if (value && !menuForm.component.trim()) {
      menuForm.component = 'Layout'
    }
  },
)

onMounted(() => {
  fetchMenus()
})
</script>

<style scoped>
.menu-card {
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

.icon-item {
  cursor: pointer;
  padding: 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
