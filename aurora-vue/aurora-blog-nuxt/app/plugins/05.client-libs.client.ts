import defaultCover from '@/assets/default-cover.jpg'

let clientLibReady = false

export default defineNuxtPlugin(async (nuxtApp) => {
  if (clientLibReady) return
  clientLibReady = true

  const [{ default: VueClickAway }, { default: infiniteScroll }, { default: v3ImgPreview }, { default: lazyPlugin }] =
    await Promise.all([
      import('vue3-click-away'),
      import('vue3-infinite-scroll-better'),
      import('v3-img-preview'),
      import('vue3-lazy')
    ])

  nuxtApp.vueApp.use(VueClickAway)
  const registeredDirectives = (nuxtApp.vueApp as { _context?: { directives?: Record<string, unknown> } })._context
    ?.directives
  const hasInfiniteScroll =
    typeof registeredDirectives === 'object' &&
    registeredDirectives !== null &&
    ('InfiniteScroll' in registeredDirectives ||
      'infiniteScroll' in registeredDirectives ||
      'infinite-scroll' in registeredDirectives)
  if (!hasInfiniteScroll) {
    nuxtApp.vueApp.use(infiniteScroll)
  }
  nuxtApp.vueApp.use(v3ImgPreview, {})
  nuxtApp.vueApp.use(lazyPlugin, {
    loading: defaultCover,
    error: defaultCover
  })
})
