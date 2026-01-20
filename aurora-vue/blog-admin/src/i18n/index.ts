import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

const messages = {
  en,
  zh,
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: 'zh', // 默认语言
  fallbackLocale: 'en', // 回退语言
  messages,
  globalInjection: true, // 全局注入 $t 函数
})

export default i18n
