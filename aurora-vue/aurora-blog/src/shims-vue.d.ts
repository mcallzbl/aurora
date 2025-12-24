/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
declare module 'vue-avatar-cropper'
declare module 'js-cookie'
declare module 'markdown-it-katex-external'
declare module 'markdown-it-emoji'
declare module 'markdown-it-container'
declare module 'markdown-it-sup'
declare module 'markdown-it-sub'
declare module 'markdown-it-footnote'
declare module 'markdown-it-abbr'
declare module 'markdown-it-ins'
declare module 'markdown-it-mark'
declare module '@iktakahiro/markdown-it-katex'
declare module '@agoose77/markdown-it-mermaid'
declare module 'v3-img-preview'

declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}
declare module 'vue-router'
