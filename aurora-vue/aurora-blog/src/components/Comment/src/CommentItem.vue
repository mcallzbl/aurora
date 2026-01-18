<template>
  <div class="mt-5 max-w-full">
    <div class="flex space-x-3 xl:space-x-5">
      <Avatar :url="props.comment.avatar" />
      <div class="max-w-full-calc space-y-5">
        <div class="bg-white text-primary p-4 rounded-md relative shadow-md reply" style="width: fit-content">
          <p class="commentContent" v-html="props.comment.commentContent.replaceAll('\n', '<br>')" />
          <div class="flex justify-between mt-3 text-xs text-gray-400 space-x-3 md:space-x-16">
            <span>{{ props.comment.nickname }} | {{ createdAt }}</span>
            <div>
              <span class="cursor-pointer reply-button" @click="clickOnReply">{{ t('comments.reply') }}</span>
            </div>
          </div>
        </div>
        <CommentReplyForm
          v-show="show"
          :initialContent="replyPlaceholder"
          :replyUserId="props.comment.userId"
          @changeShow="changeShow" />
        <transition-group name="fade">
          <CommentReplyItem
            v-for="reply in props.comment.replyDTOs"
            :key="reply.id"
            :commentUserId="props.comment.userId"
            :reply="reply" />
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Avatar from '@/components/Avatar.vue'
import CommentReplyItem from './CommentReplyItem.vue'
import CommentReplyForm from './CommentReplyForm.vue'

defineOptions({ name: 'CommentItem' })

interface ReplyDTO {
  id: number | string
  [key: string]: any
}

interface CommentItemProps {
  comment: {
    id: number | string
    userId: number | string
    avatar: string
    nickname: string
    commentContent: string
    createTime: string | number | Date
    replyDTOs: ReplyDTO[]
  }
  index: number
}

const props = defineProps<CommentItemProps>()
const { t, d } = useI18n()

// provide for children
provide('parentId', props.comment.id)
provide('index', props.index)

const show = ref(false)

const createdAt = computed(() => {
  const date = new Date(props.comment.createTime)
  return d(date, 'short')
})

const replyPlaceholder = computed(() => t('comments.reply_placeholder'))

const changeShow = () => {
  show.value = false
}

const clickOnReply = () => {
  show.value = true
}
</script>
<style lang="scss" scoped>
.reply::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-right: 8px solid var(--background-primary);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  left: -8px;
  top: 14px;
}

.reply {
  background: var(--background-primary);
}

.reply-button {
  color: var(--text-accent);
}

.commentContent {
  line-height: 26px;
  white-space: pre-line;
  word-wrap: break-word;
  word-break: break-all;
}
</style>
