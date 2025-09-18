// Authentication and 2FA Types

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  email_verified: boolean
  phone_verified: boolean
  two_factor_enabled: boolean
  backup_codes_generated: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
  preferences: UserPreferences
  security_settings: SecuritySettings
}

export interface UserPreferences {
  language: string
  timezone: string
  theme: 'light' | 'dark' | 'system'
  notifications: NotificationPreferences
  dashboard_layout: DashboardLayout
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  security_alerts: boolean
  marketing_emails: boolean
}

export interface DashboardLayout {
  sidebar_collapsed: boolean
  widgets_order: string[]
  default_view: string
}

export interface SecuritySettings {
  password_changed_at: string
  failed_login_attempts: number
  account_locked_until?: string
  trusted_devices: TrustedDevice[]
  active_sessions: ActiveSession[]
  security_questions: SecurityQuestion[]
}

export interface TrustedDevice {
  id: string
  device_name: string
  device_type: DeviceType
  browser: string
  os: string
  ip_address: string
  location?: string
  trusted_at: string
  last_used_at: string
  is_current: boolean
}

export interface ActiveSession {
  id: string
  device_name: string
  browser: string
  os: string
  ip_address: string
  location?: string
  created_at: string
  last_activity_at: string
  is_current: boolean
}

export interface SecurityQuestion {
  id: string
  question: string
  answer_hash: string
  created_at: string
}

// 2FA Types
export interface TwoFactorAuth {
  id: string
  user_id: string
  method: TwoFactorMethod
  is_enabled: boolean
  is_verified: boolean
  secret?: string // For TOTP
  phone_number?: string // For SMS
  backup_codes: string[]
  recovery_codes: string[]
  qr_code_url?: string
  created_at: string
  verified_at?: string
  last_used_at?: string
}

export interface TwoFactorSetup {
  method: TwoFactorMethod
  secret: string
  qr_code_url: string
  backup_codes: string[]
  manual_entry_key: string
}

export interface TwoFactorVerification {
  user_id: string
  method: TwoFactorMethod
  code: string
  backup_code?: string
  trust_device?: boolean
}

export interface BackupCode {
  id: string
  user_id: string
  code: string
  is_used: boolean
  used_at?: string
  created_at: string
}

export interface RecoveryCode {
  id: string
  user_id: string
  code: string
  is_used: boolean
  used_at?: string
  created_at: string
  expires_at: string
}

// Authentication Types
export interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
  captcha_token?: string
}

export interface LoginResponse {
  user: User
  access_token: string
  refresh_token: string
  expires_in: number
  requires_2fa: boolean
  two_factor_methods: TwoFactorMethod[]
  session_id: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone_number?: string
  terms_accepted: boolean
  marketing_consent?: boolean
}

export interface PasswordReset {
  email: string
  token: string
  new_password: string
  confirm_password: string
}

export interface PasswordChange {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface EmailVerification {
  email: string
  token: string
}

export interface PhoneVerification {
  phone_number: string
  code: string
}

// Enums
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest'
}

export enum TwoFactorMethod {
  TOTP = 'totp', // Time-based One-Time Password (Google Authenticator, Authy)
  SMS = 'sms', // SMS verification
  EMAIL = 'email', // Email verification
  BACKUP_CODE = 'backup_code', // Backup codes
  RECOVERY_CODE = 'recovery_code' // Recovery codes
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  UNKNOWN = 'unknown'
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
  APPLE = 'apple'
}

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_CHANGED = 'email_changed',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  BACKUP_CODES_GENERATED = 'backup_codes_generated',
  BACKUP_CODE_USED = 'backup_code_used',
  RECOVERY_CODE_USED = 'recovery_code_used',
  DEVICE_TRUSTED = 'device_trusted',
  DEVICE_REMOVED = 'device_removed',
  SESSION_CREATED = 'session_created',
  SESSION_REVOKED = 'session_revoked',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

// Security Event
export interface SecurityEvent {
  id: string
  user_id: string
  type: SecurityEventType
  description: string
  ip_address: string
  user_agent: string
  location?: string
  device_info: DeviceInfo
  metadata: Record<string, any>
  risk_score: number
  created_at: string
}

export interface DeviceInfo {
  device_type: DeviceType
  browser: string
  browser_version: string
  os: string
  os_version: string
  device_name: string
  is_mobile: boolean
  is_trusted: boolean
  ip_address?: string
  user_agent?: string
  location?: string
}

// API Response Types
export interface AuthResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
  requires_2fa?: boolean
  two_factor_methods?: TwoFactorMethod[]
}

export interface PaginatedUsers {
  users: User[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface PaginatedSessions {
  sessions: ActiveSession[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface PaginatedSecurityEvents {
  events: SecurityEvent[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Filter and Sort Types
export interface UserFilter {
  role?: UserRole | UserRole[]
  is_active?: boolean
  email_verified?: boolean
  two_factor_enabled?: boolean
  created_from?: string
  created_to?: string
  last_login_from?: string
  last_login_to?: string
  search?: string
}

export interface UserSort {
  field: 'full_name' | 'email' | 'created_at' | 'last_login_at' | 'role'
  direction: 'asc' | 'desc'
}

export interface SecurityEventFilter {
  user_id?: string
  type?: SecurityEventType | SecurityEventType[]
  risk_score_min?: number
  risk_score_max?: number
  date_from?: string
  date_to?: string
  ip_address?: string
  location?: string
  search?: string
}

export interface SecurityEventSort {
  field: 'created_at' | 'risk_score' | 'type'
  direction: 'asc' | 'desc'
}

// Statistics Types
export interface AuthStats {
  total_users: number
  active_users: number
  verified_users: number
  two_factor_users: number
  failed_logins_today: number
  successful_logins_today: number
  locked_accounts: number
  new_registrations_today: number
  average_session_duration: number
  most_used_2fa_method: TwoFactorMethod
  login_success_rate: number
  security_events_today: number
}

export interface SecurityStats {
  high_risk_events: number
  medium_risk_events: number
  low_risk_events: number
  blocked_attempts: number
  suspicious_activities: number
  trusted_devices: number
  active_sessions: number
  password_changes_today: number
  two_factor_setups_today: number
  account_lockouts_today: number
}

// Constants
export const TOTP_SETTINGS = {
  ISSUER: 'SistemaVNG',
  ALGORITHM: 'SHA1',
  DIGITS: 6,
  PERIOD: 30,
  WINDOW: 1
} as const

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SYMBOLS: true,
  FORBIDDEN_PATTERNS: [
    'password',
    '123456',
    'qwerty',
    'admin',
    'user'
  ]
} as const

export const SESSION_SETTINGS = {
  ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days
  REMEMBER_ME_EXPIRY: 30 * 24 * 60 * 60, // 30 days
  MAX_SESSIONS_PER_USER: 5,
  INACTIVITY_TIMEOUT: 30 * 60 // 30 minutes
} as const

export const SECURITY_SETTINGS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60, // 30 minutes
  PASSWORD_HISTORY_COUNT: 5,
  PASSWORD_EXPIRY_DAYS: 90,
  BACKUP_CODES_COUNT: 10,
  RECOVERY_CODES_COUNT: 5,
  RECOVERY_CODE_EXPIRY: 24 * 60 * 60, // 24 hours
  TRUSTED_DEVICE_EXPIRY: 30 * 24 * 60 * 60 // 30 days
} as const

export const RISK_SCORES = {
  LOW: 1,
  MEDIUM: 5,
  HIGH: 8,
  CRITICAL: 10
} as const

// Utility Functions
export const isPasswordStrong = (password: string): boolean => {
  const { MIN_LENGTH, REQUIRE_UPPERCASE, REQUIRE_LOWERCASE, REQUIRE_NUMBERS, REQUIRE_SYMBOLS } = PASSWORD_REQUIREMENTS
  
  if (password.length < MIN_LENGTH) return false
  if (REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) return false
  if (REQUIRE_LOWERCASE && !/[a-z]/.test(password)) return false
  if (REQUIRE_NUMBERS && !/\d/.test(password)) return false
  if (REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false
  
  return true
}

export const calculatePasswordStrength = (password: string): number => {
  let score = 0
  
  // Length
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  
  // Character types
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  
  // Patterns
  if (!/(..).*\1/.test(password)) score += 1 // No repeated pairs
  if (!/012|123|234|345|456|567|678|789|890/.test(password)) score += 1 // No sequences
  
  return Math.min(score, 10)
}

export const getPasswordStrengthLabel = (score: number): string => {
  if (score <= 3) return 'Muito fraca'
  if (score <= 5) return 'Fraca'
  if (score <= 7) return 'Média'
  if (score <= 9) return 'Forte'
  return 'Muito forte'
}

export const getPasswordStrengthColor = (score: number): string => {
  if (score <= 3) return 'text-red-600'
  if (score <= 5) return 'text-orange-600'
  if (score <= 7) return 'text-yellow-600'
  if (score <= 9) return 'text-blue-600'
  return 'text-green-600'
}

export const formatTwoFactorMethod = (method: TwoFactorMethod): string => {
  switch (method) {
    case TwoFactorMethod.TOTP:
      return 'Aplicativo Autenticador'
    case TwoFactorMethod.SMS:
      return 'SMS'
    case TwoFactorMethod.EMAIL:
      return 'Email'
    case TwoFactorMethod.BACKUP_CODE:
      return 'Código de Backup'
    case TwoFactorMethod.RECOVERY_CODE:
      return 'Código de Recuperação'
    default:
      return method
  }
}

export const formatUserRole = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrador'
    case UserRole.MANAGER:
      return 'Gerente'
    case UserRole.USER:
      return 'Usuário'
    case UserRole.GUEST:
      return 'Convidado'
    default:
      return role
  }
}

export const formatDeviceType = (type: DeviceType): string => {
  switch (type) {
    case DeviceType.DESKTOP:
      return 'Desktop'
    case DeviceType.MOBILE:
      return 'Mobile'
    case DeviceType.TABLET:
      return 'Tablet'
    case DeviceType.UNKNOWN:
      return 'Desconhecido'
    default:
      return type
  }
}

export const formatSecurityEventType = (type: SecurityEventType): string => {
  switch (type) {
    case SecurityEventType.LOGIN_SUCCESS:
      return 'Login realizado'
    case SecurityEventType.LOGIN_FAILED:
      return 'Falha no login'
    case SecurityEventType.LOGOUT:
      return 'Logout'
    case SecurityEventType.PASSWORD_CHANGED:
      return 'Senha alterada'
    case SecurityEventType.EMAIL_CHANGED:
      return 'Email alterado'
    case SecurityEventType.TWO_FACTOR_ENABLED:
      return '2FA habilitado'
    case SecurityEventType.TWO_FACTOR_DISABLED:
      return '2FA desabilitado'
    case SecurityEventType.BACKUP_CODES_GENERATED:
      return 'Códigos de backup gerados'
    case SecurityEventType.BACKUP_CODE_USED:
      return 'Código de backup usado'
    case SecurityEventType.RECOVERY_CODE_USED:
      return 'Código de recuperação usado'
    case SecurityEventType.DEVICE_TRUSTED:
      return 'Dispositivo confiável'
    case SecurityEventType.DEVICE_REMOVED:
      return 'Dispositivo removido'
    case SecurityEventType.SESSION_CREATED:
      return 'Sessão criada'
    case SecurityEventType.SESSION_REVOKED:
      return 'Sessão revogada'
    case SecurityEventType.ACCOUNT_LOCKED:
      return 'Conta bloqueada'
    case SecurityEventType.ACCOUNT_UNLOCKED:
      return 'Conta desbloqueada'
    case SecurityEventType.SUSPICIOUS_ACTIVITY:
      return 'Atividade suspeita'
    default:
      return type
  }
}

export const getRiskScoreColor = (score: number): string => {
  if (score >= RISK_SCORES.CRITICAL) return 'text-red-600'
  if (score >= RISK_SCORES.HIGH) return 'text-orange-600'
  if (score >= RISK_SCORES.MEDIUM) return 'text-yellow-600'
  return 'text-green-600'
}

export const getRiskScoreLabel = (score: number): string => {
  if (score >= RISK_SCORES.CRITICAL) return 'Crítico'
  if (score >= RISK_SCORES.HIGH) return 'Alto'
  if (score >= RISK_SCORES.MEDIUM) return 'Médio'
  return 'Baixo'
}

// Type Guards
export const isTwoFactorMethod = (value: string): value is TwoFactorMethod => {
  return Object.values(TwoFactorMethod).includes(value as TwoFactorMethod)
}

export const isUserRole = (value: string): value is UserRole => {
  return Object.values(UserRole).includes(value as UserRole)
}

export const isDeviceType = (value: string): value is DeviceType => {
  return Object.values(DeviceType).includes(value as DeviceType)
}

export const isSecurityEventType = (value: string): value is SecurityEventType => {
  return Object.values(SecurityEventType).includes(value as SecurityEventType)
}

// Validation Functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validateTOTPCode = (code: string): boolean => {
  return /^\d{6}$/.test(code)
}

export const validateBackupCode = (code: string): boolean => {
  return /^[A-Z0-9]{8}-[A-Z0-9]{8}$/.test(code)
}

export const validateRecoveryCode = (code: string): boolean => {
  return /^[A-Z0-9]{12}$/.test(code)
}