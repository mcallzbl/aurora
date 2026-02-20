import { getQuery, getRequestHeaders, proxyRequest } from 'h3'

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const base = trimTrailingSlash(config.public.apiBase)
  const query = new URLSearchParams(getQuery(event) as Record<string, string>).toString()
  const target = query ? `${base}?${query}` : base

  return proxyRequest(event, target, {
    headers: getRequestHeaders(event)
  })
})
