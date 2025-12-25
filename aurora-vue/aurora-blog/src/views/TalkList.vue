<template>
  <div>
    <Breadcrumb :current="t('menu.talks')" />
    <div class="flex flex-col">
      <div class="post-header">
        <h1 class="post-title text-white uppercase">{{ t('titles.talks') }}</h1>
      </div>
      <div class="main-grid">
        <div class="relative space-y-5">
          <div
            v-for="item in talks"
            :key="item.id"
            class="bg-ob-deep-800 flex p-4 lg:p-8 rounded-2xl shadow-xl mb-0 talk-item"
            @click="toTalk(item.id)">
            <Avatar :url="item.avatar" />
            <div class="talk-info">
              <div class="user-nickname text-sm">
                {{ item.nickname }}
              </div>
              <div class="time">
                {{ t('settings.shared-on') }}
                {{ formatTime(item.createTime) }},
                {{ t(`settings.months[${new Date(item.createTime).getMonth()}]`) }}
                {{ new Date(item.createTime).getDate() }}, {{ new Date(item.createTime).getFullYear() }}
                <template v-if="item.isTop === 1">
                  <svg-icon class="top-svg" icon-class="top" />
                  <span style="color: #f21835">置顶</span>
                </template>
                <svg-icon class="message-svg" icon-class="message" />
                {{
                  item.commentCount == null ? 0 : item.commentCount
                }}
              </div>
              <div class="talk-content" v-html="item.content" />
              <el-row v-if="item.imgs" class="talk-images">
                <el-col v-for="(img, index) of item.imgs" :key="index" :md="4">
                  <el-image
                    :src="img"
                    aspect-ratio="1"
                    class="images-items"
                    max-height="200"
                    @click.stop="handlePreview(img)" />
                </el-col>
              </el-row>
            </div>
          </div>
          <Paginator
            :page="pagination.current"
            :pageSize="pagination.size"
            :pageTotal="pagination.total"
            @pageChange="pageChangeHanlder" />
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

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { Profile, Sidebar } from '../components/Sidebar'
import Paginator from '@/components/Paginator.vue'
import Avatar from '../components/Avatar.vue'
import { v3ImgPreviewFn } from 'v3-img-preview'
import { useRouter } from 'vue-router'
import api from '@/api/api'

export default defineComponent({
  name: 'talkList',
  components: { Breadcrumb, Sidebar, Profile, Paginator, Avatar },
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const pagination = reactive({
      size: 7,
      total: 0,
      current: 1
    })
    const reactiveData = reactive({
      images: [] as any,
      talks: '' as any
    })
    onMounted(() => {
      fetchTalks()
    })
    const handlePreview = (index: any) => {
      v3ImgPreviewFn({ images: reactiveData.images, index: reactiveData.images.indexOf(index) })
    }
    const fetchTalks = () => {
      const params = {
        current: pagination.current,
        size: pagination.size
      }
      api.getTalks(params).then(({ data }) => {
        reactiveData.talks = data.data.records
        pagination.total = data.data.count
        reactiveData.talks.forEach((item: any) => {
          if (item.imgs) {
            reactiveData.images.push(...item.imgs)
          }
        })
      })
    }
    const formatTime = (data: any): string => {
      let hours = new Date(data).getHours()
      let minutes = new Date(data).getMinutes()
      let seconds = new Date(data).getSeconds()
      return hours + ':' + minutes + ':' + seconds
    }
    const toPageTop = () => {
      window.scrollTo({
        top: 0
      })
    }
    const pageChangeHanlder = (current: number) => {
      reactiveData.talks = ''
      toPageTop()
      pagination.current = current
      fetchTalks()
    }
    const toTalk = (id: any) => {
      router.push({ path: '/talks/' + id })
    }
    return {
      pagination,
      ...toRefs(reactiveData),
      formatTime,
      pageChangeHanlder,
      handlePreview,
      toTalk,
      t
    }
  }
})
</script>

<style lang="scss" scoped>
.top-svg {
  margin-left: 5px;
}

.message-svg {
  margin-left: 5px;
  font-size: 15px;
}

.talk-item:hover {
  transform: scale(1.005);
}

.el-card {
  background: var(--background-primary);
  border-radius: 10px;
  border: 0;
}

.talk-info {
  flex: 1;
  margin-left: 10px;
}

.user-nickname {
  font-weight: 530;
}

.time {
  color: #999;
  font-size: 13px;
  @media (min-width: 1280px) {
    margin-top: 4px;
  }
}

.talk-content {
  margin-top: 10px;
  font-size: 14px;
  line-height: 26px;
  white-space: pre-line;
  word-wrap: break-word;
  word-break: break-all;
}

.talk-images {
  margin-top: 8px;
}

.images-items {
  cursor: pointer;
  border-radius: 3px;
  margin-right: 5px;
}
</style>
