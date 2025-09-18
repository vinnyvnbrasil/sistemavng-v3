import { createClient } from '@supabase/supabase-js'
import { authenticator } from 'otplib'
import * as QRCode from 'qrcode'
import * as crypto from 'crypto'
import {
  User,
  TwoFactorAuth,
  TwoFactorSetup,
  TwoFactorVerification,
  TwoFactorMethod,
  LoginCredentials,
  LoginResponse,
  RegisterData,
  PasswordReset,
  PasswordChange,
  EmailVerification,
  PhoneVerification,
  BackupCode,
  RecoveryCode,
  SecurityEvent,
  SecurityEventType,
  DeviceInfo,
  TrustedDevice,
  ActiveSession,
  AuthStats,
  SecurityStats,
  UserFilter,
  UserSort,
  SecurityEventFilter,
  SecurityEventSort,
  PaginatedUsers,
  PaginatedSessions,
  PaginatedSecurityEvents,
  AuthResponse,
  TOTP_SETTINGS,
  SECURITY_SETTINGS,
  SESSION_SETTINGS,
  RISK_SCORES,
  isPasswordStrong,
  validateEmail,
  validatePhoneNumber,
  validateTOTPCode,
  validateBackupCode,
  validateRecoveryCode
} from '@/types/auth'
import { ActivityService } from './activities'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class AuthService {
  constructor() {
    // ActivityService is now used as static methods
  }

  // Authentication Methods
  async login(credentials: LoginCredentials, deviceInfo: DeviceInfo): Promise<AuthResponse<LoginResponse>> {
    try {
      const { email, password, remember_me, captcha_token } = credentials

      // Validate input
      if (!validateEmail(email)) {
        return {
          success: false,
          message: 'Email inválido',
          errors: { email: ['Formato de email inválido'] }
        }
      }

      // Check if account is locked
      const lockStatus = await this.checkAccountLockStatus(email)
      if (lockStatus.isLocked) {
        await this.logSecurityEvent({
          user_id: lockStatus.userId || '',
          type: SecurityEventType.LOGIN_FAILED,
          description: 'Tentativa de login em conta bloqueada',
          ip_address: deviceInfo.ip_address || '',
          user_agent: deviceInfo.user_agent || '',
          device_info: deviceInfo,
          risk_score: RISK_SCORES.HIGH
        })

        return {
          success: false,
          message: `Conta bloqueada até ${lockStatus.lockedUntil}`,
          errors: { account: ['Conta temporariamente bloqueada'] }
        }
      }

      // Attempt login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError || !authData.user) {
        await this.handleFailedLogin(email, deviceInfo)
        return {
          success: false,
          message: 'Credenciais inválidas',
          errors: { credentials: ['Email ou senha incorretos'] }
        }
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError || !userData) {
        return {
          success: false,
          message: 'Erro ao carregar dados do usuário'
        }
      }

      // Check if user is active
      if (!userData.is_active) {
        return {
          success: false,
          message: 'Conta desativada. Entre em contato com o suporte.'
        }
      }

      // Reset failed login attempts
      await this.resetFailedLoginAttempts(authData.user.id)

      // Check if 2FA is enabled
      const twoFactorData = await this.getTwoFactorAuth(authData.user.id)
      if (twoFactorData && twoFactorData.is_enabled) {
        // Store temporary session for 2FA verification
        await this.storeTempSession(authData.user.id, authData.session?.access_token || '', deviceInfo)

        return {
          success: true,
          requires_2fa: true,
          two_factor_methods: [twoFactorData.method],
          message: 'Verificação de dois fatores necessária'
        }
      }

      // Complete login
      const loginResponse = await this.completeLogin(userData, authData.session!, deviceInfo, remember_me)
      return {
        success: true,
        data: loginResponse
      }

    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: 'Erro interno do servidor'
      }
    }
  }

  async register(data: RegisterData, deviceInfo: DeviceInfo): Promise<AuthResponse<User>> {
    try {
      const { email, password, full_name, phone_number, terms_accepted } = data

      // Validate input
      if (!validateEmail(email)) {
        return {
          success: false,
          errors: { email: ['Formato de email inválido'] }
        }
      }

      if (!isPasswordStrong(password)) {
        return {
          success: false,
          errors: { password: ['Senha não atende aos requisitos de segurança'] }
        }
      }

      if (!terms_accepted) {
        return {
          success: false,
          errors: { terms: ['Você deve aceitar os termos de uso'] }
        }
      }

      if (phone_number && !validatePhoneNumber(phone_number)) {
        return {
          success: false,
          errors: { phone_number: ['Formato de telefone inválido'] }
        }
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return {
          success: false,
          errors: { email: ['Este email já está em uso'] }
        }
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            phone_number
          }
        }
      })

      if (authError || !authData.user) {
        return {
          success: false,
          message: authError?.message || 'Erro ao criar conta'
        }
      }

      // Create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name,
          phone_number,
          role: 'user',
          is_active: true,
          email_verified: false,
          phone_verified: false,
          two_factor_enabled: false,
          backup_codes_generated: false,
          preferences: {
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo',
            theme: 'system',
            notifications: {
              email_notifications: true,
              push_notifications: true,
              sms_notifications: false,
              security_alerts: true,
              marketing_emails: false
            },
            dashboard_layout: {
              sidebar_collapsed: false,
              widgets_order: [],
              default_view: 'dashboard'
            }
          },
          security_settings: {
            password_changed_at: new Date().toISOString(),
            failed_login_attempts: 0,
            trusted_devices: [],
            active_sessions: [],
            security_questions: []
          }
        })
        .select()
        .single()

      if (userError) {
        return {
          success: false,
          message: 'Erro ao criar perfil do usuário'
        }
      }

      // Log security event
      await this.logSecurityEvent({
        user_id: authData.user.id,
        type: SecurityEventType.LOGIN_SUCCESS,
        description: 'Conta criada com sucesso',
        ip_address: deviceInfo.ip_address || '',
        user_agent: deviceInfo.user_agent || '',
        device_info: deviceInfo,
        risk_score: RISK_SCORES.LOW
      })

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Usuário registrado',
        authData.user.id,
        'system',
        authData.user.id,
        {
          description: `Usuário registrado: ${email}`,
          entityName: 'user',
          metadata: {
            email,
            full_name,
            registration_method: 'email'
          }
        }
      )

      return {
        success: true,
        data: userData,
        message: 'Conta criada com sucesso! Verifique seu email para ativar a conta.'
      }

    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        message: 'Erro interno do servidor'
      }
    }
  }

  async logout(userId: string, sessionId?: string): Promise<AuthResponse> {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()

      // Revoke session if provided
      if (sessionId) {
        await this.revokeSession(userId, sessionId)
      }

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        type: SecurityEventType.LOGOUT,
        description: 'Logout realizado',
        ip_address: '',
        user_agent: '',
        device_info: {} as DeviceInfo,
        risk_score: RISK_SCORES.LOW
      })

      return {
        success: true,
        message: 'Logout realizado com sucesso'
      }

    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        message: 'Erro ao fazer logout'
      }
    }
  }

  // Two-Factor Authentication Methods
  async setupTwoFactor(userId: string, method: TwoFactorMethod): Promise<AuthResponse<TwoFactorSetup>> {
    try {
      if (method === TwoFactorMethod.TOTP) {
        return await this.setupTOTP(userId)
      } else if (method === TwoFactorMethod.SMS) {
        return await this.setupSMS(userId)
      }

      return {
        success: false,
        message: 'Método de 2FA não suportado'
      }

    } catch (error) {
      console.error('Setup 2FA error:', error)
      return {
        success: false,
        message: 'Erro ao configurar 2FA'
      }
    }
  }

  private async setupTOTP(userId: string): Promise<AuthResponse<TwoFactorSetup>> {
    try {
      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (!userData) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        }
      }

      // Generate secret
      const secret = authenticator.generateSecret()
      const serviceName = TOTP_SETTINGS.ISSUER
      const accountName = userData.email
      
      // Generate QR code URL
      const otpauth = authenticator.keyuri(accountName, serviceName, secret)
      const qrCodeUrl = await QRCode.toDataURL(otpauth)

      // Generate backup codes
      const backupCodes = this.generateBackupCodes()

      // Store 2FA setup (not enabled yet)
      const { error } = await supabase
        .from('two_factor_auth')
        .upsert({
          user_id: userId,
          method: TwoFactorMethod.TOTP,
          secret,
          is_enabled: false,
          is_verified: false,
          backup_codes: backupCodes,
          recovery_codes: []
        })

      if (error) {
        return {
          success: false,
          message: 'Erro ao configurar TOTP'
        }
      }

      return {
        success: true,
        data: {
          method: TwoFactorMethod.TOTP,
          secret,
          qr_code_url: qrCodeUrl,
          backup_codes: backupCodes,
          manual_entry_key: secret
        },
        message: 'TOTP configurado. Escaneie o QR code com seu aplicativo autenticador.'
      }

    } catch (error) {
      console.error('Setup TOTP error:', error)
      return {
        success: false,
        message: 'Erro ao configurar TOTP'
      }
    }
  }

  private async setupSMS(userId: string): Promise<AuthResponse<TwoFactorSetup>> {
    try {
      // Get user phone number
      const { data: userData } = await supabase
        .from('users')
        .select('phone_number')
        .eq('id', userId)
        .single()

      if (!userData?.phone_number) {
        return {
          success: false,
          message: 'Número de telefone não cadastrado'
        }
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes()

      // Store 2FA setup
      const { error } = await supabase
        .from('two_factor_auth')
        .upsert({
          user_id: userId,
          method: TwoFactorMethod.SMS,
          phone_number: userData.phone_number,
          is_enabled: false,
          is_verified: false,
          backup_codes: backupCodes,
          recovery_codes: []
        })

      if (error) {
        return {
          success: false,
          message: 'Erro ao configurar SMS'
        }
      }

      return {
        success: true,
        data: {
          method: TwoFactorMethod.SMS,
          secret: '',
          qr_code_url: '',
          backup_codes: backupCodes,
          manual_entry_key: ''
        },
        message: 'SMS 2FA configurado. Você receberá códigos por SMS.'
      }

    } catch (error) {
      console.error('Setup SMS error:', error)
      return {
        success: false,
        message: 'Erro ao configurar SMS'
      }
    }
  }

  async verifyTwoFactor(verification: TwoFactorVerification, deviceInfo: DeviceInfo): Promise<AuthResponse<LoginResponse>> {
    try {
      const { user_id, method, code, backup_code, trust_device } = verification

      // Get 2FA data
      const twoFactorData = await this.getTwoFactorAuth(user_id)
      if (!twoFactorData) {
        return {
          success: false,
          message: '2FA não configurado'
        }
      }

      let isValid = false

      if (backup_code) {
        // Verify backup code
        isValid = await this.verifyBackupCode(user_id, backup_code)
      } else {
        // Verify regular code
        if (method === TwoFactorMethod.TOTP) {
          isValid = this.verifyTOTPCode(twoFactorData.secret!, code)
        } else if (method === TwoFactorMethod.SMS) {
          isValid = await this.verifySMSCode(user_id, code)
        }
      }

      if (!isValid) {
        await this.logSecurityEvent({
          user_id,
          type: SecurityEventType.LOGIN_FAILED,
          description: '2FA inválido',
          ip_address: deviceInfo.ip_address || '',
          user_agent: deviceInfo.user_agent || '',
          device_info: deviceInfo,
          risk_score: RISK_SCORES.MEDIUM
        })

        return {
          success: false,
          message: 'Código de verificação inválido'
        }
      }

      // Get temp session
      const tempSession = await this.getTempSession(user_id)
      if (!tempSession) {
        return {
          success: false,
          message: 'Sessão temporária expirada. Faça login novamente.'
        }
      }

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user_id)
        .single()

      if (!userData) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        }
      }

      // Complete login
      const loginResponse = await this.completeLogin(userData, tempSession, deviceInfo, false, trust_device)

      // Clean up temp session
      await this.clearTempSession(user_id)

      // Update 2FA last used
      await supabase
        .from('two_factor_auth')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', user_id)

      return {
        success: true,
        data: loginResponse
      }

    } catch (error) {
      console.error('Verify 2FA error:', error)
      return {
        success: false,
        message: 'Erro ao verificar 2FA'
      }
    }
  }

  async enableTwoFactor(userId: string, method: TwoFactorMethod, verificationCode: string): Promise<AuthResponse> {
    try {
      // Get 2FA data
      const twoFactorData = await this.getTwoFactorAuth(userId)
      if (!twoFactorData) {
        return {
          success: false,
          message: '2FA não configurado'
        }
      }

      // Verify code
      let isValid = false
      if (method === TwoFactorMethod.TOTP) {
        isValid = this.verifyTOTPCode(twoFactorData.secret!, verificationCode)
      } else if (method === TwoFactorMethod.SMS) {
        isValid = await this.verifySMSCode(userId, verificationCode)
      }

      if (!isValid) {
        return {
          success: false,
          message: 'Código de verificação inválido'
        }
      }

      // Enable 2FA
      const { error } = await supabase
        .from('two_factor_auth')
        .update({
          is_enabled: true,
          is_verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        return {
          success: false,
          message: 'Erro ao habilitar 2FA'
        }
      }

      // Update user
      await supabase
        .from('users')
        .update({ two_factor_enabled: true })
        .eq('id', userId)

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        type: SecurityEventType.TWO_FACTOR_ENABLED,
        description: `2FA habilitado (${method})`,
        ip_address: '',
        user_agent: '',
        device_info: {} as DeviceInfo,
        risk_score: RISK_SCORES.LOW
      })

      return {
        success: true,
        message: '2FA habilitado com sucesso'
      }

    } catch (error) {
      console.error('Enable 2FA error:', error)
      return {
        success: false,
        message: 'Erro ao habilitar 2FA'
      }
    }
  }

  async disableTwoFactor(userId: string, password: string): Promise<AuthResponse> {
    try {
      // Verify password
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (!userData) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        }
      }

      // Verify password by attempting sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password
      })

      if (authError) {
        return {
          success: false,
          message: 'Senha incorreta'
        }
      }

      // Disable 2FA
      const { error } = await supabase
        .from('two_factor_auth')
        .update({
          is_enabled: false,
          is_verified: false
        })
        .eq('user_id', userId)

      if (error) {
        return {
          success: false,
          message: 'Erro ao desabilitar 2FA'
        }
      }

      // Update user
      await supabase
        .from('users')
        .update({ two_factor_enabled: false })
        .eq('id', userId)

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        type: SecurityEventType.TWO_FACTOR_DISABLED,
        description: '2FA desabilitado',
        ip_address: '',
        user_agent: '',
        device_info: {} as DeviceInfo,
        risk_score: RISK_SCORES.MEDIUM
      })

      return {
        success: true,
        message: '2FA desabilitado com sucesso'
      }

    } catch (error) {
      console.error('Disable 2FA error:', error)
      return {
        success: false,
        message: 'Erro ao desabilitar 2FA'
      }
    }
  }

  // Backup Codes
  async generateNewBackupCodes(userId: string): Promise<AuthResponse<string[]>> {
    try {
      const backupCodes = this.generateBackupCodes()

      const { error } = await supabase
        .from('two_factor_auth')
        .update({ backup_codes: backupCodes })
        .eq('user_id', userId)

      if (error) {
        return {
          success: false,
          message: 'Erro ao gerar códigos de backup'
        }
      }

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        type: SecurityEventType.BACKUP_CODES_GENERATED,
        description: 'Novos códigos de backup gerados',
        ip_address: '',
        user_agent: '',
        device_info: {} as DeviceInfo,
        risk_score: RISK_SCORES.LOW
      })

      return {
        success: true,
        data: backupCodes,
        message: 'Códigos de backup gerados com sucesso'
      }

    } catch (error) {
      console.error('Generate backup codes error:', error)
      return {
        success: false,
        message: 'Erro ao gerar códigos de backup'
      }
    }
  }

  // Password Management
  async changePassword(userId: string, data: PasswordChange): Promise<AuthResponse> {
    try {
      const { current_password, new_password, confirm_password } = data

      if (new_password !== confirm_password) {
        return {
          success: false,
          errors: { confirm_password: ['Senhas não coincidem'] }
        }
      }

      if (!isPasswordStrong(new_password)) {
        return {
          success: false,
          errors: { new_password: ['Senha não atende aos requisitos de segurança'] }
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: new_password
      })

      if (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error)
        }
      }

      // Update user record
      await supabase
        .from('users')
        .update({
          'security_settings.password_changed_at': new Date().toISOString()
        })
        .eq('id', userId)

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        type: SecurityEventType.PASSWORD_CHANGED,
        description: 'Senha alterada',
        ip_address: '',
        user_agent: '',
        device_info: {} as DeviceInfo,
        risk_score: RISK_SCORES.LOW
      })

      return {
        success: true,
        message: 'Senha alterada com sucesso'
      }

    } catch (error) {
      console.error('Change password error:', error)
      return {
        success: false,
        message: 'Erro ao alterar senha'
      }
    }
  }

  async resetPassword(data: PasswordReset): Promise<AuthResponse> {
    try {
      const { email, token, new_password, confirm_password } = data

      if (new_password !== confirm_password) {
        return {
          success: false,
          errors: { confirm_password: ['Senhas não coincidem'] }
        }
      }

      if (!isPasswordStrong(new_password)) {
        return {
          success: false,
          errors: { new_password: ['Senha não atende aos requisitos de segurança'] }
        }
      }

      // Reset password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: new_password
      })

      if (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error)
        }
      }

      return {
        success: true,
        message: 'Senha redefinida com sucesso'
      }

    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        message: 'Erro ao redefinir senha'
      }
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error)
        }
      }

      return {
        success: true,
        message: 'Email de redefinição de senha enviado'
      }

    } catch (error) {
      console.error('Request password reset error:', error)
      return {
        success: false,
        message: 'Erro ao solicitar redefinição de senha'
      }
    }
  }

  // Session Management
  async getSessions(userId: string, page = 1, limit = 10): Promise<PaginatedSessions> {
    try {
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('last_activity_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return {
        sessions: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit
      }

    } catch (error) {
      console.error('Get sessions error:', error)
      return {
        sessions: [],
        total: 0,
        page,
        limit,
        has_more: false
      }
    }
  }

  async revokeSession(userId: string, sessionId: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('id', sessionId)

      if (error) {
        return {
          success: false,
          message: 'Erro ao revogar sessão'
        }
      }

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        type: SecurityEventType.SESSION_REVOKED,
        description: 'Sessão revogada',
        ip_address: '',
        user_agent: '',
        device_info: {} as DeviceInfo,
        risk_score: RISK_SCORES.LOW
      })

      return {
        success: true,
        message: 'Sessão revogada com sucesso'
      }

    } catch (error) {
      console.error('Revoke session error:', error)
      return {
        success: false,
        message: 'Erro ao revogar sessão'
      }
    }
  }

  async revokeAllSessions(userId: string, exceptCurrent = true): Promise<AuthResponse> {
    try {
      let query = supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId)

      if (exceptCurrent) {
        query = query.eq('is_current', false)
      }

      const { error } = await query

      if (error) {
        return {
          success: false,
          message: 'Erro ao revogar sessões'
        }
      }

      return {
        success: true,
        message: 'Sessões revogadas com sucesso'
      }

    } catch (error) {
      console.error('Revoke all sessions error:', error)
      return {
        success: false,
        message: 'Erro ao revogar sessões'
      }
    }
  }

  // Security Events
  async getSecurityEvents(
    userId: string,
    filter: SecurityEventFilter = {},
    sort: SecurityEventSort = { field: 'created_at', direction: 'desc' },
    page = 1,
    limit = 20
  ): Promise<PaginatedSecurityEvents> {
    try {
      const offset = (page - 1) * limit
      let query = supabase
        .from('security_events')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Apply filters
      if (filter.type) {
        if (Array.isArray(filter.type)) {
          query = query.in('type', filter.type)
        } else {
          query = query.eq('type', filter.type)
        }
      }

      if (filter.risk_score_min !== undefined) {
        query = query.gte('risk_score', filter.risk_score_min)
      }

      if (filter.risk_score_max !== undefined) {
        query = query.lte('risk_score', filter.risk_score_max)
      }

      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from)
      }

      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to)
      }

      if (filter.ip_address) {
        query = query.eq('ip_address', filter.ip_address)
      }

      if (filter.search) {
        query = query.or(`description.ilike.%${filter.search}%,ip_address.ilike.%${filter.search}%`)
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return {
        events: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit
      }

    } catch (error) {
      console.error('Get security events error:', error)
      return {
        events: [],
        total: 0,
        page,
        limit,
        has_more: false
      }
    }
  }

  // Statistics
  async getAuthStats(): Promise<AuthStats> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get basic user stats
      const { data: userStats } = await supabase
        .from('users')
        .select('is_active, email_verified, two_factor_enabled, created_at')

      const totalUsers = userStats?.length || 0
      const activeUsers = userStats?.filter(u => u.is_active).length || 0
      const verifiedUsers = userStats?.filter(u => u.email_verified).length || 0
      const twoFactorUsers = userStats?.filter(u => u.two_factor_enabled).length || 0
      const newRegistrationsToday = userStats?.filter(u => u.created_at.startsWith(today)).length || 0

      // Get security events stats
      const { data: securityEvents } = await supabase
        .from('security_events')
        .select('type, created_at')
        .gte('created_at', today)

      const failedLoginsToday = securityEvents?.filter(e => e.type === SecurityEventType.LOGIN_FAILED).length || 0
      const successfulLoginsToday = securityEvents?.filter(e => e.type === SecurityEventType.LOGIN_SUCCESS).length || 0
      const securityEventsToday = securityEvents?.length || 0

      // Get locked accounts
      const { data: lockedAccounts } = await supabase
        .from('users')
        .select('id')
        .not('security_settings->account_locked_until', 'is', null)

      const lockedAccountsCount = lockedAccounts?.length || 0

      // Get most used 2FA method
      const { data: twoFactorMethods } = await supabase
        .from('two_factor_auth')
        .select('method')
        .eq('is_enabled', true)

      const methodCounts = twoFactorMethods?.reduce((acc, item) => {
        acc[item.method] = (acc[item.method] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const mostUsed2FAMethod = Object.keys(methodCounts).reduce((a, b) => 
        methodCounts[a] > methodCounts[b] ? a : b, TwoFactorMethod.TOTP
      ) as TwoFactorMethod

      const loginSuccessRate = successfulLoginsToday + failedLoginsToday > 0 
        ? (successfulLoginsToday / (successfulLoginsToday + failedLoginsToday)) * 100 
        : 100

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        verified_users: verifiedUsers,
        two_factor_users: twoFactorUsers,
        failed_logins_today: failedLoginsToday,
        successful_logins_today: successfulLoginsToday,
        locked_accounts: lockedAccountsCount,
        new_registrations_today: newRegistrationsToday,
        average_session_duration: 0, // TODO: Calculate from session data
        most_used_2fa_method: mostUsed2FAMethod,
        login_success_rate: loginSuccessRate,
        security_events_today: securityEventsToday
      }

    } catch (error) {
      console.error('Get auth stats error:', error)
      return {
        total_users: 0,
        active_users: 0,
        verified_users: 0,
        two_factor_users: 0,
        failed_logins_today: 0,
        successful_logins_today: 0,
        locked_accounts: 0,
        new_registrations_today: 0,
        average_session_duration: 0,
        most_used_2fa_method: TwoFactorMethod.TOTP,
        login_success_rate: 100,
        security_events_today: 0
      }
    }
  }

  async getSecurityStats(): Promise<SecurityStats> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: events } = await supabase
        .from('security_events')
        .select('risk_score, type, created_at')
        .gte('created_at', today)

      const highRiskEvents = events?.filter(e => e.risk_score >= RISK_SCORES.HIGH).length || 0
      const mediumRiskEvents = events?.filter(e => e.risk_score >= RISK_SCORES.MEDIUM && e.risk_score < RISK_SCORES.HIGH).length || 0
      const lowRiskEvents = events?.filter(e => e.risk_score < RISK_SCORES.MEDIUM).length || 0
      const suspiciousActivities = events?.filter(e => e.type === SecurityEventType.SUSPICIOUS_ACTIVITY).length || 0
      const passwordChangesToday = events?.filter(e => e.type === SecurityEventType.PASSWORD_CHANGED).length || 0
      const twoFactorSetupsToday = events?.filter(e => e.type === SecurityEventType.TWO_FACTOR_ENABLED).length || 0
      const accountLockoutsToday = events?.filter(e => e.type === SecurityEventType.ACCOUNT_LOCKED).length || 0

      // Get trusted devices count
      const { data: trustedDevices } = await supabase
        .from('users')
        .select('security_settings')

      const trustedDevicesCount = trustedDevices?.reduce((acc, user) => {
        const devices = user.security_settings?.trusted_devices || []
        return acc + devices.length
      }, 0) || 0

      // Get active sessions count
      const { data: activeSessions } = await supabase
        .from('active_sessions')
        .select('id')

      const activeSessionsCount = activeSessions?.length || 0

      return {
        high_risk_events: highRiskEvents,
        medium_risk_events: mediumRiskEvents,
        low_risk_events: lowRiskEvents,
        blocked_attempts: 0, // TODO: Implement blocked attempts tracking
        suspicious_activities: suspiciousActivities,
        trusted_devices: trustedDevicesCount,
        active_sessions: activeSessionsCount,
        password_changes_today: passwordChangesToday,
        two_factor_setups_today: twoFactorSetupsToday,
        account_lockouts_today: accountLockoutsToday
      }

    } catch (error) {
      console.error('Get security stats error:', error)
      return {
        high_risk_events: 0,
        medium_risk_events: 0,
        low_risk_events: 0,
        blocked_attempts: 0,
        suspicious_activities: 0,
        trusted_devices: 0,
        active_sessions: 0,
        password_changes_today: 0,
        two_factor_setups_today: 0,
        account_lockouts_today: 0
      }
    }
  }

  // Private Helper Methods
  private async getTwoFactorAuth(userId: string): Promise<TwoFactorAuth | null> {
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return null
      }

      return data
    } catch (error) {
      return null
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < SECURITY_SETTINGS.BACKUP_CODES_COUNT; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`
      codes.push(formattedCode)
    }
    return codes
  }

  private verifyTOTPCode(secret: string, code: string): boolean {
    try {
      return authenticator.verify({ token: code, secret })
    } catch (error) {
      return false
    }
  }

  private async verifySMSCode(userId: string, code: string): Promise<boolean> {
    // TODO: Implement SMS code verification
    // This would typically involve checking against a stored code in the database
    // that was sent via SMS service
    return false
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const { data: twoFactorData } = await supabase
        .from('two_factor_auth')
        .select('backup_codes')
        .eq('user_id', userId)
        .single()

      if (!twoFactorData?.backup_codes) {
        return false
      }

      const isValid = twoFactorData.backup_codes.includes(code)
      if (isValid) {
        // Remove used backup code
        const updatedCodes = twoFactorData.backup_codes.filter((c: string) => c !== code)
        await supabase
          .from('two_factor_auth')
          .update({ backup_codes: updatedCodes })
          .eq('user_id', userId)

        // Log usage
        await this.logSecurityEvent({
          user_id: userId,
          type: SecurityEventType.BACKUP_CODE_USED,
          description: 'Código de backup usado',
          ip_address: '',
          user_agent: '',
          device_info: {} as DeviceInfo,
          risk_score: RISK_SCORES.MEDIUM
        })
      }

      return isValid
    } catch (error) {
      return false
    }
  }

  private async checkAccountLockStatus(email: string): Promise<{ isLocked: boolean; lockedUntil?: string; userId?: string }> {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, security_settings')
        .eq('email', email)
        .single()

      if (!data) {
        return { isLocked: false }
      }

      const lockedUntil = data.security_settings?.account_locked_until
      if (lockedUntil && new Date(lockedUntil) > new Date()) {
        return {
          isLocked: true,
          lockedUntil,
          userId: data.id
        }
      }

      return { isLocked: false, userId: data.id }
    } catch (error) {
      return { isLocked: false }
    }
  }

  private async handleFailedLogin(email: string, deviceInfo: DeviceInfo): Promise<void> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, security_settings')
        .eq('email', email)
        .single()

      if (!userData) return

      const failedAttempts = (userData.security_settings?.failed_login_attempts || 0) + 1
      const shouldLock = failedAttempts >= SECURITY_SETTINGS.MAX_LOGIN_ATTEMPTS

      const updates: any = {
        'security_settings.failed_login_attempts': failedAttempts
      }

      if (shouldLock) {
        const lockUntil = new Date(Date.now() + SECURITY_SETTINGS.LOCKOUT_DURATION * 1000)
        updates['security_settings.account_locked_until'] = lockUntil.toISOString()
      }

      await supabase
        .from('users')
        .update(updates)
        .eq('id', userData.id)

      // Log security event
      await this.logSecurityEvent({
        user_id: userData.id,
        type: shouldLock ? SecurityEventType.ACCOUNT_LOCKED : SecurityEventType.LOGIN_FAILED,
        description: shouldLock ? 'Conta bloqueada por tentativas excessivas' : 'Falha no login',
        ip_address: deviceInfo.ip_address || '',
        user_agent: deviceInfo.user_agent || '',
        device_info: deviceInfo,
        risk_score: shouldLock ? RISK_SCORES.HIGH : RISK_SCORES.MEDIUM
      })
    } catch (error) {
      console.error('Handle failed login error:', error)
    }
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({
          'security_settings.failed_login_attempts': 0,
          'security_settings.account_locked_until': null
        })
        .eq('id', userId)
    } catch (error) {
      console.error('Reset failed login attempts error:', error)
    }
  }

  private async completeLogin(
    userData: User,
    session: any,
    deviceInfo: DeviceInfo,
    rememberMe = false,
    trustDevice = false
  ): Promise<LoginResponse> {
    // Create session record
    const sessionData = {
      id: crypto.randomUUID(),
      user_id: userData.id,
      device_name: deviceInfo.device_name,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip_address: deviceInfo.ip_address || '',
      location: deviceInfo.location,
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      is_current: true
    }

    await supabase
      .from('active_sessions')
      .insert(sessionData)

    // Add trusted device if requested
    if (trustDevice) {
      await this.addTrustedDevice(userData.id, deviceInfo)
    }

    // Log successful login
    await this.logSecurityEvent({
      user_id: userData.id,
      type: SecurityEventType.LOGIN_SUCCESS,
      description: 'Login realizado com sucesso',
      ip_address: deviceInfo.ip_address || '',
      user_agent: deviceInfo.user_agent || '',
      device_info: deviceInfo,
      risk_score: RISK_SCORES.LOW
    })

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userData.id)

    return {
      user: userData,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      requires_2fa: false,
      two_factor_methods: [],
      session_id: sessionData.id
    }
  }

  private async addTrustedDevice(userId: string, deviceInfo: DeviceInfo): Promise<void> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('security_settings')
        .eq('id', userId)
        .single()

      if (!userData) return

      const trustedDevices = userData.security_settings?.trusted_devices || []
      const newDevice: TrustedDevice = {
        id: crypto.randomUUID(),
        device_name: deviceInfo.device_name,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ip_address: deviceInfo.ip_address || '',
        location: deviceInfo.location,
        trusted_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        is_current: true
      }

      trustedDevices.push(newDevice)

      await supabase
        .from('users')
        .update({
          'security_settings.trusted_devices': trustedDevices
        })
        .eq('id', userId)

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        type: SecurityEventType.DEVICE_TRUSTED,
        description: 'Dispositivo adicionado como confiável',
        ip_address: deviceInfo.ip_address || '',
        user_agent: deviceInfo.user_agent || '',
        device_info: deviceInfo,
        risk_score: RISK_SCORES.LOW
      })
    } catch (error) {
      console.error('Add trusted device error:', error)
    }
  }

  private async storeTempSession(userId: string, token: string, deviceInfo: DeviceInfo): Promise<void> {
    try {
      await supabase
        .from('temp_sessions')
        .insert({
          user_id: userId,
          token,
          device_info: deviceInfo,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        })
    } catch (error) {
      console.error('Store temp session error:', error)
    }
  }

  private async getTempSession(userId: string): Promise<any> {
    try {
      const { data } = await supabase
        .from('temp_sessions')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .single()

      return data
    } catch (error) {
      return null
    }
  }

  private async clearTempSession(userId: string): Promise<void> {
    try {
      await supabase
        .from('temp_sessions')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error('Clear temp session error:', error)
    }
  }

  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at' | 'metadata'>): Promise<void> {
    try {
      await supabase
        .from('security_events')
        .insert({
          ...event,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          metadata: {}
        })
    } catch (error) {
      console.error('Log security event error:', error)
    }
  }
}