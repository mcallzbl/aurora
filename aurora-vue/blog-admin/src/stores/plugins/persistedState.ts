import type { PiniaPluginContext } from 'pinia'

type PersistPaths = string[] | true

const defaultKey = (storeId: string) => `pinia:${storeId}`
const persistMap: Record<string, PersistPaths> = {
  app: ['collapse', 'tabs', 'userInfo', 'pageState'],
  theme: ['mode'],
}

const pickState = (state: Record<string, unknown>, paths: string[]) => {
  return paths.reduce<Record<string, unknown>>((acc, key) => {
    if (key in state) {
      acc[key] = state[key]
    }
    return acc
  }, {})
}

export const persistedStatePlugin = ({ store }: PiniaPluginContext) => {
  if (typeof window === 'undefined') {
    return
  }

  const persistPaths = persistMap[store.$id]
  if (!persistPaths) {
    return
  }

  const storage = window.sessionStorage
  const key = defaultKey(store.$id)

  try {
    const raw = storage.getItem(key)
    if (raw) {
      store.$patch(JSON.parse(raw))
    }
  } catch (error) {
    console.warn('[pinia] failed to restore state', error)
  }

  store.$subscribe(
    (_mutation, state) => {
      try {
        const payload =
          persistPaths === true ? state : pickState(state as Record<string, unknown>, persistPaths)
        storage.setItem(key, JSON.stringify(payload))
      } catch (error) {
        console.warn('[pinia] failed to persist state', error)
      }
    },
    { detached: true },
  )
}
