import { createClient } from '@supabase/supabase-js'
import {
  ApiResponse,
  ApiError,
  ApiErrorCode,
  HttpMethod,
  HttpStatus,
  RequestConfig,
  ApiClientConfig,
  PaginationParams,
  FilterParams,
  RateLimitInfo,
  HealthStatus,
  ApiMetrics,
  API_CONSTANTS,
  buildUrl,
  buildQueryString,
  parseApiError,
  createApiResponse,
  validatePaginationParams,
  calculatePaginationMeta,
  ContentType,
  CacheStrategy,
  RequestPriority
} from '@/types/api'
import { ActivityService } from './activities'

// API Client Class
export class ApiClient {
  private config: ApiClientConfig
  private supabase: any
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>
  private rateLimits: Map<string, { count: number; resetTime: number }>
  private requestQueue: Map<RequestPriority, Array<() => Promise<any>>>
  private isProcessingQueue: boolean = false

  constructor(config: ApiClientConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || API_CONSTANTS.DEFAULT_TIMEOUT,
      retries: config.retries || API_CONSTANTS.MAX_RETRIES,
      retryDelay: config.retryDelay || API_CONSTANTS.RETRY_DELAY
    }
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // ActivityService is now used as static methods
    this.cache = new Map()
    this.rateLimits = new Map()
    this.requestQueue = new Map([
      [RequestPriority.CRITICAL, []],
      [RequestPriority.HIGH, []],
      [RequestPriority.NORMAL, []],
      [RequestPriority.LOW, []]
    ])
    
    // Setup request interceptors
    this.setupInterceptors()
    
    // Start queue processor
    this.processRequestQueue()
  }

  // HTTP Methods
  async get<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.GET,
      url,
      params,
      ...config
    })
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.POST,
      url,
      data,
      ...config
    })
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.PUT,
      url,
      data,
      ...config
    })
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.PATCH,
      url,
      data,
      ...config
    })
  }

  async delete<T = any>(
    url: string,
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.DELETE,
      url,
      ...config
    })
  }

  // Main request method
  private async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // Validate rate limits
      await this.checkRateLimit(config.url)
      
      // Check cache first
      if (config.method === HttpMethod.GET && config.cache !== false) {
        const cached = this.getFromCache(config.url, config.params)
        if (cached) {
          return cached
        }
      }
      
      // Build full URL
      const fullUrl = this.buildFullUrl(config.url, config.params)
      
      // Prepare headers
      const headers = this.prepareHeaders(config.headers)
      
      // Log request activity
      await this.logActivity('api_request', {
        method: config.method,
        url: fullUrl,
        timestamp: new Date().toISOString()
      })
      
      // Make request with retries
      const response = await this.makeRequestWithRetries<T>({
        ...config,
        url: fullUrl,
        headers
      })
      
      // Cache response if applicable
      if (config.method === HttpMethod.GET && config.cache !== false) {
        this.setCache(config.url, config.params, response, config.cacheTtl)
      }
      
      return response
    } catch (error) {
      const apiError = parseApiError(error)
      
      // Log error activity
      await this.logActivity('api_error', {
        method: config.method,
        url: config.url,
        error: apiError,
        timestamp: new Date().toISOString()
      })
      
      throw apiError
    }
  }

  // Request with retries
  private async makeRequestWithRetries<T>(
    config: RequestConfig,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.makeHttpRequest<T>(config)
      return response
    } catch (error: any) {
      const maxRetries = config.retries ?? this.config.retries
      
      if (attempt <= maxRetries && this.shouldRetry(error)) {
        const delay = this.calculateRetryDelay(attempt)
        await this.sleep(delay)
        return this.makeRequestWithRetries(config, attempt + 1)
      }
      
      throw error
    }
  }

  // Make HTTP request using Supabase or fetch
  private async makeHttpRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { method, url, data, headers } = config
    
    // Use Supabase for database operations
    if (url.includes('/api/')) {
      return this.makeSupabaseRequest<T>(config)
    }
    
    // Use fetch for external APIs
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.config.timeout)
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': ContentType.JSON,
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      return createApiResponse(true, result)
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Make Supabase request
  private async makeSupabaseRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { method, url, data } = config
    
    // Extract table name from URL
    const tableName = this.extractTableName(url)
    
    try {
      let query = this.supabase.from(tableName)
      
      switch (method) {
        case HttpMethod.GET:
          const { data: getData, error: getError } = await query.select('*')
          if (getError) throw getError
          return createApiResponse(true, getData)
          
        case HttpMethod.POST:
          const { data: postData, error: postError } = await query.insert(data).select()
          if (postError) throw postError
          return createApiResponse(true, postData)
          
        case HttpMethod.PUT:
        case HttpMethod.PATCH:
          const id = this.extractIdFromUrl(url)
          const { data: updateData, error: updateError } = await query
            .update(data)
            .eq('id', id)
            .select()
          if (updateError) throw updateError
          return createApiResponse(true, updateData)
          
        case HttpMethod.DELETE:
          const deleteId = this.extractIdFromUrl(url)
          const { error: deleteError } = await query.delete().eq('id', deleteId)
          if (deleteError) throw deleteError
          return createApiResponse<T>(true, null as T, 'Deleted successfully')
          
        default:
          throw new Error(`Unsupported method: ${method}`)
      }
    } catch (error: any) {
      throw new Error((error instanceof Error ? error.message : String(error)) || 'Database operation failed')
    }
  }

  // Pagination support
  async getPaginated<T = any>(
    url: string,
    params: PaginationParams & FilterParams = {},
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T[]>> {
    const validatedParams = validatePaginationParams(params)
    const queryString = buildQueryString({ ...validatedParams, ...params })
    const fullUrl = `${url}?${queryString}`
    
    const response = await this.get<T[]>(fullUrl, undefined, config)
    
    // Add pagination meta if not present
    if (response.success && !response.meta) {
      const total = Array.isArray(response.data) ? response.data.length : 0
      response.meta = calculatePaginationMeta(
        total,
        validatedParams.page || 1,
        validatedParams.limit || API_CONSTANTS.DEFAULT_PAGE_SIZE
      )
    }
    
    return response
  }

  // File upload
  async uploadFile(
    url: string,
    file: File,
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<{ url: string; size: number; type: string }>> {
    // Validate file
    this.validateFile(file)
    
    const formData = new FormData()
    formData.append('file', file)
    
    return this.request({
      method: HttpMethod.POST,
      url,
      data: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      },
      ...config
    })
  }

  // Batch requests
  async batch<T = any>(
    requests: RequestConfig[],
    options: { failFast?: boolean; maxConcurrency?: number } = {}
  ): Promise<Array<ApiResponse<T> | ApiError>> {
    const { failFast = false, maxConcurrency = 5 } = options
    const results: Array<ApiResponse<T> | ApiError> = []
    
    // Process requests in batches
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency)
      
      const batchPromises = batch.map(async (config) => {
        try {
          return await this.request<T>(config)
        } catch (error) {
          const apiError = parseApiError(error)
          if (failFast) throw apiError
          return apiError
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      if (failFast && batchResults.some(result => 'code' in result)) {
        break
      }
    }
    
    return results
  }

  // WebSocket support
  createWebSocket(url: string, protocols?: string[]): WebSocket {
    const ws = new WebSocket(url, protocols)
    
    ws.onopen = () => {
      this.logActivity('websocket_connected', { url, timestamp: new Date().toISOString() })
    }
    
    ws.onclose = () => {
      this.logActivity('websocket_disconnected', { url, timestamp: new Date().toISOString() })
    }
    
    ws.onerror = (error) => {
      this.logActivity('websocket_error', { url, error, timestamp: new Date().toISOString() })
    }
    
    return ws
  }

  // Health check
  async healthCheck(): Promise<HealthStatus> {
    try {
      const startTime = Date.now()
      
      // Check database
      const dbCheck = await this.checkDatabase()
      
      // Check storage
      const storageCheck = await this.checkStorage()
      
      // Check external services
      const servicesCheck = await this.checkExternalServices()
      
      const responseTime = Date.now() - startTime
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime?.() || 0,
        checks: {
          database: dbCheck,
          storage: storageCheck,
          cache: { name: 'cache', status: 'healthy', response_time: responseTime },
          external_services: servicesCheck
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: 0,
        checks: {
          database: { name: 'database', status: 'unhealthy', error: 'Connection failed' },
          storage: { name: 'storage', status: 'unhealthy', error: 'Connection failed' },
          cache: { name: 'cache', status: 'unhealthy', error: 'Connection failed' },
          external_services: []
        }
      }
    }
  }

  // Get API metrics
  async getMetrics(): Promise<ApiMetrics> {
    // This would typically come from a monitoring service
    return {
      requests_total: 1000,
      requests_per_second: 10,
      average_response_time: 250,
      error_rate: 0.05,
      endpoints: [
        {
          path: '/api/users',
          method: 'GET',
          requests: 500,
          avg_response_time: 200,
          error_count: 5
        }
      ]
    }
  }

  // Cache management
  private getFromCache(url: string, params?: Record<string, any>): any {
    const key = this.getCacheKey(url, params)
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  private setCache(
    url: string,
    params: Record<string, any> | undefined,
    data: any,
    ttl?: number
  ): void {
    const key = this.getCacheKey(url, params)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || API_CONSTANTS.CACHE_TTL
    })
  }

  private getCacheKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${url}:${paramString}`
  }

  clearCache(): void {
    this.cache.clear()
  }

  // Rate limiting
  private async checkRateLimit(url: string): Promise<void> {
    const key = this.getRateLimitKey(url)
    const now = Date.now()
    const limit = this.rateLimits.get(key)
    
    if (!limit) {
      this.rateLimits.set(key, { count: 1, resetTime: now + API_CONSTANTS.RATE_LIMIT_WINDOW })
      return
    }
    
    if (now > limit.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + API_CONSTANTS.RATE_LIMIT_WINDOW })
      return
    }
    
    if (limit.count >= API_CONSTANTS.DEFAULT_RATE_LIMIT) {
      throw new Error('Rate limit exceeded')
    }
    
    limit.count++
  }

  private getRateLimitKey(url: string): string {
    return url.split('?')[0] // Remove query parameters
  }

  getRateLimitInfo(url: string): RateLimitInfo {
    const key = this.getRateLimitKey(url)
    const limit = this.rateLimits.get(key)
    
    if (!limit) {
      return {
        limit: API_CONSTANTS.DEFAULT_RATE_LIMIT,
        remaining: API_CONSTANTS.DEFAULT_RATE_LIMIT,
        reset: Date.now() + API_CONSTANTS.RATE_LIMIT_WINDOW
      }
    }
    
    return {
      limit: API_CONSTANTS.DEFAULT_RATE_LIMIT,
      remaining: Math.max(0, API_CONSTANTS.DEFAULT_RATE_LIMIT - limit.count),
      reset: limit.resetTime
    }
  }

  // Request queue management
  async queueRequest<T>(
    config: RequestConfig,
    priority: RequestPriority = RequestPriority.NORMAL
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const queue = this.requestQueue.get(priority)!
      queue.push(async () => {
        try {
          const result = await this.request<T>(config)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue) return
    
    this.isProcessingQueue = true
    
    while (true) {
      let hasRequests = false
      
      // Process requests by priority
      for (const priority of [RequestPriority.CRITICAL, RequestPriority.HIGH, RequestPriority.NORMAL, RequestPriority.LOW]) {
        const queue = this.requestQueue.get(priority)!
        if (queue.length > 0) {
          const request = queue.shift()!
          hasRequests = true
          
          try {
            await request()
          } catch (error) {
            console.error('Queue request failed:', error)
          }
          
          break // Process one request at a time
        }
      }
      
      if (!hasRequests) {
        await this.sleep(100) // Wait before checking again
      }
    }
  }

  // Utility methods
  private buildFullUrl(url: string, params?: Record<string, any>): string {
    const baseUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`
    
    if (params && Object.keys(params).length > 0) {
      const queryString = buildQueryString(params)
      return `${baseUrl}?${queryString}`
    }
    
    return baseUrl
  }

  private prepareHeaders(headers?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': ContentType.JSON,
      'Accept': ContentType.JSON,
      ...this.config.headers,
      ...headers
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx status codes
    return (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      (error.status >= 500 && error.status < 600)
    )
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 1000
    return exponentialDelay + jitter
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private validateFile(file: File): void {
    if (file.size > API_CONSTANTS.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${API_CONSTANTS.MAX_FILE_SIZE} bytes`)
    }
    
    if (!API_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type as any)) {
      throw new Error(`File type ${file.type} is not allowed`)
    }
  }

  private extractTableName(url: string): string {
    const match = url.match(/\/api\/(\w+)/)
    return match ? match[1] : 'unknown'
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)$/)
    return match ? match[1] : ''
  }

  private async checkDatabase(): Promise<any> {
    try {
      const { data, error } = await this.supabase.from('users').select('count').limit(1)
      return {
        name: 'database',
        status: error ? 'unhealthy' : 'healthy',
        response_time: 100,
        error: error?.message
      }
    } catch (error: any) {
      return {
        name: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async checkStorage(): Promise<any> {
    try {
      const { data, error } = await this.supabase.storage.listBuckets()
      return {
        name: 'storage',
        status: error ? 'unhealthy' : 'healthy',
        response_time: 100,
        error: error?.message
      }
    } catch (error: any) {
      return {
        name: 'storage',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async checkExternalServices(): Promise<any[]> {
    // Check external services if any
    return []
  }

  private setupInterceptors(): void {
    if (this.config.interceptors?.request) {
      // Setup request interceptor
    }
    
    if (this.config.interceptors?.response) {
      // Setup response interceptor
    }
    
    if (this.config.interceptors?.error) {
      // Setup error interceptor
    }
  }

  private async logActivity(type: string, data: any): Promise<void> {
    try {
      await ActivityService.createActivity({
        type: type as any,
        title: `API ${type}`,
        description: `API ${type}`,
        user_id: 'system',
        entity_type: 'system',
        entity_id: 'api-client',
        metadata: {
          ...data,
          ip_address: '127.0.0.1',
          user_agent: 'API Client'
        }
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }
}

// Default API client instance
const defaultConfig: ApiClientConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: API_CONSTANTS.DEFAULT_TIMEOUT,
  retries: API_CONSTANTS.MAX_RETRIES,
  retryDelay: API_CONSTANTS.RETRY_DELAY
}

export const apiClient = new ApiClient(defaultConfig)

// Convenience functions
export const api = {
  get: <T = any>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>) =>
    apiClient.get<T>(url, params, config),
  
  post: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    apiClient.post<T>(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    apiClient.put<T>(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    apiClient.patch<T>(url, data, config),
  
  delete: <T = any>(url: string, config?: Partial<RequestConfig>) =>
    apiClient.delete<T>(url, config),
  
  paginated: <T = any>(url: string, params?: PaginationParams & FilterParams, config?: Partial<RequestConfig>) =>
    apiClient.getPaginated<T>(url, params, config),
  
  upload: (url: string, file: File, config?: Partial<RequestConfig>) =>
    apiClient.uploadFile(url, file, config),
  
  batch: <T = any>(requests: RequestConfig[], options?: { failFast?: boolean; maxConcurrency?: number }) =>
    apiClient.batch<T>(requests, options),
  
  health: () => apiClient.healthCheck(),
  
  metrics: () => apiClient.getMetrics(),
  
  clearCache: () => apiClient.clearCache(),
  
  getRateLimit: (url: string) => apiClient.getRateLimitInfo(url)
}

export default api