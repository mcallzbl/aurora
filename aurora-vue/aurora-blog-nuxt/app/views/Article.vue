<template>
  <div class="flex flex-col">
    <div class="main-grid">
      <div>
        <div class="article-block">
          <div class="post-header">
            <span class="post-labels">
              <ob-skeleton v-if="loading" height="20px" tag="b" width="35px" />
              <b v-else-if="!loading && article.categoryName">
                <span>{{ article.categoryName }}</span>
              </b>
              <b v-else>{{ t('settings.default-category') }}</b>
              <ul>
                <ob-skeleton v-if="loading" :count="2" class="mr-2" height="16px" tag="li" width="35px" />
                <template v-else-if="!loading && article.tags && article.tags.length > 0">
                  <li v-for="tag in article.tags" :key="tag.id">
                    <em class="opacity-50">#</em>
                    {{ tag.tagName }}
                  </li>
                </template>
                <template v-else>
                  <li>
                    <b class="opacity-50">#</b>
                    {{ t('settings.default-tag') }}
                  </li>
                </template>
              </ul>
            </span>
            <h1 v-if="article.articleTitle" class="post-title text-white">
              {{ article.articleTitle }}
            </h1>
            <ob-skeleton
              v-else
              class="post-title text-white uppercase"
              height="clamp(1.2rem, calc(1rem + 3.5vw), 4rem)"
              width="100%" />
            <div class="flex flex-row items-center justify-start mt-8 mb-4">
              <div v-if="article.author" class="post-footer">
                <img
                  v-lazy="article.author.avatar || ''"
                  alt="author avatar"
                  class="hover:opacity-50 cursor-pointer"
                  @click="handleAuthorClick(article.author.website)" />
                <span class="text-white opacity-80">
                  <strong
                    class="text-white pr-1.5 hover:opacity-50 cursor-pointer"
                    @click="handleAuthorClick(article.author.website)">
                    {{ article.author.nickname }}
                  </strong>
                  <time :datetime="toIso(article.createTime)" class="opacity-70">
                    {{ t('settings.shared-on') }} {{ formatDate(article.createTime) }}
                  </time>
                </span>
              </div>
              <div v-else class="post-footer">
                <div class="flex flex-row items-center">
                  <ob-skeleton :circle="true" class="mr-2" height="28px" width="28px" />
                  <span class="text-ob-dim mt-1">
                    <ob-skeleton height="20px" width="150px" />
                  </span>
                </div>
              </div>
              <div v-if="wordNum !== '' && readTime !== ''" class="post-stats">
                <span>
                  <svg-icon icon-class="text-outline" style="stroke: white" />
                  <span class="pl-2 opacity-70">
                    {{ wordNum }}
                  </span>
                </span>
                <span>
                  <svg-icon icon-class="clock-outline" style="stroke: white" />
                  <span class="pl-2 opacity-70">
                    {{ readTime }}
                  </span>
                </span>
              </div>
              <div v-else class="post-stats">
                <span>
                  <svg-icon icon-class="clock" />
                  <span class="pl-2">
                    <ob-skeleton height="16px" width="40px" />
                  </span>
                </span>
                <span>
                  <svg-icon icon-class="text" />
                  <span class="pl-2">
                    <ob-skeleton height="16px" width="40px" />
                  </span>
                </span>
              </div>
            </div>
          </div>
          <template v-if="article.articleContent">
            <div class="post-html">
              <div ref="articleRef" class="markdown-body" v-html="article.articleContent" />
            </div>
          </template>
          <div v-else class="post-html post-skeleton">
            <ob-skeleton :count="1" class="mb-6" height="36px" tag="div" width="150px" />
            <br />
            <ob-skeleton :count="35" class="mr-2" height="16px" tag="div" width="100px" />
            <br />
            <br />
            <ob-skeleton :count="25" class="mr-2" height="16px" tag="div" width="100px" />
          </div>
        </div>
        <div class="flex flex-col lg:flex-row justify-start items-end my-8 my-gap">
          <div v-if="preArticleCard" class="w-full h-full self-stretch mr-0 lg:mr-4">
            <SubTitle icon="arrow-left-circle" title="settings.paginator.pre" />
            <ArticleCard :data="preArticleCard" class="pre-and-next-article" />
          </div>
          <div v-if="nextArticleCard" class="w-full h-full self-stretch mt-0">
            <SubTitle :side="!isMobile ? 'right' : 'left'" icon="arrow-right-circle" title="settings.paginator.next" />
            <ArticleCard :data="nextArticleCard" class="pre-and-next-article" />
          </div>
        </div>
        <Comment />
      </div>
      <div>
        <Sidebar>
          <Profile />
          <Sticky :stickyTop="32" dynamicElClass="#sticky-sidebar" endingElId="footer">
            <div id="sticky-sidebar">
              <transition mode="out-in" name="fade-slide-y">
                <div v-show="!!article.articleContent" class="sidebar-box mb-4">
                  <SubTitle :title="'titles.toc'" icon="toc" />
                  <div id="toc1"></div>
                </div>
              </transition>
              <Navigator />
            </div>
          </Sticky>
        </Sidebar>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Navigator, Profile, Sidebar } from '@/components/Sidebar'
import {
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  onServerPrefetch,
  onUnmounted,
  provide,
  reactive,
  ref,
  toRef
} from 'vue'
import { onBeforeRouteUpdate, useRoute, useRouter, type RouteLocationNormalizedLoaded } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead, useRuntimeConfig } from '#imports'
import { Comment } from '@/components/Comment'
import { SubTitle } from '@/components/Title'
import { ArticleCard } from '@/components/ArticleCard'
import '@/styles/prism-aurora-future.css'
import { useCommonStore } from '@/stores/common'
import { useCommentStore } from '@/stores/comment'
import Sticky from '@/components/Sticky.vue'
import Prism from 'prismjs'
import tocbot from 'tocbot'
import emitter from '@/utils/mitt'
import v3ImgPreviewPkg from 'v3-img-preview'
import api from '@/api/api'
import markdownToHtml from '@/utils/markdown'
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  normalizeLocaleKey,
  toOgLocale,
  type SupportedLocale
} from '@/config/i18n'

type ImgPreviewFn = (options: { images: string[]; index: number }) => void
type TagInfo = {
  id: string | number
  tagName?: string | null
}
type AuthorInfo = {
  avatar?: string
  nickname?: string
  website?: string
}
type ArticleCardData = {
  id?: string | number
  articleTitle?: string
  articleContent?: string
  articleCover?: string
  createTime?: string | number | Date
  updateTime?: string | number | Date
  status?: number
}
type ArticleDetail = ArticleCardData & {
  categoryName?: string
  tags?: TagInfo[]
  author?: AuthorInfo
  preArticleCard?: ArticleCardData | null
  nextArticleCard?: ArticleCardData | null
}
type CommentRecord = {
  id: string | number
  replyDTOs?: unknown[]
}
type ReactiveData = {
  articleId: string | number | undefined
  article: ArticleDetail
  wordNum: string
  readTime: string
  comments: CommentRecord[]
  images: string[]
  preArticleCard: ArticleCardData | null
  nextArticleCard: ArticleCardData | null
  haveMore: boolean
  isReload: boolean
}
type NotifyFn = (options: { title: string; message: string; type: 'error' | 'warning' | 'success' | 'info' }) => void

const { v3ImgPreviewFn } = v3ImgPreviewPkg as { v3ImgPreviewFn: ImgPreviewFn }

defineOptions({ name: 'ArticleDetail' })

const proxy = getCurrentInstance()?.appContext.config.globalProperties as { $notify?: NotifyFn } | undefined
const commonStore = useCommonStore()
const commentStore = useCommentStore()
const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const { t, d } = useI18n()

// Avoid skeletons in SSR HTML: default loading=false when SSR renders
const loading = ref(!import.meta.env.SSR)
const articleRef = ref<HTMLElement | null>(null)

const reactiveData = reactive<ReactiveData>({
  articleId: undefined,
  article: {},
  wordNum: '',
  readTime: '',
  comments: [],
  images: [],
  preArticleCard: null,
  nextArticleCard: null,
  haveMore: false,
  isReload: false
})
const pageInfo = reactive({
  current: 1,
  size: 7
})
commentStore.type = 1

const article = toRef(reactiveData, 'article')
const wordNum = toRef(reactiveData, 'wordNum')
const readTime = toRef(reactiveData, 'readTime')
const preArticleCard = toRef(reactiveData, 'preArticleCard')
const nextArticleCard = toRef(reactiveData, 'nextArticleCard')

const getArticleIdFromParam = (param: unknown): string | number | undefined => {
  if (typeof param === 'string' || typeof param === 'number') return param
  if (Array.isArray(param) && param.length > 0) return param[0]
  return undefined
}

const withFallbackAuthor = (article: ArticleDetail): ArticleDetail => {
  const nickname = article.author?.nickname
  if (typeof nickname === 'string' && nickname.trim().length > 0) return article
  return {
    ...article,
    author: {
      ...(article.author || {}),
      nickname: 'mcallzbl'
    }
  }
}

// SSR: prefetch and render article HTML (no top-level await -> no async setup)
onServerPrefetch(async () => {
  try {
    reactiveData.articleId = getArticleIdFromParam(route.params.articleId)
    const API_BASE = import.meta.env.VITE_API_BASE as string
    const resp = await fetch(`${API_BASE}/articles/${reactiveData.articleId}`, {
      headers: { accept: 'application/json' }
    })
    const raw = await resp.text()
    const j = JSON.parse(raw)
    if (j && j.data) {
      const a = j.data as ArticleDetail
      const { default: MarkdownIt } = await import('markdown-it')
      const mdSSR = new MarkdownIt({ html: true })
      a.articleContent = mdSSR.render(a.articleContent || '')
      reactiveData.article = withFallbackAuthor(a)
      const plain = String(a.articleContent)
        .replace(/<\/?[^>]*>/g, '')
        .replace(/[|]*\n/, '')
        .replace(/&npsp;/gi, '')
      reactiveData.wordNum = Math.round(plain.length / 100) / 10 + 'k'
      reactiveData.readTime = Math.round(plain.length / 400) + 'mins'
      if (a.articleCover) commonStore.setHeaderImage(a.articleCover)
      if (a.preArticleCard) {
        const txt = mdSSR
          .render(a.preArticleCard.articleContent || '')
          .replace(/<\/?[^>]*>/g, '')
          .replace(/[|]*\n/, '')
          .replace(/&npsp;/gi, '')
        reactiveData.preArticleCard = { ...a.preArticleCard, articleContent: txt }
      }
      if (a.nextArticleCard) {
        const txt = mdSSR
          .render(a.nextArticleCard.articleContent || '')
          .replace(/<\/?[^>]*>/g, '')
          .replace(/[|]*\n/, '')
          .replace(/&npsp;/gi, '')
        reactiveData.nextArticleCard = { ...a.nextArticleCard, articleContent: txt }
      }
      loading.value = false
    }
  } catch {
    // ignore SSR failure; client will refetch on mounted
  }
})

onMounted(() => {
  reactiveData.articleId = getArticleIdFromParam(route.params.articleId)
  toPageTop()
  // If SSR already populated the article, avoid refetch (prevents flicker)
  if (!reactiveData.article.id) {
    fetchArticle()
  } else {
    loading.value = false
    nextTick(() => {
      Prism.highlightAll()
      initTocbot()
    })
  }
  fetchComments()
})

onUnmounted(() => {
  commonStore.resetHeaderImage()
  reactiveData.article = {}
  tocbot.destroy()
})

onBeforeRouteUpdate((to: RouteLocationNormalizedLoaded) => {
  reactiveData.article = {}
  reactiveData.readTime = ''
  reactiveData.wordNum = ''
  reactiveData.comments = []
  reactiveData.images = []
  reactiveData.preArticleCard = null
  reactiveData.nextArticleCard = null
  reactiveData.articleId = getArticleIdFromParam(to.params.articleId)
  pageInfo.current = 1
  reactiveData.isReload = true
  toPageTop()
  fetchArticle()
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

emitter.on('articleFetchComment', () => {
  pageInfo.current = 1
  reactiveData.isReload = true
  fetchComments()
})
emitter.on('articleFetchReplies', (payload: unknown) => {
  const index = typeof payload === 'number' ? payload : Number(payload)
  if (!Number.isFinite(index)) return
  fetchReplies(index)
})
emitter.on('articleLoadMore', () => {
  fetchComments()
})

const handlePreview = (image: string) => {
  v3ImgPreviewFn({ images: reactiveData.images, index: reactiveData.images.indexOf(image) })
}

const initTocbot = () => {
  if (!articleRef.value) return
  const nodes = articleRef.value.children
  if (nodes.length) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const reg = /^H[1-4]{1}$/
      if (reg.exec(node.tagName)) {
        node.id = String(i)
      }
    }
  }
  tocbot.init({
    tocSelector: '#toc1',
    contentSelector: '.post-html',
    headingSelector: 'h1, h2, h3',
    collapseDepth: 3,
    disableTocScrollSync: true,
    onClick: function (e) {
      e.preventDefault()
    }
  })
  const imgs = articleRef.value.getElementsByTagName('img')
  for (let i = 0; i < imgs.length; i++) {
    reactiveData.images.push(imgs[i].src)
    imgs[i].addEventListener('click', () => {
      handlePreview(imgs[i].currentSrc)
    })
  }
}

const fetchArticle = () => {
  if (reactiveData.articleId == null) {
    router.push({ path: '/404' })
    return
  }
  loading.value = true
  api.getArticeById(reactiveData.articleId).then(({ data }) => {
    if (data.code === 52003) {
      proxy?.$notify?.({
        title: 'Error',
        message: t('errors.article_password_failed'),
        type: 'error'
      })
      router.push({ path: '/404' })
      return
    }
    if (data.data === null) {
      router.push({ path: '/404' })
      return
    }
    commonStore.setHeaderImage(data.data.articleCover)
    const a = data.data as ArticleDetail
    a.articleContent = markdownToHtml(a.articleContent || '')
    reactiveData.article = withFallbackAuthor(a)
    reactiveData.wordNum = Math.round(deleteHTMLTag(a.articleContent || '').length / 100) / 10 + 'k'
    reactiveData.readTime = Math.round(deleteHTMLTag(a.articleContent || '').length / 400) + 'mins'
    loading.value = false
    nextTick(() => {
      Prism.highlightAll()
      initTocbot()
    })
    if (data.data.preArticleCard) {
      new Promise<ArticleCardData>((resolve) => {
        const preArticleCard = data.data.preArticleCard as ArticleCardData
        preArticleCard.articleContent = markdownToHtml(preArticleCard.articleContent || '')
          .replace(/<\/?[^>]*>/g, '')
          .replace(/[|]*\n/, '')
          .replace(/&npsp;/gi, '')
        resolve(preArticleCard)
      }).then((preArticleCard) => {
        reactiveData.preArticleCard = preArticleCard
      })
    }
    if (data.data.nextArticleCard) {
      new Promise<ArticleCardData>((resolve) => {
        const nextArticleCard = data.data.nextArticleCard as ArticleCardData
        nextArticleCard.articleContent = markdownToHtml(nextArticleCard.articleContent || '')
          .replace(/<\/?[^>]*>/g, '')
          .replace(/[|]*\n/, '')
          .replace(/&npsp;/gi, '')
        resolve(nextArticleCard)
      }).then((nextArticleCard) => {
        reactiveData.nextArticleCard = nextArticleCard
      })
    }
  })
}

const fetchComments = () => {
  const params = {
    type: 1,
    topicId: reactiveData.articleId,
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

const handleAuthorClick = (link?: string | null) => {
  const target = link && link !== '' ? link : window.location.href
  window.location.href = target
}

const toIso = (value?: string | number | Date) => {
  return value ? new Date(value).toISOString() : ''
}

const formatDate = (value?: string | number | Date) => {
  return value ? d(new Date(value), 'short') : ''
}

const toPageTop = () => {
  window.scrollTo({
    top: 0
  })
}

const deleteHTMLTag = (content: string) => {
  return String(content)
    .replace(/<\/?[^>]*>/g, '')
    .replace(/[|]*\n/, '')
    .replace(/&npsp;/gi, '')
}

const isMobile = computed(() => commonStore.isMobile)

// SEO head tags
const routeLocale = computed<SupportedLocale>(() => {
  const firstSegment = String(route.path.split('/').filter(Boolean)[0] || '')
  const normalized = normalizeLocaleKey(firstSegment)
  return isSupportedLocale(normalized) ? normalized : DEFAULT_LOCALE
})

const siteOrigin = computed(() => {
  const configured = String(runtimeConfig.public.siteUrl || '').trim()
  if (configured.length > 0) return configured.replace(/\/$/, '')
  if (import.meta.client) return window.location.origin
  return 'https://www.devillusion.asia'
})

const canonicalUrl = computed(() => `${siteOrigin.value}${route.path}`)
const plainText = computed(() => {
  const raw = reactiveData.article.articleContent || ''
  return String(raw)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_`~\-\[\]\(\)!]/g, '')
    .replace(/<\/?[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
})
const headTitle = computed(() => reactiveData.article.articleTitle || 'Article')
const articleAuthor = computed(() => {
  const nickname = reactiveData.article.author?.nickname
  if (typeof nickname === 'string' && nickname.trim().length > 0) return nickname.trim()
  return 'mcallzbl'
})

const localeSummary = computed(() => {
  return String(t('seo.article_page_suffix'))
})
const headDesc = computed(() => `${(plainText.value || headTitle.value).slice(0, 120)} | ${localeSummary.value}`.slice(0, 200))
const headImage = computed(() => reactiveData.article.articleCover || `${siteOrigin.value}/favicon.ico`)

useHead(() => ({
  title: headTitle.value,
  htmlAttrs: {
    lang: routeLocale.value
  },
  meta: [
    { key: 'description', name: 'description', content: headDesc.value },
    { key: 'author', name: 'author', content: articleAuthor.value },
    { key: 'og:title', property: 'og:title', content: headTitle.value },
    { key: 'og:description', property: 'og:description', content: headDesc.value },
    { key: 'og:type', property: 'og:type', content: 'article' },
    { key: 'og:url', property: 'og:url', content: canonicalUrl.value },
    { key: 'og:image', property: 'og:image', content: headImage.value },
    { key: 'og:site_name', property: 'og:site_name', content: "mcallzbl's blog" },
    { key: 'og:locale', property: 'og:locale', content: toOgLocale(routeLocale.value) },
    { key: 'article:author', property: 'article:author', content: articleAuthor.value },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: headTitle.value },
    { key: 'twitter:description', name: 'twitter:description', content: headDesc.value },
    { key: 'twitter:image', name: 'twitter:image', content: headImage.value }
  ],
  link: [{ key: 'canonical', rel: 'canonical', href: canonicalUrl.value }],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: headTitle.value,
        description: headDesc.value,
        inLanguage: routeLocale.value,
        datePublished: reactiveData.article.createTime || undefined,
        dateModified: reactiveData.article.updateTime || reactiveData.article.createTime || undefined,
        author: { '@type': 'Person', name: articleAuthor.value },
        publisher: { '@type': 'Person', name: 'mcallzbl' },
        image: headImage.value,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl.value }
      })
    }
  ]
}))
</script>
<style lang="scss">
.post-html {
  word-wrap: break-word;
  word-break: break-all;
}

#toc1 {
  max-height: 470px;
  overflow: hidden scroll;
}

#toc1 > ol {
  list-style: none;
  counter-reset: li;
  padding-left: 1.5rem;

  > li {
    @apply font-medium pb-1;
    &.is-active-li > .node-name--H1 {
      @apply text-ob;
    }

    &.is-active-li > .node-name--H2 {
      @apply text-ob;
    }

    &.is-active-li > .node-name--H3 {
      @apply text-ob;
    }
  }

  ol li {
    @apply font-medium mt-1.5 mb-1.5;
    padding-left: 1.5rem;

    &.is-active-li > .node-name--H2 {
      @apply text-ob;
    }

    &.is-active-li > .node-name--H3 {
      @apply text-ob;
    }

    ol li {
      @apply font-medium mt-1.5 mb-1.5;
      padding-left: 1.5rem;

      &.is-active-li .node-name--H3 {
        @apply text-ob;
      }
    }
  }

  ol,
  ol ol {
    position: relative;
  }

  > li::before,
  ol > li::before,
  ol ol > li::before,
  ol ol ol > li::before,
  ol ol ol ol > li::before {
    content: '•';
    color: var(--text-accent);
    display: inline-block;
    width: 1em;
    margin-left: -1.15em;
    padding: 0;
    font-weight: 500;
    text-shadow: 0 0 0.5em var(--accent-2);
  }

  > li::before {
    @apply text-xl;
  }

  > li > ol::before,
  > li > ol > li > ol::before {
    content: '';
    border-left: 1px solid var(--text-accent);
    position: absolute;
    opacity: 0.35;
    left: -1em;
    top: 0;
    bottom: 0;
  }

  > li > ol::before {
    left: -1.25em;
    border-left: 2px solid var(--text-accent);
  }
}

.pre-and-next-article {
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

.markdown-body .hljs-center {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
<style lang="scss" scoped>
.my-gap {
  gap: 1rem;
}
</style>
