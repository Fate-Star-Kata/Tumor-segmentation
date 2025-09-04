import type {
  ApiResponse,
  SegmentRequest,
  SegmentResponse,
  HistoryQueryParams,
  HistoryResponse,
  StatsQueryParams,
  StatsResponse,
  PerformanceQueryParams,
  PerformanceResponse,
  ModelSettings,
  UpdateModelSettingsRequest,
  UpdateModelSettingsResponse,
  DeleteRecordResponse,
  BatchDeleteRequest,
  BatchDeleteResponse
} from '@/types/apis/pagesApi_T'
import serviceAxios from '@/http'

// 执行肝肿瘤分割
export function segmentLiverTumor(data: FormData): Promise<ApiResponse<SegmentResponse>> {
  return serviceAxios({
    url: '/yolo/liver/segment/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取分割历史记录
export function getSegmentationHistory(params?: HistoryQueryParams): Promise<ApiResponse<HistoryResponse>> {
  return serviceAxios({
    url: '/yolo/liver/segmentation/history/',
    method: 'get',
    params
  })
}

// 获取分割统计数据
export function getSegmentationStats(params?: StatsQueryParams): Promise<ApiResponse<StatsResponse>> {
  return serviceAxios({
    url: '/yolo/liver/segmentation/stats/',
    method: 'get',
    params
  })
}

// 获取模型性能统计
export function getModelPerformance(params?: PerformanceQueryParams): Promise<ApiResponse<PerformanceResponse>> {
  return serviceAxios({
    url: '/yolo/liver/model/performance/',
    method: 'get',
    params
  })
}

// 获取模型设置
export function getModelSettings(): Promise<ApiResponse<ModelSettings>> {
  return serviceAxios({
    url: '/yolo/liver/model/settings/',
    method: 'get'
  })
}

// 更新模型设置
export function updateModelSettings(data: UpdateModelSettingsRequest): Promise<ApiResponse<UpdateModelSettingsResponse>> {
  return serviceAxios({
    url: '/yolo/liver/model/settings/',
    method: 'post',
    data
  })
}

// 删除单条记录
export function deleteSegmentationRecord(recordId: number): Promise<ApiResponse<DeleteRecordResponse>> {
  return serviceAxios({
    url: `/yolo/liver/segmentation/delete/${recordId}/`,
    method: 'delete'
  })
}

// 批量删除记录
export function batchDeleteSegmentationRecords(data: BatchDeleteRequest): Promise<ApiResponse<BatchDeleteResponse>> {
  return serviceAxios({
    url: '/yolo/liver/segmentation/delete/batch/',
    method: 'post',
    data
  })
}