# Aurora Blog Nuxt 部署方案

## 1. 目标与默认策略
- SEO 优先：已开启 Nuxt/Nitro 预渲染（`nitro.prerender` + 构建期动态路由采集）。
- 推荐生产方案：`SSR + 反向代理 + 缓存`。
- 可选方案：纯静态部署（适合低成本托管，但交互页面和动态内容实时性较弱）。

## 2. 关键环境变量
在生产环境至少提供：

```bash
VITE_API_BASE=https://www.devillusion.asia/api
NUXT_DEVTOOLS=false
NODE_ENV=production
NITRO_PORT=3000
NITRO_HOST=0.0.0.0
```

说明：
- `VITE_API_BASE` 会用于客户端请求和构建期动态路由预渲染采集。
- `NUXT_DEVTOOLS` 生产建议关闭。

## 3. 方案 A（推荐）：SSR Node 服务

### 3.1 构建
```bash
pnpm install --frozen-lockfile
pnpm build
```

### 3.2 启动
```bash
node .output/server/index.mjs
```

### 3.3 systemd 示例
新建服务文件 `/etc/systemd/system/aurora-blog-nuxt.service`：

```ini
[Unit]
Description=Aurora Blog Nuxt
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/ubuntu/aurora/blog-nuxt/dist
Environment=NODE_ENV=production
Environment=NUXT_DEVTOOLS=false
Environment=VITE_API_BASE=https://blog.mcallzbl.com/api
Environment=SITE_URL=https://blog.mcallzbl.com
Environment=NITRO_HOST=0.0.0.0
Environment=NITRO_PORT=3638
ExecStart=/home/ubuntu/.nvm/versions/node/v24.12.0/bin/node /home/ubuntu/aurora/blog-nuxt/dist/server/index.mjs
Restart=always
RestartSec=3
User=ubuntu
Group=ubuntu
```

启停命令（你本机执行）：

```bash
sudo systemctl daemon-reload
sudo systemctl enable aurora-blog-nuxt
sudo systemctl restart aurora-blog-nuxt
sudo systemctl status aurora-blog-nuxt
```

### 3.4 Nginx 反向代理（示例）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:3000;
    }
}
```

建议配合 HTTPS（Let's Encrypt）并开启 gzip/brotli。

## 4. 方案 B：静态部署（`nuxt generate`）

### 4.1 生成
```bash
pnpm install --frozen-lockfile
pnpm generate
```

输出目录默认在 `.output/public`，可部署到：
- Nginx 静态站点
- Cloudflare Pages
- Netlify / Vercel 静态托管

### 4.2 Nginx 静态站点示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /home/mcallzbl/File2/Workshop/Github/aurora/aurora-vue/aurora-blog-nuxt/.output/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4.3 限制
- 静态构建后内容固定，新增文章/标签/相册需重新构建发布。
- 依赖实时服务端能力的场景不如 SSR 灵活。

## 5. 预渲染策略说明
项目当前预渲染包含：
- 多语言静态页面：`/en`、`/zh`、`/ja`、`/zh-TW` 及其核心子路由。
- 构建期动态采集：文章、说说、标签列表、相册详情页面。
- `crawlLinks: true`：自动补采页面中的可爬取链接。
- `sitemap.xml`：由 SSR 路由实时生成（`server/routes/sitemap.xml.ts`），非静态文件。

建议：
- 每次上线前执行 `pnpm build`（SSR）或 `pnpm generate`（静态）验证预渲染结果。
- 如果 API 有访问限制，确保构建环境可访问 `VITE_API_BASE`。
- 若使用 CDN，请对 `/sitemap.xml` 关闭强缓存，避免搜索引擎拿到旧内容。
