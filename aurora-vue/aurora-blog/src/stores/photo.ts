import { defineStore } from 'pinia'

type PhotoStoreState = {
  photoAlbumVisible: boolean
  photos: string[]
  id: number | string
}

export const usePhotoStore = defineStore('photoStore', {
  state: (): PhotoStoreState => ({
    photoAlbumVisible: true,
    photos: [],
    id: ''
  }),
  actions: {}
})
