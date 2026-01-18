<template>
  <div>
    <Breadcrumb :current="t('menu.talks')" />
    <div class="flex flex-col">
      <div class="post-header">
        <h1 class="post-title text-white uppercase">{{ t('titles.talks') }}</h1>
      </div>
      <div class="main-grid">
        <div class="relative space-y-5">
          <div
            v-for="item in talks"
            :key="item.id"
            class="bg-ob-deep-800 flex p-3 md:p-4 lg:p-8 rounded-2xl shadow-xl mb-0 talk-item"
            @click="toTalk(item.id)">
            <Avatar :url="item.avatar" />
            <div class="talk-info">
              <div class="user-nickname text-sm">
                {{ item.nickname }}
              </div>
              <div class="time">
                {{ t('settings.shared-on') }}
                <time :datetime="new Date(item.createTime).toISOString()">
                  {{ d(new Date(item.createTime), 'short') }}
                </time>
                <template v-if="item.isTop === 1">
                  <svg-icon class="top-svg" icon-class="top" />
                  <span style="color: #f21835">置顶</span>
                </template>
                <svg-icon class="message-svg" icon-class="message" />
                {{
                  item.commentCount == null ? 0 : item.commentCount
                }}
              </div>
              <div class="talk-content" v-html="item.content" />
              <el-row v-if="item.imgs" class="talk-images">
                <el-col v-for="(img, index) of item.imgs" :key="index" :md="4">
                  <el-image
                    :src="img"
                    aspect-ratio="1"
                    class="images-items"
                    max-height="200"
                    @click.stop="handlePreview(img)" />
                </el-col>
              </el-row>
            </div>
          </div>
          <Paginator
            :page="pagination.current"
            :pageSize="pagination.size"
            :pageTotal="pagination.total"
            @pageChange="pageChangeHandler" />
        </div>
        <div class="col-span-1">
          <Sidebar>
            <Profile />
          </Sidebar>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { Profile, Sidebar } from '../components/Sidebar'
import Paginator from '@/components/Paginator.vue'
import Avatar from '../components/Avatar.vue'
import v3ImgPreviewPkg from 'v3-img-preview'
import { useRouter } from 'vue-router'
import api from '@/api/api'

defineOptions({ name: 'talkList' })

type TalkItem = {
  id: number | string
  avatar?: string
  nickname?: string
  createTime: string | number | Date
  isTop?: number
  commentCount?: number | null
  content?: string
  imgs?: string[]
}

type TalkListApiResponse = {
  data: {
    records: TalkItem[]
    count: number
  }
}

type ImgPreviewFn = (options: { images: string[]; index: number }) => void
const { v3ImgPreviewFn } = v3ImgPreviewPkg as { v3ImgPreviewFn: ImgPreviewFn }

const { t, d } = useI18n()
const router = useRouter()
const pagination = reactive<{ size: number; total: number; current: number }>({
  size: 7,
  total: 0,
  current: 1
})
const reactiveData = reactive<{ images: string[]; talks: TalkItem[] }>({
  images: [],
  talks: []
})
const { talks } = toRefs(reactiveData)

const handlePreview = (imageUrl: string) => {
  v3ImgPreviewFn({ images: reactiveData.images, index: reactiveData.images.indexOf(imageUrl) })
}

const fetchTalks = () => {
  const params = {
    current: pagination.current,
    size: pagination.size
  }
  api.getTalks(params).then(({ data }: { data: TalkListApiResponse }) => {
    reactiveData.talks = data.data.records
    pagination.total = data.data.count
    reactiveData.talks.forEach((item) => {
      if (item.imgs) {
        reactiveData.images.push(...item.imgs)
      }
    })
  })
}

const toPageTop = () => {
  window.scrollTo({
    top: 0
  })
}

const pageChangeHandler = (current: number) => {
  reactiveData.talks = []
  toPageTop()
  pagination.current = current
  fetchTalks()
}

const toTalk = (id: TalkItem['id']) => {
  router.push({ path: '/talks/' + id })
}

onMounted(() => {
  fetchTalks()
})
</script>

<style lang="scss" scoped>
.top-svg {
  margin-left: 5px;
}

.message-svg {
  margin-left: 5px;
  font-size: 15px;
}

.talk-item:hover {
  transform: scale(1.005);
}

.el-card {
  background: var(--background-primary);
  border-radius: 10px;
  border: 0;
}

.talk-info {
  flex: 1;
  margin-left: 10px;
}

.user-nickname {
  font-weight: 500;
}

.time {
  color: #999;
  font-size: 13px;
  @media (min-width: 1280px) {
    margin-top: 4px;
  }
}

.talk-content {
  margin-top: 10px;
  font-size: 14px;
  line-height: 26px;
  white-space: pre-line;
  word-wrap: break-word;
  word-break: break-all;
}

.talk-images {
  margin-top: 8px;
}

.images-items {
  cursor: pointer;
  border-radius: 3px;
  margin-right: 5px;
}
</style>
