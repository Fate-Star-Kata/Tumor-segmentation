<template>
  <div class="min-h-screen bg-base-100 text-base-content p-6">
    <!-- 页面标题 -->
    <div class="text-center mb-8">
      <RevealMotion :delay="0">
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          肝肿瘤智能分割
        </h1>
      </RevealMotion>
      <RevealMotion :delay="0.1">
        <p class="text-lg opacity-70">
          上传医学影像，获取精准的肿瘤分割结果
        </p>
      </RevealMotion>
    </div>

    <div class="max-w-6xl mx-auto">
      <!-- 上传区域 -->
      <RevealMotion :delay="0.2">
        <div class="card bg-base-200 shadow-lg mb-8">
          <div class="card-body">
            <h2 class="card-title text-xl mb-4">图片上传</h2>
            
            <!-- 文件上传区域 -->
            <div 
              class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center transition-colors"
              :class="{
                'border-primary bg-primary/5': isDragOver,
                'border-error bg-error/5': uploadError
              }"
              @drop="handleDrop"
              @dragover.prevent="isDragOver = true"
              @dragleave="isDragOver = false"
              @dragenter.prevent
            >
              <div v-if="!selectedFile" class="space-y-4">
                <div class="text-4xl opacity-50">
                  📁
                </div>
                <div>
                  <p class="text-lg font-medium mb-2">拖拽图片到此处或点击选择</p>
                  <p class="text-sm opacity-70">支持 JPG、PNG、JPEG 格式，最大 10MB</p>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileSelect"
                >
                <button 
                  class="btn btn-primary"
                  @click="fileInput?.click()"
                >
                  选择图片
                </button>
              </div>
              
              <!-- 已选择文件预览 -->
              <div v-else class="space-y-4">
                <div class="relative inline-block">
                  <img 
                    :src="previewUrl" 
                    alt="预览图片"
                    class="max-w-xs max-h-48 rounded-lg shadow-md"
                  >
                  <button 
                    class="btn btn-circle btn-sm btn-error absolute -top-2 -right-2"
                    @click="clearFile"
                  >
                    ✕
                  </button>
                </div>
                <div>
                  <p class="font-medium">{{ selectedFile.name }}</p>
                  <p class="text-sm opacity-70">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
              </div>
            </div>
            
            <!-- 错误提示 -->
            <div v-if="uploadError" class="alert alert-error mt-4">
              <span>{{ uploadError }}</span>
            </div>
            
            <!-- 上传按钮 -->
            <div class="card-actions justify-end mt-6">
              <button 
                class="btn btn-primary btn-lg"
                :disabled="!selectedFile || isLoading"
                @click="performSegmentation"
              >
                <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
                {{ isLoading ? '分割中...' : '开始分割' }}
              </button>
            </div>
          </div>
        </div>
      </RevealMotion>

      <!-- 分割结果展示 -->
      <RevealMotion :delay="0.3" v-if="segmentationResult">
        <div class="card bg-base-200 shadow-lg">
          <div class="card-body">
            <h2 class="card-title text-xl mb-6">分割结果</h2>
            
            <!-- 结果统计信息 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div class="stat bg-base-100 rounded-lg">
                <div class="stat-title">置信度</div>
                <div class="stat-value text-primary">{{ (segmentationResult.confidence * 100).toFixed(1) }}%</div>
              </div>
              <div class="stat bg-base-100 rounded-lg">
                <div class="stat-title">肿瘤面积</div>
                <div class="stat-value text-secondary">{{ segmentationResult.tumor_area.toLocaleString() }}</div>
                <div class="stat-desc">像素</div>
              </div>
              <div class="stat bg-base-100 rounded-lg">
                <div class="stat-title">总面积</div>
                <div class="stat-value">{{ segmentationResult.total_area.toLocaleString() }}</div>
                <div class="stat-desc">像素</div>
              </div>
              <div class="stat bg-base-100 rounded-lg">
                <div class="stat-title">肿瘤比例</div>
                <div class="stat-value text-accent">{{ (segmentationResult.tumor_ratio * 100).toFixed(2) }}%</div>
              </div>
            </div>
            
            <!-- 图片展示区域 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- 原始图片 -->
              <div class="space-y-3">
                <h3 class="font-semibold text-lg">原始图片</h3>
                <div class="relative group">
                  <img 
                    :src="getImageUrl(segmentationResult.original_image_path)"
                    alt="原始图片"
                    class="w-full rounded-lg shadow-md cursor-pointer transition-transform group-hover:scale-105"
                    @click="openImageModal(getImageUrl(segmentationResult.original_image_path), '原始图片')"
                  >
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">点击查看大图</span>
                  </div>
                </div>
              </div>
              
              <!-- 分割掩码 -->
              <div class="space-y-3">
                <h3 class="font-semibold text-lg">分割掩码</h3>
                <div class="relative group">
                  <img 
                    :src="getImageUrl(segmentationResult.mask_image_path)"
                    alt="分割掩码"
                    class="w-full rounded-lg shadow-md cursor-pointer transition-transform group-hover:scale-105"
                    @click="openImageModal(getImageUrl(segmentationResult.mask_image_path), '分割掩码')"
                  >
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">点击查看大图</span>
                  </div>
                </div>
              </div>
              
              <!-- 叠加图片 -->
              <div class="space-y-3">
                <h3 class="font-semibold text-lg">叠加结果</h3>
                <div class="relative group">
                  <img 
                    :src="getImageUrl(segmentationResult.overlay_image_path)"
                    alt="叠加结果"
                    class="w-full rounded-lg shadow-md cursor-pointer transition-transform group-hover:scale-105"
                    @click="openImageModal(getImageUrl(segmentationResult.overlay_image_path), '叠加结果')"
                  >
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">点击查看大图</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="card-actions justify-center mt-8">
              <button class="btn btn-outline" @click="resetForm">
                重新分割
              </button>
              <button class="btn btn-primary" @click="downloadResults">
                下载结果
              </button>
            </div>
          </div>
        </div>
      </RevealMotion>
    </div>

    <!-- 图片查看模态框 -->
    <div v-if="modalImage" class="modal modal-open">
      <div class="modal-box max-w-4xl">
        <h3 class="font-bold text-lg mb-4">{{ modalTitle }}</h3>
        <img :src="modalImage" alt="查看大图" class="w-full rounded-lg">
        <div class="modal-action">
          <button class="btn" @click="closeImageModal">关闭</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeImageModal"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, defineComponent, onMounted, onBeforeUnmount } from 'vue'
import { Motion } from 'motion-v'
import { segmentLiverTumor } from '@/api'
import type { SegmentResponse } from '@/types/apis/pagesApi_T'
import { ElMessage } from 'element-plus'

// RevealMotion 组件定义
type RevealProps = { delay?: number }
const RevealMotion = defineComponent<RevealProps>({
  name: 'RevealMotion',
  props: { delay: { type: Number, default: 0 } },
  setup(props, { slots }) {
    const el = ref<HTMLElement | null>(null)
    const inView = ref(false)
    let io: IntersectionObserver | null = null

    const animateProps = computed(() => {
      return inView.value
        ? { opacity: 1, y: 0, transition: { duration: 0.6, delay: props.delay } }
        : { opacity: 0, y: 16 }
    })

    onMounted(() => {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              inView.value = true
              io?.unobserve(e.target)
            }
          })
        },
        { threshold: 0.15 }
      )
      if (el.value) io.observe(el.value)
    })

    onBeforeUnmount(() => io?.disconnect())

    return () =>
      h(
        'div',
        { ref: el },
        [
          h(
            Motion as any,
            {
              initial: { opacity: 0, y: 16 },
              animate: animateProps.value,
            },
            slots
          )
        ]
      )
  },
})

// 响应式数据
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const isDragOver = ref(false)
const uploadError = ref<string>('')
const isLoading = ref(false)
const segmentationResult = ref<SegmentResponse | null>(null)
const modalImage = ref<string>('')
const modalTitle = ref<string>('')
const fileInput = ref<HTMLInputElement>()

// 文件选择处理
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    validateAndSetFile(target.files[0])
  }
}

// 拖拽处理
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    validateAndSetFile(event.dataTransfer.files[0])
  }
}

// 文件验证和设置
const validateAndSetFile = (file: File) => {
  uploadError.value = ''
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    uploadError.value = '请选择图片文件'
    return
  }
  
  // 检查文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = '文件大小不能超过 10MB'
    return
  }
  
  selectedFile.value = file
  
  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
  previewUrl.value = ''
  uploadError.value = ''
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
}

// 执行分割
const performSegmentation = async () => {
  if (!selectedFile.value) return
  
  isLoading.value = true
  uploadError.value = ''
  
  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    
    const response = await segmentLiverTumor(formData)
    
    if (response.code === 200) {
      segmentationResult.value = response.data
      ElMessage.success('分割完成！')
    } else {
      throw new Error(response.msg || '分割失败')
    }
  } catch (error: any) {
    console.error('分割错误:', error)
    uploadError.value = error.message || '分割过程中发生错误，请重试'
    ElMessage.error(uploadError.value)
  } finally {
    isLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  clearFile()
  segmentationResult.value = null
  uploadError.value = ''
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取图片URL
const getImageUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_SERVER_PATH || 'http://localhost:8000'
  return `${baseUrl}/${path}`
}

// 打开图片模态框
const openImageModal = (imageUrl: string, title: string) => {
  modalImage.value = imageUrl
  modalTitle.value = title
}

// 关闭图片模态框
const closeImageModal = () => {
  modalImage.value = ''
  modalTitle.value = ''
}

// 下载结果
const downloadResults = () => {
  if (!segmentationResult.value) return
  
  // 创建下载链接
  const downloadLink = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // 下载所有结果图片
  downloadLink(getImageUrl(segmentationResult.value.original_image_path), 'original.jpg')
  downloadLink(getImageUrl(segmentationResult.value.mask_image_path), 'mask.png')
  downloadLink(getImageUrl(segmentationResult.value.overlay_image_path), 'overlay.jpg')
  
  ElMessage.success('开始下载结果文件')
}
</script>

<style scoped>
/* 自定义样式 */
.stat {
  @apply p-4;
}

.stat-title {
  @apply text-sm opacity-70 font-medium;
}

.stat-value {
  @apply text-2xl font-bold mt-1;
}

.stat-desc {
  @apply text-xs opacity-60 mt-1;
}

/* 拖拽动画 */
.border-dashed {
  transition: all 0.3s ease;
}

/* 图片悬停效果 */
.group:hover img {
  transform: scale(1.02);
}

/* 模态框样式 */
.modal-backdrop {
  @apply bg-black/50;
}
</style>
