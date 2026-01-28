<template>
  <el-card class="article-editor-container">
    <div class="page-title">{{ route.name || '文章编辑' }}</div>

    <div class="article-title-container">
      <el-input v-model="article.articleTitle" size="large" placeholder="输入文章标题" />
      <el-button
        v-if="article.id == null || article.status === 3"
        type="info"
        size="large"
        class="save-btn"
        @click="handleSaveDraft"
      >
        保存草稿
      </el-button>
      <el-button type="primary" size="large" @click="handleOpenPublishDialog"> 发布文章 </el-button>
    </div>

    <MdEditor
      v-model="article.articleContent"
      :toolbars-exclude="['github']"
      :preview-theme="'github'"
      :code-theme="'atom'"
      @on-upload-img="handleUploadImg"
      style="height: calc(100vh - 280px)"
    />

    <el-dialog v-model="showPublishDialog" title="发布文章" width="40%" top="3vh">
      <el-form label-width="80px" size="default" :model="article">
        <el-form-item label="文章分类">
          <el-tag
            v-show="article.categoryName"
            type="success"
            closable
            style="margin-right: 1rem"
            @close="handleRemoveCategory"
          >
            {{ article.categoryName }}
          </el-tag>
          <el-popover
            v-if="!article.categoryName"
            placement="bottom-start"
            width="460"
            trigger="click"
          >
            <template #reference>
              <el-button type="success" plain size="small"> 添加分类 </el-button>
            </template>
            <div class="popover-title">分类</div>
            <el-autocomplete
              v-model="categoryName"
              :fetch-suggestions="handleSearchCategories"
              placeholder="请输入分类名搜索，enter可添加自定义分类"
              :trigger-on-focus="false"
              style="width: 100%"
              @keyup.enter="handleSaveCategory"
              @select="handleSelectCategory"
            >
              <template #default="{ item }">
                <div>{{ item.categoryName }}</div>
              </template>
            </el-autocomplete>
            <div class="popover-container">
              <div
                v-for="item of categoryList"
                :key="item.id"
                class="category-item"
                @click="handleAddCategory(item)"
              >
                {{ item.categoryName }}
              </div>
            </div>
          </el-popover>
        </el-form-item>

        <el-form-item label="文章标签">
          <el-tag
            v-for="(item, index) of article.tagNames"
            :key="index"
            closable
            style="margin-right: 1rem; margin-bottom: 0.5rem"
            @close="handleRemoveTag(item)"
          >
            {{ item }}
          </el-tag>
          <el-popover
            v-if="article.tagNames.length < 3"
            placement="bottom-start"
            width="460"
            trigger="click"
          >
            <template #reference>
              <el-button type="primary" plain size="small"> 添加标签 </el-button>
            </template>
            <div class="popover-title">标签</div>
            <el-autocomplete
              v-model="tagName"
              :fetch-suggestions="handleSearchTags"
              placeholder="请输入标签名搜索，enter可添加自定义标签"
              :trigger-on-focus="false"
              style="width: 100%"
              @keyup.enter="handleSaveTag"
              @select="handleSelectTag"
            >
              <template #default="{ item }">
                <div>{{ item.tagName }}</div>
              </template>
            </el-autocomplete>
            <div class="popover-container">
              <div style="margin-bottom: 1rem">添加标签</div>
              <el-tag
                v-for="(item, index) of tagList"
                :key="index"
                :class="getTagClass(item)"
                @click="handleAddTag(item)"
              >
                {{ item.tagName }}
              </el-tag>
            </div>
          </el-popover>
        </el-form-item>

        <el-form-item label="文章类型">
          <el-select v-model="article.type" placeholder="请选择类型">
            <el-option
              v-for="item in articleTypes"
              :key="item.type"
              :label="item.desc"
              :value="item.type"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="article.type !== 1" label="原文地址">
          <el-input v-model="article.originalUrl" placeholder="请填写原文链接" />
        </el-form-item>

        <el-form-item label="上传封面">
          <div class="upload-cover-shell" v-loading="coverUploading">
            <el-upload
              class="upload-cover"
              drag
              :headers="uploadHeaders"
              :http-request="interceptCoverUpload"
              :show-file-list="false"
            >
              <template v-if="!article.articleCover">
                <el-icon class="el-icon--upload"><i class="el-icon-upload" /></el-icon>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              </template>
              <img v-else :src="article.articleCover" class="cover-preview" />
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="置顶">
          <el-switch v-model="article.isTop" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <el-form-item label="推荐">
          <el-switch v-model="article.isFeatured" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <el-form-item label="发布形式">
          <el-radio-group v-model="article.status">
            <el-radio :value="1">公开</el-radio>
            <el-radio :value="2">密码</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="article.status === 2" label="访问密码">
          <el-input v-model="article.password" placeholder="请填写文章访问密码" />
        </el-form-item>

        <el-form-item label="文章摘要">
          <el-input
            v-model="article.articleAbstract"
            type="textarea"
            :autosize="true"
            placeholder="默认取文章前500个字符"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePublishArticle">发表</el-button>
      </template>
    </el-dialog>

    <ImageCropperDialog
      ref="coverCropper"
      title="裁剪封面"
      :ratio="COVER_RATIO"
      :size="COVER_CROP_SIZE"
      @confirm="handleCoverCropConfirm"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { api, request } from '@/api'
import dayjs from 'dayjs'
import * as imageConversion from 'image-conversion'
import ImageCropperDialog from '@/components/ImageCropperDialog.vue'

defineOptions({
  name: 'ArticleEditor',
})

interface Category {
  id?: number
  categoryName: string
}

interface Tag {
  id?: number
  tagName: string
}

interface Article {
  id: number | null
  articleTitle: string
  articleContent: string
  articleAbstract: string
  articleCover: string
  categoryName: string | null
  tagNames: string[]
  isTop: 0 | 1
  isFeatured: 0 | 1
  type: 1 | 2 | 3
  status: 1 | 2 | 3
  originalUrl?: string
  password?: string
}

const UPLOAD_SIZE = 1024 // 1MB
const COVER_RATIO: [number, number] = [3, 2]
const COVER_CROP_SIZE = 360

const route = useRoute()
const router = useRouter()

const showPublishDialog = ref(false)
const autoSave = ref(true)
const categoryName = ref('')
const tagName = ref('')
const categoryList = ref<Category[]>([])
const tagList = ref<Tag[]>([])

const articleTypes = [
  { type: 1, desc: '原创' },
  { type: 2, desc: '转载' },
  { type: 3, desc: '翻译' },
]

const article = reactive<Article>({
  id: null,
  articleTitle: dayjs().format('YYYY-MM-DD'),
  articleContent: '',
  articleAbstract: '',
  articleCover: '',
  categoryName: null,
  tagNames: [],
  isTop: 0,
  isFeatured: 0,
  type: 1,
  status: 1,
})

const uploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + sessionStorage.getItem('token'),
}))

const coverCropper = ref<{ open: (file: File) => void } | null>(null)
const coverUploading = ref(false)

const getTagClass = (item: Tag) => {
  const isSelected = article.tagNames.includes(item.tagName)
  return isSelected ? 'tag-item-select' : 'tag-item'
}

const fetchCategories = async () => {
  const result = await request.get<Category[]>(api.admin.category.search)
  if (!result.ok) {
    return
  }
  categoryList.value = result.data
}

const fetchTags = async () => {
  const result = await request.get<Tag[]>(api.admin.tag.search)
  if (!result.ok) {
    return
  }
  tagList.value = result.data
}

const handleSearchCategories = async (keywords: string, cb: (results: Category[]) => void) => {
  const result = await request.get<Category[]>(api.admin.category.search, {
    params: { keywords },
  })
  cb(result.ok ? result.data : [])
}

const handleSelectCategory = (item: Category) => {
  handleAddCategory({ categoryName: item.categoryName })
}

const handleSaveCategory = () => {
  if (categoryName.value.trim()) {
    handleAddCategory({ categoryName: categoryName.value })
    categoryName.value = ''
  }
}

const handleAddCategory = (item: { categoryName: string }) => {
  article.categoryName = item.categoryName
}

const handleRemoveCategory = () => {
  article.categoryName = null
}

const handleSearchTags = async (keywords: string, cb: (results: Tag[]) => void) => {
  const result = await request.get<Tag[]>(api.admin.tag.search, {
    params: { keywords },
  })
  cb(result.ok ? result.data : [])
}

const handleSelectTag = (item: Tag) => {
  handleAddTag({ tagName: item.tagName })
}

const handleSaveTag = () => {
  if (tagName.value.trim()) {
    handleAddTag({ tagName: tagName.value })
    tagName.value = ''
  }
}

const handleAddTag = (item: { tagName: string }) => {
  if (!article.tagNames.includes(item.tagName)) {
    article.tagNames.push(item.tagName)
  }
}

const handleRemoveTag = (tagName: string) => {
  const index = article.tagNames.indexOf(tagName)
  if (index > -1) {
    article.tagNames.splice(index, 1)
  }
}

const interceptCoverUpload = (options: UploadRequestOptions) => {
  const file = options.file as File
  if (!file) {
    return
  }
  coverCropper.value?.open(file)
  options.onSuccess?.({})
}

const handleCoverCropConfirm = async ({ blob, mime }: { blob: Blob; mime: string }) => {
  try {
    coverUploading.value = true
    let uploadBlob = blob
    if (uploadBlob.size / 1024 > UPLOAD_SIZE) {
      uploadBlob = await imageConversion.compressAccurately(uploadBlob, UPLOAD_SIZE)
    }
    const ext = mime === 'image/png' ? 'png' : 'jpg'
    const form = new FormData()
    form.append('file', uploadBlob, `cover.${ext}`)
    const result = await request.post<string>(
      api.admin.article.images,
      form,
      { headers: uploadHeaders.value },
      { silent: true },
    )
    if (!result.ok) {
      ElMessage.error(result.message || '上传失败')
      return
    }
    article.articleCover = result.data
  } catch {
    ElMessage.error('上传失败')
  } finally {
    coverUploading.value = false
  }
}

const handleUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData()
    let fileToUpload: File | Blob = file

    if (file.size / 1024 >= UPLOAD_SIZE) {
      const compressed = await imageConversion.compressAccurately(file, UPLOAD_SIZE)
      fileToUpload = new File([compressed], file.name, { type: file.type })
    }

    formData.append('file', fileToUpload)
    const result = await request.post<string>(api.admin.article.images, formData, undefined, {
      silent: true,
    })
    if (!result.ok) {
      ElMessage.error(result.message || '上传失败')
      return ''
    }
    return result.data || ''
  })

  const urls = await Promise.all(uploadPromises)
  callback(urls)
}

const handleOpenPublishDialog = () => {
  if (!article.articleTitle.trim()) {
    ElMessage.error('文章标题不能为空')
    return
  }
  if (!article.articleContent.trim()) {
    ElMessage.error('文章内容不能为空')
    return
  }
  fetchCategories()
  fetchTags()
  showPublishDialog.value = true
}

const handleSaveDraft = async () => {
  if (!article.articleTitle.trim()) {
    ElMessage.error('文章标题不能为空')
    return
  }
  if (!article.articleContent.trim()) {
    ElMessage.error('文章内容不能为空')
    return
  }

  article.status = 3
  const result = await request.post<null>(api.admin.article.list, article, undefined, {
    silent: true,
  })
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '保存草稿失败',
    })
    autoSave.value = false
    return
  }
  sessionStorage.removeItem('article')
  router.push({ path: '/article-list' })
  ElNotification.success({
    title: '成功',
    message: '保存草稿成功',
  })
  autoSave.value = false
}

const handlePublishArticle = async () => {
  if (!article.articleTitle.trim()) {
    ElMessage.error('文章标题不能为空')
    return
  }
  if (!article.articleContent.trim()) {
    ElMessage.error('文章内容不能为空')
    return
  }
  if (!article.categoryName) {
    ElMessage.error('文章分类不能为空')
    return
  }
  if (article.tagNames.length === 0) {
    ElMessage.error('文章标签不能为空')
    return
  }
  if (!article.articleCover.trim()) {
    ElMessage.error('文章封面不能为空')
    return
  }

  const result = await request.post<null>(api.admin.article.list, article, undefined, {
    silent: true,
  })
  if (!result.ok) {
    ElNotification.error({
      title: '失败',
      message: result.message || '发布失败',
    })
    showPublishDialog.value = false
    autoSave.value = false
    return
  }
  sessionStorage.removeItem('article')
  await router.push({ path: '/article-list' })
  ElNotification.success({
    title: '成功',
    message: result.message || '发布成功',
  })
  showPublishDialog.value = false
  autoSave.value = false
}

const handleAutoSave = () => {
  if (
    autoSave.value &&
    article.articleTitle.trim() &&
    article.articleContent.trim() &&
    article.id != null
  ) {
    request
      .post<null>(api.admin.article.list, article, undefined, { silent: true })
      .then((result) => {
        if (result.ok) {
          ElNotification.success({
            title: '成功',
            message: '自动保存成功',
          })
        } else {
          ElNotification.error({
            title: '失败',
            message: result.message || '自动保存失败',
          })
        }
      })
  }

  if (autoSave.value && article.id == null) {
    sessionStorage.setItem('article', JSON.stringify(article))
  }
}

const loadArticle = async () => {
  const articleId = route.params.id as string | undefined
  if (articleId) {
    const result = await request.get<Article>(api.admin.article.detail(articleId))
    if (!result.ok) {
      return
    }
    Object.assign(article, result.data)
  } else {
    const savedArticle = sessionStorage.getItem('article')
    if (savedArticle) {
      Object.assign(article, JSON.parse(savedArticle))
    }
  }
}

onMounted(() => {
  loadArticle()
})

onUnmounted(() => {
  handleAutoSave()
})
</script>

<style scoped>
.article-editor-container {
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

.article-title-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.save-btn {
  background: var(--surface-1);
  color: var(--ink-700);
  border: 1px solid var(--border-soft);
}

.save-btn:hover {
  background: var(--surface-2);
  color: var(--ink-900);
}

.popover-title {
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
  color: var(--ink-900);
}

.popover-container {
  margin-top: 1rem;
  height: 260px;
  overflow-y: auto;
}

.category-item {
  cursor: pointer;
  padding: 0.6rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.category-item:hover {
  background-color: var(--success-light);
  color: var(--success);
}

.tag-item {
  margin-right: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-item:hover {
  transform: translateY(-2px);
}

.tag-item-select {
  margin-right: 1rem;
  margin-bottom: 1rem;
  cursor: not-allowed;
  opacity: 0.5;
}

.upload-cover-shell {
  width: 100%;
}

.upload-cover-shell :deep(.el-loading-mask) {
  border-radius: 12px;
}

.upload-cover {
  width: 100%;
}

.upload-cover :deep(.el-upload) {
  width: 100%;
}

.upload-cover :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 2px dashed var(--border-soft);
  transition: all 0.3s;
}

.upload-cover :deep(.el-upload-dragger:hover) {
  border-color: var(--primary);
}

.cover-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
}

:deep(.md-editor) {
  border-radius: 12px;
  border: 1px solid var(--border-soft);
}
</style>
