<template>
  <div class="block">
    <Feature v-if="themeConfig.feature">
      <FeatureList />
    </Feature>
    <span v-if="themeConfig.feature">
      <Title id="article-list" :title="'titles.articles'" icon="article" />
    </span>
    <div class="main-grid">
      <div class="flex flex-col relative">
        <ul :class="tabClass">
          <li :class="{ active: activeTab === 0 }" @click="handleTabChange(0)">
            <span :style="activeTabStyle(0)" class="first-tab">
              {{ t('settings.button-all') }}
            </span>
          </li>
          <template v-if="categories && categories.length > 0">
            <li
              v-for="category in categories"
              :key="category.id"
              :class="{ active: activeTab === category.id }"
              @click="handleTabChange(category.id)">
              <span :style="activeTabStyle(category.id)">
                {{ category.categoryName }}
              </span>
              <b>
                {{ category.articleCount }}
              </b>
            </li>
          </template>
          <template v-else-if="categories.length = 0">
            <li v-for="i in 6" :key="i" style="position: relative; top: -4px">
              <ob-skeleton height="33px" tag="span" width="60px" />
            </li>
          </template>
        </ul>
        <span :class="expanderClass" @click="expandHandler">
          <svg-icon icon-class="chevron" />
        </span>
        <ul class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <template v-if="haveArticles === true">
            <li v-for="article in articles" :key="article.id">
              <ArticleCard :data="article" class="home-article" />
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
          @pageChange="pageChangeHanlder" />
      </div>
      <div>
        <Sidebar>
          <Profile />
          <RecentComment v-if="true" />
          <TagBox />
          <Notice />
          <WebsiteInfo />
        </Sidebar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRef } from 'vue'
import { Feature, FeatureList } from '@/components/Feature'
import { ArticleCard } from '@/components/ArticleCard'
import { Title } from '@/components/Title'
import { Notice, Profile, RecentComment, Sidebar, TagBox, WebsiteInfo } from '@/components/Sidebar'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { useArticleStore } from '@/stores/article'
import { useCategoryStore } from '@/stores/Category'
import { useI18n } from 'vue-i18n'
import Paginator from '@/components/Paginator.vue'
import api from '@/api/api'
import markdownToHtml from '@/utils/markdown'

defineOptions({ name: 'HomeView' })

type ArticleRecord = {
  id: number | string
  articleContent: string
  [key: string]: unknown
}

const sanitizeArticleContent = (item: ArticleRecord) => {
  const content = typeof item.articleContent === 'string' ? item.articleContent : String(item.articleContent ?? '')
  item.articleContent = markdownToHtml(content)
    .replace(/<\/?[^>]*>/g, '')
    .replace(/[|]*\n/, '')
    .replace(/&npsp;/gi, '')
}

const normalizeCategoryId = (value: string | number) => {
  const normalized = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(normalized) ? normalized : 0
}

const appStore = useAppStore()
const userStore = useUserStore()
const articleStore = useArticleStore()
const categoryStore = useCategoryStore()
const { t } = useI18n()
const expanderClass = ref({
  'tab-expander': true,
  expanded: false
})
const tabClass = ref({
  tab: true,
  'expanded-tab': false
})
const activeTab = ref(0)
const articleOffset = ref(0)
const reactiveData = reactive({
  haveArticles: false
})
const pagination = reactive({
  size: 12,
  total: 0,
  current: 1
})
let nowCategoryId = 0

const haveArticles = toRef(reactiveData, 'haveArticles')
const articles = toRef(articleStore.$state, 'articles')
const categories = toRef(categoryStore.$state, 'categories')
const themeConfig = computed(() => appStore.themeConfig)

onMounted(() => {
  fetchTopAndFeatured()
  fetchCategories()
  fetchArticles()
  const articleListEl = document.getElementById('article-list')
  articleOffset.value = articleListEl && articleListEl instanceof HTMLElement ? articleListEl.offsetTop + 120 : 0
})

const fetchTopAndFeatured = () => {
  api.getTopAndFeaturedArticles().then(({ data }) => {
    const topArticle = data.data.topArticle as ArticleRecord
    const featuredArticles = data.data.featuredArticles as ArticleRecord[]
    sanitizeArticleContent(topArticle)
    featuredArticles.forEach(sanitizeArticleContent)
    articleStore.topArticle = topArticle
    articleStore.featuredArticles = featuredArticles
  })
}

const fetchArticles = () => {
  activeTab.value = userStore.tab
  nowCategoryId = userStore.tab
  pagination.current = userStore.page
  if (userStore.tab === 0) {
    reactiveData.haveArticles = false
    api
      .getArticles({
        current: pagination.current,
        size: pagination.size
      })
      .then(({ data }) => {
        if (data.flag) {
          const records = data.data.records as ArticleRecord[]
          records.forEach(sanitizeArticleContent)
          articleStore.articles = records
          pagination.total = data.data.count
          reactiveData.haveArticles = true
        }
      })
  } else {
    fetchArticlesByCategoryId(userStore.tab)
  }
}

const fetchArticlesByCategoryId = (categoryId: number) => {
  reactiveData.haveArticles = false
  api
    .getArticlesByCategoryId({
      current: pagination.current,
      size: pagination.size,
      categoryId: categoryId
    })
    .then(({ data }) => {
      const records = data.data.records as ArticleRecord[]
      records.forEach(sanitizeArticleContent)
      articleStore.articles = records
      pagination.total = data.data.count
      reactiveData.haveArticles = true
    })
}

const fetchCategories = () => {
  categoryStore.categories = []
  api.getAllCategories().then(({ data }) => {
    categoryStore.categories.push(...data.data)
  })
}

const expandHandler = () => {
  expanderClass.value.expanded = !expanderClass.value.expanded
  tabClass.value['expanded-tab'] = !tabClass.value['expanded-tab']
}

const handleTabChange = (categoryId: string | number) => {
  const normalized = normalizeCategoryId(categoryId)
  userStore.tab = normalized
  userStore.page = 1
  pagination.current = 1
  activeTab.value = normalized
  nowCategoryId = normalized
  toArticleOffset()
  if (normalized === 0) {
    fetchArticles()
  } else {
    fetchArticlesByCategoryId(normalized)
  }
}

const toArticleOffset = () => {
  window.scrollTo({
    top: articleOffset.value
  })
}

const activeTabStyle = (catagoryId: string | number) => {
  const normalized = normalizeCategoryId(catagoryId)
  if (normalized === activeTab.value) return { background: appStore.themeConfig.header_gradient_css }
  return {}
}

const pageChangeHanlder = (current: number) => {
  userStore.page = current
  pagination.current = current
  toArticleOffset()
  if (nowCategoryId === 0) {
    fetchArticles()
  } else {
    fetchArticlesByCategoryId(nowCategoryId)
  }
}
</script>
<style lang="scss">
.home-article {
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
