<template>
  <ul class="flex flex-row justify-evenly flex-wrap w-full py-4 px-2 text-center items-center">
    <a v-if="websiteConfig.github" ref="github" :href="websiteConfig.github" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="github" />
      </li>
    </a>
    <a v-if="websiteConfig.gitee" ref="github" :href="websiteConfig.gitee" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="gitee" />
      </li>
    </a>
    <a v-if="websiteConfig.twitter" ref="twitter" :href="websiteConfig.twitter" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="twitter" />
      </li>
    </a>
    <a v-if="websiteConfig.stackoverflow" ref="stackoverflow" :href="websiteConfig.stackoverflow" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="stackoverflow" />
      </li>
    </a>
    <a v-if="websiteConfig.wechat" ref="wechat" :href="websiteConfig.wechat" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="wechat" />
      </li>
    </a>
    <a v-if="websiteConfig.qq" ref="qq" :href="websiteConfig.qq" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="qq" />
      </li>
    </a>
    <a v-if="websiteConfig.weibo" ref="weibo" :href="websiteConfig.weibo" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="weibo" />
      </li>
    </a>
    <a v-if="websiteConfig.csdn" ref="csdn" :href="websiteConfig.csdn" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="csdn" />
      </li>
    </a>
    <a v-if="websiteConfig.zhihu" ref="zhifu" :href="websiteConfig.zhihu" target="_blank">
      <li class="diamond-clip-path diamond-icon">
        <svg-icon class="fill-current" icon-class="zhifu" />
      </li>
    </a>
    <a v-if="websiteConfig.juejin" ref="juejin" :href="websiteConfig.juejin" target="_blank">
      <li class="diamond-clip-path diamond-icon">掘</li>
    </a>
  </ul>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useAppStore } from '@/stores/app'

export default defineComponent({
  name: 'Social',
  setup() {
    let appStore = useAppStore()
    return {
      websiteConfig: computed(() => {
        return appStore.websiteConfig
      })
    }
  }
})
</script>

<style scoped>
.custom-social-svg-icon {
  width: 1em;
  height: 1em;
  font-size: 1em;
  vertical-align: -0.15em;
  fill: var(--text-bright);
  stroke: var(--background-primary);
  overflow: hidden;
}
</style>
