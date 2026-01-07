<template>
  <div class="sidebar-box">
    <SubTitle :title="'titles.website_info'" icon="website-info" />
    <ul class="mx-auto">
      <li class="pb-3">
        <span class="text-sm font-medium">{{ t('settings.running-time') }}:</span>
        <span v-if="websiteCreateTime !== ''" class="text-sm font-medium text-right float-right">
          {{ websiteCreateTime }}
        </span>
        <ob-skeleton v-else class="float-right" height="16px" tag="span" width="136px" />
      </li>
      <li class="pb-2">
        <span class="text-sm font-medium">{{ t('settings.view-count') }}:</span>
        <span v-if="viewCount" class="text-sm font-medium text-right float-right">{{ viewCount }}</span>
        <ob-skeleton v-else class="float-right" height="16px" tag="span" width="60px" />
      </li>
    </ul>
  </div>
  
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { SubTitle } from '@/components/Title'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'WebsiteInfo' })

const { t } = useI18n()
const appStore = useAppStore()

const websiteCreateTime = ref('')
const viewCount = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const runTime = () => {
  const created = appStore.websiteConfig?.websiteCreateTime
  if (!created) return

  const now = Date.now()
  const start = new Date(created).getTime()
  const diff = Math.max(0, now - start)
  const dayMs = 24 * 60 * 60 * 1000
  const hourMs = 60 * 60 * 1000
  const minuteMs = 60 * 1000

  const days = Math.floor(diff / dayMs)
  const hours = Math.floor((diff % dayMs) / hourMs)
  const minutes = Math.floor((diff % hourMs) / minuteMs)
  const seconds = Math.floor((diff % minuteMs) / 1000)

  websiteCreateTime.value = `${days}${t('settings.days_suffix')}${hours}${t('settings.hours_suffix')}${minutes}${t('settings.minutes_suffix')}${seconds}${t('settings.seconds_suffix')}`
  viewCount.value = appStore.viewCount
}

onMounted(() => {
  runTime()
  timer = setInterval(runTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
