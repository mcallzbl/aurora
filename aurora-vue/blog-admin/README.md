# aurora-admin

[English](./README.en.md) | [中文](#中文)

## 中文

### 项目设置

```sh
pnpm install
```

### 开发环境编译和热重载

```sh
pnpm dev
```

### 生产环境类型检查、编译和压缩

```sh
pnpm build
```

### 使用 [Vitest](https://vitest.dev/) 运行单元测试

```sh
pnpm test:unit
```

### 使用 [ESLint](https://eslint.org/) 进行代码检查

```sh
pnpm lint
```

## 多语言使用

项目已配置 Vue I18n 多语言支持，默认支持中文和英文。

### 在模板中使用

```vue

<template>
  <h1>{{ $t('common.welcome') }}</h1>
  <p>{{ $t('messages.loading') }}</p>
</template>

```

### 在 Composition API 中使用

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// 使用翻译
const message = t('common.hello')

// 切换语言
const switchLanguage = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}
</script>
```

### 语言文件位置

- 中文：`src/i18n/locales/zh.json`
- 英文：`src/i18n/locales/en.json`

### 添加新的翻译

在对应的语言文件中添加键值对：

```json
{
  "your": {
    "custom": {
      "message": "你的自定义消息"
    }
  }
}
```

然后在代码中使用：`{{ $t('your.custom.message') }}`
