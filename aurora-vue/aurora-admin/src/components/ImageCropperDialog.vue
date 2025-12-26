<template>
  <el-dialog :title="title" :visible.sync="visible" width="560px" append-to-body>
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <vue-cropper
        v-if="imageUrl"
        ref="cropper"
        :img="imageUrl"
        :output-type="outputType"
        :info="true"
        :auto-crop="true"
        :auto-crop-width="autoCropWidth"
        :auto-crop-height="autoCropHeight"
        :fixed="true"
        :fixed-number="ratio"
        :fixed-box="fixedBox"
        :can-move="true"
        :center-box="true"
        style="width: 320px; height: 320px;"
      />
      <div style="margin-left: 1rem;">
        <el-button-group>
          <el-button size="mini" @click="$refs.cropper && $refs.cropper.changeScale(1)">放大</el-button>
          <el-button size="mini" @click="$refs.cropper && $refs.cropper.changeScale(-1)">缩小</el-button>
          <el-button size="mini" @click="$refs.cropper && $refs.cropper.rotateLeft()">左旋</el-button>
          <el-button size="mini" @click="$refs.cropper && $refs.cropper.rotateRight()">右旋</el-button>
        </el-button-group>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="onCancel">取 消</el-button>
      <el-button type="primary" @click="onConfirm">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { VueCropper } from 'vue-cropper'

export default {
  name: 'ImageCropperDialog',
  components: { VueCropper },
  props: {
    title: { type: String, default: '裁剪图片' },
    ratio: { type: Array, default: () => [1, 1] },
    size: { type: Number, default: 200 },
    fixedBox: { type: Boolean, default: true },
    outputType: { type: String, default: 'png' }
  },
  data() {
    return {
      visible: false,
      imageUrl: '',
      currentMime: 'image/jpeg'
    }
  },
  computed: {
    autoCropWidth() {
      return this.size
    },
    autoCropHeight() {
      // 根据比例计算高度
      const [w, h] = this.ratio
      if (!w || !h) return this.size
      return Math.round((this.size * h) / w)
    }
  },
  methods: {
    open(file) {
      if (!file) return
      this.currentMime = file.type || 'image/jpeg'
      const reader = new FileReader()
      reader.onload = () => {
        this.imageUrl = reader.result
        this.visible = true
      }
      reader.onerror = () => {
        this.$message.error('读取图片失败')
      }
      reader.readAsDataURL(file)
    },
    onCancel() {
      this.visible = false
      this.reset()
      this.$emit('cancel')
    },
    onConfirm() {
      if (!this.$refs.cropper) {
        this.$message.error('图片未加载完成')
        return
      }
      this.$refs.cropper.getCropBlob((blob) => {
        if (!blob) {
          this.$message.error('裁剪失败')
          return
        }
        this.visible = false
        const payload = { blob, mime: this.currentMime }
        this.$emit('confirm', payload)
        this.reset()
      })
    },
    reset() {
      this.imageUrl = ''
      this.currentMime = 'image/jpeg'
    }
  }
}
</script>

<style scoped>
</style>

