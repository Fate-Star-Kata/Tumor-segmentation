<template>
  <div class="min-h-screen bg-base-100 text-base-content p-6">
    <!-- 页面标题 -->
    <div class="mb-8">
      <RevealMotion :delay="0">
        <h1 class="text-3xl font-bold mb-2">分割历史记录</h1>
        <p class="text-base-content/70">查看您的肝肿瘤分割历史记录和结果</p>
      </RevealMotion>
    </div>

    <!-- 筛选器 -->
    <RevealMotion :delay="0.1">
      <div class="card bg-base-200 shadow-sm mb-6">
        <div class="card-body p-4">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="form-control">
              <label class="label">
                <span class="label-text">患者ID</span>
              </label>
              <input 
                v-model="filters.patient_id" 
                type="text" 
                placeholder="输入患者ID" 
                class="input input-bordered input-sm w-full max-w-xs"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">开始日期</span>
              </label>
              <input 
                v-model="filters.start_date" 
                type="date" 
                class="input input-bordered input-sm w-full max-w-xs"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">结束日期</span>
              </label>
              <input 
                v-model="filters.end_date" 
                type="date" 
                class="input input-bordered input-sm w-full max-w-xs"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">每页显示</span>
              </label>
              <select v-model="filters.page_size" class="select select-bordered select-sm w-full max-w-xs">
                <option value="10">10条</option>
                <option value="20">20条</option>
                <option value="50">50条</option>
              </select>
            </div>
            <div class="flex gap-2">
              <button @click="loadHistory" class="btn btn-primary btn-sm" :disabled="loading">
                <span v-if="loading" class="loading loading-spinner loading-xs"></span>
                搜索
              </button>
              <button @click="resetFilters" class="btn btn-outline btn-sm">
                重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </RevealMotion>

    <!-- 历史记录列表 -->
    <RevealMotion :delay="0.2">
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-0">
          <!-- 加载状态 -->
          <div v-if="loading" class="flex justify-center items-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <!-- 空状态 -->
          <div v-else-if="!historyData?.records?.length" class="text-center py-12">
            <div class="text-6xl mb-4">📋</div>
            <h3 class="text-lg font-semibold mb-2">暂无历史记录</h3>
            <p class="text-base-content/70">还没有进行过肿瘤分割，快去体验一下吧！</p>
          </div>

          <!-- 记录表格 -->
          <div v-else class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>患者ID</th>
                  <th>置信度</th>
                  <th>肿瘤面积</th>
                  <th>总面积</th>
                  <th>肿瘤比例</th>
                  <th>分割时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="record in historyData.records" 
                  :key="record.id"
                  class="hover:bg-base-300 cursor-pointer transition-colors"
                  @click="showDetail(record)"
                >
                  <td class="font-mono">{{ record.id }}</td>
                  <td>{{ record.patient_id || '未指定' }}</td>
                  <td>
                    <div class="badge badge-success">{{ (record.confidence * 100).toFixed(1) }}%</div>
                  </td>
                  <td>{{ record.tumor_area.toLocaleString() }} px²</td>
                  <td>{{ record.total_area.toLocaleString() }} px²</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-base-300 rounded-full h-2">
                        <div 
                          class="bg-primary h-2 rounded-full transition-all"
                          :style="{ width: `${(record.tumor_ratio * 100).toFixed(1)}%` }"
                        ></div>
                      </div>
                      <span class="text-xs">{{ (record.tumor_ratio * 100).toFixed(2) }}%</span>
                    </div>
                  </td>
                  <td>{{ formatDate(record.segmentation_time) }}</td>
                  <td>
                    <button 
                      @click.stop="showDetail(record)" 
                      class="btn btn-ghost btn-xs"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div v-if="historyData?.pagination" class="flex justify-between items-center p-4 border-t border-base-300">
            <div class="text-sm text-base-content/70">
              共 {{ historyData.pagination.total_count }} 条记录，
              第 {{ historyData.pagination.current_page }} / {{ historyData.pagination.total_pages }} 页
            </div>
            <div class="join">
              <button 
                @click="changePage(historyData.pagination.current_page - 1)"
                :disabled="!historyData.pagination.has_previous"
                class="join-item btn btn-sm"
              >
                上一页
              </button>
              <button 
                v-for="page in getPageNumbers()"
                :key="page"
                @click="changePage(page)"
                :class="[
                  'join-item btn btn-sm',
                  page === historyData.pagination.current_page ? 'btn-active' : ''
                ]"
              >
                {{ page }}
              </button>
              <button 
                @click="changePage(historyData.pagination.current_page + 1)"
                :disabled="!historyData.pagination.has_next"
                class="join-item btn btn-sm"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </RevealMotion>

    <!-- 详情模态框 -->
    <dialog ref="detailModal" class="modal">
      <div class="modal-box max-w-4xl">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        
        <h3 class="font-bold text-lg mb-4">分割详情 - ID: {{ selectedRecord?.id }}</h3>
        
        <div v-if="selectedRecord" class="space-y-6">
          <!-- 基本信息 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">置信度</div>
              <div class="stat-value text-success">{{ (selectedRecord.confidence * 100).toFixed(1) }}%</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">肿瘤面积</div>
              <div class="stat-value text-sm">{{ selectedRecord.tumor_area.toLocaleString() }}</div>
              <div class="stat-desc">px²</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">总面积</div>
              <div class="stat-value text-sm">{{ selectedRecord.total_area.toLocaleString() }}</div>
              <div class="stat-desc">px²</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">肿瘤比例</div>
              <div class="stat-value text-warning">{{ (selectedRecord.tumor_ratio * 100).toFixed(2) }}%</div>
            </div>
          </div>

          <!-- 图片展示 -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold">分割结果图像</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- 原始图像 -->
              <div class="space-y-2">
                <h5 class="font-medium">原始图像</h5>
                <div class="relative group">
                  <!-- 加载指示器 -->
                  <div class="absolute inset-0 bg-base-200 rounded-lg flex items-center justify-center z-10">
                    <span class="loading loading-spinner loading-md"></span>
                  </div>
                  <img 
                    :src="getImageUrl(selectedRecord.original_image)"
                    :data-original-path="selectedRecord.original_image"
                    alt="原始图像"
                    class="w-full h-48 object-cover rounded-lg border border-base-300 cursor-pointer hover:opacity-80 transition-opacity relative z-20"
                    style="opacity: 0; transition: opacity 0.3s ease;"
                    @click="showImageModal(getImageUrl(selectedRecord.original_image), '原始图像', $event)"
                    @error="handleImageError"
                    @load="handleImageLoad"
                    loading="lazy"
                  />
                  <div class="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center z-30 pointer-events-none">
                    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">点击放大</span>
                  </div>
                </div>
              </div>

              <!-- 分割掩码 -->
              <div class="space-y-2">
                <h5 class="font-medium">分割掩码</h5>
                <div class="relative group">
                  <!-- 加载指示器 -->
                  <div class="absolute inset-0 bg-base-200 rounded-lg flex items-center justify-center z-10">
                    <span class="loading loading-spinner loading-md"></span>
                  </div>
                  <img 
                    :src="getImageUrl(selectedRecord.mask_image)"
                    :data-original-path="selectedRecord.mask_image"
                    alt="分割掩码"
                    class="w-full h-48 object-cover rounded-lg border border-base-300 cursor-pointer hover:opacity-80 transition-opacity relative z-20"
                    style="opacity: 0; transition: opacity 0.3s ease;"
                    @click="showImageModal(getImageUrl(selectedRecord.mask_image), '分割掩码', $event)"
                    @error="handleImageError"
                    @load="handleImageLoad"
                    loading="lazy"
                  />
                  <div class="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center z-30 pointer-events-none">
                    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">点击放大</span>
                  </div>
                </div>
              </div>

              <!-- 叠加结果 -->
              <div class="space-y-2">
                <h5 class="font-medium">叠加结果</h5>
                <div class="relative group">
                  <!-- 加载指示器 -->
                  <div class="absolute inset-0 bg-base-200 rounded-lg flex items-center justify-center z-10">
                    <span class="loading loading-spinner loading-md"></span>
                  </div>
                  <img 
                    :src="getImageUrl(selectedRecord.overlay_image)"
                    :data-original-path="selectedRecord.overlay_image"
                    alt="叠加结果"
                    class="w-full h-48 object-cover rounded-lg border border-base-300 cursor-pointer hover:opacity-80 transition-opacity relative z-20"
                    style="opacity: 0; transition: opacity 0.3s ease;"
                    @click="showImageModal(getImageUrl(selectedRecord.overlay_image), '叠加结果', $event)"
                    @error="handleImageError"
                    @load="handleImageLoad"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center z-30 pointer-events-none">
                    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">点击放大</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 其他信息 -->
          <div class="space-y-2">
            <h4 class="text-lg font-semibold">其他信息</h4>
            <div class="bg-base-200 rounded-lg p-4 space-y-2">
              <div><strong>患者ID:</strong> {{ selectedRecord.patient_id || '未指定' }}</div>
              <div><strong>会话ID:</strong> <code class="text-xs">{{ selectedRecord.session_id }}</code></div>
              <div><strong>分割时间:</strong> {{ formatDate(selectedRecord.segmentation_time) }}</div>
              <div v-if="selectedRecord.diagnosis_notes">
                <strong>诊断备注:</strong> {{ selectedRecord.diagnosis_notes }}
              </div>
            </div>
          </div>

          <!-- 下载按钮 -->
          <div class="flex gap-2 pt-4">
            <button @click="downloadImage(getImageUrl(selectedRecord.original_image), '原始图像')" class="btn btn-outline btn-sm">
              下载原始图像
            </button>
            <button @click="downloadImage(getImageUrl(selectedRecord.mask_image), '分割掩码')" class="btn btn-outline btn-sm">
              下载分割掩码
            </button>
            <button @click="downloadImage(getImageUrl(selectedRecord.overlay_image), '叠加结果')" class="btn btn-outline btn-sm">
              下载叠加结果
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <!-- 图片放大模态框 -->
    <dialog ref="imageModal" class="modal">
      <div class="modal-box max-w-5xl">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        
        <h3 class="font-bold text-lg mb-4">{{ currentImageTitle }}</h3>
        
        <div class="flex justify-center">
          <img 
            :src="currentImageUrl"
            :data-original-path="currentImageUrl"
            :alt="currentImageTitle"
            class="max-w-full max-h-[70vh] object-contain rounded-lg"
            style="opacity: 0; transition: opacity 0.3s ease;"
            @error="handleImageError"
            @load="handleImageLoad"
          />
        </div>
        
        <div class="flex justify-center mt-4">
          <button @click="downloadImage(currentImageUrl, currentImageTitle)" class="btn btn-primary btn-sm">
            下载图片
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, defineComponent, onBeforeUnmount } from 'vue'
import { Motion } from 'motion-v'
import { ElMessage } from 'element-plus'
import { getSegmentationHistory } from '@/api'
import type { HistoryQueryParams, HistoryResponse, SegmentationRecord } from '@/types/apis/pagesApi_T'

// 动画组件
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
const loading = ref(false)
const historyData = ref<HistoryResponse | null>(null)
const selectedRecord = ref<SegmentationRecord | null>(null)
const detailModal = ref<HTMLDialogElement>()
const imageModal = ref<HTMLDialogElement>()
const currentImageUrl = ref('')
const currentImageTitle = ref('')

// 筛选器
const filters = ref<HistoryQueryParams>({
  page: 1,
  page_size: 20,
  patient_id: '',
  start_date: '',
  end_date: ''
})

// 服务器路径
const serverPath = import.meta.env.VITE_SERVER_PATH || 'http://localhost:8000'

// 加载历史记录
const loadHistory = async () => {
  try {
    loading.value = true
    
    // 清理空值
    const params: HistoryQueryParams = {
      page: filters.value.page,
      page_size: filters.value.page_size
    }
    
    if (filters.value.patient_id?.trim()) {
      params.patient_id = filters.value.patient_id.trim()
    }
    if (filters.value.start_date) {
      params.start_date = filters.value.start_date
    }
    if (filters.value.end_date) {
      params.end_date = filters.value.end_date
    }
    
    const response = await getSegmentationHistory(params)
    historyData.value = response.data
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重置筛选器
const resetFilters = () => {
  filters.value = {
    page: 1,
    page_size: 20,
    patient_id: '',
    start_date: '',
    end_date: ''
  }
  loadHistory()
}

// 切换页面
const changePage = (page: number) => {
  if (page < 1 || (historyData.value?.pagination && page > historyData.value.pagination.total_pages)) {
    return
  }
  filters.value.page = page
  loadHistory()
}

// 获取页码数组
const getPageNumbers = () => {
  if (!historyData.value?.pagination) return []
  
  const { current_page, total_pages } = historyData.value.pagination
  const pages: number[] = []
  
  // 显示当前页前后各2页
  const start = Math.max(1, current_page - 2)
  const end = Math.min(total_pages, current_page + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
}

// 显示详情
const showDetail = (record: SegmentationRecord) => {
  selectedRecord.value = record
  detailModal.value?.showModal()
}

// 显示图片模态框
const showImageModal = (url: string, title: string, event?: Event) => {
  // 检查图片是否加载失败
  if (event) {
    const img = event.target as HTMLImageElement
    if (img.dataset.loadFailed === 'true' || img.dataset.loadSuccess !== 'true') {
      console.warn('图片加载失败或未完成，无法放大显示')
      ElMessage.warning('图片加载失败，无法放大显示')
      return
    }
  }
  
  console.log('显示图片模态框:', url, title)
  currentImageUrl.value = url
  currentImageTitle.value = title
  
  // 确保模态框正确显示
  setTimeout(() => {
    imageModal.value?.showModal()
  }, 100)
}

// 获取图片URL
const getImageUrl = (imagePath: string) => {
  console.log('原始图片路径:', imagePath)
  console.log('服务器路径:', serverPath)
  
  if (!imagePath) return ''
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http')) return imagePath
  
  // 处理路径分隔符，统一使用正斜杠
  const normalizedPath = imagePath.replace(/\\/g, '/')
  // 移除开头的斜杠
  const cleanPath = normalizedPath.replace(/^\//, '')
  
  const finalUrl = `${serverPath}/${cleanPath}`
  console.log('最终图片URL:', finalUrl)
  
  return finalUrl
}

// 处理图片加载完成
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.log('图片加载成功:', img.src)
  
  // 标记图片加载成功
  img.dataset.loadSuccess = 'true'
  img.dataset.loadFailed = 'false'
  
  // 隐藏加载指示器
  const loadingIndicator = img.parentElement?.querySelector('.loading')
  if (loadingIndicator) {
    const loadingContainer = loadingIndicator.parentElement
    if (loadingContainer) {
      loadingContainer.style.display = 'none'
    }
  }
  
  // 确保图片可见
  img.style.opacity = '1'
  img.style.visibility = 'visible'
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const originalSrc = img.src
  
  console.error('图片加载失败:', originalSrc)
  
  // 如果还没有尝试过重试，则尝试重新构建URL
  if (!img.dataset.retried) {
    img.dataset.retried = 'true'
    
    // 尝试不同的路径格式
    const originalPath = img.getAttribute('data-original-path')
    if (originalPath) {
      // 尝试直接使用原始路径
      const retryUrl = `${serverPath}/${originalPath}`
      console.log('重试URL:', retryUrl)
      img.src = retryUrl
      return
    }
  }
  
  // 最终失败，标记为加载失败并显示占位图
  img.dataset.loadFailed = 'true'
  img.dataset.loadSuccess = 'false'
  
  // 隐藏加载指示器
  const loadingIndicator = img.parentElement?.querySelector('.loading')
  if (loadingIndicator) {
    const loadingContainer = loadingIndicator.parentElement
    if (loadingContainer) {
      loadingContainer.style.display = 'none'
    }
  }
  
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4='
  
  // 确保占位图可见
  img.style.opacity = '1'
  img.style.visibility = 'visible'
  
  // 移除点击事件和悬停效果
  img.style.cursor = 'default'
  img.onclick = null
  const parent = img.parentElement
  if (parent) {
    parent.classList.remove('cursor-pointer', 'hover:opacity-80')
    // 移除悬停文本
    const hoverOverlay = parent.querySelector('.absolute.inset-0')
    if (hoverOverlay) {
      hoverOverlay.remove()
    }
  }
  
  console.warn(`图片加载失败，已禁用点击放大: ${originalSrc}`)
}

// 下载图片
const downloadImage = async (url: string, filename: string) => {
  try {
    // 检查URL是否为占位图
    if (url.startsWith('data:image/svg+xml')) {
      ElMessage.warning('该图片加载失败，无法下载')
      return
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${filename}_${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(downloadUrl)
    ElMessage.success('图片下载成功')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载图片失败，请稍后重试')
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
/* 自定义样式 */
.table th {
  @apply bg-base-300 text-base-content font-semibold;
}

.table td {
  @apply border-b border-base-200;
}

.stat {
  @apply p-4;
}

.stat-title {
  @apply text-xs text-base-content/70 font-medium;
}

.stat-value {
  @apply text-lg font-bold;
}

.stat-desc {
  @apply text-xs text-base-content/70;
}
</style>
