<template>
  <div id="App-Wrapper" :class="[appWrapperClass, theme, pageClass]" :style="wrapperStyle">
    <div
      id="App-Container"
      :style="cssVariables"
      class="app-container mx-auto w-full max-w-10/12 lg:max-w-screen-2xl px-3 lg:px-8"
      tabindex="-1"
      @keydown.meta.k.stop.prevent="">
      <HeaderMain />
      <div :style="headerImage" class="app-banner app-banner-image" />
      <div :style="headerBaseBackground" class="app-banner app-banner-screen" />
      <div class="relative z-10">
        <slot />
      </div>
    </div>
    <div id="loading-bar-wrapper" class="nprogress-custom-parent"></div>
  </div>
  <Footer id="footer" :style="cssVariables" />
  <div v-if="isMobile" class="App-Mobile-sidebar">
    <div id="App-Mobile-Profile" class="App-Mobile-wrapper">
      <MobileMenu />
    </div>
  </div>
  <AuroraNavigator />
  <Dia v-if="!isMobile" />
  <UserCenter />
  <LanguageModal />
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead, useRuntimeConfig } from '#imports'
import { useAppStore } from '@/stores/app'
import { useCommonStore } from '@/stores/common'
import { useMetaStore } from '@/stores/meta'
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  normalizeLocaleKey,
  SUPPORTED_LOCALES,
  toOgLocale,
  type SupportedLocale
} from '@/config/i18n'
import HeaderMain from '@/components/Header/src/Header.vue'
import Footer from '@/components/Footer.vue'
import MobileMenu from '@/components/MobileMenu.vue'
import Dia from '@/components/Dia.vue'
import AuroraNavigator from '@/components/AuroraNavigator.vue'
import UserCenter from '@/components/UserCenter.vue'
import LanguageModal from '@/components/LanguageModal.vue'
import api from '@/api/api'
import defaultCover from '@/assets/default-cover.jpg'

const appStore = useAppStore()
const commonStore = useCommonStore()
const metaStore = useMetaStore()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const { t } = useI18n()
const MOBILE_WIDTH = 996
const appWrapperClass = 'app-wrapper'
const wrapperStyle = ref({ minHeight: '100vh' })

const isMobile = computed(() => commonStore.isMobile)

onMounted(() => {
  initialApp()
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('copy', copyEventHandler)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', resizeHandler)
  }
})

const initialApp = () => {
  initResizeEvent()
  initialCopy()
  initWindowOnload()
  fetchWebsiteConfig()
  nextTick(() => {
    updateWrapperMinHeight()
  })
  appStore.initializeTheme(appStore.themeConfig.theme)

  api.report()
}

const updateWrapperMinHeight = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const footerEl = document.getElementById('footer')
  const footerHeight = footerEl?.getBoundingClientRect().height ?? 0
  const minHeight = Math.max(window.innerHeight - footerHeight, 320)
  wrapperStyle.value = {
    minHeight: `${minHeight}px`
  }
}

const fetchWebsiteConfig = async () => {
  try {
    const { data } = await api.getWebsiteConfig()
    const payload = data && typeof data === 'object' && 'data' in data ? (data as Record<string, unknown>).data : data
    const normalizedPayload =
      payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : ({} as Record<string, unknown>)
    const configCandidate = normalizedPayload.websiteConfigDTO ?? normalizedPayload.websiteConfig
    const configData =
      configCandidate && typeof configCandidate === 'object'
        ? (configCandidate as Record<string, unknown>)
        : ({} as Record<string, unknown>)
    appStore.$patch({
      viewCount: Number(normalizedPayload.viewCount ?? 0),
      articleCount: Number(normalizedPayload.articleCount ?? 0),
      talkCount: Number(normalizedPayload.talkCount ?? 0),
      categoryCount: Number(normalizedPayload.categoryCount ?? 0),
      tagCount: Number(normalizedPayload.tagCount ?? 0),
      websiteConfig: configData
    })
    initFavicon(typeof configData.favicon === 'string' ? configData.favicon : '')
    nextTick(() => {
      updateWrapperMinHeight()
    })
  } catch (error) {
    console.error('配置获取失败', error)
    nextTick(() => {
      updateWrapperMinHeight()
    })
  }
}

const copyEventHandler = (event: ClipboardEvent) => {
  if (document.getSelection() instanceof Selection) {
    if (document.getSelection()?.toString() !== '' && event.clipboardData) {
      event.clipboardData.setData('text', document.getSelection()?.toString() ?? '')
      event.preventDefault()
    }
  }
}

const initialCopy = () => {
  document.addEventListener('copy', copyEventHandler)
}

const resizeHandler = () => {
  const rect = document.body.getBoundingClientRect()
  const mobileState = rect.width - 1 < MOBILE_WIDTH
  if (isMobile.value !== mobileState) commonStore.changeMobileState(mobileState)
  updateWrapperMinHeight()
}

const initResizeEvent = () => {
  resizeHandler()
  window.addEventListener('resize', resizeHandler)
}

const initWindowOnload = () => {
  window.onload = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0 })
    }, 10)
  }
}

const initFavicon = (faviconUrl: string) => {
  if (!faviconUrl) return
  let favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
  if (!favicon) {
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    document.head.appendChild(favicon)
  }
  if (favicon.href !== faviconUrl) {
    favicon.href = faviconUrl
  }
}

const title = computed(() => appStore.websiteConfig.websiteTitle || metaStore.title)
const theme = computed(() => appStore.themeConfig.theme)

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

const siteAuthor = computed(() => {
  const author = appStore.websiteConfig.author
  if (typeof author === 'string' && author.trim().length > 0) return author.trim()
  return 'mcallzbl'
})

const siteDescription = computed(() => {
  return String(t('seo.site_description'))
})

const canonicalUrl = computed(() => `${siteOrigin.value}${route.path}`)
const alternateOgLocales = computed(() => SUPPORTED_LOCALES.filter((item) => item !== routeLocale.value).map((item) => toOgLocale(item)))

useHead(() => ({
  title: title.value,
  htmlAttrs: {
    lang: routeLocale.value
  },
  meta: [
    { key: 'description', name: 'description', content: siteDescription.value },
    { key: 'author', name: 'author', content: siteAuthor.value },
    { key: 'og:title', property: 'og:title', content: title.value },
    { key: 'og:description', property: 'og:description', content: siteDescription.value },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'og:url', property: 'og:url', content: canonicalUrl.value },
    { key: 'og:site_name', property: 'og:site_name', content: title.value },
    { key: 'og:locale', property: 'og:locale', content: toOgLocale(routeLocale.value) },
    ...(alternateOgLocales.value.length > 0
      ? [{ key: 'og:locale:alternate', property: 'og:locale:alternate', content: alternateOgLocales.value.join(',') }]
      : []),
    { key: 'twitter:card', name: 'twitter:card', content: 'summary' },
    { key: 'twitter:title', name: 'twitter:title', content: title.value },
    { key: 'twitter:description', name: 'twitter:description', content: siteDescription.value }
  ],
  link: [{ key: 'canonical', rel: 'canonical', href: canonicalUrl.value }]
}))

const headerImage = computed(() => ({
  backgroundImage: `url(${commonStore.headerImage}), url(${defaultCover})`,
  opacity: commonStore.headerImage !== '' ? 1 : 0
}))

const headerBaseBackground = computed(() => ({
  background: appStore.themeConfig.header_gradient_css,
  opacity: commonStore.headerImage !== '' ? 0.91 : 0.99
}))

const cssVariables = computed(() => {
  const { theme: currentTheme, gradient, header_gradient_css } = appStore.themeConfig
  if (currentTheme === 'theme-dark') {
    return `
      --text-accent: ${gradient.color_1};
      --text-sub-accent: ${gradient.color_3};
      --main-gradient: ${header_gradient_css};
    `
  }
  return `
    --text-accent: ${gradient.color_3};
    --text-sub-accent: ${gradient.color_2};
    --main-gradient: ${header_gradient_css};
  `
})

const pageClass = computed(() => (/^\/[A-Za-z-]+\/articles\//.test(route.path) ? 'page-article' : ''))
</script>

<style>
@reference "../styles/tailwind.css";

.arrow-left > .icon,
.arrow-right > .icon {
  display: inline !important;
}

.img-error {
  display: none !important;
}

.el-drawer {
  background-color: var(--background-primary) !important;
}

.el-dialog {
  background-color: var(--background-primary) !important;
}

body {
  background: var(--background-primary-alt);
  color: var(--text-normal);
  overflow-x: hidden;
}

*:focus {
  outline: none;
}

#__nuxt,
#app {
  position: relative;
  min-width: 100%;
  min-height: 100vh;
  height: 100%;
  font-family: Rubik, Avenir, Helvetica, Arial, sans-serif;
}

.app-wrapper {
  background-color: var(--background-primary);
  color: var(--text-normal);
  min-width: 100%;
  height: 100%;
  padding-bottom: 3rem;
  transition-property: transform, border-radius;
  transition-duration: 350ms;
  transition-timing-function: ease;
  transform-origin: 0 42%;
}

.app-container {
  color: var(--text-normal);
  margin: 0 auto;
}

.header-wave {
  position: absolute;
  top: 100px;
  left: 0;
  z-index: 1;
}

.App-Mobile-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
}

.App-Mobile-wrapper {
  position: relative;
  overflow-y: auto;
  height: 100%;
  margin-right: -1rem;
  padding-right: 1.5rem;
  padding-left: 1rem;
  padding-top: 2rem;
  opacity: 0;
  transition: all 0.85s cubic-bezier(0, 1.8, 1, 1.2);
  transform: translateY(-20%);
  width: 280px;
}

.app-banner {
  content: '';
  display: block;
  height: 600px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
  clip-path: polygon(
    100% 0,
    0 0,
    0 77.5%,
    1% 77.4%,
    2% 77.1%,
    3% 76.6%,
    4% 75.9%,
    5% 75.05%,
    6% 74.05%,
    7% 72.95%,
    8% 71.75%,
    9% 70.55%,
    10% 69.3%,
    11% 68.05%,
    12% 66.9%,
    13% 65.8%,
    14% 64.8%,
    15% 64%,
    16% 63.35%,
    17% 62.85%,
    18% 62.6%,
    19% 62.5%,
    20% 62.65%,
    21% 63%,
    22% 63.5%,
    23% 64.2%,
    24% 65.1%,
    25% 66.1%,
    26% 67.2%,
    27% 68.4%,
    28% 69.65%,
    29% 70.9%,
    30% 72.15%,
    31% 73.3%,
    32% 74.35%,
    33% 75.3%,
    34% 76.1%,
    35% 76.75%,
    36% 77.2%,
    37% 77.45%,
    38% 77.5%,
    39% 77.3%,
    40% 76.95%,
    41% 76.4%,
    42% 75.65%,
    43% 74.75%,
    44% 73.75%,
    45% 72.6%,
    46% 71.4%,
    47% 70.15%,
    48% 68.9%,
    49% 67.7%,
    50% 66.55%,
    51% 65.5%,
    52% 64.55%,
    53% 63.75%,
    54% 63.15%,
    55% 62.75%,
    56% 62.55%,
    57% 62.5%,
    58% 62.7%,
    59% 63.1%,
    60% 63.7%,
    61% 64.45%,
    62% 65.4%,
    63% 66.45%,
    64% 67.6%,
    65% 68.8%,
    66% 70.05%,
    67% 71.3%,
    68% 72.5%,
    69% 73.6%,
    70% 74.65%,
    71% 75.55%,
    72% 76.35%,
    73% 76.9%,
    74% 77.3%,
    75% 77.5%,
    76% 77.45%,
    77% 77.25%,
    78% 76.8%,
    79% 76.2%,
    80% 75.4%,
    81% 74.45%,
    82% 73.4%,
    83% 72.25%,
    84% 71.05%,
    85% 69.8%,
    86% 68.55%,
    87% 67.35%,
    88% 66.2%,
    89% 65.2%,
    90% 64.3%,
    91% 63.55%,
    92% 63%,
    93% 62.65%,
    94% 62.5%,
    95% 62.55%,
    96% 62.8%,
    97% 63.3%,
    98% 63.9%,
    99% 64.75%,
    100% 65.7%
  );
}

.app-banner-image {
  z-index: 1;
  background-size: cover;
  opacity: 0;
  transition: ease-in-out opacity 300ms;
}

.app-banner-screen {
  transition: ease-in-out opacity 300ms;
  z-index: 2;
  opacity: 0.91;
}

@media (max-width: 768px) {
  .page-article .app-banner {
    display: none !important;
  }

  .page-article .site-header,
  .page-article .site-header * {
    color: var(--text-normal) !important;
    text-shadow: none !important;
  }

  .page-article .header-controls span {
    color: var(--text-normal) !important;
  }

  .page-article .header-controls .svg-icon {
    stroke: currentColor !important;
    fill: currentColor !important;
  }
}
</style>
