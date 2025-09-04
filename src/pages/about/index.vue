<template>
  <div class="min-h-screen bg-base-100 text-base-content">
    <!-- 页面标题 -->
    <div class="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
      <div class="container mx-auto px-4">
        <RevealMotion :delay="0">
          <h1 class="text-4xl md:text-5xl font-bold text-center mb-4">
            模型信息
          </h1>
        </RevealMotion>
        <RevealMotion :delay="0.1">
          <p class="text-lg text-center opacity-70">
            查看当前模型设置和性能统计数据
          </p>
        </RevealMotion>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 模型设置卡片 -->
        <RevealMotion :delay="0.2">
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                模型设置
              </h2>
              
              <div v-if="modelSettingsLoading" class="flex justify-center py-8">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
              
              <div v-else-if="modelSettings" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="stat bg-base-100 rounded-lg">
                    <div class="stat-title">置信度阈值</div>
                    <div class="stat-value text-primary">{{ modelSettings.confidence_threshold }}</div>
                  </div>
                  <div class="stat bg-base-100 rounded-lg">
                    <div class="stat-title">输入尺寸</div>
                    <div class="stat-value text-secondary">{{ modelSettings.input_size }}</div>
                  </div>
                </div>
                
                <div class="space-y-3">
                  <div class="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                    <span class="font-medium">模型状态</span>
                    <div class="badge" :class="modelSettings.is_active ? 'badge-success' : 'badge-error'">
                      {{ modelSettings.is_active ? '激活' : '未激活' }}
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                    <span class="font-medium">创建时间</span>
                    <span class="text-sm opacity-70">{{ formatDateTime(modelSettings.created_time) }}</span>
                  </div>
                  
                  <div class="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                    <span class="font-medium">更新时间</span>
                    <span class="text-sm opacity-70">{{ formatDateTime(modelSettings.updated_time) }}</span>
                  </div>
                </div>
              </div>
              
              <div v-else class="text-center py-8">
                <div class="text-error">加载模型设置失败</div>
                <button class="btn btn-outline btn-sm mt-2" @click="loadModelSettings">
                  重新加载
                </button>
              </div>
            </div>
          </div>
        </RevealMotion>

        <!-- 性能统计卡片 -->
        <RevealMotion :delay="0.3">
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                性能统计
                <select class="select select-sm select-bordered ml-auto" v-model="selectedDays" @change="loadPerformanceStats">
                  <option value="7">最近7天</option>
                  <option value="30">最近30天</option>
                  <option value="90">最近90天</option>
                </select>
              </h2>
              
              <div v-if="performanceLoading" class="flex justify-center py-8">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
              
              <div v-else-if="performanceStats" class="space-y-6">
                <!-- 总体统计 -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="stat bg-base-100 rounded-lg">
                    <div class="stat-title">总分割次数</div>
                    <div class="stat-value text-primary">{{ performanceStats.overall_stats.total_segmentations }}</div>
                  </div>
                  <div class="stat bg-base-100 rounded-lg">
                    <div class="stat-title">成功率</div>
                    <div class="stat-value text-success">{{ performanceStats.overall_stats.overall_success_rate.toFixed(1) }}%</div>
                  </div>
                  <div class="stat bg-base-100 rounded-lg">
                    <div class="stat-title">平均置信度</div>
                    <div class="stat-value text-info">{{ performanceStats.overall_stats.overall_avg_confidence.toFixed(3) }}</div>
                  </div>
                  <div class="stat bg-base-100 rounded-lg">
                    <div class="stat-title">平均肿瘤比例</div>
                    <div class="stat-value text-warning">{{ (performanceStats.overall_stats.overall_avg_tumor_ratio * 100).toFixed(1) }}%</div>
                  </div>
                </div>
                
                <!-- 每日统计表格 -->
                <div class="overflow-x-auto">
                  <table class="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>日期</th>
                        <th>分割次数</th>
                        <th>成功次数</th>
                        <th>成功率</th>
                        <th>平均置信度</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="stat in performanceStats.daily_stats" :key="stat.date">
                        <td>{{ formatDate(stat.date) }}</td>
                        <td>{{ stat.total_segmentations }}</td>
                        <td>{{ stat.successful_segmentations }}</td>
                        <td>
                          <div class="badge" :class="stat.success_rate === 100 ? 'badge-success' : 'badge-warning'">
                            {{ stat.success_rate.toFixed(1) }}%
                          </div>
                        </td>
                        <td>{{ stat.avg_confidence.toFixed(3) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div v-else class="text-center py-8">
                <div class="text-error">加载性能统计失败</div>
                <button class="btn btn-outline btn-sm mt-2" @click="loadPerformanceStats">
                  重新加载
                </button>
              </div>
            </div>
          </div>
        </RevealMotion>
      </div>
      
      <!-- 统计时间范围信息 -->
      <RevealMotion :delay="0.4">
        <div v-if="performanceStats" class="text-center mt-8 opacity-70">
          <p class="text-sm">
            统计时间范围：{{ formatDate(performanceStats.date_range.start_date) }} 至 {{ formatDate(performanceStats.date_range.end_date) }}
            （{{ performanceStats.date_range.days }} 天）
          </p>
        </div>
      </RevealMotion>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, defineComponent, computed } from 'vue'
import { Motion } from 'motion-v'
import { ElMessage } from 'element-plus'
import { getModelSettings, getModelPerformance } from '@/api'
import type { ModelSettings, PerformanceResponse } from '@/types/apis/pagesApi_T'

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
const modelSettings = ref<ModelSettings | null>(null)
const modelSettingsLoading = ref(false)
const performanceStats = ref<PerformanceResponse | null>(null)
const performanceLoading = ref(false)
const selectedDays = ref(7)

// 加载模型设置
const loadModelSettings = async () => {
  try {
    modelSettingsLoading.value = true
    const response = await getModelSettings()
    if (response.code === 200) {
      modelSettings.value = response.data
    } else {
      throw new Error(response.msg || '获取模型设置失败')
    }
  } catch (error) {
    console.error('加载模型设置失败:', error)
    ElMessage.error('加载模型设置失败')
  } finally {
    modelSettingsLoading.value = false
  }
}

// 加载性能统计
const loadPerformanceStats = async () => {
  try {
    performanceLoading.value = true
    const response = await getModelPerformance({ days: selectedDays.value })
    if (response.code === 200) {
      performanceStats.value = response.data
    } else {
      throw new Error(response.msg || '获取性能统计失败')
    }
  } catch (error) {
    console.error('加载性能统计失败:', error)
    ElMessage.error('加载性能统计失败')
  } finally {
    performanceLoading.value = false
  }
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadModelSettings()
  loadPerformanceStats()
})
</script>

<style scoped>
/* 自定义样式 */
.stat {
  @apply p-4;
}

.stat-title {
  @apply text-sm opacity-70 mb-1;
}

.stat-value {
  @apply text-2xl font-bold;
}

.table th {
  @apply bg-base-300;
}
</style>