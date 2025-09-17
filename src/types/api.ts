// API Types and Interfaces

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
  meta?: {
    total?: number
    page?: number
    limit?: number
    pages?: number
  }
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

// Filtering
export interface FilterParams {
  search?: string
  status?: string
  category?: string
  date_from?: string
  date_to?: string
  created_by?: string
  [key: string]: any
}

// Sorting
export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

// HTTP Methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

// API Endpoints
export enum ApiEndpoint {
  // Authentication
  AUTH_LOGIN = '/api/auth/login',
  AUTH_REGISTER = '/api/auth/register',
  AUTH_LOGOUT = '/api/auth/logout',
  AUTH_REFRESH = '/api/auth/refresh',
  AUTH_PROFILE = '/api/auth/profile',
  AUTH_PASSWORD_CHANGE = '/api/auth/password/change',
  AUTH_PASSWORD_RESET = '/api/auth/password/reset',
  AUTH_2FA_SETUP = '/api/auth/2fa/setup',
  AUTH_2FA_VERIFY = '/api/auth/2fa/verify',
  AUTH_2FA_DISABLE = '/api/auth/2fa/disable',
  AUTH_SESSIONS = '/api/auth/sessions',
  
  // Users
  USERS = '/api/users',
  USER_BY_ID = '/api/users/:id',
  USER_PROFILE = '/api/users/:id/profile',
  USER_PREFERENCES = '/api/users/:id/preferences',
  USER_ACTIVITIES = '/api/users/:id/activities',
  USER_NOTIFICATIONS = '/api/users/:id/notifications',
  
  // Reports
  REPORTS = '/api/reports',
  REPORT_BY_ID = '/api/reports/:id',
  REPORT_GENERATE = '/api/reports/:id/generate',
  REPORT_DOWNLOAD = '/api/reports/:id/download',
  REPORT_TEMPLATES = '/api/reports/templates',
  
  // Activities
  ACTIVITIES = '/api/activities',
  ACTIVITY_BY_ID = '/api/activities/:id',
  ACTIVITY_STATS = '/api/activities/stats',
  
  // Notifications
  NOTIFICATIONS = '/api/notifications',
  NOTIFICATION_BY_ID = '/api/notifications/:id',
  NOTIFICATION_MARK_READ = '/api/notifications/:id/read',
  NOTIFICATION_MARK_UNREAD = '/api/notifications/:id/unread',
  NOTIFICATION_PREFERENCES = '/api/notifications/preferences',
  NOTIFICATION_STATS = '/api/notifications/stats',
  
  // Backup
  BACKUPS = '/api/backups',
  BACKUP_BY_ID = '/api/backups/:id',
  BACKUP_CREATE = '/api/backups/create',
  BACKUP_RESTORE = '/api/backups/:id/restore',
  BACKUP_DOWNLOAD = '/api/backups/:id/download',
  BACKUP_SCHEDULES = '/api/backups/schedules',
  BACKUP_STATS = '/api/backups/stats',
  
  // Audit
  AUDIT_LOGS = '/api/audit/logs',
  AUDIT_LOG_BY_ID = '/api/audit/logs/:id',
  AUDIT_RULES = '/api/audit/rules',
  AUDIT_RULE_BY_ID = '/api/audit/rules/:id',
  AUDIT_REPORTS = '/api/audit/reports',
  AUDIT_REPORT_BY_ID = '/api/audit/reports/:id',
  AUDIT_REPORT_GENERATE = '/api/audit/reports/:id/generate',
  AUDIT_STATS = '/api/audit/stats',
  SYSTEM_LOGS = '/api/system/logs',
  SYSTEM_LOG_BY_ID = '/api/system/logs/:id',
  SYSTEM_STATS = '/api/system/stats',
  
  // Dashboard
  DASHBOARD_STATS = '/api/dashboard/stats',
  DASHBOARD_ACTIVITIES = '/api/dashboard/activities',
  DASHBOARD_NOTIFICATIONS = '/api/dashboard/notifications',
  
  // Settings
  SETTINGS = '/api/settings',
  SETTINGS_SYSTEM = '/api/settings/system',
  SETTINGS_SECURITY = '/api/settings/security',
  SETTINGS_NOTIFICATIONS = '/api/settings/notifications',
  SETTINGS_BACKUP = '/api/settings/backup',
  
  // Health Check
  HEALTH = '/api/health',
  HEALTH_DATABASE = '/api/health/database',
  HEALTH_STORAGE = '/api/health/storage',
  HEALTH_SERVICES = '/api/health/services'
}

// Request/Response Types
export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    avatar_url?: string
  }
  token: string
  refresh_token: string
  expires_at: string
  requires_2fa?: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
  terms_accepted: boolean
}

export interface RegisterResponse {
  user: {
    id: string
    email: string
    name: string
  }
  message: string
  verification_required?: boolean
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export interface PasswordResetRequest {
  email: string
}

export interface TwoFactorSetupResponse {
  secret: string
  qr_code: string
  backup_codes: string[]
}

export interface TwoFactorVerifyRequest {
  code: string
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
  path: string
  method: string
}

export enum ApiErrorCode {
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  TWO_FACTOR_INVALID = 'TWO_FACTOR_INVALID',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // File/Upload Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Business Logic Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'
}

// API Client Configuration
export interface ApiClientConfig {
  baseUrl: string
  timeout: number
  retries: number
  retryDelay: number
  headers?: Record<string, string>
  interceptors?: {
    request?: (config: any) => any
    response?: (response: any) => any
    error?: (error: any) => any
  }
}

// Request Configuration
export interface RequestConfig {
  method: HttpMethod
  url: string
  params?: Record<string, any>
  data?: any
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  cache?: boolean
  cacheTtl?: number
}

// Webhook Types
export interface WebhookEvent {
  id: string
  type: string
  data: any
  timestamp: string
  signature: string
}

export interface WebhookConfig {
  url: string
  events: string[]
  secret: string
  enabled: boolean
  retry_attempts: number
  timeout: number
}

// Rate Limiting
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retry_after?: number
}

// Health Check
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: HealthCheck
    storage: HealthCheck
    cache: HealthCheck
    external_services: HealthCheck[]
  }
}

export interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  response_time?: number
  error?: string
  details?: any
}

// API Metrics
export interface ApiMetrics {
  requests_total: number
  requests_per_second: number
  average_response_time: number
  error_rate: number
  endpoints: {
    path: string
    method: string
    requests: number
    avg_response_time: number
    error_count: number
  }[]
}

// Constants
export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 300000, // 5 minutes
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  DEFAULT_RATE_LIMIT: 100,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/csv'],
  JWT_EXPIRY: 3600, // 1 hour
  REFRESH_TOKEN_EXPIRY: 604800, // 7 days
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128
} as const

// Type Guards
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj === 'object' && typeof obj.success === 'boolean'
}

export function isApiError(obj: any): obj is ApiError {
  return obj && typeof obj === 'object' && typeof obj.code === 'string' && typeof obj.message === 'string'
}

export function isPaginationParams(obj: any): obj is PaginationParams {
  return obj && typeof obj === 'object'
}

// Utility Functions
export function buildUrl(endpoint: string, params?: Record<string, string | number>): string {
  let url = endpoint
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value))
    })
  }
  return url
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  return searchParams.toString()
}

export function parseApiError(error: any): ApiError {
  if (isApiError(error)) {
    return error
  }
  
  return {
    code: ApiErrorCode.INTERNAL_ERROR,
    message: error?.message || 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    path: '',
    method: ''
  }
}

export function createApiResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  meta?: PaginationMeta
): ApiResponse<T> {
  return {
    success,
    data,
    message,
    meta
  }
}

export function validatePaginationParams(params: PaginationParams): PaginationParams {
  return {
    page: Math.max(1, params.page || 1),
    limit: Math.min(API_CONSTANTS.MAX_PAGE_SIZE, Math.max(1, params.limit || API_CONSTANTS.DEFAULT_PAGE_SIZE)),
    sort: params.sort,
    order: params.order === 'desc' ? 'desc' : 'asc'
  }
}

export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const pages = Math.ceil(total / limit)
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  }
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// Content Types
export enum ContentType {
  JSON = 'application/json',
  FORM_DATA = 'multipart/form-data',
  URL_ENCODED = 'application/x-www-form-urlencoded',
  TEXT = 'text/plain',
  HTML = 'text/html',
  XML = 'application/xml',
  PDF = 'application/pdf',
  CSV = 'text/csv',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

// Cache Strategies
export enum CacheStrategy {
  NO_CACHE = 'no-cache',
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only'
}

// Request Priority
export enum RequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// API Versioning
export interface ApiVersion {
  version: string
  deprecated?: boolean
  sunset_date?: string
  migration_guide?: string
}

export const API_VERSIONS = {
  V1: { version: 'v1', deprecated: false },
  V2: { version: 'v2', deprecated: false }
} as const