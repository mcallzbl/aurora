<template>
  <nav class="items-center flex-1 hidden lg:flex">
    <ul class="flex flex-row list-none px-6 text-white">
      <li
        v-for="route in routes"
        :key="route.path"
        class="not-italic font-medium text-xs h-full relative flex flex-col items-center justify-center cursor-pointer text-center py-4 px-2">
        <div
          v-if="route.children && route.children.length === 0"
          :data-menu="route.name"
          class="nav-link text-sm block px-1.5 py-0.5 rounded-md relative uppercase cursor-pointer"
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
          class="nav-link text-sm block px-1.5 py-0.5 rounded-md relative uppercase"
          hover
          @command="pushPage">
          <span v-if="$i18n.locale === 'cn' && route.i18n.cn" class="relative z-50">
            {{ route.i18n.cn }}
          </span>
          <span v-else-if="$i18n.locale === 'en' && route.i18n.en" class="relative z-50">
            {{ route.i18n.en }}
          </span>
          <span v-else class="relative z-50">{{ route.name }}</span>
          <DropdownMenu>
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
      <li
        class="not-italic font-medium text-xs h-full relative flex flex-col items-center justify-center cursor-pointer text-center py-4 px-2"
        data-menu="PhotoAlbums">
        <Dropdown class="nav-link text-sm block px-1.5 py-0.5 rounded-md relative uppercase" hover>
          <span v-if="$i18n.locale === 'cn'" class="relative z-50"> 相册 </span>
          <span v-else-if="$i18n.locale === 'en'" class="relative z-50"> PhotoAlbums </span>
          <DropdownMenu>
            <template v-for="item in albums" :key="item.id">
              <DropdownItem :name="item.albumName" @click="pushPage(`/photos/${item.id}`)">
                <span class="relative z-50">{{ item.albumName }}</span>
              </DropdownItem>
            </template>
          </DropdownMenu>
        </Dropdown>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
// @ts-nocheck
import { defineComponent, onMounted, reactive, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Dropdown, DropdownItem, DropdownMenu } from '@/components/Dropdown'
import { isExternal } from '@/utils/validate'
import config from '@/config/config'
import api from '@/api/api'

export default defineComponent({
  name: 'Navigation',
  components: { Dropdown, DropdownMenu, DropdownItem },
  setup() {
    const { t, te } = useI18n()
    const router = useRouter()
    const pushPage = (path: string): void => {
      if (!path) return
      if (isExternal(path)) {
        window.location.href = path
      } else {
        router.push({
          path: path
        })
      }
    }
    const reactiveData = reactive({
      albums: [] as any
    })
    onMounted(() => {
      api.getAlbums().then(({ data }) => {
        reactiveData.albums = data.data
      })
    })
    const openPhotoAlbum = (id: any): void => {
      router.push('/photos/' + id)
    }
    return {
      ...toRefs(reactiveData),
      routes: config.routes,
      pushPage,
      openPhotoAlbum,
      te,
      t
    }
  }
})
</script>

<style lang="scss" scoped>
.nav-link {
  @apply hover:text-ob-bright;
  &:hover {
    &:before {
      @apply opacity-60;
    }
  }

  &:before {
    @apply absolute rounded-lg opacity-0 transition bg-ob-deep-800 z-40;
    content: '';
    top: -4px;
    left: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
  }
}
</style>
