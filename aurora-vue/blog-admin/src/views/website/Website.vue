<template>
  <el-card class="website-card">
    <div class="page-title">{{ pageTitle }}</div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="网站信息" name="info">
        <el-form label-width="100px" :model="websiteConfig" label-position="left">
          <el-form-item label="作者头像">
            <el-upload
              class="avatar-uploader"
              accept="image/*"
              :http-request="handleAuthorAvatarRequest"
              :show-file-list="false"
            >
              <img
                v-if="websiteConfig.authorAvatar"
                :src="websiteConfig.authorAvatar"
                class="avatar"
              />
              <el-icon v-else class="avatar-uploader-icon">
                <i class="el-icon-plus" />
              </el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item label="网站 Logo">
            <el-upload
              class="avatar-uploader"
              accept="image/*"
              :http-request="handleLogoRequest"
              :show-file-list="false"
            >
              <img v-if="websiteConfig.logo" :src="websiteConfig.logo" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon">
                <i class="el-icon-plus" />
              </el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item label="Favicon">
            <el-upload
              class="avatar-uploader"
              accept="image/*"
              :http-request="handleFaviconRequest"
              :show-file-list="false"
            >
              <img v-if="websiteConfig.favicon" :src="websiteConfig.favicon" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon">
                <i class="el-icon-plus" />
              </el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item label="网站名称">
            <el-input v-model="websiteConfig.name" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="网站英文名称">
            <el-input v-model="websiteConfig.englishName" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="网站作者">
            <el-input v-model="websiteConfig.author" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="网页标题">
            <el-input v-model="websiteConfig.websiteTitle" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="作者介绍">
            <el-input v-model="websiteConfig.authorIntro" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="多语言">
            <el-radio-group v-model="websiteConfig.multiLanguage">
              <el-radio :value="0">关闭</el-radio>
              <el-radio :value="1">开启</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="网站创建日期">
            <el-date-picker
              v-model="websiteConfig.websiteCreateTime"
              style="width: 400px"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              type="date"
              placeholder="选择日期"
            />
          </el-form-item>
          <el-form-item label="网站公告">
            <el-input
              v-model="websiteConfig.notice"
              placeholder="请输入公告内容"
              style="width: 400px"
              type="textarea"
              :rows="5"
            />
          </el-form-item>
          <el-form-item label="工信部备案号">
            <el-input v-model="websiteConfig.beianNumber" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="公安部备案号">
            <el-input v-model="websiteConfig.gonganBeianNumber" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="QQ 登录">
            <el-radio-group v-model="websiteConfig.qqLogin">
              <el-radio :value="0">关闭</el-radio>
              <el-radio :value="1">开启</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-button
            type="primary"
            size="default"
            class="submit-button"
            @click="updateWebsiteConfig"
          >
            修改
          </el-button>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="社交信息" name="social">
        <div class="tip-text">提示：空白默认不显示</div>
        <el-form label-width="80px" :model="websiteConfig">
          <el-form-item label="Github">
            <el-input v-model="websiteConfig.github" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="Gitee">
            <el-input v-model="websiteConfig.gitee" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="QQ">
            <el-input v-model="websiteConfig.qq" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="WeChat">
            <el-input v-model="websiteConfig.weChat" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="微博">
            <el-input v-model="websiteConfig.weibo" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="CSDN">
            <el-input v-model="websiteConfig.csdn" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="知乎">
            <el-input v-model="websiteConfig.zhihu" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="掘金">
            <el-input v-model="websiteConfig.juejin" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="Twitter">
            <el-input v-model="websiteConfig.twitter" size="small" style="width: 400px" />
          </el-form-item>
          <el-form-item label="StackOverflow">
            <el-input v-model="websiteConfig.stackoverflow" size="small" style="width: 400px" />
          </el-form-item>
          <el-button
            type="primary"
            size="default"
            class="submit-button submit-button--compact"
            @click="updateWebsiteConfig"
          >
            修改
          </el-button>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="其他设置" name="other">
        <el-form label-width="120px" :model="websiteConfig" label-position="left">
          <el-row class="avatar-row">
            <el-col :md="12">
              <el-form-item label="用户头像">
                <el-upload
                  class="avatar-uploader"
                  accept="image/*"
                  :http-request="handleUserAvatarRequest"
                  :show-file-list="false"
                >
                  <img
                    v-if="websiteConfig.userAvatar"
                    :src="websiteConfig.userAvatar"
                    class="avatar"
                  />
                  <el-icon v-else class="avatar-uploader-icon">
                    <i class="el-icon-plus" />
                  </el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :md="12">
              <el-form-item label="游客头像">
                <el-upload
                  class="avatar-uploader"
                  accept="image/*"
                  :http-request="handleTouristAvatarRequest"
                  :show-file-list="false"
                >
                  <img
                    v-if="websiteConfig.touristAvatar"
                    :src="websiteConfig.touristAvatar"
                    class="avatar"
                  />
                  <el-icon v-else class="avatar-uploader-icon">
                    <i class="el-icon-plus" />
                  </el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="邮箱通知">
            <el-radio-group v-model="websiteConfig.isEmailNotice">
              <el-radio :value="1">开启</el-radio>
              <el-radio :value="0">关闭</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="评论审核">
            <el-radio-group v-model="websiteConfig.isCommentReview">
              <el-radio :value="1">开启</el-radio>
              <el-radio :value="0">关闭</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="打赏状态">
            <el-radio-group v-model="websiteConfig.isReward">
              <el-radio :value="1">开启</el-radio>
              <el-radio :value="0">关闭</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-row v-show="websiteConfig.isReward === 1" class="avatar-row">
            <el-col :md="12">
              <el-form-item label="微信收款码">
                <el-upload
                  class="avatar-uploader"
                  :action="api.admin.website.images"
                  accept="image/*"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :before-upload="handleBeforeUpload"
                  :on-success="handleWeiXinSuccess"
                >
                  <img
                    v-if="websiteConfig.weiXinQRCode"
                    :src="websiteConfig.weiXinQRCode"
                    class="avatar"
                  />
                  <el-icon v-else class="avatar-uploader-icon">
                    <i class="el-icon-plus" />
                  </el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :md="12">
              <el-form-item label="支付宝收款码">
                <el-upload
                  class="avatar-uploader"
                  :action="api.admin.website.images"
                  accept="image/*"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :before-upload="handleBeforeUpload"
                  :on-success="handleAlipaySuccess"
                >
                  <img
                    v-if="websiteConfig.alipayQRCode"
                    :src="websiteConfig.alipayQRCode"
                    class="avatar"
                  />
                  <el-icon v-else class="avatar-uploader-icon">
                    <i class="el-icon-plus" />
                  </el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
          <el-button
            type="primary"
            size="default"
            class="submit-button"
            @click="updateWebsiteConfig"
          >
            修改
          </el-button>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <ImageCropperDialog
      ref="imageCropper"
      :ratio="cropRatio"
      :size="cropSize"
      :fixed-box="true"
      title="裁剪图片"
      @confirm="handleCropperConfirm"
      @cancel="handleCropperCancel"
    />
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { api, request, type ApiResponse } from '@/api'
import { ElMessage, ElNotification } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import * as imageConversion from 'image-conversion'
import ImageCropperDialog from '@/components/ImageCropperDialog.vue'

defineOptions({
  name: 'WebsiteView',
})

interface WebsiteConfig {
  authorAvatar?: string
  logo?: string
  favicon?: string
  name?: string
  englishName?: string
  author?: string
  websiteTitle?: string
  authorIntro?: string
  multiLanguage?: number
  websiteCreateTime?: string
  notice?: string
  beianNumber?: string
  gonganBeianNumber?: string
  qqLogin?: number
  github?: string
  gitee?: string
  qq?: string
  weChat?: string
  weibo?: string
  csdn?: string
  zhihu?: string
  juejin?: string
  twitter?: string
  stackoverflow?: string
  userAvatar?: string
  touristAvatar?: string
  isEmailNotice?: number
  isCommentReview?: number
  isReward?: number
  weiXinQRCode?: string
  alipayQRCode?: string
}

type UploadResponse = ApiResponse<string>

const UPLOAD_SIZE = 1024 // 1MB

const pageTitle = computed(() => '网站配置')
const activeTab = ref('info')

const websiteConfig = reactive<WebsiteConfig>({
  multiLanguage: 0,
  qqLogin: 0,
  isEmailNotice: 0,
  isCommentReview: 0,
  isReward: 0,
})

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
}))

const imageCropper = ref<{ open: (file: File) => void } | null>(null)
const cropField = ref<keyof WebsiteConfig | null>(null)
const cropRatio = ref<[number, number]>([1, 1])
const cropSize = ref(200)

const fetchWebsiteConfig = async () => {
  const result = await request.get<WebsiteConfig>(api.admin.website.config)
  if (!result.ok) {
    return
  }
  Object.assign(websiteConfig, result.data)
}

const openCropper = (
  req: UploadRequestOptions,
  field: keyof WebsiteConfig,
  ratio: [number, number],
) => {
  const file = req.file as File
  if (!file) return
  cropField.value = field
  cropRatio.value = ratio
  imageCropper.value?.open(file)
  req.onSuccess?.({})
}

const handleAuthorAvatarRequest = (req: UploadRequestOptions) =>
  openCropper(req, 'authorAvatar', [1, 1])
const handleLogoRequest = (req: UploadRequestOptions) => openCropper(req, 'logo', [1, 1])
const handleFaviconRequest = (req: UploadRequestOptions) => openCropper(req, 'favicon', [1, 1])
const handleUserAvatarRequest = (req: UploadRequestOptions) =>
  openCropper(req, 'userAvatar', [1, 1])
const handleTouristAvatarRequest = (req: UploadRequestOptions) =>
  openCropper(req, 'touristAvatar', [1, 1])

const setConfigField = (field: keyof WebsiteConfig, value: string) => {
  const target = websiteConfig as Record<string, string | number | undefined>
  target[field] = value
}

const handleCropperConfirm = async ({ blob }: { blob: Blob; mime: string }) => {
  if (!cropField.value) return
  try {
    let uploadBlob = blob
    if (uploadBlob.size / 1024 > UPLOAD_SIZE) {
      uploadBlob = await imageConversion.compressAccurately(uploadBlob, UPLOAD_SIZE)
    }
    const form = new FormData()
    form.append('file', uploadBlob, `${cropField.value || 'image'}.png`)
    const result = await request.post<string>(
      api.admin.website.images,
      form,
      { headers: uploadHeaders.value },
      { silent: true },
    )
    if (!result.ok) {
      ElMessage.error(result.message || '上传失败')
      return
    }
    if (result.data) {
      setConfigField(cropField.value, result.data)
    }
  } catch {
    ElMessage.error('上传失败')
  } finally {
    cropField.value = null
  }
}

const handleCropperCancel = () => {
  cropField.value = null
}

const handleUploadSuccess = (response: UploadResponse, field: keyof WebsiteConfig) => {
  if (response.flag && response.data) {
    setConfigField(field, response.data)
    return
  }
  if (!response.flag) {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleWeiXinSuccess = (response: UploadResponse) =>
  handleUploadSuccess(response, 'weiXinQRCode')
const handleAlipaySuccess = (response: UploadResponse) =>
  handleUploadSuccess(response, 'alipayQRCode')

const handleBeforeUpload = async (file: File): Promise<File | Blob> => {
  if (file.size / 1024 < UPLOAD_SIZE) {
    return file
  }
  return await imageConversion.compressAccurately(file, UPLOAD_SIZE)
}

const updateWebsiteConfig = async () => {
  const result = await request.put<null>(api.admin.website.config, websiteConfig, undefined, {
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
}

onMounted(() => {
  fetchWebsiteConfig()
})
</script>

<style scoped>
.website-card {
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

.tip-text {
  color: var(--ink-500);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.submit-button {
  margin-left: 6.3rem;
}

.submit-button--compact {
  margin-left: 4.375rem;
}

.avatar-row {
  width: 600px;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed rgba(71, 59, 47, 0.35);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--accent-primary);
  transform: translateY(-1px);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: var(--ink-500);
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}
</style>
