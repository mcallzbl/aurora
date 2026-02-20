import type { Directive } from 'vue'

const ssrDirective: Directive = {
  getSSRProps: () => ({})
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('lazy', ssrDirective)
  nuxtApp.vueApp.directive('infinite-scroll', ssrDirective)
  nuxtApp.vueApp.directive('click-away', ssrDirective)
})
