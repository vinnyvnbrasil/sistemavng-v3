// Backup and Recovery System Types

export interface Backup {
  id: string
  name: string
  description?: string
  type: BackupType
  status: BackupStatus
  size: number // in bytes
  compressed_size?: number // in bytes
  file_count: number
  created_at: string
  updated_at: string
  completed_at?: string
  expires_at?: string
  created_by: string
  storage_location: string
  storage_provider: StorageProvider
  encryption_enabled: boolean
  compression_enabled: boolean
  metadata: BackupMetadata
  checksum: string
  version: string
  tags: string[]
  retention_policy?: RetentionPolicy
  schedule_id?: string
  parent_backup_id?: string // For incremental backups
  restore_count: number
  last_restored_at?: string
  is_automated: boolean
  error_message?: string
  progress_percentage?: number
}

export interface BackupSchedule {
  id: string
  name: string
  description?: string
  type: BackupType
  frequency: BackupFrequency
  cron_expression?: string
  is_enabled: boolean
  next_run_at?: string
  last_run_at?: string
  last_backup_id?: string
  created_at: string
  updated_at: string
  created_by: string
  settings: BackupSettings
  retention_policy: RetentionPolicy
  notification_settings: NotificationSettings
  failure_count: number
  max_failures: number
  is_paused: boolean
  pause_reason?: string
  tags: string[]
}

export interface BackupSettings {
  include_files: boolean
  include_database: boolean
  include_user_data: boolean
  include_system_config: boolean
  include_logs: boolean
  exclude_patterns: string[]
  compression_level: CompressionLevel
  encryption_enabled: boolean
  encryption_key_id?: string
  storage_provider: StorageProvider
  storage_config: StorageConfig
  max_backup_size?: number // in bytes
  timeout_minutes: number
  parallel_uploads: boolean
  verify_integrity: boolean
}

export interface RestoreJob {
  id: string
  backup_id: string
  name: string
  description?: string
  status: RestoreStatus
  type: RestoreType
  target_location?: string
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
  created_by: string
  settings: RestoreSettings
  progress_percentage: number
  files_restored: number
  total_files: number
  bytes_restored: number
  total_bytes: number
  error_message?: string
  warnings: string[]
  is_test_restore: boolean
  verification_status?: VerificationStatus
  rollback_available: boolean
  rollback_backup_id?: string
}

export interface RestoreSettings {
  restore_files: boolean
  restore_database: boolean
  restore_user_data: boolean
  restore_system_config: boolean
  overwrite_existing: boolean
  create_rollback: boolean
  verify_integrity: boolean
  target_path?: string
  exclude_patterns: string[]
  preserve_permissions: boolean
  restore_timestamps: boolean
}

export interface BackupMetadata {
  database_version?: string
  application_version: string
  system_info: SystemInfo
  file_types: Record<string, number>
  largest_files: FileInfo[]
  backup_duration: number // in seconds
  compression_ratio?: number
  encryption_algorithm?: string
  custom_metadata?: Record<string, any>
}

export interface SystemInfo {
  os: string
  architecture: string
  node_version: string
  memory_total: number
  memory_used: number
  disk_total: number
  disk_used: number
  cpu_count: number
  hostname: string
  timezone: string
}

export interface FileInfo {
  path: string
  size: number
  modified_at: string
  type: string
  checksum?: string
}

export interface RetentionPolicy {
  keep_daily: number // days
  keep_weekly: number // weeks
  keep_monthly: number // months
  keep_yearly: number // years
  max_backups?: number
  delete_after_days?: number
  archive_after_days?: number
  compress_after_days?: number
}

export interface NotificationSettings {
  on_success: boolean
  on_failure: boolean
  on_warning: boolean
  email_recipients: string[]
  webhook_url?: string
  slack_webhook?: string
  include_logs: boolean
  include_summary: boolean
}

export interface StorageConfig {
  provider: StorageProvider
  bucket_name?: string
  region?: string
  access_key?: string
  secret_key?: string
  endpoint?: string
  path_prefix?: string
  encryption_key?: string
  connection_timeout?: number
  retry_attempts?: number
  custom_config?: Record<string, any>
}

export interface BackupStats {
  total_backups: number
  successful_backups: number
  failed_backups: number
  total_size: number
  compressed_size: number
  average_backup_time: number
  last_backup_date?: string
  next_scheduled_backup?: string
  storage_usage_by_provider: Record<StorageProvider, number>
  backup_frequency_stats: Record<BackupFrequency, number>
  retention_savings: number
  compression_savings: number
  oldest_backup_date?: string
  largest_backup_size: number
  fastest_backup_time: number
  slowest_backup_time: number
}

export interface RestoreStats {
  total_restores: number
  successful_restores: number
  failed_restores: number
  average_restore_time: number
  total_data_restored: number
  last_restore_date?: string
  most_restored_backup?: string
  restore_success_rate: number
  average_files_restored: number
  fastest_restore_time: number
  slowest_restore_time: number
}

export interface BackupHealth {
  overall_status: HealthStatus
  last_successful_backup?: string
  days_since_last_backup: number
  failed_backups_count: number
  storage_health: StorageHealth[]
  schedule_health: ScheduleHealth[]
  retention_compliance: boolean
  encryption_compliance: boolean
  issues: HealthIssue[]
  recommendations: string[]
  next_maintenance_date?: string
}

export interface StorageHealth {
  provider: StorageProvider
  status: HealthStatus
  available_space?: number
  used_space: number
  connection_status: ConnectionStatus
  last_tested_at: string
  error_message?: string
  response_time?: number
}

export interface ScheduleHealth {
  schedule_id: string
  schedule_name: string
  status: HealthStatus
  last_run_status: BackupStatus
  next_run_at?: string
  consecutive_failures: number
  is_overdue: boolean
  error_message?: string
}

export interface HealthIssue {
  id: string
  type: IssueType
  severity: IssueSeverity
  title: string
  description: string
  affected_component: string
  detected_at: string
  resolved_at?: string
  resolution_steps: string[]
  auto_resolvable: boolean
}

// Enums
export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  DIFFERENTIAL = 'differential',
  SNAPSHOT = 'snapshot'
}

export enum BackupStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  VERIFYING = 'verifying',
  UPLOADING = 'uploading',
  COMPRESSING = 'compressing',
  ENCRYPTING = 'encrypting'
}

export enum RestoreStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  VERIFYING = 'verifying',
  DOWNLOADING = 'downloading',
  EXTRACTING = 'extracting',
  DECRYPTING = 'decrypting'
}

export enum RestoreType {
  FULL = 'full',
  PARTIAL = 'partial',
  FILES_ONLY = 'files_only',
  DATABASE_ONLY = 'database_only',
  POINT_IN_TIME = 'point_in_time'
}

export enum BackupFrequency {
  MANUAL = 'manual',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum StorageProvider {
  LOCAL = 'local',
  AWS_S3 = 'aws_s3',
  GOOGLE_CLOUD = 'google_cloud',
  AZURE_BLOB = 'azure_blob',
  DROPBOX = 'dropbox',
  FTP = 'ftp',
  SFTP = 'sftp'
}

export enum CompressionLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  MAXIMUM = 'maximum'
}

export enum VerificationStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  TIMEOUT = 'timeout',
  ERROR = 'error'
}

export enum IssueType {
  STORAGE = 'storage',
  SCHEDULE = 'schedule',
  BACKUP = 'backup',
  RESTORE = 'restore',
  RETENTION = 'retention',
  ENCRYPTION = 'encryption',
  NETWORK = 'network',
  PERMISSION = 'permission'
}

export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Filter and Sort Types
export interface BackupFilter {
  type?: BackupType | BackupType[]
  status?: BackupStatus | BackupStatus[]
  created_by?: string
  storage_provider?: StorageProvider | StorageProvider[]
  date_from?: string
  date_to?: string
  size_min?: number
  size_max?: number
  tags?: string[]
  search?: string
  is_automated?: boolean
  has_schedule?: boolean
}

export interface BackupSort {
  field: 'created_at' | 'updated_at' | 'size' | 'name' | 'completed_at'
  direction: 'asc' | 'desc'
}

export interface RestoreFilter {
  status?: RestoreStatus | RestoreStatus[]
  type?: RestoreType | RestoreType[]
  created_by?: string
  backup_id?: string
  date_from?: string
  date_to?: string
  is_test_restore?: boolean
  search?: string
}

export interface RestoreSort {
  field: 'created_at' | 'updated_at' | 'started_at' | 'completed_at' | 'progress_percentage'
  direction: 'asc' | 'desc'
}

// API Response Types
export interface PaginatedBackups {
  backups: Backup[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface PaginatedRestoreJobs {
  restore_jobs: RestoreJob[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface PaginatedSchedules {
  schedules: BackupSchedule[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Form Data Types
export interface CreateBackupData {
  name: string
  description?: string
  type: BackupType
  settings: BackupSettings
  tags?: string[]
  schedule_id?: string
  expires_at?: string
}

export interface UpdateBackupData {
  name?: string
  description?: string
  tags?: string[]
  expires_at?: string
}

export interface CreateScheduleData {
  name: string
  description?: string
  type: BackupType
  frequency: BackupFrequency
  cron_expression?: string
  settings: BackupSettings
  retention_policy: RetentionPolicy
  notification_settings: NotificationSettings
  tags?: string[]
}

export interface UpdateScheduleData {
  name?: string
  description?: string
  frequency?: BackupFrequency
  cron_expression?: string
  is_enabled?: boolean
  settings?: Partial<BackupSettings>
  retention_policy?: Partial<RetentionPolicy>
  notification_settings?: Partial<NotificationSettings>
  tags?: string[]
}

export interface CreateRestoreJobData {
  backup_id: string
  name: string
  description?: string
  type: RestoreType
  settings: RestoreSettings
  target_location?: string
  is_test_restore?: boolean
}

// Constants
export const BACKUP_TYPE_LABELS: Record<BackupType, string> = {
  [BackupType.FULL]: 'Backup Completo',
  [BackupType.INCREMENTAL]: 'Backup Incremental',
  [BackupType.DIFFERENTIAL]: 'Backup Diferencial',
  [BackupType.SNAPSHOT]: 'Snapshot'
}

export const BACKUP_STATUS_LABELS: Record<BackupStatus, string> = {
  [BackupStatus.PENDING]: 'Pendente',
  [BackupStatus.RUNNING]: 'Executando',
  [BackupStatus.COMPLETED]: 'Concluído',
  [BackupStatus.FAILED]: 'Falhou',
  [BackupStatus.CANCELLED]: 'Cancelado',
  [BackupStatus.PAUSED]: 'Pausado',
  [BackupStatus.VERIFYING]: 'Verificando',
  [BackupStatus.UPLOADING]: 'Enviando',
  [BackupStatus.COMPRESSING]: 'Comprimindo',
  [BackupStatus.ENCRYPTING]: 'Criptografando'
}

export const RESTORE_STATUS_LABELS: Record<RestoreStatus, string> = {
  [RestoreStatus.PENDING]: 'Pendente',
  [RestoreStatus.RUNNING]: 'Executando',
  [RestoreStatus.COMPLETED]: 'Concluído',
  [RestoreStatus.FAILED]: 'Falhou',
  [RestoreStatus.CANCELLED]: 'Cancelado',
  [RestoreStatus.PAUSED]: 'Pausado',
  [RestoreStatus.VERIFYING]: 'Verificando',
  [RestoreStatus.DOWNLOADING]: 'Baixando',
  [RestoreStatus.EXTRACTING]: 'Extraindo',
  [RestoreStatus.DECRYPTING]: 'Descriptografando'
}

export const STORAGE_PROVIDER_LABELS: Record<StorageProvider, string> = {
  [StorageProvider.LOCAL]: 'Armazenamento Local',
  [StorageProvider.AWS_S3]: 'Amazon S3',
  [StorageProvider.GOOGLE_CLOUD]: 'Google Cloud Storage',
  [StorageProvider.AZURE_BLOB]: 'Azure Blob Storage',
  [StorageProvider.DROPBOX]: 'Dropbox',
  [StorageProvider.FTP]: 'FTP',
  [StorageProvider.SFTP]: 'SFTP'
}

export const BACKUP_FREQUENCY_LABELS: Record<BackupFrequency, string> = {
  [BackupFrequency.MANUAL]: 'Manual',
  [BackupFrequency.HOURLY]: 'A cada hora',
  [BackupFrequency.DAILY]: 'Diário',
  [BackupFrequency.WEEKLY]: 'Semanal',
  [BackupFrequency.MONTHLY]: 'Mensal',
  [BackupFrequency.CUSTOM]: 'Personalizado'
}

export const BACKUP_STATUS_COLORS: Record<BackupStatus, string> = {
  [BackupStatus.PENDING]: 'text-yellow-600 bg-yellow-100',
  [BackupStatus.RUNNING]: 'text-blue-600 bg-blue-100',
  [BackupStatus.COMPLETED]: 'text-green-600 bg-green-100',
  [BackupStatus.FAILED]: 'text-red-600 bg-red-100',
  [BackupStatus.CANCELLED]: 'text-gray-600 bg-gray-100',
  [BackupStatus.PAUSED]: 'text-orange-600 bg-orange-100',
  [BackupStatus.VERIFYING]: 'text-purple-600 bg-purple-100',
  [BackupStatus.UPLOADING]: 'text-indigo-600 bg-indigo-100',
  [BackupStatus.COMPRESSING]: 'text-teal-600 bg-teal-100',
  [BackupStatus.ENCRYPTING]: 'text-pink-600 bg-pink-100'
}

export const RESTORE_STATUS_COLORS: Record<RestoreStatus, string> = {
  [RestoreStatus.PENDING]: 'text-yellow-600 bg-yellow-100',
  [RestoreStatus.RUNNING]: 'text-blue-600 bg-blue-100',
  [RestoreStatus.COMPLETED]: 'text-green-600 bg-green-100',
  [RestoreStatus.FAILED]: 'text-red-600 bg-red-100',
  [RestoreStatus.CANCELLED]: 'text-gray-600 bg-gray-100',
  [RestoreStatus.PAUSED]: 'text-orange-600 bg-orange-100',
  [RestoreStatus.VERIFYING]: 'text-purple-600 bg-purple-100',
  [RestoreStatus.DOWNLOADING]: 'text-indigo-600 bg-indigo-100',
  [RestoreStatus.EXTRACTING]: 'text-teal-600 bg-teal-100',
  [RestoreStatus.DECRYPTING]: 'text-pink-600 bg-pink-100'
}

// Utility Functions
export function formatBackupSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function formatBackupDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0
  return Math.round(((originalSize - compressedSize) / originalSize) * 100)
}

export function isBackupExpired(backup: Backup): boolean {
  if (!backup.expires_at) return false
  return new Date(backup.expires_at) < new Date()
}

export function getNextBackupDate(schedule: BackupSchedule): Date | null {
  if (!schedule.is_enabled || !schedule.next_run_at) return null
  return new Date(schedule.next_run_at)
}

export function validateBackupSettings(settings: BackupSettings): string[] {
  const errors: string[] = []

  if (!settings.include_files && !settings.include_database && !settings.include_user_data) {
    errors.push('Pelo menos um tipo de dados deve ser incluído no backup')
  }

  if (settings.timeout_minutes <= 0) {
    errors.push('Timeout deve ser maior que zero')
  }

  if (settings.max_backup_size && settings.max_backup_size <= 0) {
    errors.push('Tamanho máximo do backup deve ser maior que zero')
  }

  return errors
}

export function validateRetentionPolicy(policy: RetentionPolicy): string[] {
  const errors: string[] = []

  if (policy.keep_daily < 0 || policy.keep_weekly < 0 || policy.keep_monthly < 0 || policy.keep_yearly < 0) {
    errors.push('Valores de retenção não podem ser negativos')
  }

  if (policy.max_backups && policy.max_backups <= 0) {
    errors.push('Número máximo de backups deve ser maior que zero')
  }

  if (policy.delete_after_days && policy.delete_after_days <= 0) {
    errors.push('Dias para exclusão deve ser maior que zero')
  }

  return errors
}