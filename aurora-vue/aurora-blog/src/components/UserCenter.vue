<template>
  <el-drawer v-model="visible" :before-close="handleClose" :with-header="false" direction="rtl">
    <span class="text font-semibold text-2xl">用户中心</span>
    <template v-if="userInfo !== ''">
      <span class="text font-medium">(该页面的信息,本网站将严格保密)</span>
      <div class="max-w-full mt-10">
        <button id="pick-avatar" @click="showCropper = true">
          <el-avatar :size="110" :src="userInfo.avatar" class="ml-40" />
        </button>
        <avatar-cropper
          v-model="showCropper"
          :request-options="options"
          trigger="#pick-avatar"
          upload-url="/api/users/avatar"
          @uploaded="handleSuccess" />
        <el-form>
          <el-form-item class="mt-5" label="昵称:" model="userInfo">
            <el-input v-model="userInfo.nickname" />
          </el-form-item>
          <el-form-item class="mt-5" label="网址:" model="userInfo">
            <el-input v-model="userInfo.website" placeholder="Please add https:// or http://" />
          </el-form-item>
          <el-form-item class="mt-5" label="描述:" model="userInfo">
            <el-input v-model="userInfo.intro" placeholder="Introduce youself" />
          </el-form-item>
          <el-form-item class="mt-5" label="邮箱:" model="userInfo">
            <el-input :placeholder="userInfo.email" disabled>
              <template v-if="userInfo.email === null" #append>
                <span class="text" @click="changeEmailDialogVisible">绑定</span>
              </template>
              <template v-else #append>
                <span class="text" @click="changeEmailDialogVisible">修改</span>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="订阅:">
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
            <span class="text-center flex-grow commit">提交</span>
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
        <el-input v-model="email" placeholder="邮箱号" />
      </el-form-item>
      <el-form-item class="mt-8" model="userInfo" type="password">
        <el-input v-model="VerificationCode" placeholder="验证码" type="password">
          <template #append>
            <button style="outline: none" type="button">
              <span class="text" @click="sendCode">{{ message }}</span>
            </button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button class="mx-auto mt-3" size="large" type="primary" @click="bingingEmail">绑定</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, getCurrentInstance, reactive, ref, toRef, toRefs } from 'vue'
import { useUserStore } from '@/stores/user'
import AvatarCropper from 'vue-avatar-cropper'
import api from '@/api/api'

export default defineComponent({
  name: 'UserCenter',
  components: { AvatarCropper },
  setup() {
    const proxy: any = getCurrentInstance()?.appContext.config.globalProperties
    const userStore = useUserStore()
    const reactiveData = reactive({
      message: '发送',
      emailDialogVisible: false,
      email: '' as any,
      VerificationCode: '' as any,
      loading: false,
      switchState: false
    })
    let showCropper = ref(false)
    const handleClose = () => {
      userStore.userVisible = false
    }
    const changeEmailDialogVisible = () => {
      reactiveData.emailDialogVisible = true
    }
    const bingingEmail = () => {
      let params = {
        email: reactiveData.email,
        code: reactiveData.VerificationCode
      }
      api.bindingEmail(params).then(({ data }) => {
        if (data.flag) {
          proxy.$notify({
            title: 'Success',
            message: '绑定成功',
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
            title: 'Success',
            message: '上传成功',
            type: 'success'
          })
        }
      })
    }
    const changeSubscribe = () => {
      if (reactiveData.switchState) {
        let params = {
          userId: userStore.userInfo.userInfoId,
          isSubscribe: userStore.userInfo.isSubscribe
        }
        api.updateUserSubscribe(params).then(({ data }) => {
          if (data.flag) {
            proxy.$notify({
              title: 'Success',
              message: '修改成功',
              type: 'success'
            })
          }
        })
      }
    }
    const commit = () => {
      let params = {
        nickname: userStore.userInfo.nickname,
        website: userStore.userInfo.website,
        intro: userStore.userInfo.intro
      }
      api.submitUserInfo(params).then(({ data }) => {
        if (data.flag) {
          proxy.$notify({
            title: 'Success',
            message: '修改成功',
            type: 'success'
          })
        }
      })
    }
    const sendCode = () => {
      api.sendValidationCode(reactiveData.email).then(({ data }) => {
        if (data.flag) {
          proxy.$notify({
            title: 'Success',
            message: '验证码已发送',
            type: 'success'
          })
        }
      })
    }
    const beforeChange = () => {
      reactiveData.switchState = true
      reactiveData.loading = true
      return new Promise((resolve, reject) => {
        if (userStore.userInfo.email === '' || userStore.userInfo.email === null) {
          reactiveData.loading = false
          proxy.$notify({
            title: 'Warning',
            message: '邮箱未绑定,尽快绑定哦',
            type: 'warning'
          })
          return reject(new Error('Error'))
        } else {
          reactiveData.loading = false
          return resolve(true)
        }
      })
    }
    return {
      userInfo: toRef(userStore.$state, 'userInfo'),
      ...toRefs(reactiveData),
      visible: toRef(userStore.$state, 'userVisible'),
      showCropper,
      handleClose,
      bingingEmail,
      changeEmailDialogVisible,
      changeSubscribe,
      handleSuccess,
      sendCode,
      commit,
      beforeChange,
      options: computed(() => {
        return {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + userStore.token
          }
        }
      })
    }
  }
})
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
