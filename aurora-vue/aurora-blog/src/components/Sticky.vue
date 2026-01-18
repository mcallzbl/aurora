<template>
  <div id="sticky" :style="wrapperStyle">
    <div :class="className" :style="stickyStyle">
      <slot>
        <div>sticky</div>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, type StyleValue } from 'vue'

export default defineComponent({
  name: 'StickyContainer',
  props: {
    stickyTop: {
      type: Number,
      default: 0
    },
    zIndex: {
      type: Number,
      default: 1
    },
    className: {
      type: String,
      default: ''
    },
    stickyBottom: {
      type: Number,
      default: 0
    },
    endingElId: {
      type: String,
      default: ''
    },
    dynamicElClass: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const active = ref(false)
    const position = ref<'' | 'fixed' | 'absolute'>('')
    const width = ref<number | string>('auto')
    const height = ref(0)
    const isSticky = ref(false)
    const newTop = ref(0)
    const top = ref(0)
    const isBottom = ref(false)
    const wrapperStyle = computed<StyleValue>(() => ({
      height: `${height.value}px`,
      zIndex: props.zIndex
    }))
    const stickyStyle = computed<StyleValue>(() => ({
      top: isSticky.value ? (top.value === -1 ? 'initial' : `${top.value}px`) : undefined,
      bottom: isBottom.value ? 0 : undefined,
      zIndex: props.zIndex,
      position: isSticky.value ? position.value || undefined : undefined,
      width: width.value,
      height: `${height.value}px`
    }))
    return {
      active,
      position,
      width,
      height,
      isSticky,
      newTop,
      top,
      isBottom,
      wrapperStyle,
      stickyStyle
    }
  },
  mounted() {
    this.height = this.$el.getBoundingClientRect().height
    window.addEventListener('scroll', this.handleScroll)
    window.addEventListener('resize', this.handleResize)
  },
  activated() {
    this.handleScroll()
  },
  unmounted() {
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    sticky(top: number, position: 'fixed' | 'absolute') {
      if (this.active) {
        return
      }
      this.top = top
      this.position = position
      this.active = true
      this.width = this.width + 'px'
      this.isSticky = true
    },
    handleReset() {
      if (!this.active) {
        return
      }
      this.reset()
    },
    reset() {
      this.position = ''
      this.width = 'auto'
      this.active = false
      this.isSticky = false
    },
    handleScroll() {
      setTimeout(() => {
        const documentHeight = document.documentElement.scrollHeight
        const width = this.$el.getBoundingClientRect().width
        const height = this.$el.getBoundingClientRect().height
        if (this.dynamicElClass !== '') {
          const dynamicEl = this.$el.querySelector(this.dynamicElClass)
          this.height = dynamicEl.getBoundingClientRect().height || height
        }
        const scrollTop = window.scrollY
        this.width = width || 'auto'
        const offsetTop = this.$el.getBoundingClientRect().top
        const endingEl = this.endingElId !== '' ? document.getElementById(this.endingElId) : null
        const wrapperEl = document.getElementById('App-Wrapper')
        const endingElSpacing = parseInt(
          window.getComputedStyle(wrapperEl || document.documentElement).paddingBottom,
          10
        )
        const endingPos =
          endingEl && endingEl instanceof HTMLElement
            ? documentHeight -
              scrollTop -
              height -
              this.stickyTop -
              this.stickyBottom -
              endingEl.getBoundingClientRect().height -
              endingElSpacing
            : documentHeight

        if (offsetTop < this.stickyTop) {
          this.active = false
          if (endingPos <= 0) {
            this.isBottom = true
            this.sticky(-1, 'absolute')
          } else {
            this.isBottom = false
            this.sticky(this.stickyTop, 'fixed')
          }
          return
        }
        this.handleReset()
      }, 16)
    },
    handleResize() {
      if (this.isSticky) {
        this.width = this.$el.getBoundingClientRect().width + 'px'
      }
    }
  }
})
</script>
