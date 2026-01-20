import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'

interface MenuState {
  menus: RouteRecordRaw[]
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    menus: [],
  }),
  actions: {
    setMenus(menus: RouteRecordRaw[]) {
      this.menus = menus
    },
    reset() {
      this.menus = []
    },
  },
})
