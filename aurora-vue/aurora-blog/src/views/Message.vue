<template>
  <div>
    <Breadcrumb :current="t('menu.message')" />
    <div class="flex flex-col">
      <div class="post-header">
        <h1 class="post-title text-white uppercase">{{ t('titles.message') }}</h1>
      </div>
      <div class="main-grid">
        <div class="relative">
          <div class="post-html">
            <p>{{ t('message.notice_line1') }}</p>
            <p>{{ t('message.notice_line2') }}</p>
          </div>
          <Comment />
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
<script setup lang="ts">
import { computed, onMounted, provide, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Profile, Sidebar } from '../components/Sidebar'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { Comment } from '../components/Comment'
import { useCommentStore } from '@/stores/comment'
import api from '@/api/api'
import emitter from '@/utils/mitt'

defineOptions({ name: 'Message' })

const { t } = useI18n()
const commentStore = useCommentStore()

const reactiveData = reactive({
  comments: [] as any[],
  haveMore: false,
  isReload: false
})

const pageInfo = reactive({
  current: 1,
  size: 7
})

commentStore.type = 2

onMounted(() => {
  fetchComments()
})

provide(
  'comments',
  computed(() => reactiveData.comments)
)
provide(
  'haveMore',
  computed(() => reactiveData.haveMore)
)

emitter.on('messageFetchComment', () => {
  pageInfo.current = 1
  reactiveData.isReload = true
  fetchComments()
})

emitter.on('messageFetchReplies', (index) => {
  fetchReplies(index as number)
})

emitter.on('messageLoadMore', () => {
  fetchComments()
})

const fetchComments = () => {
  const params = {
    type: 2,
    topicId: null,
    current: pageInfo.current,
    size: pageInfo.size
  }
  api.getComments(params).then(({ data }) => {
    const records = Array.isArray(data?.data?.records) ? data.data.records : []
    if (reactiveData.isReload) {
      reactiveData.comments = records
      reactiveData.isReload = false
    } else if (records.length > 0) {
      reactiveData.comments.push(...records)
    }
    const total = typeof data?.data?.count === 'number' ? data.data.count : reactiveData.comments.length
    reactiveData.haveMore = total > reactiveData.comments.length
    pageInfo.current++
  })
}

const fetchReplies = (index: number) => {
  api.getRepliesByCommentId(reactiveData.comments[index].id).then(({ data }) => {
    reactiveData.comments[index].replyDTOs = data.data
  })
}
</script>
