import { getQuery, getRequestHeaders, proxyRequest } from 'h3'

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const path = event.context.params?.path || ''
  const base = trimTrailingSlash(config.public.apiBase)
  const query = new URLSearchParams(getQuery(event) as Record<string, string>).toString()
  const target = `${base}/${path}${query ? `?${query}` : ''}`

  return proxyRequest(event, target, {
    headers: getRequestHeaders(event)
  })
})
