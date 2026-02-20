<template>
  <div class="header-controls" tabindex="0" @keydown.k="handleOpenModel">
    <span v-if="!isMobile" class="ob-drop-shadow" data-dia="search" @click="handleOpenModel">
      <svg-icon icon-class="search" />
    </span>
    <span v-if="multiLanguage" class="ob-drop-shadow" data-dia="language" @click="openLanguageModal">
      <svg-icon icon-class="globe" />
    </span>
    <template v-if="userInfo === ''">
      <span class="mr-3" @click="openLoginDialog">{{ t('settings.login') }}</span>
    </template>
    <template v-if="userInfo !== ''">
      <Dropdown hover>
        <span class="mr-2">
          <div class="flex-shrink-0">
            <div class="rounded-full ring-gray-100 overflow-hidden shaodw-lg w-9">
              <img :src="userInfo.avatar" alt="" class="avatar-img" />
            </div>
          </div>
        </span>
        <DropdownMenu>
          <template v-if="!isMobile">
            <DropdownItem @click="openUserCenter">{{ t('settings.personal-center') }}</DropdownItem>
          </template>
          <DropdownItem @click="logout">{{ t('settings.logout') }}</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </template>
    <span v-if="!isMobile" class="ob-drop-shadow" data-dia="light-switch" no-hover-effect>
      <ThemeToggle />
    </span>
  </div>
  <el-dialog v-model="loginDialogVisible" :fullscreen="isMobile" width="30%">
    <el-form @keyup.enter="login">
      <el-form-item class="mt-5">
        <el-input v-model="loginInfo.username" :placeholder="t('auth.email')" />
      </el-form-item>
      <el-form-item class="mt-8" type="password">
        <el-input v-model="loginInfo.password" :placeholder="t('auth.password')" show-password type="password" />
      </el-form-item>
      <el-form-item>
        <el-button class="mx-auto mt-3" size="large" type="primary" @click="login">{{ t('settings.login') }}</el-button>
      </el-form-item>
      <el-form-item>
        <el-button class="mx-auto my-el-button" type="default" @click="qqLogin">{{ t('auth.qq_login') }}</el-button>
      </el-form-item>
      <div class="mt-8">
        <span class="text" @click="openRegisterDialog">{{ t('auth.register_now') }}</span>
        <span class="text float-right" @click="openForgetPasswordDialog">{{ t('auth.forgot_password') }}</span>
      </div>
    </el-form>
  </el-dialog>
  <el-dialog v-model="registerDialogVisible" :fullscreen="isMobile" width="30%">
    <el-form>
      <el-form-item class="mt-5">
        <el-input v-model="loginInfo.username" :placeholder="t('auth.email')" />
      </el-form-item>
      <el-form-item class="mt-8">
        <el-input v-model="loginInfo.code" :placeholder="t('auth.code')">
          <template #append>
            <span class="text" @click="sendCode">{{ t('auth.send_code') }}</span>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item class="mt-8" type="password">
        <el-input v-model="loginInfo.password" :placeholder="t('auth.password')" show-password type="password" />
      </el-form-item>
      <el-form-item>
        <el-button class="mx-auto mt-3" size="large" type="primary" @click="register">{{
          t('auth.register')
        }}</el-button>
      </el-form-item>
      <span class="text" @click="returnLoginDialog">{{ t('auth.login_existing') }}</span>
    </el-form>
  </el-dialog>
  <el-dialog v-model="forgetPasswordDialogVisible" :fullscreen="isMobile" width="30%">
    <el-form>
      <el-form-item class="mt-5">
        <el-input v-model="loginInfo.username" :placeholder="t('auth.email')" />
      </el-form-item>
      <el-form-item class="mt-8">
        <el-input v-model="loginInfo.code" :placeholder="t('auth.code')">
          <template #append>
            <span class="text" @click="sendCode">{{ t('auth.send_code') }}</span>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item class="mt-8" type="password">
        <el-input v-model="loginInfo.password" :placeholder="t('auth.new_password')" show-password type="password" />
      </el-form-item>
      <el-form-item>
        <el-button class="mx-auto mt-3" size="large" type="primary" @click="updatePassword">{{
          t('common.confirm')
        }}</el-button>
      </el-form-item>
      <span class="text" @click="returnLoginDialog">{{ t('auth.back_to_login') }}</span>
    </el-form>
  </el-dialog>
  <el-dialog v-model="articlePasswordDialogVisible" :fullscreen="isMobile" width="30%">
    <el-form @submit.prevent @keyup.enter="accessArticle">
      <el-form-item class="mt-5">
        <el-input
          id="article-password-input"
          v-model="articlePassword"
          :placeholder="t('auth.article_password_placeholder')" />
      </el-form-item>
      <el-form-item>
        <el-button class="mx-auto mt-3" size="large" type="primary" @click="accessArticle">{{
          t('auth.verify_password')
        }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
  <teleport to="body">
    <SearchModel />
  </teleport>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { Dropdown, DropdownItem, DropdownMenu } from '@/components/Dropdown'
import { useAppStore } from '@/stores/app'
import { useCommonStore } from '@/stores/common'
import { useUserStore } from '@/stores/user'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ToggleSwitch/ThemeToggle.vue'
import api from '@/api/api'
import SearchModel from '@/components/SearchModel.vue'
import { useSearchStore } from '@/stores/search'
import config from '@/config/config'
import { useI18n } from 'vue-i18n'
import emitter from '@/utils/mitt'

defineOptions({ name: 'HeaderControls' })

type NotifyFn = (options: { title: string; message: string; type: 'success' | 'warning' | 'error' | 'info' }) => void
type QQLogin = { showPopup: (options: { appId: string; redirectURI: string }) => void }
type QQGlobal = { Login: QQLogin }

const { t } = useI18n()
const proxy = getCurrentInstance()?.appContext.config.globalProperties as { $notify?: NotifyFn } | undefined
const appStore = useAppStore()
const commonStore = useCommonStore()
const userStore = useUserStore()
const searchStore = useSearchStore()
const route = useRoute()
const router = useRouter()

const loginInfo = reactive({
  username: '',
  password: '',
  code: ''
})

const loginDialogVisible = ref(false)
const registerDialogVisible = ref(false)
const forgetPasswordDialogVisible = ref(false)
const articlePasswordDialogVisible = ref(false)
const articlePassword = ref('')
const articleId = ref('')

const isMobile = computed(() => commonStore.isMobile)
const userInfo = computed(() => userStore.userInfo)
const multiLanguage = computed(() => {
  const raw = appStore.websiteConfig?.multiLanguage
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw === 1
  if (typeof raw === 'string') return raw === '1' || raw.toLowerCase() === 'true'
  return false
})

const handleOpenModel = () => {
  searchStore.setOpenModal(true)
}

const openLanguageModal = () => {
  emitter.emit('openLanguageModal')
}

const openUserCenter = () => {
  userStore.userVisible = true
}

const openLoginDialog = () => {
  loginDialogVisible.value = true
}

const openRegisterDialog = () => {
  loginInfo.code = ''
  loginDialogVisible.value = false
  registerDialogVisible.value = true
}

const returnLoginDialog = () => {
  registerDialogVisible.value = false
  forgetPasswordDialogVisible.value = false
  loginDialogVisible.value = true
}

const openForgetPasswordDialog = () => {
  loginInfo.code = ''
  loginDialogVisible.value = false
  forgetPasswordDialogVisible.value = true
}

const sendCode = () => {
  api.sendValidationCode(loginInfo.username).then(({ data }) => {
    if (data.flag) {
      proxy?.$notify?.({ title: t('common.success'), message: t('auth.code_sent'), type: 'success' })
    }
  })
}

const register = () => {
  const params = {
    code: loginInfo.code,
    username: loginInfo.username,
    password: loginInfo.password
  }
  api.register(params).then(({ data }) => {
    if (data.flag) {
      proxy?.$notify?.({ title: t('common.success'), message: t('auth.register_success'), type: 'success' })
      registerDialogVisible.value = false
      loginDialogVisible.value = true
    }
  })
}

const login = () => {
  if (loginInfo.username.trim().length === 0 || loginInfo.password.trim().length === 0) {
    proxy?.$notify?.({ title: t('common.warning'), message: t('auth.password_empty'), type: 'warning' })
    return
  }
  const params = new URLSearchParams()
  params.append('username', loginInfo.username)
  params.append('password', loginInfo.password)
  api.login(params).then(({ data }) => {
    if (data.flag) {
      userStore.userInfo = data.data
      sessionStorage.setItem('token', data.data.token)
      userStore.token = data.data.token
      proxy?.$notify?.({ title: t('common.success'), message: t('auth.login_success'), type: 'success' })
      loginDialogVisible.value = false
    }
  })
}

const logout = () => {
  api.logout().then(({ data }) => {
    if (data.flag) {
      userStore.userInfo = ''
      userStore.token = ''
      userStore.accessArticles = []
      sessionStorage.removeItem('token')
      proxy?.$notify?.({ title: t('common.success'), message: t('auth.logout_success'), type: 'success' })
    }
  })
}

const qqLogin = () => {
  userStore.currentUrl = route.path
  loginDialogVisible.value = false
  if (commonStore.isMobile) {
    const QC = (window as Window & { QC?: QQGlobal }).QC
    if (QC?.Login?.showPopup) {
      QC.Login.showPopup({
        appId: config.qqLogin.QQ_APP_ID,
        redirectURI: config.qqLogin.QQ_REDIRECT_URI
      })
    }
  } else {
    const url =
      'https://graph.qq.com/oauth2.0/show?which=Login&display=pc&client_id=' +
      String(config.qqLogin.QQ_APP_ID) +
      '&response_type=token&scope=all&redirect_uri=' +
      encodeURIComponent(String(config.qqLogin.QQ_REDIRECT_URI))
    window.open(url, '_self')
  }
}

const updatePassword = () => {
  api.updatePassword(loginInfo).then(({ data }) => {
    if (data.flag) {
      proxy?.$notify?.({ title: t('common.success'), message: t('auth.update_success'), type: 'success' })
      forgetPasswordDialogVisible.value = false
      loginDialogVisible.value = true
    }
  })
}

const accessArticle = () => {
  if (articlePassword.value.trim().length === 0) {
    proxy?.$notify?.({ title: t('common.warning'), message: t('auth.password_empty'), type: 'warning' })
    return
  }
  api
    .accessArticle({
      articleId: articleId.value,
      articlePassword: articlePassword.value
    })
    .then(({ data }) => {
      if (data.flag) {
        articlePasswordDialogVisible.value = false
        userStore.accessArticles.push(articleId.value)
        router.push({ path: '/articles/' + articleId.value })
      }
    })
}

// open article password dialog from emitter (widen payload type to satisfy mitt Handler<unknown>)
const onArticlePasswordDialog = (payload: unknown) => {
  const id = typeof payload === 'string' ? payload : String(payload ?? '')
  articlePasswordDialogVisible.value = true
  articlePassword.value = ''
  articleId.value = id
  nextTick(() => {
    document.getElementById('article-password-input')?.focus()
  })
}
emitter.on('changeArticlePasswordDialogVisible', onArticlePasswordDialog)
onBeforeUnmount(() => {
  emitter.off('changeArticlePasswordDialogVisible', onArticlePasswordDialog)
})
</script>
<style lang="scss">
.my-el-button {
  width: 300px !important;
}

.el-button {
  width: 300px;
}

.el-dialog__headerbtn {
  outline: none !important;
}

.el-input-group__append {
  background-color: var(--background-primary-alt) !important;
}

.el-form-item__label {
  text-align: left;
  width: 70px;
  color: var(--text-normal) !important;
}

.el-input__inner {
  color: var(--text-normal) !important;
  background-color: var(--background-primary-alt) !important;
}

.el-input__wrapper {
  background: var(--background-primary-alt) !important;
}
</style>
<style lang="scss" scoped>
.text {
  color: var(--text-normal);
  cursor: pointer;
}

#submit-button {
  outline: none;
  background: #0fb6d6;
}

.header-controls {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: auto;
  padding-left: 0.5rem;

  span {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    cursor: pointer;
    transition: opacity 250ms ease;
    padding-right: 0.5rem;

    &[no-hover-effect] {
      &:hover {
        opacity: 1;
      }
    }

    &:hover {
      opacity: 0.5;
    }

    .svg-icon {
      stroke: #fff;
      height: 2rem;
      width: 2rem;
      margin-right: 0.5rem;
      pointer-events: none;
    }
  }

  .search-bar {
    @apply bg-transparent flex flex-row px-0 mr-2 rounded-full;
    opacity: 0;
    width: 0;
    transition: 300ms all ease-out;

    &.active {
      @apply bg-ob-deep-800;
      opacity: 0.95;
      width: 200px;

      imput {
        width: initial;
      }
    }

    &:focus {
      appearance: none;
      outline: none;
    }

    input {
      @apply flex flex-1 bg-transparent text-ob-normal px-6 box-border;
      width: 0;
      appearance: none;
      outline: none;
    }

    svg {
      @apply float-right;
    }
  }
}

.avatar-img {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 800ms;
  transform: rotate(-360deg);
}

.avatar-img:hover {
  transform: rotate(360deg);
}
</style>
