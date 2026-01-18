declare module 'markdown-it' {
  export type MarkdownItOptions = {
    html?: boolean
    [key: string]: unknown
  }

  export type PluginSimple = (md: MarkdownIt) => void
  export type PluginWithOptions<T = unknown> = (md: MarkdownIt, options?: T) => void

  export default class MarkdownIt {
    constructor(options?: MarkdownItOptions)

    use(
      plugin: PluginSimple | PluginWithOptions | ((md: MarkdownIt, ...params: unknown[]) => void),
      ...params: unknown[]
    ): this

    render(src: string, env?: Record<string, unknown>): string
  }
}
