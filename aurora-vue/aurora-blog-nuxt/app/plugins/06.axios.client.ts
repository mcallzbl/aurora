import axios, { type InternalAxiosRequestConfig } from 'axios'

let interceptorReady = false

export default defineNuxtPlugin((nuxtApp) => {
  axios.defaults.baseURL = '/'

  if (interceptorReady) {
    return
  }

  interceptorReady = true

  axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers.Authorization = `Bearer ${sessionStorage.getItem('token')}`
    return config
  })

  axios.interceptors.response.use(
    (response) => {
      if (response.data.flag) {
        return response
      }

      const userStore = useUserStore()
      const proxy = nuxtApp.vueApp.config.globalProperties

      switch (response.data.code) {
        case 50000:
          proxy.$notify({
            title: 'Error',
            message: '系统异常',
            type: 'error'
          })
          break
        case 40001:
          proxy.$notify({
            title: 'Error',
            message: '用户未登录',
            type: 'error'
          })
          if (userStore.userInfo !== '') {
            userStore.userInfo = ''
            userStore.token = ''
            userStore.accessArticles = []
            sessionStorage.removeItem('token')
          }
          break
        default:
          proxy.$notify({
            title: 'Error',
            message: response.data.message,
            type: 'error'
          })
      }

      return response
    },
    (error) => Promise.reject(error)
  )
})
