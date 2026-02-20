# UI 外壳边界约定

## 目标
在不改业务数据层的前提下，可随时替换页面视觉实现。

## 分层
- `app/layouts/default.vue`: 全局壳层（Header/Banner/Footer/移动菜单/导航挂件）。
- `app/views/*`: 页面容器，负责页面结构与页面级交互。
- `app/components/*`: 纯展示或轻交互组件，不直接持有后端协议。
- `app/services/blog-api.ts`: 后端接口契约。
- `server/api/[...path].ts`: 前端到后端的代理边界。

## 约束
- 页面和组件不直接写死后端域名，只通过 `/api/*`。
- 新 UI 重写时，优先保持 `services` 与 `stores` API 不变。
- 新 UI 可以替换 `layouts/default.vue` 与 `components/*`，但不得修改 `server/api` 代理契约。

## 推荐替换路径
1. 先换 `layouts/default.vue` 的视觉结构。
2. 再逐页替换 `app/views/*`。
3. 最后替换 `app/components/*` 细节组件。
