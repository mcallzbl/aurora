<template>
  <div class="flex flex-col">
    <div class="post-header">
      <Breadcrumb :current="t('menu.tags')" />
      <h1 class="post-title text-white uppercase">{{ t('menu.tags') }}</h1>
    </div>
    <div class="ob-card">
      <TagList>
        <template v-if="tags != '' && tags.length > 0">
          <TagItem v-for="tag in tags" :id="tag.id" :key="tag.id" :count="tag.count" :name="tag.tagName" size="xl" />
        </template>
      </TagList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, toRef } from 'vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { useI18n } from 'vue-i18n'
import { useTagStore } from '@/stores/tag'
import { TagItem, TagList } from '@/components/Tag'
import { useCommonStore } from '@/stores/common'
import api from '@/api/api'

defineOptions({ name: 'TagsView' })

const commonStore = useCommonStore()
const { t } = useI18n()
const tagStore = useTagStore()

onMounted(() => {
  fetchTags()
})

onUnmounted(() => {
  commonStore.resetHeaderImage()
})

const fetchTags = () => {
  api.getAllTags().then(({ data }) => {
    tagStore.tags = data.data
  })
}

const tags = toRef(tagStore.$state, 'tags')
</script>
