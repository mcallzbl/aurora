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
          <span class="relative z-50">{{ getMenuLabel(route.name) }}</span>
        </div>
        <Dropdown
          v-else
          class="nav-link text-sm block px-1.5 py-0.5 rounded-md relative uppercase"
          hover
          @command="pushPage">
          <span class="relative z-50">{{ getMenuLabel(route.name) }}</span>
          <DropdownMenu>
            <DropdownItem v-for="sub in route.children" :key="sub.path" :name="sub.path">
              <span class="relative z-50">{{ getMenuLabel(sub.name) }}</span>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </li>
      <li
        class="not-italic font-medium text-xs h-full relative flex flex-col items-center justify-center cursor-pointer text-center py-4 px-2"
        data-menu="PhotoAlbums">
        <Dropdown class="nav-link text-sm block px-1.5 py-0.5 rounded-md relative uppercase" hover>
          <span class="relative z-50">{{ t('menu.album') }}</span>
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
import { defineComponent, onMounted, reactive, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Dropdown, DropdownItem, DropdownMenu } from '@/components/Dropdown'
import { isExternal } from '@/utils/validate'
import config from '@/config/config'
import api from '@/api/api'

export default defineComponent({
  name: 'HeaderNavigation',
  components: { Dropdown, DropdownMenu, DropdownItem },
  setup() {
    type NavRoute = {
      name?: string
      path: string
      children?: NavRoute[]
    }
    type AlbumItem = {
      id: string | number
      albumName: string
    }

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
      albums: [] as AlbumItem[]
    })
    onMounted(() => {
      api.getAlbums().then(({ data }) => {
        reactiveData.albums = data.data
      })
    })
    const openPhotoAlbum = (id: string | number): void => {
      router.push('/photos/' + id)
    }
    const getMenuLabel = (name?: string): string => {
      const label = name ?? ''
      const key = `menu.${label.toLowerCase()}`
      return te(key) ? t(key) : label
    }

    return {
      ...toRefs(reactiveData),
      routes: config.routes as NavRoute[],
      pushPage,
      openPhotoAlbum,
      te,
      t,
      getMenuLabel
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
