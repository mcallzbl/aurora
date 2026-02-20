# Aurora Blog Nuxt 重写协作说明

## 目标
- 将 `aurora-blog`（Vue + Vite SSG）重写到 `aurora-blog-nuxt`（Nuxt 4）。
- 多语言采用目录式路由（例如：`/en/...`、`/zh/...`、`/ja/...`、`/zh-TW/...`）。
- 第一阶段优先保证界面与交互尽可能贴近原版。
- 同时完成解耦：页面结构、业务数据、样式主题分层，便于后续独立重写 UI。

## 当前分析结论（2026-02-20）
- 原项目核心入口是 `src/entry-ssg.ts`，路由定义在 `src/router/index.ts`，页面在 `src/views/*.vue`。
- 现有页面路由：`/`、`/articles/:articleId`、`/talks`、`/talks/:talkId`、`/archives`、`/article-list/:tagId`、`/tags`、`/about`、`/message`、`/friends`、`/photos/:albumId`、`/oauth/login/qq`、`/404`。
- 现有语言资源：`en`、`zh`、`ja`、`zh-TW`（`src/locales/languages/*.json`）。
- 全局状态使用 Pinia（`app/common/user/local/meta/...`），主题与 i18n 当前在 store 内有耦合。
- API 统一通过 `src/api/api.ts` 的 axios 调用 `/api/*`，应保留后端契约不变。
- 全局样式基于 `src/styles/index.css` + `src/styles/theme-variables.css` + Tailwind；UI 迁移需先复用视觉变量，再逐步组件化。

## 解耦约束
- 页面层：只负责布局与组合，不直接堆叠复杂请求逻辑。
- 业务层：将 API 与数据处理下沉到 `services`/`composables`。
- 视图层：组件尽量无业务副作用，靠 props/events 驱动。
- 样式层：保留主题变量（CSS variables），避免把业务逻辑写进样式。
- i18n 层：文案资源与路由 locale 解耦，统一 locale 规范化处理。

## TODO（每完成一项必须更新）
- [x] 分析原项目结构、路由、i18n、状态与样式基线（完成日期：2026-02-20）
- [x] 在 `aurora-blog-nuxt` 建立目录式多语言路由骨架（`[locale]` + 默认语言重定向策略）（完成日期：2026-02-20）
- [x] 建立 Nuxt i18n 方案并迁移 `en/zh/ja/zh-TW` 文案（完成日期：2026-02-20）
- [x] 建立基础布局（Header/Banner/Footer/MobileMenu）并保证外观接近原版（完成日期：2026-02-20）
- [x] 迁移核心页面（Home、Article、TalkList、Talk、Archives、Tags、About、Message、Friends、Photos）（完成日期：2026-02-20）
- [x] 迁移全局状态并做职责拆分（app/common/user/meta/search 等）（完成日期：2026-02-20）
- [x] 迁移 API 层到 Nuxt 可复用请求模块（含鉴权 header 与错误提示策略）（完成日期：2026-02-20）
- [x] 迁移主题系统（明暗主题、渐变变量、全局过渡、NProgress 风格）（完成日期：2026-02-20）
- [x] 迁移 SEO/Head 逻辑（标题、favicon、关键 meta）（完成日期：2026-02-20）
- [x] 对齐功能回归清单（路由可达性、分页、评论、搜索、语言切换、主题切换）（完成日期：2026-02-20，清单见 `aurora-blog-nuxt/docs/regression-checklist.md`）
- [x] 输出“可替换 UI 外壳”接口文档（为后续重写界面做边界约定）（完成日期：2026-02-20，文档见 `aurora-blog-nuxt/docs/ui-shell-contract.md`）
- [x] 安装依赖并完成 `pnpm build` 验证（完成日期：2026-02-20，当前可构建，仍有 Tailwind CSS minify 警告待后续清理）
- [x] 修复 Nuxt 首轮回归问题：Header 控件可见性、导航偏移、底部高度计算、多语言开关兼容（完成日期：2026-02-20）
- [x] 修复 Tailwind `@apply` 在 Nuxt 中的编译链（完成日期：2026-02-20，已切换 `@tailwindcss/postcss` 并通过构建验证）
- [x] 实现 Nuxt 预渲染 SEO 方案（静态路由 + 构建期动态路由采集，含多语言路径）（完成日期：2026-02-20）
- [x] 输出部署文档（SSR 推荐方案 + 静态部署备选 + systemd/nginx 示例）（完成日期：2026-02-20，文档见 `aurora-blog-nuxt/docs/deployment.md`）
- [x] 实现 `SSR` 实时 `sitemap.xml`（按最新 API 数据动态生成，移除静态 sitemap 文件）（完成日期：2026-02-20）

## 更新规则（强制）
- 完成任意 TODO 后，必须在本文件把对应项改为 `[x]`，并补充完成日期。
- 若任务拆分或新增，直接在 TODO 中追加，禁止只口头说明不落文档。
