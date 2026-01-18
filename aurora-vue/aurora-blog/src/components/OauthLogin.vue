<template>
  <div class="oauth-background">
    <div id="preloader_1">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { getCurrentInstance, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useUserStore } from '@/stores/user'
import api from '@/api/api'

defineOptions({ name: 'OauthLoginModel' })

type NotifyFn = (options: { title: string; message: string; type: string }) => void
type QQLogin = {
  check: () => boolean
  getMe: (cb: (openId: string, accessToken: string) => void) => void
}
type QQGlobal = {
  Login: QQLogin
}

const proxy = getCurrentInstance()?.appContext.config.globalProperties as { $notify?: NotifyFn } | undefined
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

onMounted(() => {
  if (route.path !== '/oauth/login/qq') return
  const QC = (window as Window & { QC?: QQGlobal }).QC
  if (QC?.Login?.check && QC.Login.check()) {
    QC.Login.getMe((openId, accessToken) => {
      const params = { openId, accessToken }
      api.qqLogin(params).then(({ data }) => {
        if (data.flag) {
          userStore.userInfo = data.data
          userStore.token = data.data.token
          sessionStorage.setItem('token', data.data.token)
          proxy?.$notify?.({
            title: t('common.success'),
            message: t('auth.login_success'),
            type: 'success'
          })
        }
      })
      if (userStore.currentUrl === '') {
        router.push({ path: '/' })
      } else {
        router.push({ path: userStore.currentUrl })
      }
    })
  }
})
</script>
<style lang="scss" scoped>
.oauth-background {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 1000;
}

#preloader_1 {
  position: relative;
  top: 45vh;
  left: 45vw;
}

#preloader_1 span {
  display: block;
  bottom: 0px;
  width: 9px;
  height: 5px;
  background: #9b59b6;
  position: absolute;
  animation: preloader_1 1.5s infinite ease-in-out;
}

#preloader_1 span:nth-child(2) {
  left: 11px;
  animation-delay: 0.2s;
}

#preloader_1 span:nth-child(3) {
  left: 22px;
  animation-delay: 0.4s;
}

#preloader_1 span:nth-child(4) {
  left: 33px;
  animation-delay: 0.6s;
}

#preloader_1 span:nth-child(5) {
  left: 44px;
  animation-delay: 0.8s;
}

@keyframes preloader_1 {
  0% {
    height: 5px;
    transform: translateY(0px);
    background: #9b59b6;
  }
  25% {
    height: 30px;
    transform: translateY(15px);
    background: #3498db;
  }
  50% {
    height: 5px;
    transform: translateY(0px);
    background: #9b59b6;
  }
  100% {
    height: 5px;
    transform: translateY(0px);
    background: #9b59b6;
  }
}
</style>
