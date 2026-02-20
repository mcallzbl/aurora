<template>
  <div>
    <Breadcrumb :current="t('menu.album')" />
    <div class="flex flex-col">
      <div class="post-header">
        <h1 v-if="photoAlbumName != ''" class="post-title text-white uppercase">{{ photoAlbumName }}</h1>
        <ob-skeleton
          v-else
          class="post-title text-white uppercase"
          height="clamp(1.2rem, calc(1rem + 3.5vw), 4rem)"
          width="30%" />
      </div>
      <div class="main-grid">
        <div class="relative">
          <div class="post-html">
            <div
              v-infinite-scroll="loadDataFromServer"
              :infinite-scroll-disabled="noResult"
              :infinite-scroll-distance="isMobile ? 0 : 30"
              :infinite-scroll-immediate-check="false"
              class="list-lis"
              infinite-scroll-watch-disabled="scrollDisabled">
              <div class="photo-wrap">
                <img
                  v-for="(item, index) of photos"
                  :key="index"
                  :src="item"
                  class="photo"
                  @click="handlePreview(index)" />
              </div>
            </div>
          </div>
        </div>
        <div class="col-span-1">
          <Sidebar>
            <Profile />
          </Sidebar>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCommonStore } from '@/stores/common'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { Profile, Sidebar } from '../components/Sidebar'
import Breadcrumb from '@/components/Breadcrumb.vue'
import v3ImgPreviewPkg from 'v3-img-preview'
import api from '@/api/api'

defineOptions({ name: 'PhotoGallery' })

type ImgPreviewFn = (options: { images: string[]; index: number }) => void
const { v3ImgPreviewFn } = v3ImgPreviewPkg as { v3ImgPreviewFn: ImgPreviewFn }

type AlbumIdParam = string | string[] | undefined
const normalizeAlbumId = (value: AlbumIdParam): string => {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
}

interface PhotoState {
  photoAlbumName: string
  noResult: boolean
  photos: string[]
  current: number
  size: number
  albumId: string
}

const { t } = useI18n()
const route = useRoute()
const commonStore = useCommonStore()
const reactiveData = reactive<PhotoState>({
  photoAlbumName: '',
  noResult: false,
  photos: [],
  current: 1,
  size: 10,
  albumId: normalizeAlbumId(route.params.albumId as AlbumIdParam)
})

onBeforeRouteUpdate((to: RouteLocationNormalizedLoaded) => {
  reactiveData.photoAlbumName = ''
  reactiveData.photos = []
  reactiveData.noResult = false
  reactiveData.current = 1
  reactiveData.albumId = normalizeAlbumId(to.params.albumId as AlbumIdParam)
  loadDataFromServer()
})

const handlePreview = (index: number) => {
  v3ImgPreviewFn({ images: reactiveData.photos, index })
}

const loadDataFromServer = () => {
  const params = {
    current: reactiveData.current,
    size: reactiveData.size
  }
  api.getPhotosBuAlbumId(reactiveData.albumId, params).then(({ data }) => {
    if (data.data.photos.length > 0) {
      reactiveData.current++
      reactiveData.photoAlbumName = data.data.photoAlbumName
      reactiveData.photos.push(...data.data.photos)
    } else {
      reactiveData.noResult = true
    }
  })
}

const { photoAlbumName, noResult, photos } = toRefs(reactiveData)
const isMobile = computed(() => commonStore.isMobile)
</script>
<style lang="scss" scoped>
.photo-wrap {
  display: flex;
  flex-wrap: wrap;
}

.photo {
  margin: 3px;
  cursor: pointer;
  flex-grow: 1;
  object-fit: cover;
  height: 200px;
}

.photo-wrap::after {
  content: '';
  display: block;
  flex-grow: 9999;
}

@media (max-width: 759px) {
  .photo {
    width: 100%;
  }
}
</style>
