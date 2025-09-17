'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  Smartphone,
  Key,
  Eye,
  EyeOff,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Unlock,
  Monitor,
  MapPin,
  Calendar,
  Activity,
  Settings,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Bell,
  User,
  Mail,
  Phone,
  Globe,
  Clock,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  User as UserType,
  TwoFactorAuth,
  TwoFactorMethod,
  TwoFactorSetup,
  SecurityEvent,
  SecurityEventType,
  TrustedDevice,
  ActiveSession,
  AuthStats,
  SecurityStats,
  SecurityEventFilter,
  SecurityEventSort,
  formatTwoFactorMethod,
  formatSecurityEventType,
  getRiskScoreColor,
  getRiskScoreLabel,
  formatDeviceType,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  calculatePasswordStrength,
  SECURITY_SETTINGS
} from '@/types/auth'
import { AuthService } from '@/lib/services/auth'

const authService = new AuthService()

export default function SecurityPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [twoFactorAuth, setTwoFactorAuth] = useState<TwoFactorAuth | null>(null)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [authStats, setAuthStats] = useState<AuthStats | null>(null)
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // 2FA Setup States
  const [showSetup2FA, setShowSetup2FA] = useState(false)
  const [setup2FAMethod, setSetup2FAMethod] = useState<TwoFactorMethod>(TwoFactorMethod.TOTP)
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState<string[]>([])

  // Password Change States
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Filter States
  const [eventFilter, setEventFilter] = useState<SecurityEventFilter>({})
  const [eventSort, setEventSort] = useState<SecurityEventSort>({ field: 'created_at', direction: 'desc' })
  const [eventsPage, setEventsPage] = useState(1)
  const [sessionsPage, setSessionsPage] = useState(1)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword))
  }, [newPassword])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load user data, 2FA status, security events, etc.
      // This would typically come from your auth context or API
      
      // Mock data for demonstration
      const mockUser: UserType = {
        id: '1',
        email: 'user@example.com',
        full_name: 'João Silva',
        role: 'user' as any,
        is_active: true,
        email_verified: true,
        phone_verified: false,
        two_factor_enabled: false,
        backup_codes_generated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          theme: 'light',
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
      }

      setUser(mockUser)
      
      // Load stats
      const [authStatsData, securityStatsData] = await Promise.all([
        authService.getAuthStats(),
        authService.getSecurityStats()
      ])
      
      setAuthStats(authStatsData)
      setSecurityStats(securityStatsData)
      
    } catch (error) {
      console.error('Error loading security data:', error)
      toast.error('Erro ao carregar dados de segurança')
    } finally {
      setLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    try {
      if (!user) return
      
      const response = await authService.setupTwoFactor(user.id, setup2FAMethod)
      
      if (response.success && response.data) {
        setTwoFactorSetup(response.data)
        toast.success(response.message || '2FA configurado com sucesso')
      } else {
        toast.error(response.message || 'Erro ao configurar 2FA')
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      toast.error('Erro ao configurar 2FA')
    }
  }

  const handleEnable2FA = async () => {
    try {
      if (!user || !verificationCode) return
      
      const response = await authService.enableTwoFactor(user.id, setup2FAMethod, verificationCode)
      
      if (response.success) {
        setUser({ ...user, two_factor_enabled: true })
        setShowSetup2FA(false)
        setTwoFactorSetup(null)
        setVerificationCode('')
        toast.success('2FA habilitado com sucesso!')
        loadData()
      } else {
        toast.error(response.message || 'Código de verificação inválido')
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      toast.error('Erro ao habilitar 2FA')
    }
  }

  const handleDisable2FA = async () => {
    try {
      if (!user || !currentPassword) return
      
      const response = await authService.disableTwoFactor(user.id, currentPassword)
      
      if (response.success) {
        setUser({ ...user, two_factor_enabled: false })
        setCurrentPassword('')
        toast.success('2FA desabilitado com sucesso!')
        loadData()
      } else {
        toast.error(response.message || 'Senha incorreta')
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      toast.error('Erro ao desabilitar 2FA')
    }
  }

  const handleGenerateBackupCodes = async () => {
    try {
      if (!user) return
      
      const response = await authService.generateNewBackupCodes(user.id)
      
      if (response.success && response.data) {
        setBackupCodes(response.data)
        setShowBackupCodes(true)
        toast.success('Códigos de backup gerados com sucesso!')
      } else {
        toast.error(response.message || 'Erro ao gerar códigos de backup')
      }
    } catch (error) {
      console.error('Error generating backup codes:', error)
      toast.error('Erro ao gerar códigos de backup')
    }
  }

  const handleChangePassword = async () => {
    try {
      if (!user) return
      
      if (newPassword !== confirmPassword) {
        toast.error('As senhas não coincidem')
        return
      }
      
      const response = await authService.changePassword(user.id, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
      
      if (response.success) {
        setShowPasswordChange(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast.success('Senha alterada com sucesso!')
      } else {
        toast.error(response.message || 'Erro ao alterar senha')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Erro ao alterar senha')
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      if (!user) return
      
      const response = await authService.revokeSession(user.id, sessionId)
      
      if (response.success) {
        toast.success('Sessão revogada com sucesso!')
        loadData()
      } else {
        toast.error(response.message || 'Erro ao revogar sessão')
      }
    } catch (error) {
      console.error('Error revoking session:', error)
      toast.error('Erro ao revogar sessão')
    }
  }

  const handleRevokeAllSessions = async () => {
    try {
      if (!user) return
      
      const response = await authService.revokeAllSessions(user.id, true)
      
      if (response.success) {
        toast.success('Todas as sessões foram revogadas!')
        loadData()
      } else {
        toast.error(response.message || 'Erro ao revogar sessões')
      }
    } catch (error) {
      console.error('Error revoking all sessions:', error)
      toast.error('Erro ao revogar sessões')
    }
  }

  const copyToClipboard = async (text: string, codeIndex?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      if (codeIndex !== undefined) {
        setCopiedCodes([...copiedCodes, text])
        setTimeout(() => {
          setCopiedCodes(prev => prev.filter(code => code !== text))
        }, 2000)
      }
      toast.success('Copiado para a área de transferência!')
    } catch (error) {
      toast.error('Erro ao copiar')
    }
  }

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segurança</h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações de segurança e autenticação
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="2fa">Autenticação 2FA</TabsTrigger>
          <TabsTrigger value="password">Senha</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status 2FA</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {user?.two_factor_enabled ? (
                    <>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Lock className="h-3 w-3 mr-1" />
                        Habilitado
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge variant="destructive">
                        <Unlock className="h-3 w-3 mr-1" />
                        Desabilitado
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeSessions.length === 1 ? 'sessão ativa' : 'sessões ativas'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dispositivos Confiáveis</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trustedDevices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {trustedDevices.length === 1 ? 'dispositivo' : 'dispositivos'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityStats?.high_risk_events || 0}</div>
                <p className="text-xs text-muted-foreground">
                  eventos de segurança
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações de Segurança</CardTitle>
              <CardDescription>
                Melhore a segurança da sua conta seguindo estas recomendações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user?.two_factor_enabled && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Habilite a autenticação de dois fatores para maior segurança</span>
                      <Button size="sm" onClick={() => setShowSetup2FA(true)}>
                        Configurar 2FA
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {!user?.email_verified && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Verifique seu endereço de email</span>
                      <Button size="sm" variant="outline">
                        Reenviar Email
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {activeSessions.length > 3 && (
                <Alert>
                  <Monitor className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Você tem muitas sessões ativas. Considere revogar sessões antigas.</span>
                      <Button size="sm" variant="outline" onClick={handleRevokeAllSessions}>
                        Revogar Sessões
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recentes</CardTitle>
              <CardDescription>
                Últimas atividades de segurança na sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${getRiskScoreColor(event.risk_score)}`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {formatSecurityEventType(event.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.description} • {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className={getRiskScoreColor(event.risk_score)}>
                      {getRiskScoreLabel(event.risk_score)}
                    </Badge>
                  </div>
                ))}
                
                {securityEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum evento de segurança registrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2fa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
              <CardDescription>
                Adicione uma camada extra de segurança à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Status do 2FA</h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.two_factor_enabled 
                      ? 'A autenticação de dois fatores está habilitada' 
                      : 'A autenticação de dois fatores está desabilitada'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {user?.two_factor_enabled ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Lock className="h-3 w-3 mr-1" />
                      Habilitado
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <Unlock className="h-3 w-3 mr-1" />
                      Desabilitado
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {user?.two_factor_enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Método Configurado</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatTwoFactorMethod(twoFactorAuth?.method || TwoFactorMethod.TOTP)}
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleGenerateBackupCodes}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Gerar Códigos de Backup
                    </Button>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Para desabilitar o 2FA, você precisará confirmar sua senha atual.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-4">
                    <Input
                      type="password"
                      placeholder="Senha atual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button 
                      variant="destructive" 
                      onClick={handleDisable2FA}
                      disabled={!currentPassword}
                    >
                      Desabilitar 2FA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure a autenticação de dois fatores para proteger sua conta com uma camada adicional de segurança.
                  </p>
                  
                  <Button onClick={() => setShowSetup2FA(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Configurar 2FA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Senha</CardTitle>
              <CardDescription>
                Altere sua senha e gerencie configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Última alteração</h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.security_settings.password_changed_at 
                      ? format(new Date(user.security_settings.password_changed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : 'Nunca alterada'
                    }
                  </p>
                </div>
                <Button onClick={() => setShowPasswordChange(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Requisitos de Senha</h3>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Mínimo de {SECURITY_SETTINGS.PASSWORD_HISTORY_COUNT} caracteres</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Pelo menos uma letra maiúscula</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Pelo menos uma letra minúscula</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Pelo menos um número</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Pelo menos um caractere especial</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>
                Gerencie suas sessões ativas e dispositivos conectados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {activeSessions.length} {activeSessions.length === 1 ? 'sessão ativa' : 'sessões ativas'}
                </p>
                <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                  Revogar Todas
                </Button>
              </div>

              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Monitor className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{session.device_name}</p>
                          {session.is_current && (
                            <Badge variant="default" className="text-xs">
                              Atual
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{session.browser} • {session.os}</span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {session.location || session.ip_address}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(session.last_activity_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revogar
                      </Button>
                    )}
                  </div>
                ))}

                {activeSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma sessão ativa encontrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança</CardTitle>
              <CardDescription>
                Histórico completo de eventos de segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <Select value={eventFilter.type as string} onValueChange={(value) => setEventFilter({ ...eventFilter, type: value as SecurityEventType })}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value={SecurityEventType.LOGIN_SUCCESS}>Login realizado</SelectItem>
                    <SelectItem value={SecurityEventType.LOGIN_FAILED}>Falha no login</SelectItem>
                    <SelectItem value={SecurityEventType.PASSWORD_CHANGED}>Senha alterada</SelectItem>
                    <SelectItem value={SecurityEventType.TWO_FACTOR_ENABLED}>2FA habilitado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={eventSort.field} onValueChange={(value) => setEventSort({ ...eventSort, field: value as any })}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Data</SelectItem>
                    <SelectItem value="risk_score">Nível de risco</SelectItem>
                    <SelectItem value="type">Tipo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Events List */}
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getRiskScoreColor(event.risk_score)}`} />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{formatSecurityEventType(event.type)}</p>
                          <Badge variant="outline" className={getRiskScoreColor(event.risk_score)}>
                            {getRiskScoreLabel(event.risk_score)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location || event.ip_address}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {securityEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum evento de segurança encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={showSetup2FA} onOpenChange={setShowSetup2FA}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Autenticação 2FA</DialogTitle>
            <DialogDescription>
              Escolha um método de autenticação de dois fatores
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Método de Autenticação</Label>
              <Select value={setup2FAMethod} onValueChange={(value) => setSetup2FAMethod(value as TwoFactorMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TwoFactorMethod.TOTP}>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Aplicativo Autenticador</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={TwoFactorMethod.SMS}>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>SMS</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!twoFactorSetup ? (
              <Button onClick={handleSetup2FA} className="w-full">
                Configurar {formatTwoFactorMethod(setup2FAMethod)}
              </Button>
            ) : (
              <div className="space-y-4">
                {setup2FAMethod === TwoFactorMethod.TOTP && twoFactorSetup.qr_code_url && (
                  <div className="space-y-2">
                    <Label>Escaneie o QR Code</Label>
                    <div className="flex justify-center p-4 border rounded-lg">
                      <img src={twoFactorSetup.qr_code_url} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Use um aplicativo como Google Authenticator ou Authy
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Código de Verificação</Label>
                  <Input
                    type="text"
                    placeholder="Digite o código de 6 dígitos"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={handleEnable2FA} 
                  className="w-full"
                  disabled={verificationCode.length !== 6}
                >
                  Habilitar 2FA
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Códigos de Backup</DialogTitle>
            <DialogDescription>
              Guarde estes códigos em um local seguro. Cada código só pode ser usado uma vez.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="text-sm font-mono">{code}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(code, index)}
                  >
                    {copiedCodes.includes(code) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button onClick={downloadBackupCodes} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(backupCodes.join('\n'))} 
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Todos
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Mantenha estes códigos seguros e acessíveis. Você precisará deles se perder acesso ao seu método principal de 2FA.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite sua senha atual e escolha uma nova senha segura
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Senha Atual</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Força da senha:</span>
                    <span className={getPasswordStrengthColor(passwordStrength)}>
                      {getPasswordStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                  <Progress value={passwordStrength * 10} className="h-2" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600">As senhas não coincidem</p>
              )}
            </div>

            <Button 
              onClick={handleChangePassword} 
              className="w-full"
              disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              Alterar Senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}