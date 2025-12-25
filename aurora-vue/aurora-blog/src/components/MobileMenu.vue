<template>
  <div class="flex flex-col justify-center items-center">
    <img
      v-if="websiteConfig.authorAvatar !== ''"
      :src="websiteConfig.authorAvatar"
      alt="avatar"
      class="circle-avatar h-28 w-28 shadow-xl m-0" />
    <ob-skeleton v-else circle height="7rem" width="7rem" />

    <h2 class="text-center pt-4 text-4xl font-semibold text-ob-bright">
      <template v-if="websiteConfig.author">
        {{ websiteConfig.author }}
      </template>
      <ob-skeleton v-else height="2.25rem" width="7rem" />
    </h2>

    <span :style="gradientBackground" class="h-1 w-14 rounded-full mt-2" />

    <p
      v-if="websiteConfig.authorIntro"
      class="pt-6 px-2 w-full text-sm text-center text-ob-dim"
      v-html="websiteConfig.authorIntro" />
    <p v-else class="pt-6 px-10 w-full text-sm text-center flex flex-col gap-2">
      <ob-skeleton :count="2" height="20px" width="10rem" />
    </p>
    <Social />
    <ul class="grid grid-cols-3 pt-4 w-full px-2 text-lg">
      <li class="col-span-1 text-center">
        <span class="text-ob-bright">{{ articleCount }}</span>
        <p class="text-base text-ob-dim">{{ t('settings.articles') }}</p>
      </li>
      <li class="col-span-1 text-center">
        <span class="text-ob-bright">{{ categoryCount }}</span>
        <p class="text-base text-ob-dim">{{ t('settings.categories') }}</p>
      </li>
      <li class="col-span-1 text-center">
        <span class="text-ob-bright">{{ tagCount }}</span>
        <p class="text-base text-ob-dim">{{ t('settings.tags') }}</p>
      </li>
    </ul>
  </div>
  <ul class="flex flex-col justify-center items-center mt-8 w-full list-none text-ob-bright">
    <li v-for="route in routes" :key="route.path" class="pb-2 cursor-pointer">
      <div
        v-if="route.children && route.children.length === 0"
        class="text-sm block px-1.5 py-0.5 rounded-md relative uppercase"
        @click="pushPage(route.path)">
        <span v-if="$i18n.locale === 'cn' && route.i18n.cn" class="relative z-50">
          {{ route.i18n.cn }}
        </span>
        <span v-else-if="$i18n.locale === 'en' && route.i18n.en" class="relative z-50">
          {{ route.i18n.en }}
        </span>
        <span v-else class="relative z-50">{{ route.name }}</span>
      </div>
      <Dropdown
        v-else
        class="flex flex-col justify-center items-center nav-link text-sm block px-1.5 py-0.5 rounded-md relative uppercase"
        @command="pushPage">
        <span v-if="$i18n.locale === 'cn' && route.i18n.cn" class="relative z-50">
          {{ route.i18n.cn }}
        </span>
        <span v-else-if="$i18n.locale === 'en' && route.i18n.en" class="relative z-50">
          {{ route.i18n.en }}
        </span>
        <span v-else class="relative z-50">{{ route.name }}</span>
        <DropdownMenu expand>
          <DropdownItem v-for="sub in route.children" :key="sub.path" :name="sub.path">
            <span v-if="$i18n.locale === 'cn' && sub.i18n.cn" class="relative z-50">
              {{ sub.i18n.cn }}
            </span>
            <span v-else-if="$i18n.locale === 'en' && sub.i18n.en" class="relative z-50">
              {{ sub.i18n.en }}
            </span>
            <span v-else class="relative z-50">{{ sub.name }}</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </li>
    <li>
      <Dropdown
        class="flex flex-col justify-center items-center nav-link text-sm block px-1.5 py-0.5 rounded-md relative uppercase">
        <span v-if="$i18n.locale === 'cn'" class="relative z-50"> 相册 </span>
        <span v-else-if="$i18n.locale === 'en'" class="relative z-50"> PhotoAlbums </span>
        <DropdownMenu expand>
          <template v-for="item in albums" :key="item.id">
            <DropdownItem :name="item.albumName" @click="pushPage(`/photos/${item.id}`)">
              <span class="relative z-50">{{ item.albumName }}</span>
            </DropdownItem>
          </template>
        </DropdownMenu>
      </Dropdown>
    </li>
  </ul>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from 'vue'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'
import { Dropdown, DropdownItem, DropdownMenu } from '@/components/Dropdown'
import { useRouter } from 'vue-router'
import { useNavigatorStore } from '@/stores/navigator'
import Social from '@/components/Social.vue'
import config from '@/config/config'
import api from '@/api/api'

export default defineComponent({
  name: 'ObMobileMenu',
  components: { Dropdown, DropdownMenu, DropdownItem, Social },
  setup() {
    const appStore = useAppStore()
    const router = useRouter()
    const navigatorStore = useNavigatorStore()
    const { t } = useI18n()
    const reactiveData = reactive({
      routes: '' as any,
      albums: [] as any
    })
    onMounted(() => {
      reactiveData.routes = config.routes
      fetchAblums()
    })
    const fetchAblums = () => {
      api.getAlbums().then(({ data }) => {
        reactiveData.albums = data.data
      })
    }
    const pushPage = (path: string): void => {
      if (!path) return
      navigatorStore.toggleMobileMenu()
      navigatorStore.setOpenNavigator(false)
      if (path.match(/(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g)) {
        window.location.href = path
      } else {
        router.push({
          path: path
        })
      }
    }
    return {
      ...toRefs(reactiveData),
      themeConfig: computed(() => appStore.themeConfig),
      gradientBackground: computed(() => {
        return { background: appStore.themeConfig.header_gradient_css }
      }),
      pushPage,
      websiteConfig: computed(() => appStore.websiteConfig),
      articleCount: computed(() => appStore.articleCount),
      talkCount: computed(() => appStore.talkCount),
      categoryCount: computed(() => appStore.categoryCount),
      tagCount: computed(() => appStore.tagCount),
      t
    }
  }
})
</script>
