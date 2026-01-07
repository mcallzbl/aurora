<template>
  <div class="flex flex-col">
    <div class="post-header">
      <h1 class="post-title text-white uppercase">{{ tagName }}</h1>
    </div>
    <div class="ob-card min-h-screen">
      <ul class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 xl:gap-10">
        <template v-if="haveArticles === true">
          <li v-for="article in articles" :key="article.id">
            <ArticleCard :data="article" class="tag-article" />
          </li>
        </template>
        <template v-else>
          <li v-for="n in 12" :key="n">
            <ArticleCard :data="{}" />
          </li>
        </template>
      </ul>
      <Paginator
        :page="pagination.current"
        :pageSize="pagination.size"
        :pageTotal="pagination.total"
        @pageChange="pageChangeHandler" />
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, onMounted, onServerPrefetch, reactive, toRefs } from 'vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { ArticleCard } from '@/components/ArticleCard'
import Paginator from '@/components/Paginator.vue'
import { useRoute } from 'vue-router'
import api from '@/api/api'
import markdownToHtml from '@/utils/markdown'

export default defineComponent({
  name: 'ArticleList',
  components: { Breadcrumb, ArticleCard, Paginator },
  setup() {
    const route = useRoute()
    const pagination = reactive({
      size: 12,
      total: 0,
      current: 1
    })
    const reactiveData = reactive({
      articles: [] as any,
      tagName: '' as any,
      haveArticles: false
    })
    onMounted(() => {
      reactiveData.tagName = route.query.tagName
      fetchArticles()
    })
    // SSR prefetch so tag list pages render with content during SSG
    onServerPrefetch(async () => {
      try {
        reactiveData.tagName = route.query.tagName as any
        const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api'
        const params = new URLSearchParams({
          tagId: String(route.params.tagId ?? ''),
          current: String(pagination.current),
          size: String(pagination.size)
        })
        const resp = await fetch(`${API_BASE}/articles/tagId?${params.toString()}`)
        const j = await resp.json()
        const records = Array.isArray(j?.data?.records) ? j.data.records : []
        records.forEach((item: any) => {
          item.articleContent = markdownToHtml(item.articleContent)
            .replace(/<\/?[^>]*>/g, '')
            .replace(/[|]*\n/, '')
            .replace(/&npsp;/gi, '')
        })
        reactiveData.articles = records
        pagination.total = typeof j?.data?.count === 'number' ? j.data.count : records.length
        reactiveData.haveArticles = true
      } catch (_) {
        // ignore SSR failure; client will refetch
      }
    })
    const fetchArticles = async () => {
      reactiveData.haveArticles = false
      const { data } = await api.getArticlesByTagId({
        tagId: route.params.tagId,
        current: pagination.current,
        size: pagination.size
      })
      data.data.records.forEach((item: any) => {
        item.articleContent = markdownToHtml(item.articleContent)
          .replace(/<\/?[^>]*>/g, '')
          .replace(/[|]*\n/, '')
          .replace(/&npsp;/gi, '')
      })
      reactiveData.articles = data.data.records
      pagination.total = data.data.count
      reactiveData.haveArticles = true
    }
    const backToPageTop = () => {
      window.scrollTo({
        top: 0
      })
    }
    const pageChangeHandler = (current: number) => {
      reactiveData.articles = []
      pagination.current = current
      backToPageTop()
      fetchArticles()
    }
    return {
      pagination,
      pageChangeHandler: pageChangeHandler,
      ...toRefs(reactiveData)
    }
  }
})
</script>
<style lang="scss">
.tag-article {
  .article-content {
    p {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
    }

    .article-footer {
      margin-top: 13px;
    }
  }
}
</style>
