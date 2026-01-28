import axios, { AxiosHeaders } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const http = axios.create()

http.interceptors.request.use((request) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    const headers = AxiosHeaders.from(request.headers ?? {})
    headers.set('Authorization', `Bearer ${token}`)
    request.headers = headers
  }
  return request
})

http.interceptors.response.use(
  (response) => {
    const { code, message } = (response.data ?? {}) as { code?: number; message?: string }
    if (code === 40001) {
      ElMessage.error(message || 'Unauthorized')
      router.push({ path: '/login' })
    } else if (code === 50000) {
      ElMessage.error(message || 'Server error')
    }
    return response
  },
  (error) => Promise.reject(error),
)

export default http
