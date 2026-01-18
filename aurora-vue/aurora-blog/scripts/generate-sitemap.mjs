import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = process.env.SITE_URL || 'https://www.devillusion.asia'
const API_BASE = process.env.VITE_API_BASE || process.env.API_BASE || 'https://www.devillusion.asia/api'
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'dist'

async function safeJson(url) {
  try {
    const r = await fetch(url)
    return await r.json()
  } catch {
    console.warn('[sitemap] fetch failed:', url)
    return null
  }
}

async function gatherRoutes() {
  const urls = new Set(['/', '/archives', '/tags', '/about', '/message', '/friends'])

  let fetched = false
  // Try fetching from API (preferred)
  try {
    const tags = await safeJson(`${API_BASE}/tags/all`)
    if (tags?.data && Array.isArray(tags.data)) {
      for (const t of tags.data) {
        urls.add(`/article-list/${encodeURIComponent(t.id)}?tagName=${encodeURIComponent(t.tagName || '')}`)
      }
      fetched = true
    }
    const size = 100
    let current = 1
    while (true) {
      const j = await safeJson(`${API_BASE}/articles/all?current=${current}&size=${size}`)
      const rec = Array.isArray(j?.data?.records) ? j.data.records : []
      if (rec.length === 0) break
      for (const a of rec) urls.add(`/articles/${encodeURIComponent(a.id)}`)
      if (rec.length < size) break
      current += 1
      fetched = true
    }
  } catch {
    // ignore; will fallback to dist scan
  }

  // Fallback: scan dist for .html files and map to routes
  if (!fetched) {
    const distDir = path.resolve(process.cwd(), 'dist')
    if (fs.existsSync(distDir)) {
      const stack = [distDir]
      while (stack.length) {
        const dir = stack.pop()
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const ent of entries) {
          const full = path.join(dir, ent.name)
          if (ent.isDirectory()) {
            stack.push(full)
          } else if (ent.isFile() && ent.name.endsWith('.html')) {
            const rel = path.relative(distDir, full).replace(/\\/g, '/')
            // Convert filename to URL path
            let route
            if (rel === 'index.html') route = '/'
            else route = `/${rel.replace(/\.html$/, '')}`
            // Skip obvious non-pages
            if (/^\/404$/.test(route)) continue
            urls.add(route)
          }
        }
      }
    }
  }
  return Array.from(urls)
}

function xmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function main() {
  const routes = await gatherRoutes()
  const rows = routes.map((r) => `  <url>\n    <loc>${xmlEscape(SITE_URL + r)}</loc>\n  </url>`).join('\n')
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`

  const outDist = path.resolve(process.cwd(), OUTPUT_DIR, 'sitemap.xml')
  fs.mkdirSync(path.dirname(outDist), { recursive: true })
  fs.writeFileSync(outDist, xml, 'utf-8')
  console.log(`[sitemap] Wrote ${outDist} with ${routes.length} URLs`)
  // also update public/sitemap.xml for dev/preview convenience (best-effort)
  try {
    const outPublic = path.resolve(process.cwd(), 'public', 'sitemap.xml')
    fs.mkdirSync(path.dirname(outPublic), { recursive: true })
    fs.writeFileSync(outPublic, xml, 'utf-8')
  } catch {}
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
