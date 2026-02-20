<script lang="ts">
import { computed, defineComponent, h, inject, toRefs, type Slot, type VNode } from 'vue'
import { SkeletonStyle } from './SkeletonTheme.vue'

const isEmptyVNode = (children?: Slot) => {
  if (!children) return true
  const nodes = children()
  const firstNode = nodes[0] as VNode | undefined
  let str = ''
  if (typeof firstNode?.children === 'string') {
    str = firstNode.children
  }
  if (str) {
    str = str.replace(/(\n|\r\n|\s)/g, '')
  }
  return (!firstNode || typeof firstNode.type === 'symbol') && !str
}

export default defineComponent({
  name: 'ObSkeleton',
  props: {
    prefix: {
      type: String,
      default: 'ob'
    },
    count: {
      type: Number,
      default: 1
    },
    duration: {
      type: Number,
      default: 1.5
    },
    tag: {
      type: String,
      default: 'span'
    },
    width: [String, Number],
    height: [String, Number],
    circle: Boolean,
    loading: Boolean,
    class: String
  },
  setup(props, { slots }) {
    const themeStyle = inject('_themeStyle', SkeletonStyle)
    const theme = inject('_skeletonTheme', { loading: false })
    const isLoading = toRefs(props).loading
    return {
      themeStyle,
      theme,
      slots,
      isLoading: computed(() => {
        return typeof isLoading === undefined
          ? typeof theme.loading !== undefined
            ? theme.loading
            : isLoading
          : isEmptyVNode(slots.default)
      })
    }
  },
  render() {
    const { width, height, duration, prefix, circle, count, tag, isLoading, slots } = this
    const propClasses = this.class ? this.class.split(' ') : []
    const classes = [...[`${prefix}-skeleton`], ...propClasses]
    const elements = []
    const styles = { ...this.themeStyle }
    if (duration) {
      styles.animation = `SkeletonLoading ${duration}s ease-in-out infinite`
    } else {
      styles.backgroundImage = ''
    }
    if (width) styles.width = String(width)
    if (height) styles.height = String(height)
    if (circle) styles.borderRadius = '50%'
    for (let i = 0; i < count; i += 1) {
      elements.push(h(tag, { key: i, class: classes, style: styles }, ''))
    }
    if (tag) {
      return !isLoading ? h(tag, slots.default) : elements
    }
    return !isLoading ? slots.default : h(tag, elements)
  }
})
</script>

<style>
.ob-skeleton {
  background-size: 200px 100%;
  background-repeat: no-repeat;
  border-radius: 10px;
  display: inline-block;
  line-height: 1;
  width: 100%;
  height: inherit;
}

@keyframes SkeletonLoading {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}
</style>
