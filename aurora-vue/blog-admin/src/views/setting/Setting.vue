<template>
  <div class="setting-page">
    <div class="setting-card">
      <aside class="setting-aside">
        <span class="aside-badge">账号设置</span>
        <h2 class="aside-title">个人信息与安全</h2>
        <p class="aside-text">
          在这里更新头像、昵称与站点信息，或修改账户密码。请保持资料最新，方便后续管理。
        </p>
        <div class="aside-stats">
          <div>
            <span class="stat-label">头像</span>
            <span class="stat-value">{{ avatar ? '已设置' : '未设置' }}</span>
          </div>
          <div>
            <span class="stat-label">昵称</span>
            <span class="stat-value">{{ infoForm.nickname || '未填写' }}</span>
          </div>
        </div>
      </aside>

      <section class="setting-panel">
        <header class="panel-header">
          <h3 class="panel-title">{{ pageTitle }}</h3>
          <p class="panel-subtitle">管理个人资料与安全设置</p>
        </header>

        <el-tabs v-model="activeName">
          <el-tab-pane label="修改信息" name="info">
            <div class="info-container">
              <el-upload
                ref="avatarUpload"
                class="avatar-uploader"
                :action="api.users.avatar"
                accept="image/*"
                :show-file-list="false"
                :headers="headers"
                :http-request="interceptAvatarUpload"
              >
                <img v-if="avatar" :src="avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon">
                  <i class="el-icon-plus" />
                </el-icon>
              </el-upload>

              <el-form label-width="70px" :model="infoForm" class="info-form">
                <el-form-item label="昵称">
                  <el-input v-model="infoForm.nickname" size="small" />
                </el-form-item>
                <el-form-item label="个人简介">
                  <el-input v-model="infoForm.intro" size="small" />
                </el-form-item>
                <el-form-item label="个人网站">
                  <el-input v-model="infoForm.webSite" size="small" />
                </el-form-item>
                <el-button type="primary" size="medium" class="info-submit" @click="updateInfo">
                  修改
                </el-button>
              </el-form>
            </div>
          </el-tab-pane>

          <el-tab-pane label="修改密码" name="password">
            <el-form label-width="70px" :model="passwordForm" class="password-form">
              <el-form-item label="旧密码">
                <el-input
                  v-model="passwordForm.oldPassword"
                  size="small"
                  show-password
                  @keyup.enter="updatePassword"
                />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input
                  v-model="passwordForm.newPassword"
                  size="small"
                  show-password
                  @keyup.enter="updatePassword"
                />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  size="small"
                  show-password
                  @keyup.enter="updatePassword"
                />
              </el-form-item>
              <el-button
                type="primary"
                size="medium"
                class="password-submit"
                @click="updatePassword"
              >
                修改
              </el-button>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>

    <ImageCropperDialog
      ref="imageCropper"
      :ratio="[1, 1]"
      :size="200"
      :fixed-box="true"
      title="裁剪头像"
      @confirm="onAvatarCropped"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { api, request } from '@/api'
import * as imageConversion from 'image-conversion'
import ImageCropperDialog from '@/components/ImageCropperDialog.vue'
import { useAppStore } from '@/stores/app'
import type { UploadRequestOptions } from 'element-plus'

defineOptions({
  name: 'SettingView',
})

interface AvatarCropResult {
  blob: Blob
  mime: string
}

const UPLOAD_SIZE = 1024 // 1MB

const appStore = useAppStore()
const route = useRoute()

const pageTitle = computed(() => (route.name ? String(route.name) : '设置'))
const activeName = ref('info')
const infoForm = reactive({
  nickname: '',
  intro: '',
  webSite: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const avatar = computed(() => appStore.userInfo?.avatar || '')
const headers = computed(() => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
}))

const imageCropper = ref<{ open: (file: File) => void } | null>(null)

watch(
  () => appStore.userInfo,
  (userInfo) => {
    infoForm.nickname = userInfo?.nickname || ''
    infoForm.intro = userInfo?.intro || ''
    infoForm.webSite = userInfo?.webSite || ''
  },
  { immediate: true },
)

const interceptAvatarUpload = (options: UploadRequestOptions) => {
  const file = options.file as File
  if (!file) {
    return
  }
  imageCropper.value?.open(file)
  options.onSuccess?.({})
}

const onAvatarCropped = async ({ blob, mime }: AvatarCropResult) => {
  try {
    let uploadBlob = blob
    if (uploadBlob.size / 1024 > UPLOAD_SIZE) {
      uploadBlob = await imageConversion.compressAccurately(uploadBlob, UPLOAD_SIZE)
    }
    const ext = mime === 'image/png' ? 'png' : 'jpg'
    const form = new FormData()
    form.append('file', uploadBlob, `avatar.${ext}`)
    const result = await request.post<string>(
      api.users.avatar,
      form,
      {
        headers: headers.value,
      },
      { silent: true },
    )
    if (!result.ok) {
      ElMessage.error(result.message || '上传失败')
      return
    }
    ElMessage.success(result.message || '上传成功')
    if (result.data) {
      appStore.updateAvatar(result.data)
    }
  } catch {
    ElMessage.error('上传失败')
  }
}

const updateInfo = async () => {
  if (!infoForm.nickname.trim()) {
    ElMessage.error('昵称不能为空')
    return
  }
  const result = await request.put<null>(api.users.info, infoForm, undefined, {
    silent: true,
  })
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '修改失败',
    })
    return
  }
  ElNotification.success({
    title: '成功',
    message: result.message || '修改成功',
  })
  appStore.updateUserInfo({
    nickname: infoForm.nickname,
    intro: infoForm.intro,
    webSite: infoForm.webSite,
  })
}

const updatePassword = async () => {
  if (!passwordForm.oldPassword.trim()) {
    ElMessage.error('旧密码不能为空')
    return
  }
  if (!passwordForm.newPassword.trim()) {
    ElMessage.error('新密码不能为空')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.error('新密码不能少于6位')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次密码输入不一致')
    return
  }
  const result = await request.put<null>(api.admin.user.password, passwordForm, undefined, {
    silent: true,
  })
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '修改失败',
    })
    return
  }
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  ElNotification.success({
    title: '成功',
    message: result.message || '修改成功',
  })
}
</script>

<style scoped>
.setting-page {
  display: grid;
  place-items: center;
  padding: clamp(1.5rem, 3vw, 2.5rem);
}

.setting-card {
  width: min(980px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  border-radius: 28px;
  background: var(--surface-1);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.setting-aside {
  padding: 3rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: linear-gradient(135deg, rgba(63, 159, 147, 0.18), rgba(242, 163, 92, 0.28));
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
  word-break: break-word;
}

.setting-panel {
  padding: 3rem 3rem 3.5rem;
  background: rgba(255, 255, 255, 0.94);
}

.panel-header {
  margin-bottom: 1.5rem;
}

.panel-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink-900);
}

.panel-subtitle {
  margin: 0.5rem 0 0;
  color: var(--ink-500);
  font-size: 0.95rem;
}

.info-container {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  padding: 1rem 0 2rem;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed var(--border-soft);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: grid;
  place-items: center;
  transition: border-color 0.2s;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: var(--ink-400);
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
  border-radius: 8px;
  object-fit: cover;
}

.info-form {
  width: min(320px, 100%);
}

.info-submit {
  margin-left: 4.375rem;
}

.password-form {
  width: min(320px, 100%);
  padding: 1rem 0 2rem;
}

.password-submit {
  margin-left: 4.4rem;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}

.setting-panel :deep(.el-form-item__label) {
  color: var(--ink-600);
  font-weight: 500;
}

.setting-panel :deep(.el-input__wrapper) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--border-soft);
  box-shadow: none;
  padding: 0.35rem 0.75rem;
}

.setting-panel :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(63, 159, 147, 0.15);
}

.setting-panel :deep(.el-input__inner) {
  font-size: 0.95rem;
  color: var(--ink-900);
}

@media (max-width: 900px) {
  .setting-card {
    grid-template-columns: 1fr;
  }

  .setting-aside {
    padding: 2.5rem 2.25rem;
  }

  .setting-panel {
    padding: 2.5rem 2.25rem 3rem;
  }

  .info-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
