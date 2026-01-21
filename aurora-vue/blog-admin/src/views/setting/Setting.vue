<template>
  <div class="setting-page">
    <el-card class="setting-container">
      <div class="page-title">{{ pageTitle }}</div>

      <el-tabs v-model="activeName">
        <el-tab-pane label="修改信息" name="info">
          <div class="info-container">
            <el-upload
              ref="avatarUpload"
              class="avatar-uploader"
              action="/api/users/avatar"
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
            <el-button type="primary" size="medium" class="password-submit" @click="updatePassword">
              修改
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

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
import axios from 'axios'
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

interface CommonResponse {
  flag: boolean
  message?: string
  data?: string
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
    const { data } = await axios.post<CommonResponse>('/api/users/avatar', form, {
      headers: headers.value,
    })
    if (data.flag) {
      ElMessage.success(data.message || '上传成功')
      if (data.data) {
        appStore.updateAvatar(data.data)
      }
      return
    }
    ElMessage.error(data.message || '上传失败')
  } catch {
    ElMessage.error('上传失败')
  }
}

const updateInfo = async () => {
  if (!infoForm.nickname.trim()) {
    ElMessage.error('昵称不能为空')
    return
  }
  try {
    const { data } = await axios.put<CommonResponse>('/api/users/info', infoForm)
    if (data.flag) {
      ElNotification.success({
        title: '成功',
        message: data.message || '修改成功',
      })
      appStore.updateUserInfo({
        nickname: infoForm.nickname,
        intro: infoForm.intro,
        webSite: infoForm.webSite,
      })
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
  }
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
  try {
    const { data } = await axios.put<CommonResponse>('/api/admin/users/password', passwordForm)
    if (data.flag) {
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      ElNotification.success({
        title: '成功',
        message: data.message || '修改成功',
      })
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
  }
}
</script>

<style scoped>
.setting-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-container {
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

.info-container {
  display: flex;
  align-items: center;
  gap: 3rem;
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
  width: 320px;
}

.info-submit {
  margin-left: 4.375rem;
}

.password-form {
  width: 320px;
  padding: 1rem 0 2rem;
}

.password-submit {
  margin-left: 4.4rem;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}
</style>
