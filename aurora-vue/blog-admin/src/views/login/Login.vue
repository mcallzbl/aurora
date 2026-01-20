<template>
  <div class="login-container">
    <section class="login-card">
      <aside class="login-aside">
        <span class="aside-badge">Aurora Admin</span>
        <h2 class="aside-title">内容管理后台</h2>
        <p class="aside-text">统一管理内容、标签、用户与统计数据。</p>
        <div class="aside-stats">
          <div>
            <span class="stat-label">安全性</span>
            <span class="stat-value">多重校验</span>
          </div>
          <div>
            <span class="stat-label">效率</span>
            <span class="stat-value">一站式配置</span>
          </div>
        </div>
      </aside>

      <div class="login-panel">
        <header class="login-header">
          <h1 class="login-title">管理员登录</h1>
          <p class="login-subtitle">欢迎回来，请先验证身份</p>
        </header>

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          status-icon
          class="login-form"
          @submit.prevent="onSubmit"
        >
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="用户名" autocomplete="username" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              show-password
              placeholder="密码"
              autocomplete="current-password"
            />
          </el-form-item>
          <el-button type="primary" class="login-button" native-type="submit" :loading="loading">
            登录
          </el-button>
        </el-form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { generateMenu } from '@/router/menu'
import axios from 'axios'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface LoginForm {
  username: string
  password: string
}

interface LoginResponse {
  flag: boolean
  message?: string
  data?:
    | {
        token?: string
      }
    | string
}

defineOptions({
  name: 'LoginView',
})

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
})
const rules: FormRules<LoginForm> = {
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
}

const onSubmit = async () => {
  if (!formRef.value) {
    return
  }
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    return
  }

  const params = new URLSearchParams()
  params.append('username', loginForm.username)
  params.append('password', loginForm.password)

  loading.value = true
  try {
    const { data } = await axios.post<LoginResponse>('/api/users/login', params)
    if (data.flag) {
      const token = typeof data.data === 'string' ? data.data : data.data?.token
      if (token) {
        sessionStorage.setItem('token', token)
      }
      const menuReady = await generateMenu()
      if (menuReady) {
        ElMessage.success('登录成功')
        await router.push({ path: '/' })
      }
      return
    }
    ElMessage.error(data.message || '登录失败')
  } catch {
    ElMessage.error('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:global(#app) {
  padding: 0;
}

.login-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: clamp(1.5rem, 3vw, 3.5rem);
}

.login-card {
  width: min(980px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  border-radius: 28px;
  background: var(--surface-1);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.login-aside {
  padding: 3.5rem 3.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: linear-gradient(135deg, rgba(63, 159, 147, 0.15), rgba(242, 163, 92, 0.25));
}

.aside-badge {
  align-self: flex-start;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--border-soft);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--ink-700);
}

.aside-title {
  margin: 0;
  font-size: 1.8rem;
  color: var(--ink-900);
}

.aside-text {
  margin: 0;
  color: var(--ink-700);
  line-height: 1.7;
}

.aside-stats {
  margin-top: auto;
  display: grid;
  gap: 1rem;
}

.aside-stats div {
  padding: 0.8rem 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--border-soft);
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-500);
  margin-bottom: 0.35rem;
}

.stat-value {
  font-weight: 600;
  color: var(--ink-900);
}

.login-panel {
  padding: 3.5rem 3.25rem;
  background: rgba(255, 255, 255, 0.92);
}

.login-header {
  margin-bottom: 2rem;
}

.login-title {
  margin: 0;
  color: #111827;
  font-size: 1.5rem;
  font-weight: 700;
}

.login-subtitle {
  margin: 0.5rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.login-form {
  display: grid;
  gap: 1rem;
}

.login-button {
  width: 100%;
}

@media (max-width: 768px) {
  .login-card {
    grid-template-columns: 1fr;
  }

  .login-aside {
    padding: 2.5rem 2rem;
  }

  .login-panel {
    padding: 2.5rem 2rem 3rem;
  }
}
</style>
