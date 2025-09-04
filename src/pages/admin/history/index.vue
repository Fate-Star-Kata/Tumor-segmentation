<script setup lang="ts">
import { Motion } from 'motion-v'
import { 
  Refresh, 
  View, 
  Delete, 
  Download, 
  Calendar, 
  User, 
  DataAnalysis,
  Picture,
  Close,
  Select
} from '@element-plus/icons-vue'
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSegmentationHistory, deleteSegmentationRecord, batchDeleteSegmentationRecords } from '@/api'
import type { HistoryResponse, SegmentationRecord } from '@/types/apis/pagesApi_T'

const loading = ref(false)
const historyData = ref<HistoryResponse | null>(null)
const error = ref('')
const selectedRecord = ref<SegmentationRecord | null>(null)
const detailModalVisible = ref(false)
const imageModalVisible = ref(false)
const currentImageUrl = ref('')
const currentImageType = ref('')

// 批量选择相关
const selectedRecords = ref<number[]>([])
const isSelectAll = ref(false)
const isIndeterminate = ref(false)

// 分页参数
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选参数
const filterForm = ref({
  patient_id: '',
  start_date: '',
  end_date: ''
})

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

const listItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  whileHover: {
    scale: 1.01,
    x: 5,
    transition: { duration: 0.2, ease: ['easeOut'] }
  },
  transition: { duration: 0.3, ease: ['easeOut'] }
}

// 计算属性
const totalPages = computed(() => {
  return historyData.value?.pagination.total_pages || 0
})

const totalCount = computed(() => {
  return historyData.value?.pagination.total_count || 0
})

// 批量选择计算属性
const hasSelectedRecords = computed(() => {
  return selectedRecords.value.length > 0
})

const selectedCount = computed(() => {
  return selectedRecords.value.length
})

// 获取历史记录
const fetchHistory = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      ...(filterForm.value.patient_id && { patient_id: filterForm.value.patient_id }),
      ...(filterForm.value.start_date && { start_date: filterForm.value.start_date }),
      ...(filterForm.value.end_date && { end_date: filterForm.value.end_date })
    }
    
    const response = await getSegmentationHistory(params)
    if (response.code === 200) {
      historyData.value = response.data
      // 清空之前的选择状态
      selectedRecords.value = []
      updateSelectAllState()
    } else {
      error.value = response.msg || '获取历史记录失败'
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('获取历史记录失败:', err)
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilter = () => {
  filterForm.value = {
    patient_id: '',
    start_date: '',
    end_date: ''
  }
  currentPage.value = 1
  fetchHistory()
}

// 应用筛选
const applyFilter = () => {
  currentPage.value = 1
  fetchHistory()
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchHistory()
}

// 页面大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchHistory()
}

// 查看详情
const viewDetail = (record: SegmentationRecord) => {
  selectedRecord.value = record
  detailModalVisible.value = true
}

// 删除记录
const deleteRecord = async (record: SegmentationRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除ID为 ${record.id} 的分割记录吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await deleteSegmentationRecord(record.id)
    if (response.code === 200) {
      ElMessage.success(`删除成功：${response.data.message}`)
      fetchHistory()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除记录失败:', err)
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 批量选择相关方法
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedRecords.value = historyData.value?.records.map(record => record.id) || []
  } else {
    selectedRecords.value = []
  }
  updateSelectAllState()
}

const handleRecordSelect = (recordId: number, checked: boolean) => {
  if (checked) {
    selectedRecords.value.push(recordId)
  } else {
    const index = selectedRecords.value.indexOf(recordId)
    if (index > -1) {
      selectedRecords.value.splice(index, 1)
    }
  }
  updateSelectAllState()
}

const updateSelectAllState = () => {
  const totalRecords = historyData.value?.records.length || 0
  const selectedCount = selectedRecords.value.length
  
  isSelectAll.value = selectedCount === totalRecords && totalRecords > 0
  isIndeterminate.value = selectedCount > 0 && selectedCount < totalRecords
}

// 批量删除
const batchDelete = async () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRecords.value.length} 条记录吗？此操作不可恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await batchDeleteSegmentationRecords({ record_ids: selectedRecords.value })
    if (response.code === 200) {
      ElMessage.success(`批量删除成功：${response.data.message}`)
      selectedRecords.value = []
      updateSelectAllState()
      fetchHistory()
    } else {
      ElMessage.error(response.msg || '批量删除失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('批量删除失败:', err)
      ElMessage.error('批量删除失败，请稍后重试')
    }
  }
}

// 清空选择
const clearSelection = () => {
  selectedRecords.value = []
  updateSelectAllState()
}

// 获取服务器路径
const serverPath = import.meta.env.VITE_SERVER_PATH || 'http://localhost:8000'

// 查看图片
const viewImage = (imageUrl: string, imageType: string) => {
  // 构建完整的图片URL
  currentImageUrl.value = `${serverPath}/media/${imageUrl}`
  currentImageType.value = imageType
  imageModalVisible.value = true
}

// 下载图片
const downloadImage = (imageUrl: string, filename: string) => {
  const fullUrl = `${serverPath}/media/${imageUrl}`
  
  const link = document.createElement('a')
  link.href = fullUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 格式化置信度
const formatConfidence = (confidence: number) => {
  return (confidence * 100).toFixed(1) + '%'
}

// 格式化肿瘤比例
const formatTumorRatio = (ratio: number) => {
  return (ratio * 100).toFixed(2) + '%'
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="history-page">
    <!-- 页面标题 -->
    <Motion :initial="cardVariants.initial" :animate="cardVariants.animate" 
      :whileHover="cardVariants.whileHover as any"
      :transition="{ ...cardVariants.transition, delay: 0.1 } as any">
      <el-card class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <el-icon size="24" class="text-blue-600">
                <DataAnalysis />
              </el-icon>
              <span class="text-lg font-medium">分割历史记录</span>
            </div>
            <Motion :initial="{ scale: 0.8, opacity: 0 }" :animate="{ scale: 1, opacity: 1 }"
              :whileHover="{ scale: 1.05 }" :transition="{ duration: 0.3, delay: 0.3 }">
              <el-button type="primary" :icon="Refresh" :loading="loading" @click="fetchHistory">
                刷新
              </el-button>
            </Motion>
          </div>
        </template>

        <!-- 筛选区域 -->
        <div class="filter-section mb-6">
          <el-form :model="filterForm" inline class="flex flex-wrap gap-4">
            <el-form-item label="患者ID">
              <el-input 
                v-model="filterForm.patient_id" 
                placeholder="请输入患者ID" 
                clearable 
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="开始日期">
              <el-date-picker
                v-model="filterForm.start_date"
                type="date"
                placeholder="选择开始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="结束日期">
              <el-date-picker
                v-model="filterForm.end_date"
                type="date"
                placeholder="选择结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="applyFilter" :loading="loading">
                筛选
              </el-button>
              <el-button @click="resetFilter">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 统计信息和批量操作 -->
        <div class="stats-info mb-4 flex items-center justify-between">
          <el-tag type="info" size="large">
            共找到 {{ totalCount }} 条记录
          </el-tag>
          
          <!-- 批量操作区域 -->
          <div v-if="historyData?.records.length" class="batch-operations flex items-center space-x-3">
            <el-checkbox 
              v-model="isSelectAll" 
              :indeterminate="isIndeterminate"
              @change="handleSelectAll"
              class="select-all-checkbox"
            >
              全选
            </el-checkbox>
            
            <el-tag v-if="hasSelectedRecords" type="warning" size="small">
              已选择 {{ selectedCount }} 条
            </el-tag>
            
            <div class="batch-buttons">
              <el-button 
                v-if="hasSelectedRecords"
                type="danger" 
                size="small" 
                :icon="Delete" 
                @click="batchDelete"
              >
                批量删除
              </el-button>
              
              <el-button 
                v-if="hasSelectedRecords"
                size="small" 
                @click="clearSelection"
              >
                清空选择
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </Motion>

    <!-- 错误提示 -->
    <el-alert v-if="error" :title="error" type="error" class="mb-6" show-icon />

    <!-- 历史记录列表 -->
    <Motion :initial="cardVariants.initial" :animate="cardVariants.animate"
      :whileHover="cardVariants.whileHover as any"
      :transition="{ ...cardVariants.transition, delay: 0.2 } as any">
      <el-card>
        <template #header>
          <span class="font-medium">历史记录列表</span>
        </template>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div v-for="i in 5" :key="i" class="record-skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
              <div class="skeleton-line skeleton-text"></div>
            </div>
          </div>
        </div>

        <!-- 记录列表 -->
        <div v-else-if="historyData?.records.length" class="records-list">
          <Motion 
            v-for="(record, index) in historyData.records" 
            :key="record.id"
            :initial="listItemVariants.initial" 
            :animate="listItemVariants.animate"
            :whileHover="listItemVariants.whileHover as any"
            :transition="{ ...listItemVariants.transition, delay: index * 0.05 } as any"
            class="record-item"
          >
            <div class="record-content">
              <div class="record-header">
                <div class="record-left flex items-center space-x-3">
                  <el-checkbox 
                    :model-value="selectedRecords.includes(record.id)"
                    @change="(checked: boolean) => handleRecordSelect(record.id, checked)"
                    @click.stop
                    class="record-checkbox"
                  />
                  <div class="record-id" @click="viewDetail(record)">
                    <el-tag type="primary" size="small">ID: {{ record.id }}</el-tag>
                  </div>
                </div>
                <div class="record-time" @click="viewDetail(record)">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDate(record.segmentation_time) }}</span>
                </div>
              </div>
              
              <div class="record-body" @click="viewDetail(record)">
                <div class="record-info">
                  <div class="info-item">
                    <el-icon class="text-blue-500"><User /></el-icon>
                    <span>患者: {{ record.patient_id || '未知' }}</span>
                  </div>
                  <div class="info-item">
                    <el-icon class="text-green-500"><DataAnalysis /></el-icon>
                    <span>置信度: {{ formatConfidence(record.confidence) }}</span>
                  </div>
                  <div class="info-item">
                    <el-icon class="text-orange-500"><Picture /></el-icon>
                    <span>肿瘤比例: {{ formatTumorRatio(record.tumor_ratio) }}</span>
                  </div>
                </div>
                
                <div class="record-images">
                  <div class="image-preview" @click.stop="viewImage(record.original_image, '原始图像')">
                    <img :src="`${serverPath}/media/${record.original_image}`" 
                         alt="原始图像" class="preview-img" />
                    <div class="image-label">原始</div>
                  </div>
                  <div class="image-preview" @click.stop="viewImage(record.mask_image, '分割掩码')">
                    <img :src="`${serverPath}/media/${record.mask_image}`" 
                         alt="分割掩码" class="preview-img" />
                    <div class="image-label">掩码</div>
                  </div>
                  <div class="image-preview" @click.stop="viewImage(record.overlay_image, '叠加结果')">
                    <img :src="`${serverPath}/media/${record.overlay_image}`" 
                         alt="叠加结果" class="preview-img" />
                    <div class="image-label">叠加</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="record-actions">
              <el-button type="primary" :icon="View" size="small" @click="viewDetail(record)">
                详情
              </el-button>
              <el-button type="danger" :icon="Delete" size="small" @click="deleteRecord(record)">
                删除
              </el-button>
            </div>
          </Motion>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="暂无历史记录" />
        </div>

        <!-- 分页 -->
        <div v-if="historyData?.records.length" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCount"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </Motion>

    <!-- 详情模态框 -->
    <el-dialog 
      v-model="detailModalVisible" 
      title="分割记录详情" 
      width="90%" 
      :before-close="() => detailModalVisible = false"
      class="detail-modal"
    >
      <div v-if="selectedRecord" class="detail-content">
        <!-- 基本信息卡片 -->
        <el-card class="mb-6" shadow="hover">
          <template #header>
            <div class="flex items-center space-x-2">
              <el-icon class="text-blue-600"><DataAnalysis /></el-icon>
              <span class="font-semibold text-lg">基本信息</span>
            </div>
          </template>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="info-card">
              <div class="info-label">记录ID</div>
              <div class="info-value text-blue-600 font-bold">{{ selectedRecord.id }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">患者ID</div>
              <div class="info-value">{{ selectedRecord.patient_id || '未知' }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">会话ID</div>
              <div class="info-value text-gray-600">{{ selectedRecord.session_id }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">分割时间</div>
              <div class="info-value text-sm">{{ formatDate(selectedRecord.segmentation_time) }}</div>
            </div>
          </div>
        </el-card>

        <!-- 分割结果卡片 -->
        <el-card class="mb-6" shadow="hover">
          <template #header>
            <div class="flex items-center space-x-2">
              <el-icon class="text-green-600"><Picture /></el-icon>
              <span class="font-semibold text-lg">分割结果</span>
            </div>
          </template>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="result-card">
              <div class="result-icon bg-green-100 text-green-600">
                <el-icon size="24"><DataAnalysis /></el-icon>
              </div>
              <div class="result-content">
                <div class="result-label">置信度</div>
                <div class="result-value text-green-600">{{ formatConfidence(selectedRecord.confidence) }}</div>
              </div>
            </div>
            <div class="result-card">
              <div class="result-icon bg-blue-100 text-blue-600">
                <el-icon size="24"><Picture /></el-icon>
              </div>
              <div class="result-content">
                <div class="result-label">肿瘤面积</div>
                <div class="result-value text-blue-600">{{ selectedRecord.tumor_area.toLocaleString() }}</div>
                <div class="result-unit">像素</div>
              </div>
            </div>
            <div class="result-card">
              <div class="result-icon bg-purple-100 text-purple-600">
                <el-icon size="24"><Picture /></el-icon>
              </div>
              <div class="result-content">
                <div class="result-label">总面积</div>
                <div class="result-value text-purple-600">{{ selectedRecord.total_area.toLocaleString() }}</div>
                <div class="result-unit">像素</div>
              </div>
            </div>
            <div class="result-card">
              <div class="result-icon bg-orange-100 text-orange-600">
                <el-icon size="24"><DataAnalysis /></el-icon>
              </div>
              <div class="result-content">
                <div class="result-label">肿瘤比例</div>
                <div class="result-value text-orange-600">{{ formatTumorRatio(selectedRecord.tumor_ratio) }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 图像结果卡片 -->
        <el-card class="mb-6" shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <el-icon class="text-purple-600"><Picture /></el-icon>
                <span class="font-semibold text-lg">图像结果</span>
              </div>
              <el-tag type="info" size="small">点击图片可放大查看</el-tag>
            </div>
          </template>
          <div class="image-results-grid">
            <div class="image-result-item">
              <div class="image-header">
                <h4 class="image-title">原始图像</h4>
                <el-tag size="small" type="primary">Original</el-tag>
              </div>
              <div class="image-container" @click="viewImage(selectedRecord.original_image, '原始图像')">
                <img :src="`${serverPath}/media/${selectedRecord.original_image}`" 
                     alt="原始图像" class="result-image" />
                <div class="image-overlay">
                  <el-icon size="32" class="text-white"><View /></el-icon>
                </div>
              </div>
              <el-button type="primary" size="small" class="download-btn" 
                @click="downloadImage(selectedRecord.original_image, `original_${selectedRecord.id}.jpg`)">
                <el-icon><Download /></el-icon>
                下载原图
              </el-button>
            </div>
            
            <div class="image-result-item">
              <div class="image-header">
                <h4 class="image-title">分割掩码</h4>
                <el-tag size="small" type="success">Mask</el-tag>
              </div>
              <div class="image-container" @click="viewImage(selectedRecord.mask_image, '分割掩码')">
                <img :src="`${serverPath}/media/${selectedRecord.mask_image}`" 
                     alt="分割掩码" class="result-image" />
                <div class="image-overlay">
                  <el-icon size="32" class="text-white"><View /></el-icon>
                </div>
              </div>
              <el-button type="success" size="small" class="download-btn" 
                @click="downloadImage(selectedRecord.mask_image, `mask_${selectedRecord.id}.png`)">
                <el-icon><Download /></el-icon>
                下载掩码
              </el-button>
            </div>
            
            <div class="image-result-item">
              <div class="image-header">
                <h4 class="image-title">叠加结果</h4>
                <el-tag size="small" type="warning">Overlay</el-tag>
              </div>
              <div class="image-container" @click="viewImage(selectedRecord.overlay_image, '叠加结果')">
                <img :src="`${serverPath}/media/${selectedRecord.overlay_image}`" 
                     alt="叠加结果" class="result-image" />
                <div class="image-overlay">
                  <el-icon size="32" class="text-white"><View /></el-icon>
                </div>
              </div>
              <el-button type="warning" size="small" class="download-btn" 
                @click="downloadImage(selectedRecord.overlay_image, `overlay_${selectedRecord.id}.jpg`)">
                <el-icon><Download /></el-icon>
                下载结果
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 诊断备注卡片 -->
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center space-x-2">
              <el-icon class="text-gray-600"><User /></el-icon>
              <span class="font-semibold text-lg">诊断备注</span>
            </div>
          </template>
          <div class="diagnosis-notes">
            <div v-if="selectedRecord.diagnosis_notes" class="notes-content">
              {{ selectedRecord.diagnosis_notes }}
            </div>
            <div v-else class="notes-empty">
              <el-icon class="text-gray-400"><User /></el-icon>
              <span class="text-gray-500">暂无诊断备注</span>
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- 图片查看模态框 -->
    <el-dialog 
      v-model="imageModalVisible" 
      :title="currentImageType" 
      width="90%" 
      :before-close="() => imageModalVisible = false"
      class="image-modal"
    >
      <div class="image-viewer">
        <img :src="currentImageUrl" :alt="currentImageType" class="full-image" />
      </div>
      <template #footer>
        <el-button @click="imageModalVisible = false">
          <el-icon><Close /></el-icon>
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.history-page {
  width: 100%;
}

/* 批量操作样式 */
.batch-operations {
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.select-all-checkbox {
  font-weight: 500;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.record-checkbox {
  margin-right: 20px;
}

.record-left {
  cursor: pointer;
}

.record-content {
  cursor: default;
}

.record-id {
  cursor: pointer;
}

.record-time {
  cursor: pointer;
}

.record-body {
  cursor: pointer;
}

/* 筛选区域样式 */
.filter-section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* 统计信息样式 */
.stats-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 记录列表样式 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.record-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.record-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 14px;
}

.record-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}

.record-images {
  display: flex;
  gap: 12px;
}

.image-preview {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-preview:hover {
  transform: scale(1.05);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  text-align: center;
  padding: 2px;
}

.record-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  gap: 8px;
  margin-left: 20px;
}

/* 加载骨架屏样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-skeleton {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.skeleton-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-title {
  width: 30%;
}

.skeleton-subtitle {
  width: 50%;
}

.skeleton-text {
  width: 70%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

/* 详情模态框样式 */
.detail-modal {
  .el-dialog__body {
    padding: 20px;
  }
}

.detail-content {
  max-height: 80vh;
  overflow-y: auto;
}

/* 基本信息卡片样式 */
.info-card {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.info-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.info-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-all;
}

/* 分割结果卡片样式 */
.result-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  gap: 16px;
}

.result-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.result-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  text-align: left;
}

.result-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.result-unit {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

/* 图像结果样式 */
.image-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.image-result-item {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.image-result-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.image-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.image-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #f1f5f9;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-container:hover .result-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.download-btn {
  width: 100%;
  margin: 16px 20px 20px 20px;
  width: calc(100% - 40px);
  border-radius: 8px;
  font-weight: 500;
}

/* 诊断备注样式 */
.diagnosis-notes {
  min-height: 80px;
}

.notes-content {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  color: #374151;
  line-height: 1.6;
  font-size: 14px;
}

.notes-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #9ca3af;
  font-style: italic;
}

/* 图片查看模态框样式 */
.image-modal .el-dialog__body {
  padding: 0;
}

.image-viewer {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  background: #f8fafc;
}

.full-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

/* 空状态样式 */
.empty-state {
  padding: 60px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-content {
    max-height: 70vh;
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
  
  .image-results-grid {
    grid-template-columns: 1fr;
  }
  
  .result-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .result-content {
    text-align: center;
  }
  
  .record-body {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .record-actions {
    flex-direction: row;
    margin-left: 0;
    margin-top: 12px;
  }
}

/* 卡片增强样式 */
.el-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.el-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}
</style>
