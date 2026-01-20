# aurora-admin

[English](#english) | [中文](./README.md)

## English

### Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

## Internationalization (i18n)

This project is configured with Vue I18n for multi-language support. Chinese and English are supported by default.

### Usage in Templates

```vue

<template>
  <h1>{{ $t('common.welcome') }}</h1>
  <p>{{ $t('messages.loading') }}</p>
</template>

```

### Usage in Composition API

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// Use translation
const message = t('common.hello')

// Switch language
const switchLanguage = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}
</script>
```

### Language Files Location

- Chinese: `src/i18n/locales/zh.json`
- English: `src/i18n/locales/en.json`

### Adding New Translations

Add key-value pairs in the corresponding language files:

```json
{
  "your": {
    "custom": {
      "message": "Your custom message"
    }
  }
}
```

Then use in code: `{{ $t('your.custom.message') }}`
