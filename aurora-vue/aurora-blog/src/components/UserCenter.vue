<template>
  <el-drawer v-model="visible" :before-close="handleClose" :with-header="false" direction="rtl">
    <span class="text font-semibold text-2xl">{{ t('settings.personal-center') }}</span>
    <template v-if="userInfo !== ''">
      <span class="text font-medium">{{ t('user.info_privacy_hint') }}</span>
      <div class="max-w-full mt-10">
        <button id="pick-avatar" @click="showCropper = true">
          <el-avatar :size="110" :src="userInfo.avatar" class="ml-40" />
        </button>
        <component
          v-if="isClient"
          :is="AvatarCropper"
          v-model="showCropper"
          :request-options="options"
          trigger="#pick-avatar"
          upload-url="/api/users/avatar"
          @uploaded="handleSuccess" />
        <el-form>
          <el-form-item class="mt-5" :label="t('user.nickname') + ':'" model="userInfo">
            <el-input v-model="userInfo.nickname" />
          </el-form-item>
          <el-form-item class="mt-5" :label="t('user.website') + ':'" model="userInfo">
            <el-input v-model="userInfo.website" :placeholder="t('user.website_placeholder')" />
          </el-form-item>
          <el-form-item class="mt-5" :label="t('user.intro') + ':'" model="userInfo">
            <el-input v-model="userInfo.intro" :placeholder="t('user.intro_placeholder')" />
          </el-form-item>
          <el-form-item class="mt-5" :label="t('auth.email') + ':'" model="userInfo">
            <el-input :placeholder="userInfo.email" disabled>
              <template v-if="userInfo.email === null" #append>
                <span class="text" @click="changeEmailDialogVisible">{{ t('auth.bind') }}</span>
              </template>
              <template v-else #append>
                <span class="text" @click="changeEmailDialogVisible">{{ t('auth.change') }}</span>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item :label="t('user.subscribe') + ':'">
            <el-switch
              v-model="userInfo.isSubscribe"
              :active-value="1"
              :before-change="beforeChange"
              :inactive-value="0"
              :loading="loading"
              active-color="#0fb6d6"
              @change="changeSubscribe" />
          </el-form-item>
          <button
            id="submit-button"
            class="mt-5 w-20 text-white p-2 rounded-lg transition transform hover:scale-105 flex float-right"
            type="button"
            @click="commit">
            <span class="text-center flex-grow commit">{{ t('common.submit') }}</span>
          </button>
        </el-form>
      </div>
    </template>
    <br />
    <br />
  </el-drawer>
  <el-dialog v-model="emailDialogVisible" width="30%">
    <el-form>
      <el-form-item class="mt-5" model="userInfo">
        <el-input v-model="email" :placeholder="t('auth.email')" />
      </el-form-item>
      <el-form-item class="mt-8" model="userInfo" type="password">
        <el-input v-model="VerificationCode" :placeholder="t('auth.code')" type="password">
          <template #append>
            <button style="outline: none" type="button">
              <span class="text" @click="sendCode">{{ message }}</span>
            </button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button class="mx-auto mt-3" size="large" type="primary" @click="bingingEmail">{{
          t('auth.bind')
        }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, defineComponent, getCurrentInstance, reactive, ref, toRef, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import api from '@/api/api'

defineOptions({ name: 'UserCenter' })

const { t } = useI18n()
const proxy: any = getCurrentInstance()?.appContext.config.globalProperties
const userStore = useUserStore()

const reactiveData = reactive({
  message: t('auth.send_code'),
  emailDialogVisible: false,
  email: '' as string,
  VerificationCode: '' as string,
  loading: false,
  switchState: false
})
const { message, emailDialogVisible, email, VerificationCode, loading, switchState } = toRefs(reactiveData)

const showCropper = ref(false)
const userInfo = toRef(userStore.$state, 'userInfo')
const visible = toRef(userStore.$state, 'userVisible')
const isClient = typeof window !== 'undefined'
const AvatarCropper = isClient
  ? defineAsyncComponent(() => import('vue-avatar-cropper'))
  : defineComponent({ name: 'AvatarCropperStub', setup: () => () => null })

const handleClose = () => {
  userStore.userVisible = false
}
const changeEmailDialogVisible = () => {
  reactiveData.emailDialogVisible = true
}
const bingingEmail = () => {
  const params = {
    email: reactiveData.email,
    code: reactiveData.VerificationCode
  }
  api.bindingEmail(params).then(({ data }) => {
    if (data.flag) {
      proxy.$notify({
        title: t('common.success'),
        message: t('auth.bind_success'),
        type: 'success'
      })
      userStore.userInfo.email = reactiveData.email
      reactiveData.emailDialogVisible = false
    }
  })
}
const handleSuccess = (data: any) => {
  data.response.json().then((data: any) => {
    if (data.flag) {
      userStore.userInfo.avatar = data.data
      proxy.$notify({
        title: t('common.success'),
        message: t('common.upload_success'),
        type: 'success'
      })
    }
  })
}
const changeSubscribe = () => {
  if (reactiveData.switchState) {
    const params = {
      userId: userStore.userInfo.userInfoId,
      isSubscribe: userStore.userInfo.isSubscribe
    }
    api.updateUserSubscribe(params).then(({ data }) => {
      if (data.flag) {
        proxy.$notify({
          title: t('common.success'),
          message: t('auth.update_success'),
          type: 'success'
        })
      }
    })
  }
}
const commit = () => {
  const params = {
    nickname: userStore.userInfo.nickname,
    website: userStore.userInfo.website,
    intro: userStore.userInfo.intro
  }
  api.submitUserInfo(params).then(({ data }) => {
    if (data.flag) {
      proxy.$notify({
        title: t('common.success'),
        message: t('auth.update_success'),
        type: 'success'
      })
    }
  })
}
const sendCode = () => {
  api.sendValidationCode(reactiveData.email).then(({ data }) => {
    if (data.flag) {
      proxy.$notify({
        title: t('common.success'),
        message: t('auth.code_sent'),
        type: 'success'
      })
    }
  })
}
const beforeChange = (): boolean | Promise<boolean> => {
  reactiveData.switchState = true
  reactiveData.loading = true
  return new Promise<boolean>((resolve) => {
    if (userStore.userInfo.email === '' || userStore.userInfo.email === null) {
      reactiveData.loading = false
      proxy.$notify({
        title: t('common.warning'),
        message: t('user.email_unbound_warning'),
        type: 'warning'
      })
      resolve(false)
    } else {
      reactiveData.loading = false
      resolve(true)
    }
  })
}

const options = computed(() => ({
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + userStore.token
  }
}))
</script>
<style lang="scss" scoped>
#submit-button {
  outline: none;
  background: #0fb6d6;
}

.text {
  color: var(--text-normal);
  cursor: pointer;
}

#pick-avatar {
  outline: none;
}
</style>
<style lang="scss">
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

.bangding-button {
  outline: none !important;
}
</style>
