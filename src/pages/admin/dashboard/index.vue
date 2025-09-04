<script setup lang="ts">
import { Motion } from 'motion-v'
import { Refresh, TrendCharts, PieChart, User, DataAnalysis } from '@element-plus/icons-vue'
import { ref, onMounted, nextTick } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart as EChartsPieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { getSegmentationStats } from '@/api'
import type { StatsResponse } from '@/types/apis/pagesApi_T'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  EChartsPieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const loading = ref(false)
const statsData = ref<StatsResponse | null>(null)
const error = ref('')

// 图表配置
const dailyStatsOption = ref({})
const confidenceDistributionOption = ref({})
const patientStatsOption = ref({})

// 动画配置
const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  whileHover: {
    scale: 1.02,
    y: -5,
    transition: { duration: 0.2, ease: ['easeOut'] }
  },
  transition: { duration: 0.4, ease: ['easeOut'] }
}

const statsCardVariants = {
  initial: { opacity: 0, y: 40, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  whileHover: {
    scale: 1.05,
    y: -8,
    transition: { duration: 0.3, ease: ['easeOut'] }
  },
  transition: { duration: 0.5, ease: ['easeOut'] }
}

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  whileHover: {
    scale: 1.2,
    rotate: 10,
    transition: { duration: 0.2, ease: ['easeOut'] }
  },
  transition: { duration: 0.6, delay: 0.3, ease: ['easeOut'] }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await getSegmentationStats({ days: 30 })
    if (response.code === 200) {
      statsData.value = response.data
      await nextTick()
      setupCharts()
    } else {
      error.value = response.msg || '获取数据失败'
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('获取统计数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 设置图表配置
const setupCharts = () => {
  if (!statsData.value) return

  // 每日统计趋势图
  dailyStatsOption.value = {
    title: {
      text: '每日分割统计趋势',
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
      data: statsData.value.daily_stats.map(item => item.day)
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
        data: statsData.value.daily_stats.map(item => item.count),
        itemStyle: {
          color: '#3b82f6'
        }
      },
      {
        name: '平均置信度',
        type: 'line',
        yAxisIndex: 1,
        data: statsData.value.daily_stats.map(item => item.avg_confidence),
        itemStyle: {
          color: '#10b981'
        }
      },
      {
        name: '平均肿瘤比例',
        type: 'line',
        yAxisIndex: 1,
        data: statsData.value.daily_stats.map(item => item.avg_tumor_ratio),
        itemStyle: {
          color: '#f59e0b'
        }
      }
    ]
  }

  // 置信度分布饼图
  confidenceDistributionOption.value = {
    title: {
      text: '置信度分布',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '置信度分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: statsData.value.confidence_distribution.map(item => ({
          value: item.count,
          name: item.range
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  // 患者统计柱状图
  patientStatsOption.value = {
    title: {
      text: '患者分割统计',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis'
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
      data: statsData.value.patient_stats.map(item => item.patient_id || '未知患者')
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
        data: statsData.value.patient_stats.map(item => item.count),
        itemStyle: {
          color: '#8b5cf6'
        }
      },
      {
        name: '平均置信度',
        type: 'line',
        yAxisIndex: 1,
        data: statsData.value.patient_stats.map(item => item.avg_confidence),
        itemStyle: {
          color: '#ef4444'
        }
      },
      {
        name: '平均肿瘤比例',
        type: 'line',
        yAxisIndex: 1,
        data: statsData.value.patient_stats.map(item => item.avg_tumor_ratio),
        itemStyle: {
          color: '#06b6d4'
        }
      }
    ]
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="dashboard">
    <!-- 仪表板页面 -->
    <Motion :initial="cardVariants.initial" :animate="cardVariants.animate" :whileHover="cardVariants.whileHover as any"
      :transition="{ ...cardVariants.transition, delay: 0.3 } as any">
      <el-card class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-medium">肿瘤分割统计仪表板</span>
            <Motion :initial="{ scale: 0.8, opacity: 0 }" :animate="{ scale: 1, opacity: 1 }"
              :whileHover="{ scale: 1.05 }" :transition="{ duration: 0.3, delay: 0.5 }">
              <el-button type="primary" :icon="Refresh" :loading="loading" circle @click="fetchStats" />
            </Motion>
          </div>
        </template>

        <!-- 错误提示 -->
        <el-alert v-if="error" :title="error" type="error" class="mb-6" show-icon />

        <!-- 统计卡片 -->
        <div v-if="statsData" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Motion :initial="statsCardVariants.initial" :animate="statsCardVariants.animate"
            :whileHover="statsCardVariants.whileHover as any"
            :transition="{ ...statsCardVariants.transition, delay: 0.4 } as any"
            class="bg-blue-50 p-6 rounded-lg cursor-pointer">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-600 text-sm font-medium">总分割次数</p>
                <Motion :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }"
                  :transition="{ duration: 0.4, delay: 0.6 }">
                  <p class="text-2xl font-bold text-blue-900">{{ statsData.total_segmentations }}</p>
                </Motion>
              </div>
              <Motion :initial="iconVariants.initial" :animate="iconVariants.animate"
                :whileHover="iconVariants.whileHover as any"
                :transition="{ ...iconVariants.transition, delay: 0.5 } as any" class="text-blue-500">
                <el-icon size="32">
                  <DataAnalysis />
                </el-icon>
              </Motion>
            </div>
          </Motion>

          <Motion :initial="statsCardVariants.initial" :animate="statsCardVariants.animate"
            :whileHover="statsCardVariants.whileHover as any"
            :transition="{ ...statsCardVariants.transition, delay: 0.5 } as any"
            class="bg-green-50 p-6 rounded-lg cursor-pointer">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-600 text-sm font-medium">患者数量</p>
                <Motion :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }"
                  :transition="{ duration: 0.4, delay: 0.7 }">
                  <p class="text-2xl font-bold text-green-900">{{ statsData.patient_stats.length }}</p>
                </Motion>
              </div>
              <Motion :initial="iconVariants.initial" :animate="iconVariants.animate"
                :whileHover="iconVariants.whileHover as any"
                :transition="{ ...iconVariants.transition, delay: 0.6 } as any" class="text-green-500">
                <el-icon size="32">
                  <User />
                </el-icon>
              </Motion>
            </div>
          </Motion>

          <Motion :initial="statsCardVariants.initial" :animate="statsCardVariants.animate"
            :whileHover="statsCardVariants.whileHover as any"
            :transition="{ ...statsCardVariants.transition, delay: 0.6 } as any"
            class="bg-yellow-50 p-6 rounded-lg cursor-pointer">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-yellow-600 text-sm font-medium">统计天数</p>
                <Motion :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }"
                  :transition="{ duration: 0.4, delay: 0.8 }">
                  <p class="text-2xl font-bold text-yellow-900">{{ statsData.date_range.days }}</p>
                </Motion>
              </div>
              <Motion :initial="iconVariants.initial" :animate="iconVariants.animate"
                :whileHover="iconVariants.whileHover as any"
                :transition="{ ...iconVariants.transition, delay: 0.7 } as any" class="text-yellow-500">
                <el-icon size="32">
                  <TrendCharts />
                </el-icon>
              </Motion>
            </div>
          </Motion>

          <Motion :initial="statsCardVariants.initial" :animate="statsCardVariants.animate"
            :whileHover="statsCardVariants.whileHover as any"
            :transition="{ ...statsCardVariants.transition, delay: 0.7 } as any"
            class="bg-purple-50 p-6 rounded-lg cursor-pointer">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-600 text-sm font-medium">活跃天数</p>
                <Motion :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }"
                  :transition="{ duration: 0.4, delay: 0.9 }">
                  <p class="text-2xl font-bold text-purple-900">{{ statsData.daily_stats.length }}</p>
                </Motion>
              </div>
              <Motion :initial="iconVariants.initial" :animate="iconVariants.animate"
                :whileHover="iconVariants.whileHover as any"
                :transition="{ ...iconVariants.transition, delay: 0.8 } as any" class="text-purple-500">
                <el-icon size="32">
                  <PieChart />
                </el-icon>
              </Motion>
            </div>
          </Motion>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
      </el-card>
    </Motion>

    <!-- 图表区域 -->
    <div v-if="statsData && !loading" class="space-y-6">
      <!-- 每日统计趋势图 -->
      <Motion :initial="cardVariants.initial" :animate="cardVariants.animate"
        :whileHover="cardVariants.whileHover as any" :transition="{ ...cardVariants.transition, delay: 0.8 } as any">
        <el-card>
          <template #header>
            <span class="font-medium">每日分割统计趋势</span>
          </template>
          <div class="h-96">
            <v-chart :option="dailyStatsOption" class="w-full h-full" />
          </div>
        </el-card>
      </Motion>

      <!-- 置信度分布和患者统计 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Motion :initial="cardVariants.initial" :animate="cardVariants.animate"
          :whileHover="cardVariants.whileHover as any" :transition="{ ...cardVariants.transition, delay: 0.9 } as any">
          <el-card>
            <template #header>
              <span class="font-medium">置信度分布</span>
            </template>
            <div class="h-80">
              <v-chart :option="confidenceDistributionOption" class="w-full h-full" />
            </div>
          </el-card>
        </Motion>

        <Motion :initial="cardVariants.initial" :animate="cardVariants.animate"
          :whileHover="cardVariants.whileHover as any" :transition="{ ...cardVariants.transition, delay: 1.0 } as any">
          <el-card>
            <template #header>
              <span class="font-medium">患者分割统计</span>
            </template>
            <div class="h-80">
              <v-chart :option="patientStatsOption" class="w-full h-full" />
            </div>
          </el-card>
        </Motion>
      </div>
    </div>

    <!-- 图表加载状态 -->
    <div v-else-if="loading" class="space-y-6">
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
</template>

<style scoped>
.dashboard {
  width: 100%;
}

/* 统计卡片增强样式 */
.cursor-pointer {
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.cursor-pointer:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 响应式动画优化 */
@media (prefers-reduced-motion: reduce) {
  .cursor-pointer {
    transition: none;
  }
}

/* 增强卡片视觉效果 */
.el-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.el-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}
</style>