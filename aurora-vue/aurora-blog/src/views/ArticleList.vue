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
<script setup lang="ts">
import { onMounted, onServerPrefetch, reactive, toRefs } from 'vue'
import { ArticleCard } from '@/components/ArticleCard'
import Paginator from '@/components/Paginator.vue'
import { useRoute, type LocationQueryValue } from 'vue-router'
import api from '@/api/api'
import markdownToHtml from '@/utils/markdown'

defineOptions({ name: 'ArticleList' })

type RouteValue = LocationQueryValue | LocationQueryValue[] | undefined
type ArticleRecord = {
  id: number | string
  articleContent: string
  [key: string]: unknown
}

const normalizeRouteValue = (value: RouteValue): string => {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
}

const sanitizeArticleContent = (item: ArticleRecord) => {
  const content = typeof item.articleContent === 'string' ? item.articleContent : String(item.articleContent ?? '')
  item.articleContent = markdownToHtml(content)
    .replace(/<\/?[^>]*>/g, '')
    .replace(/[|]*\n/, '')
    .replace(/&npsp;/gi, '')
}

const route = useRoute()
const pagination = reactive({
  size: 12,
  total: 0,
  current: 1
})
const reactiveData = reactive({
  articles: [] as ArticleRecord[],
  tagName: '',
  haveArticles: false
})
const { articles, tagName, haveArticles } = toRefs(reactiveData)

onMounted(() => {
  reactiveData.tagName = normalizeRouteValue(route.query.tagName)
  fetchArticles()
})

// SSR prefetch so tag list pages render with content during SSG
onServerPrefetch(async () => {
  try {
    reactiveData.tagName = normalizeRouteValue(route.query.tagName)
    const API_BASE = import.meta.env.VITE_API_BASE || '/api'
    const params = new URLSearchParams({
      tagId: normalizeRouteValue(route.params.tagId),
      current: String(pagination.current),
      size: String(pagination.size)
    })
    const resp = await fetch(`${API_BASE}/articles/tagId?${params.toString()}`)
    const j = (await resp.json()) as { data?: { records?: ArticleRecord[]; count?: number } }
    const records = Array.isArray(j?.data?.records) ? j.data.records : []
    records.forEach(sanitizeArticleContent)
    reactiveData.articles = records
    pagination.total = typeof j?.data?.count === 'number' ? j.data.count : records.length
    reactiveData.haveArticles = true
  } catch {
    // ignore SSR failure; client will refetch
  }
})

const fetchArticles = async () => {
  reactiveData.haveArticles = false
  const { data } = await api.getArticlesByTagId({
    tagId: normalizeRouteValue(route.params.tagId),
    current: pagination.current,
    size: pagination.size
  })
  const records = Array.isArray(data?.data?.records) ? (data.data.records as ArticleRecord[]) : []
  records.forEach(sanitizeArticleContent)
  reactiveData.articles = records
  pagination.total = typeof data?.data?.count === 'number' ? data.data.count : records.length
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
