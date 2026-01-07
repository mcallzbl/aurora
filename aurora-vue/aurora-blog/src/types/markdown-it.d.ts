declare module 'markdown-it' {
  import type { PluginSimple } from 'markdown-it'
  export default class MarkdownIt {
    constructor(options?: any)

    use(plugin: PluginSimple | any, ...params: any[]): this

    render(src: string, env?: any): string
  }
}
