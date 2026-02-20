<template>
  <div>
    <div class="flex space-x-3 xl:space-x-5">
      <Avatar :url="reply.avatar" />
      <div class="reply bg-white flex flex-col p-3 rounded-md relative shadow-md">
        <p class="commentContent">
          <template v-if="reply.replyUserId !== commentUserId">
            <a :href="reply.replyWebsite" target="_blank" class="reply-link">@{{ reply.replyNickname }}</a>
            <span>&nbsp;</span>
          </template>
          <span>{{ reply.commentContent }}</span>
        </p>
        <div class="flex justify-between mt-2 text-xs text-gray-400 space-x-3 md:space-x-16">
          <span> {{ reply.nickname }} | {{ time }}</span>
          <div>
            <span class="cursor-pointer reply-button" @click="clickOnSonReply">{{ t('comments.reply') }}</span>
          </div>
        </div>
      </div>
    </div>
    <a href="" target="_blank"></a>
    <CommentReplyForm
      v-show="show"
      :initialContent="replyContent"
      :replyUserId="reply.userId ?? commentUserId"
      class="mt-5"
      @changeShow="changeShow" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Avatar from '@/components/Avatar.vue'
import CommentReplyForm from './CommentReplyForm.vue'

defineOptions({ name: 'CommentReplyItem' })

const { t } = useI18n()

type ReplyRecord = {
  avatar?: string
  replyUserId?: string | number
  replyWebsite?: string
  replyNickname?: string
  commentContent?: string
  nickname?: string
  createTime?: string | number | Date
  userId?: string | number
}

const props = defineProps<{
  reply: ReplyRecord
  commentUserId: string | number
}>()

const formatTime = (time: string | number | Date | undefined): string => {
  if (time == null) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${month}-${day}`
}

const show = ref(false)
const replyContent = ref('')
const time = computed(() => formatTime(props.reply.createTime))

const clickOnSonReply = () => {
  replyContent.value = '@' + (props.reply.nickname ?? '')
  show.value = true
}

const changeShow = () => {
  show.value = false
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
<style lang="scss">
.reply-link {
  color: var(--text-accent);
}
</style>
