<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Motion } from 'motion-v'
import { Message, TrendCharts, Setting, Refresh } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { getModelPerformance, getModelSettings, updateModelSettings } from '@/api'
import type { PerformanceResponse, ModelSettings, UpdateModelSettingsRequest } from '@/types/apis/pagesApi_T'
import EmailConfig from 'components/pages/admin/systemConfig/EmailConfig.vue'
import { ElMessage } from 'element-plus'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 动画配置
const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
}

// 响应式数据
const activeTab = ref('modelPerformance')
const performanceLoading = ref(false)
const settingsLoading = ref(false)
const performanceData = ref<PerformanceResponse | null>(null)
const modelSettings = ref<ModelSettings | null>(null)
const performanceError = ref('')
const settingsError = ref('')

// 图表配置
const performanceChartOption = ref({})
const successRateChartOption = ref({})

// 模型设置表单
const settingsForm = ref<UpdateModelSettingsRequest>({
  confidence_threshold: 0.5,
  model_path: '',
  config_path: null,
  input_size: '512x512'
})

// 标签页配置
const tabList = [
  {
    key: 'modelPerformance',
    label: '模型性能统计',
    icon: 'TrendCharts'
  },
  {
    key: 'modelSettings',
    label: '模型设置',
    icon: 'Setting'
  },
  {
    key: 'emailConfig',
    label: '邮箱配置',
    icon: 'Message'
  }
]

// 切换标签页
const handleTabChange = (tabKey: string) => {
  activeTab.value = tabKey
  if (tabKey === 'modelPerformance') {
    fetchPerformanceData()
  } else if (tabKey === 'modelSettings') {
    fetchModelSettings()
  }
}

// 获取模型性能数据
const fetchPerformanceData = async () => {
  try {
    performanceLoading.value = true
    performanceError.value = ''
    const response = await getModelPerformance({ days: 30 })
    if (response.code === 200) {
      performanceData.value = response.data
      await nextTick()
      setupPerformanceCharts()
    } else {
      performanceError.value = response.msg || '获取性能数据失败'
    }
  } catch (err) {
    performanceError.value = '网络错误，请稍后重试'
    console.error('获取模型性能数据失败:', err)
  } finally {
    performanceLoading.value = false
  }
}

// 获取模型设置
const fetchModelSettings = async () => {
  try {
    settingsLoading.value = true
    settingsError.value = ''
    const response = await getModelSettings()
    if (response.code === 200) {
      modelSettings.value = response.data
      // 更新表单数据
      settingsForm.value = {
        confidence_threshold: response.data.confidence_threshold,
        model_path: response.data.model_path,
        config_path: response.data.config_path,
        input_size: response.data.input_size
      }
    } else {
      settingsError.value = response.msg || '获取模型设置失败'
    }
  } catch (err) {
    settingsError.value = '网络错误，请稍后重试'
    console.error('获取模型设置失败:', err)
  } finally {
    settingsLoading.value = false
  }
}

// 更新模型设置
const handleUpdateSettings = async () => {
  try {
    settingsLoading.value = true
    settingsError.value = ''
    const response = await updateModelSettings(settingsForm.value)
    if (response.code === 200) {
      ElMessage.success('模型设置更新成功')
      await fetchModelSettings() // 重新获取最新设置
    } else {
      settingsError.value = response.msg || '更新模型设置失败'
    }
  } catch (err) {
    settingsError.value = '网络错误，请稍后重试'
    console.error('更新模型设置失败:', err)
  } finally {
    settingsLoading.value = false
  }
}

// 设置性能图表
const setupPerformanceCharts = () => {
  if (!performanceData.value) return

  // 每日性能趋势图
  performanceChartOption.value = {
    title: {
      text: '模型性能趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['分割次数', '平均置信度', '平均肿瘤比例'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: performanceData.value.daily_stats.map(item => item.date)
    },
    yAxis: [
      {
        type: 'value',
        name: '分割次数',
        position: 'left'
      },
      {
        type: 'value',
        name: '比例/置信度',
        position: 'right',
        max: 1
      }
    ],
    series: [
      {
        name: '分割次数',
        type: 'bar',
        data: performanceData.value.daily_stats.map(item => item.total_segmentations),
        itemStyle: {
          color: '#3b82f6'
        }
      },
      {
        name: '平均置信度',
        type: 'line',
        yAxisIndex: 1,
        data: performanceData.value.daily_stats.map(item => item.avg_confidence),
        itemStyle: {
          color: '#10b981'
        }
      },
      {
        name: '平均肿瘤比例',
        type: 'line',
        yAxisIndex: 1,
        data: performanceData.value.daily_stats.map(item => item.avg_tumor_ratio),
        itemStyle: {
          color: '#f59e0b'
        }
      }
    ]
  }

  // 成功率趋势图
  successRateChartOption.value = {
    title: {
      text: '模型成功率趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: performanceData.value.daily_stats.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      name: '成功率 (%)',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '成功率',
        type: 'line',
        data: performanceData.value.daily_stats.map(item => item.success_rate),
        itemStyle: {
          color: '#ef4444'
        },
        areaStyle: {
          color: 'rgba(239, 68, 68, 0.1)'
        }
      }
    ]
  }
}

onMounted(() => {
  fetchPerformanceData()
})
</script>

<template>
  <!-- @vue-ignore -->
  <Motion :initial="pageVariants.initial" :animate="pageVariants.animate" :transition="pageVariants.transition"
    class="system-config h-full overflow-y-auto">
    <el-card>
      <!-- 标签页头部 -->
      <Motion :initial="{ opacity: 0, y: -20 }" :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, delay: 0.1 }">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="config-tabs">
          <el-tab-pane v-for="tab in tabList" :key="tab.key" :label="tab.label" :name="tab.key">
            <template #label>
              <el-space>
                <el-icon>
                  <component :is="tab.icon" />
                </el-icon>
                <span>{{ tab.label }}</span>
              </el-space>
            </template>
          </el-tab-pane>
        </el-tabs>
      </Motion>

      <!-- 配置内容区域 -->
      <Motion :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.6, delay: 0.2 }" class="config-content">
        
        <!-- 模型性能统计 -->
        <div v-if="activeTab === 'modelPerformance'" class="performance-content">
          <!-- 错误提示 -->
          <el-alert v-if="performanceError" :title="performanceError" type="error" class="mb-6" show-icon />
          
          <!-- 总体统计卡片 -->
          <div v-if="performanceData && !performanceLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Motion :initial="{ opacity: 0, y: 30, scale: 0.9 }" :animate="{ opacity: 1, y: 0, scale: 1 }"
              :whileHover="{ scale: 1.05, y: -8 }" :transition="{ duration: 0.5, delay: 0.1 }"
              class="bg-blue-50 p-6 rounded-lg cursor-pointer">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-blue-600 text-sm font-medium">总分割次数</p>
                  <p class="text-2xl font-bold text-blue-900">{{ performanceData.overall_stats.total_segmentations }}</p>
                </div>
                <el-icon size="32" class="text-blue-500">
                  <TrendCharts />
                </el-icon>
              </div>
            </Motion>
            
            <Motion :initial="{ opacity: 0, y: 30, scale: 0.9 }" :animate="{ opacity: 1, y: 0, scale: 1 }"
              :whileHover="{ scale: 1.05, y: -8 }" :transition="{ duration: 0.5, delay: 0.2 }"
              class="bg-green-50 p-6 rounded-lg cursor-pointer">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-green-600 text-sm font-medium">成功分割次数</p>
                  <p class="text-2xl font-bold text-green-900">{{ performanceData.overall_stats.total_successful }}</p>
                </div>
                <el-icon size="32" class="text-green-500">
                  <TrendCharts />
                </el-icon>
              </div>
            </Motion>
            
            <Motion :initial="{ opacity: 0, y: 30, scale: 0.9 }" :animate="{ opacity: 1, y: 0, scale: 1 }"
              :whileHover="{ scale: 1.05, y: -8 }" :transition="{ duration: 0.5, delay: 0.3 }"
              class="bg-yellow-50 p-6 rounded-lg cursor-pointer">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-yellow-600 text-sm font-medium">总体成功率</p>
                  <p class="text-2xl font-bold text-yellow-900">{{ performanceData.overall_stats.overall_success_rate.toFixed(1) }}%</p>
                </div>
                <el-icon size="32" class="text-yellow-500">
                  <TrendCharts />
                </el-icon>
              </div>
            </Motion>
            
            <Motion :initial="{ opacity: 0, y: 30, scale: 0.9 }" :animate="{ opacity: 1, y: 0, scale: 1 }"
              :whileHover="{ scale: 1.05, y: -8 }" :transition="{ duration: 0.5, delay: 0.4 }"
              class="bg-purple-50 p-6 rounded-lg cursor-pointer">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-purple-600 text-sm font-medium">平均置信度</p>
                  <p class="text-2xl font-bold text-purple-900">{{ (performanceData.overall_stats.overall_avg_confidence * 100).toFixed(1) }}%</p>
                </div>
                <el-icon size="32" class="text-purple-500">
                  <TrendCharts />
                </el-icon>
              </div>
            </Motion>
          </div>
          
          <!-- 加载状态 -->
          <div v-else-if="performanceLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div v-for="i in 4" :key="i" class="bg-gray-100 p-6 rounded-lg animate-pulse">
              <div class="flex items-center justify-between">
                <div class="space-y-2">
                  <div class="h-4 bg-gray-300 rounded w-20"></div>
                  <div class="h-8 bg-gray-300 rounded w-16"></div>
                </div>
                <div class="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
          
          <!-- 图表区域 -->
          <div v-if="performanceData && !performanceLoading" class="space-y-6">
            <!-- 性能趋势图 -->
            <Motion :initial="{ opacity: 0, y: 30 }" :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.6, delay: 0.5 }">
              <el-card>
                <template #header>
                  <div class="flex items-center justify-between">
                    <span class="font-medium">模型性能趋势</span>
                    <el-button type="primary" :icon="Refresh" :loading="performanceLoading" circle @click="fetchPerformanceData" />
                  </div>
                </template>
                <div class="h-96">
                  <v-chart :option="performanceChartOption" class="w-full h-full" />
                </div>
              </el-card>
            </Motion>
            
            <!-- 成功率趋势图 -->
            <Motion :initial="{ opacity: 0, y: 30 }" :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.6, delay: 0.6 }">
              <el-card>
                <template #header>
                  <span class="font-medium">模型成功率趋势</span>
                </template>
                <div class="h-80">
                  <v-chart :option="successRateChartOption" class="w-full h-full" />
                </div>
              </el-card>
            </Motion>
          </div>
          
          <!-- 图表加载状态 -->
          <div v-else-if="performanceLoading" class="space-y-6">
            <el-card>
              <template #header>
                <span class="font-medium">加载中...</span>
              </template>
              <div class="h-96 flex items-center justify-center">
                <el-icon class="is-loading" size="48">
                  <Refresh />
                </el-icon>
              </div>
            </el-card>
          </div>
        </div>
        
        <!-- 模型设置 -->
        <div v-if="activeTab === 'modelSettings'" class="settings-content">
          <!-- 错误提示 -->
          <el-alert v-if="settingsError" :title="settingsError" type="error" class="mb-6" show-icon />
          
          <!-- 当前设置展示 -->
          <Motion :initial="{ opacity: 0, y: 30 }" :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.1 }">
            <el-card class="mb-6">
              <template #header>
                <div class="flex items-center justify-between">
                  <span class="font-medium">当前模型设置</span>
                  <el-button type="primary" :icon="Refresh" :loading="settingsLoading" circle @click="fetchModelSettings" />
                </div>
              </template>
              
              <div v-if="modelSettings && !settingsLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <p class="text-blue-600 text-sm font-medium mb-2">置信度阈值</p>
                  <p class="text-xl font-bold text-blue-900">{{ modelSettings.confidence_threshold }}</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                  <p class="text-green-600 text-sm font-medium mb-2">模型路径</p>
                  <p class="text-xl font-bold text-green-900">{{ modelSettings.model_path || '未设置' }}</p>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                  <p class="text-yellow-600 text-sm font-medium mb-2">配置路径</p>
                  <p class="text-xl font-bold text-yellow-900">{{ modelSettings.config_path || '未设置' }}</p>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                  <p class="text-purple-600 text-sm font-medium mb-2">输入尺寸</p>
                  <p class="text-xl font-bold text-purple-900">{{ modelSettings.input_size }}</p>
                </div>
              </div>
              
              <div v-else-if="settingsLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div v-for="i in 4" :key="i" class="bg-gray-100 p-4 rounded-lg animate-pulse">
                  <div class="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                  <div class="h-6 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            </el-card>
          </Motion>
          
          <!-- 设置更新表单 -->
          <Motion :initial="{ opacity: 0, y: 30 }" :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.2 }">
            <el-card>
              <template #header>
                <span class="font-medium">更新模型设置</span>
              </template>
              
              <el-form :model="settingsForm" label-width="120px" class="max-w-2xl">
                <el-form-item label="置信度阈值">
                  <el-slider
                    v-model="settingsForm.confidence_threshold"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    show-input
                    :show-input-controls="false"
                  />
                  <p class="text-sm text-gray-500 mt-1">检测结果的最小置信度要求 (0-1)</p>
                </el-form-item>
                
                <el-form-item label="模型路径">
                  <el-input
                    v-model="settingsForm.model_path"
                    placeholder="请输入模型文件路径"
                  />
                  <p class="text-sm text-gray-500 mt-1">模型文件的完整路径</p>
                </el-form-item>
                
                <el-form-item label="配置路径">
                  <el-input
                    v-model="settingsForm.config_path"
                    placeholder="请输入配置文件路径（可选）"
                  />
                  <p class="text-sm text-gray-500 mt-1">配置文件的路径（可选）</p>
                </el-form-item>
                
                <el-form-item label="输入尺寸">
                  <el-input
                    v-model="settingsForm.input_size"
                    placeholder="请输入输入图像尺寸（如：512x512）"
                  />
                  <p class="text-sm text-gray-500 mt-1">模型输入图像的尺寸格式</p>
                </el-form-item>
                
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="settingsLoading"
                    @click="handleUpdateSettings"
                    class="w-full"
                  >
                    更新设置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </Motion>
        </div>
        
        <!-- 邮箱配置 -->
        <EmailConfig v-if="activeTab === 'emailConfig'" />
      </Motion>
    </el-card>
  </Motion>
</template>

<style scoped lang="scss">
.system-config {
  .el-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

    :deep(.el-card__body) {
      padding: 24px;
    }
  }

  .config-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 24px;
      border-bottom: 2px solid #f0f2f5;
    }

    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none;
      }
    }

    :deep(.el-tabs__item) {
      font-size: 16px;
      font-weight: 500;
      padding: 0 24px;
      height: 48px;
      line-height: 48px;
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
        transform: translateY(-2px);
      }

      &.is-active {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 3px;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
    }
  }

  .config-content {
    min-height: 400px;
  }

  // 模型性能统计样式
  .performance-content {
    .grid {
      display: grid;
      gap: 1.5rem;
      
      &.grid-cols-1 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }
      
      @media (min-width: 768px) {
        &.md\:grid-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      
      @media (min-width: 1024px) {
        &.lg\:grid-cols-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
    }
    
    .bg-blue-50, .bg-green-50, .bg-yellow-50, .bg-purple-50 {
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
    }
    
    .bg-blue-50 {
      background-color: #eff6ff;
      border: 1px solid #dbeafe;
    }
    
    .bg-green-50 {
      background-color: #f0fdf4;
      border: 1px solid #dcfce7;
    }
    
    .bg-yellow-50 {
      background-color: #fefce8;
      border: 1px solid #fef3c7;
    }
    
    .bg-purple-50 {
      background-color: #faf5ff;
      border: 1px solid #e9d5ff;
    }
  }
  
  // 模型设置样式
  .settings-content {
    .grid {
      display: grid;
      gap: 1.5rem;
      
      &.grid-cols-1 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }
      
      @media (min-width: 768px) {
        &.md\:grid-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      
      @media (min-width: 1024px) {
        &.lg\:grid-cols-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
    }
    
    .bg-blue-50, .bg-green-50, .bg-yellow-50, .bg-purple-50 {
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
    
    .max-w-2xl {
      max-width: 42rem;
    }
  }
  
  // 通用工具类样式
  .mb-6 {
    margin-bottom: 1.5rem;
  }
  
  .mb-2 {
    margin-bottom: 0.5rem;
  }
  
  .mt-1 {
    margin-top: 0.25rem;
  }
  
  .p-4 {
    padding: 1rem;
  }
  
  .p-6 {
    padding: 1.5rem;
  }
  
  .rounded-lg {
    border-radius: 8px;
  }
  
  .font-medium {
    font-weight: 500;
  }
  
  .font-bold {
    font-weight: 700;
  }
  
  .text-sm {
    font-size: 0.875rem;
  }
  
  .text-xl {
    font-size: 1.25rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .cursor-pointer {
    cursor: pointer;
  }
  
  .space-y-2 > * + * {
    margin-top: 0.5rem;
  }
  
  .space-y-6 > * + * {
    margin-top: 1.5rem;
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }
  
  .bg-gray-100 {
    background-color: #f3f4f6;
  }
  
  .bg-gray-300 {
    background-color: #d1d5db;
  }
  
  .text-gray-500 {
    color: #6b7280;
  }
  
  .h-4 {
    height: 1rem;
  }
  
  .h-6 {
    height: 1.5rem;
  }
  
  .h-8 {
    height: 2rem;
  }
  
  .h-80 {
    height: 20rem;
  }
  
  .h-96 {
    height: 24rem;
  }
  
  .w-8 {
    width: 2rem;
  }
  
  .w-16 {
    width: 4rem;
  }
  
  .w-20 {
    width: 5rem;
  }
  
  .w-full {
    width: 100%;
  }
  
  .flex {
    display: flex;
  }
  
  .items-center {
    align-items: center;
  }
  
  .justify-between {
    justify-content: space-between;
  }
  
  .justify-center {
    justify-content: center;
  }
  
  .rounded {
    border-radius: 0.25rem;
  }
  
  // 颜色类
  .text-blue-600 {
    color: #2563eb;
  }
  
  .text-blue-900 {
    color: #1e3a8a;
  }
  
  .text-green-600 {
    color: #16a34a;
  }
  
  .text-green-900 {
    color: #14532d;
  }
  
  .text-yellow-600 {
    color: #ca8a04;
  }
  
  .text-yellow-900 {
    color: #713f12;
  }
  
  .text-purple-600 {
    color: #9333ea;
  }
  
  .text-purple-900 {
    color: #581c87;
  }
  
  .text-blue-500 {
    color: #3b82f6;
  }
  
  .text-green-500 {
    color: #10b981;
  }
  
  .text-yellow-500 {
    color: #f59e0b;
  }
  
  .text-purple-500 {
    color: #8b5cf6;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .system-config {
    .performance-content,
    .settings-content {
      .lg\:grid-cols-4,
      .md\:grid-cols-2 {
        grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
      }
    }
  }
}

@media (max-width: 480px) {
  .system-config {
    .text-2xl {
      font-size: 1.25rem;
    }
    
    .p-6 {
      padding: 1rem;
    }
    
    .p-4 {
      padding: 0.75rem;
    }
  }
}
</style>
