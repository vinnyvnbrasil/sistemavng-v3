// Audit and Logging System Types

export interface AuditLog {
  id: string
  user_id?: string
  session_id?: string
  action: AuditAction
  resource_type: ResourceType
  resource_id?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address: string
  user_agent: string
  location?: string
  risk_score: number
  severity: AuditSeverity
  category: AuditCategory
  description: string
  metadata?: Record<string, any>
  created_at: string
  expires_at?: string
}

export interface SystemLog {
  id: string
  level: LogLevel
  category: LogCategory
  message: string
  context?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  request_id?: string
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  duration_ms?: number
  memory_usage?: number
  cpu_usage?: number
  created_at: string
}

export interface AuditRule {
  id: string
  name: string
  description: string
  conditions: AuditCondition[]
  actions: AuditRuleAction[]
  is_active: boolean
  enabled: boolean
  priority: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface AuditCondition {
  field: string
  operator: ConditionOperator
  value: any
  logical_operator?: LogicalOperator
}

export interface AuditRuleAction {
  type: RuleActionType
  config: Record<string, any>
}

export interface AuditReport {
  id: string
  name: string
  description: string
  filters: AuditLogFilter
  schedule?: ReportSchedule
  format: ReportFormat
  recipients: string[]
  is_active: boolean
  last_generated_at?: string
  next_generation_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ReportSchedule {
  frequency: ScheduleFrequency
  day_of_week?: number
  day_of_month?: number
  hour: number
  minute: number
  timezone: string
  enabled?: boolean
}

export interface AuditStats {
  total_logs: number
  logs_today: number
  logs_this_week: number
  logs_this_month: number
  high_risk_events: number
  failed_logins: number
  successful_logins: number
  data_modifications: number
  system_errors: number
  security_violations: number
  top_users: Array<{
    user_id: string
    user_name: string
    action_count: number
  }>
  top_actions: Array<{
    action: AuditAction
    count: number
  }>
  risk_distribution: Array<{
    risk_level: string
    count: number
    percentage: number
  }>
  hourly_activity: Array<{
    hour: number
    count: number
  }>
}

export interface LogStats {
  total_logs: number
  logs_by_level: Record<LogLevel, number>
  logs_by_category: Record<LogCategory, number>
  error_rate: number
  average_response_time: number
  memory_usage_avg: number
  cpu_usage_avg: number
  top_errors: Array<{
    error: string
    count: number
  }>
  performance_metrics: Array<{
    endpoint: string
    avg_duration: number
    request_count: number
  }>
}

// Enums
export enum AuditAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  
  // User Management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',
  USER_ROLE_CHANGED = 'user_role_changed',
  
  // Data Operations
  DATA_CREATED = 'data_created',
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
  DATA_VIEWED = 'data_viewed',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  
  // System Operations
  SYSTEM_BACKUP = 'system_backup',
  SYSTEM_RESTORE = 'system_restore',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  CONFIGURATION_CHANGED = 'configuration_changed',
  
  // Security Events
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_CHANGED = 'permission_changed',
  
  // API Operations
  API_REQUEST = 'api_request',
  API_ERROR = 'api_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

export enum ResourceType {
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  SESSION = 'session',
  DOCUMENT = 'document',
  REPORT = 'report',
  BACKUP = 'backup',
  CONFIGURATION = 'configuration',
  API_KEY = 'api_key',
  WEBHOOK = 'webhook',
  NOTIFICATION = 'notification',
  AUDIT_LOG = 'audit_log',
  SYSTEM_LOG = 'system_log'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  SYSTEM_ADMINISTRATION = 'system_administration',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  PERFORMANCE = 'performance'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  APPLICATION = 'application',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  API = 'api',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  INTEGRATION = 'integration'
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or'
}

export enum RuleActionType {
  ALERT = 'alert',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  BLOCK_USER = 'block_user',
  REQUIRE_2FA = 'require_2fa',
  LOG_SECURITY_EVENT = 'log_security_event'
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel'
}

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

// Filter and Sort Types
export interface AuditLogFilter {
  user_id?: string
  action?: AuditAction | AuditAction[]
  resource_type?: ResourceType | ResourceType[]
  resource_id?: string
  severity?: AuditSeverity | AuditSeverity[]
  category?: AuditCategory | AuditCategory[]
  risk_score_min?: number
  risk_score_max?: number
  ip_address?: string
  location?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface SystemLogFilter {
  level?: LogLevel | LogLevel[]
  category?: LogCategory | LogCategory[]
  user_id?: string
  request_id?: string
  error_name?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface AuditLogSort {
  field: 'created_at' | 'risk_score' | 'severity' | 'action' | 'user_id'
  direction: 'asc' | 'desc'
}

export interface SystemLogSort {
  field: 'created_at' | 'level' | 'category' | 'duration_ms' | 'memory_usage'
  direction: 'asc' | 'desc'
}

// API Response Types
export interface AuditLogResponse {
  success: boolean
  message?: string
  data?: AuditLog
  logs?: AuditLog[]
  total?: number
  page?: number
  limit?: number
  stats?: AuditStats
}

export interface SystemLogResponse {
  success: boolean
  message?: string
  data?: SystemLog
  logs?: SystemLog[]
  total?: number
  page?: number
  limit?: number
  stats?: LogStats
}

export interface AuditRuleResponse {
  success: boolean
  message?: string
  data?: AuditRule
  rules?: AuditRule[]
}

export interface AuditReportResponse {
  success: boolean
  message?: string
  data?: AuditReport
  reports?: AuditReport[]
  file_url?: string
}

// Constants
export const AUDIT_SETTINGS = {
  DEFAULT_RETENTION_DAYS: 365,
  MAX_RETENTION_DAYS: 2555, // 7 years
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  HIGH_RISK_THRESHOLD: 7,
  CRITICAL_RISK_THRESHOLD: 9,
  MAX_EXPORT_RECORDS: 100000
} as const

export const LOG_SETTINGS = {
  DEFAULT_RETENTION_DAYS: 90,
  MAX_RETENTION_DAYS: 365,
  DEFAULT_PAGE_SIZE: 100,
  MAX_PAGE_SIZE: 1000,
  MAX_LOG_SIZE_MB: 10,
  MAX_EXPORT_RECORDS: 50000
} as const

// Utility Functions
export const formatAuditAction = (action: AuditAction): string => {
  const actionMap: Record<AuditAction, string> = {
    [AuditAction.LOGIN]: 'Login realizado',
    [AuditAction.LOGOUT]: 'Logout realizado',
    [AuditAction.LOGIN_FAILED]: 'Falha no login',
    [AuditAction.PASSWORD_CHANGED]: 'Senha alterada',
    [AuditAction.PASSWORD_RESET]: 'Senha redefinida',
    [AuditAction.TWO_FACTOR_ENABLED]: '2FA habilitado',
    [AuditAction.TWO_FACTOR_DISABLED]: '2FA desabilitado',
    [AuditAction.USER_CREATED]: 'Usuário criado',
    [AuditAction.USER_UPDATED]: 'Usuário atualizado',
    [AuditAction.USER_DELETED]: 'Usuário excluído',
    [AuditAction.USER_ACTIVATED]: 'Usuário ativado',
    [AuditAction.USER_DEACTIVATED]: 'Usuário desativado',
    [AuditAction.USER_ROLE_CHANGED]: 'Função do usuário alterada',
    [AuditAction.DATA_CREATED]: 'Dados criados',
    [AuditAction.DATA_UPDATED]: 'Dados atualizados',
    [AuditAction.DATA_DELETED]: 'Dados excluídos',
    [AuditAction.DATA_VIEWED]: 'Dados visualizados',
    [AuditAction.DATA_EXPORTED]: 'Dados exportados',
    [AuditAction.DATA_IMPORTED]: 'Dados importados',
    [AuditAction.SYSTEM_BACKUP]: 'Backup do sistema',
    [AuditAction.SYSTEM_RESTORE]: 'Restauração do sistema',
    [AuditAction.SYSTEM_MAINTENANCE]: 'Manutenção do sistema',
    [AuditAction.CONFIGURATION_CHANGED]: 'Configuração alterada',
    [AuditAction.SECURITY_VIOLATION]: 'Violação de segurança',
    [AuditAction.SUSPICIOUS_ACTIVITY]: 'Atividade suspeita',
    [AuditAction.ACCESS_DENIED]: 'Acesso negado',
    [AuditAction.PERMISSION_CHANGED]: 'Permissão alterada',
    [AuditAction.API_REQUEST]: 'Requisição API',
    [AuditAction.API_ERROR]: 'Erro na API',
    [AuditAction.RATE_LIMIT_EXCEEDED]: 'Limite de taxa excedido'
  }
  return actionMap[action] || action
}

export const formatResourceType = (type: ResourceType): string => {
  const typeMap: Record<ResourceType, string> = {
    [ResourceType.USER]: 'Usuário',
    [ResourceType.ROLE]: 'Função',
    [ResourceType.PERMISSION]: 'Permissão',
    [ResourceType.SESSION]: 'Sessão',
    [ResourceType.DOCUMENT]: 'Documento',
    [ResourceType.REPORT]: 'Relatório',
    [ResourceType.BACKUP]: 'Backup',
    [ResourceType.CONFIGURATION]: 'Configuração',
    [ResourceType.API_KEY]: 'Chave API',
    [ResourceType.WEBHOOK]: 'Webhook',
    [ResourceType.NOTIFICATION]: 'Notificação',
    [ResourceType.AUDIT_LOG]: 'Log de Auditoria',
    [ResourceType.SYSTEM_LOG]: 'Log do Sistema'
  }
  return typeMap[type] || type
}

export const formatAuditSeverity = (severity: AuditSeverity): string => {
  const severityMap: Record<AuditSeverity, string> = {
    [AuditSeverity.LOW]: 'Baixa',
    [AuditSeverity.MEDIUM]: 'Média',
    [AuditSeverity.HIGH]: 'Alta',
    [AuditSeverity.CRITICAL]: 'Crítica'
  }
  return severityMap[severity] || severity
}

export const formatLogLevel = (level: LogLevel): string => {
  const levelMap: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'Debug',
    [LogLevel.INFO]: 'Info',
    [LogLevel.WARN]: 'Aviso',
    [LogLevel.ERROR]: 'Erro',
    [LogLevel.FATAL]: 'Fatal'
  }
  return levelMap[level] || level
}

export const getSeverityColor = (severity: AuditSeverity): string => {
  const colorMap: Record<AuditSeverity, string> = {
    [AuditSeverity.LOW]: 'text-green-600 bg-green-100',
    [AuditSeverity.MEDIUM]: 'text-yellow-600 bg-yellow-100',
    [AuditSeverity.HIGH]: 'text-orange-600 bg-orange-100',
    [AuditSeverity.CRITICAL]: 'text-red-600 bg-red-100'
  }
  return colorMap[severity] || 'text-gray-600 bg-gray-100'
}

export const getLogLevelColor = (level: LogLevel): string => {
  const colorMap: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'text-gray-600 bg-gray-100',
    [LogLevel.INFO]: 'text-blue-600 bg-blue-100',
    [LogLevel.WARN]: 'text-yellow-600 bg-yellow-100',
    [LogLevel.ERROR]: 'text-red-600 bg-red-100',
    [LogLevel.FATAL]: 'text-purple-600 bg-purple-100'
  }
  return colorMap[level] || 'text-gray-600 bg-gray-100'
}

export const getRiskScoreColor = (score: number): string => {
  if (score >= 9) return 'text-red-600 bg-red-100'
  if (score >= 7) return 'text-orange-600 bg-orange-100'
  if (score >= 4) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
}

export const getRiskScoreLabel = (score: number): string => {
  if (score >= 9) return 'Crítico'
  if (score >= 7) return 'Alto'
  if (score >= 4) return 'Médio'
  return 'Baixo'
}

// Type Guards
export const isAuditLog = (obj: any): obj is AuditLog => {
  return obj && typeof obj === 'object' && 'action' in obj && 'resource_type' in obj
}

export const isSystemLog = (obj: any): obj is SystemLog => {
  return obj && typeof obj === 'object' && 'level' in obj && 'category' in obj
}

export const isAuditRule = (obj: any): obj is AuditRule => {
  return obj && typeof obj === 'object' && 'conditions' in obj && 'actions' in obj
}

export const isAuditReport = (obj: any): obj is AuditReport => {
  return obj && typeof obj === 'object' && 'filters' in obj && 'format' in obj
}