<template>
  <transition-group name="fade">
    <CommentItem v-for="(comment, index) in comments" :key="comment.id" :comment="comment" :index="index">
    </CommentItem>
  </transition-group>
  <button
    v-if="haveMore"
    class="load-more-button mt-7 w-32 text-white p-2 rounded-lg shadow-lg transition transform hover:scale-105 flex mx-auto"
    type="button"
    @click="loadMore">
    <span class="text-center flex-grow">{{ t('comments.load_more') }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue'
import CommentItem from './CommentItem.vue'
import { useI18n } from 'vue-i18n'
import { useCommentStore } from '@/stores/comment'
import emitter from '@/utils/mitt'

defineOptions({ name: 'CommentList' })

const { t } = useI18n()
const commentStore = useCommentStore()

interface CommentListItem {
  id: number | string
  userId: number | string
  avatar: string
  nickname: string
  commentContent: string
  createTime: string | number | Date
  replyDTOs: Array<{ id: number | string; [key: string]: any }>
  [key: string]: any
}

const comments = inject<ComputedRef<CommentListItem[]>>(
  'comments',
  computed(() => [] as CommentListItem[])
)
const haveMore = inject<ComputedRef<boolean>>(
  'haveMore',
  computed(() => false)
)

const loadMore = () => {
  switch (commentStore.type) {
    case 1:
      emitter.emit('articleLoadMore')
      break
    case 2:
      emitter.emit('messageLoadMore')
      break
    case 3:
      emitter.emit('aboutLoadMore')
      break
    case 4:
      emitter.emit('friendLinkLoadMore')
      break
    case 5:
      emitter.emit('talkLoadMore')
  }
}
</script>
<style lang="scss" scoped>
.load-more-button {
  outline: none;
  background: var(--main-gradient);
}
</style>
