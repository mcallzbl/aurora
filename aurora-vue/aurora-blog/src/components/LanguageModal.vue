<template>
  <div v-if="visible" id="language-modal" tabindex="-1" @keydown.esc="close" @click.self="close">
    <transition mode="out-in" name="fade-bounce-pure-y">
      <div v-if="visible" class="lang-container">
        <header class="lang-header">
          <h3 class="lang-title">{{ t('settings.tips-open-language') }}</h3>
          <button class="lang-close" type="button" @click="close">
            <svg-icon icon-class="close" />
          </button>
        </header>
        <div class="lang-list">
          <ul>
            <li v-for="code in locales" :key="code">
              <button type="button" :class="['lang-item', { active: code === locale }]" @click="switchLocale(code)">
                <span class="name">{{ getName(code) }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import emitter from '@/utils/mitt'

const appStore = useAppStore()
const { t, locale, availableLocales, te } = useI18n()

const visible = ref(false)
const locales = computed(() => availableLocales)

const open = () => {
  visible.value = true
  document.body.classList.add('modal--active')
}
const close = () => {
  visible.value = false
  document.body.classList.remove('modal--active')
}
const switchLocale = (code: string) => {
  appStore.changeLocale(code)
  close()
}
const getName = (code: string) => {
  const key = `languages.${code}`
  if (te && te(key)) return t(key)
  return code
}

onMounted(() => {
  emitter.on('openLanguageModal', open)
})
onUnmounted(() => {
  emitter.off('openLanguageModal', open)
})
</script>

<style lang="scss" scoped>
#language-modal {
  @apply fixed h-screen w-screen top-0 left-0 transition-colors;
  background-color: rgba(26, 26, 26, 0.8);
  z-index: 250;
}

.lang-container {
  @apply bg-ob-deep-900 rounded-2xl shadow-2xl mt-16 mb-auto mr-2 lg:mr-auto ml-2 lg:ml-auto max-w-xl relative;
}

.lang-header {
  @apply flex items-center justify-between px-4 pt-4;
}
.lang-title {
  @apply text-ob-bright text-xl font-semibold m-0;
}
.lang-close {
  @apply appearance-none bg-transparent border-0 text-ob cursor-pointer;
}
.lang-list {
  @apply px-4 mt-2 overflow-y-auto pb-4;
  max-height: 420px;
}
.lang-item {
  @apply w-full flex items-center gap-3 rounded-lg shadow-md border-2 px-3 py-2 mb-2 text-left;
  background: var(--background-primary-alt);
  border-color: var(--background-secondary);
  color: var(--text-normal);
}
.lang-item.active {
  border-color: var(--text-accent);
  color: var(--text-bright);
}
.name {
  opacity: 0.9;
}
</style>
