// 肿瘤分割系统API类型定义

// 通用响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string | null
  data: T
}

// 执行肝肿瘤分割相关类型
export interface SegmentRequest {
  image: File
}

export interface SegmentResponse {
  segmentation_id: number
  confidence: number
  tumor_area: number
  total_area: number
  tumor_ratio: number
  uploaded_image_path: string
  original_image_path: string
  mask_image_path: string
  overlay_image_path: string
  session_id: string
}

// 分割历史记录相关类型
export interface HistoryQueryParams {
  page?: number
  page_size?: number
  patient_id?: string
  start_date?: string
  end_date?: string
}

export interface SegmentationRecord {
  id: number
  patient_id: string | null
  confidence: number
  tumor_area: number
  total_area: number
  tumor_ratio: number
  segmentation_time: string
  session_id: string
  original_image: string
  mask_image: string
  overlay_image: string
  diagnosis_notes: string
}

export interface PaginationInfo {
  current_page: number
  total_pages: number
  total_count: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface HistoryResponse {
  records: SegmentationRecord[]
  pagination: PaginationInfo
}

// 分割统计相关类型
export interface StatsQueryParams {
  days?: number
}

export interface PatientStats {
  patient_id: string | null
  count: number
  avg_confidence: number
  avg_tumor_ratio: number
}

export interface DailyStats {
  day: string
  count: number
  avg_confidence: number
  avg_tumor_ratio: number
}

export interface ConfidenceDistribution {
  range: string
  count: number
  percentage: number
}

export interface DateRange {
  start_date: string
  end_date: string
  days: number
}

export interface StatsResponse {
  total_segmentations: number
  patient_stats: PatientStats[]
  daily_stats: DailyStats[]
  confidence_distribution: ConfidenceDistribution[]
  date_range: DateRange
}

// 模型性能统计相关类型
export interface PerformanceQueryParams {
  days?: number
}

export interface DailyPerformanceStats {
  date: string
  total_segmentations: number
  successful_segmentations: number
  avg_confidence: number
  avg_tumor_ratio: number
  success_rate: number
}

export interface OverallStats {
  total_segmentations: number
  total_successful: number
  overall_success_rate: number
  overall_avg_confidence: number
  overall_avg_tumor_ratio: number
}

export interface PerformanceResponse {
  daily_stats: DailyPerformanceStats[]
  overall_stats: OverallStats
  date_range: DateRange
}

// 模型设置相关类型
export interface ModelSettings {
  id: number
  confidence_threshold: number
  model_path: string
  config_path: string | null
  input_size: string
  is_active: boolean
  created_time: string
  updated_time: string
}

export interface UpdateModelSettingsRequest {
  confidence_threshold?: number
  model_path?: string
  config_path?: string | null
  input_size?: string
}

export interface UpdateModelSettingsResponse {
  id: number
  confidence_threshold: number
  model_path: string
  config_path: string | null
  input_size: string
  updated_time: string
}

// 删除记录相关类型
export interface DeleteRecordResponse {
  deleted_record_id: number
  deleted_files: string[]
  message: string
}

export interface BatchDeleteRequest {
  record_ids: number[]
}

export interface BatchDeleteResponse {
  deleted_count: number
  deleted_record_ids: number[]
  deleted_files: string[]
  message: string
}