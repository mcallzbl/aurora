<template>
  <div class="flex space-x-3 xl:space-x-5">
    <Avatar :url="avatar" />
    <div class="comment flex flex-col flex-wrap-reverse w-full max-w-full-calc">
      <textarea
        v-model="commentContent"
        :placeholder="t('comments.placeholder')"
        class="w-full shadow-md rounded-md p-4 focus:outline-none input"
        cols="30"
        rows="5" />
      <div class="justify-between" style="text-align: right">
        <button
          id="submit-button"
          class="mt-5 w-32 text-white p-2 rounded-lg shadow-lg transition transform hover:scale-105 flex float-right"
          @click="saveComment">
          <span class="text-center flex-grow commit">{{ t('comments.submit') }}</span>
        </button>
      </div>
      <div class="w-full border-b-2 mt-6 wire"></div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, getCurrentInstance, ref } from 'vue'
import Avatar from '@/components/Avatar.vue'
import { useUserStore } from '@/stores/user'
import { useRoute } from 'vue-router'
import { useCommentStore } from '@/stores/comment'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'
import api from '@/api/api'
import emitter from '@/utils/mitt'

const proxy: any = getCurrentInstance()?.appContext.config.globalProperties
const { t } = useI18n()
const userStore = useUserStore()
const commentStore = useCommentStore()
const appStore = useAppStore()
const route = useRoute()

const commentContent = ref('')
const avatar = computed(() => (userStore.userInfo === '' ? '' : userStore.userInfo.avatar))

const fetchComments = () => {
  switch (commentStore.type) {
    case 1:
      emitter.emit('articleFetchComment')
      break
    case 2:
      emitter.emit('messageFetchComment')
      break
    case 3:
      emitter.emit('aboutFetchComment')
      break
    case 4:
      emitter.emit('friendLinkFetchComment')
      break
    case 5:
      emitter.emit('talkFetchComment')
  }
}

const saveComment = () => {
  if (userStore.userInfo === '') {
    proxy.$notify({
      title: 'Warning',
      message: t('comments.login_required'),
      type: 'warning'
    })
    return
  }
  if (commentContent.value.trim() === '') {
    proxy.$notify({
      title: 'Warning',
      message: t('comments.empty'),
      type: 'warning'
    })
    return
  }
  const path = route.path
  const arr = path.split('/')
  const params: any = {
    commentContent: commentContent.value,
    type: commentStore.type
  }
  params.topicId = arr[2]
  api.saveComment(params).then(({ data }) => {
    if (data.flag) {
      fetchComments()
      const isCommentReview = appStore.websiteConfig.isCommentReview
      if (isCommentReview) {
        proxy.$notify({
          title: 'Warning',
          message: t('comments.pending_review'),
          type: 'warning'
        })
      } else {
        proxy.$notify({
          title: 'Success',
          message: t('comments.success'),
          type: 'success'
        })
      }
      commentContent.value = ''
    }
  })
}
</script>

<style lang="scss" scoped>
.input {
  background: var(--background-primary);
  resize: none;
}

#submit-button {
  outline: none;
  background: var(--main-gradient);
}

.wire {
  border-color: var(--text-normal);
}
</style>
