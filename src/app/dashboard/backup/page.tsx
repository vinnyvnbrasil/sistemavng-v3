'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  HardDrive,
  Shield,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Calendar,
  Database,
  FileText,
  Users,
  Folder,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  BarChart3,
  Activity,
  Server,
  Zap,
  Archive,
  RotateCcw,
  Eye,
  Edit,
  Copy
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { BackupService } from '@/lib/services/backup'
import {
  Backup,
  BackupSchedule,
  RestoreJob,
  BackupType,
  BackupStatus,
  RestoreStatus,
  BackupFrequency,
  StorageProvider,
  BackupStats,
  RestoreStats,
  BackupHealth,
  CreateBackupData,
  CreateScheduleData,
  CreateRestoreJobData,
  BackupSettings,
  RestoreSettings,
  RetentionPolicy,
  HealthStatus,
  formatBackupSize
} from '@/types/backup'

interface BackupPageState {
  backups: Backup[]
  schedules: BackupSchedule[]
  restoreJobs: RestoreJob[]
  stats: BackupStats | null
  restoreStats: RestoreStats | null
  health: BackupHealth | null
  loading: boolean
  searchTerm: string
  selectedTab: string
  showCreateBackup: boolean
  showCreateSchedule: boolean
  showCreateRestore: boolean
  selectedBackup: Backup | null
  selectedSchedule: BackupSchedule | null
  selectedRestore: RestoreJob | null
}

const getStatusColor = (status: BackupStatus | RestoreStatus) => {
  switch (status) {
    case BackupStatus.COMPLETED:
    case RestoreStatus.COMPLETED:
      return 'bg-green-100 text-green-800'
    case BackupStatus.RUNNING:
    case RestoreStatus.RUNNING:
      return 'bg-blue-100 text-blue-800'
    case BackupStatus.FAILED:
    case RestoreStatus.FAILED:
      return 'bg-red-100 text-red-800'
    case BackupStatus.PENDING:
    case RestoreStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: BackupStatus | RestoreStatus) => {
  switch (status) {
    case BackupStatus.COMPLETED:
    case RestoreStatus.COMPLETED:
      return <CheckCircle className="h-4 w-4" />
    case BackupStatus.RUNNING:
    case RestoreStatus.RUNNING:
      return <RefreshCw className="h-4 w-4 animate-spin" />
    case BackupStatus.FAILED:
    case RestoreStatus.FAILED:
      return <XCircle className="h-4 w-4" />
    case BackupStatus.PENDING:
    case RestoreStatus.PENDING:
      return <Clock className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

const getHealthStatusColor = (status: HealthStatus) => {
  switch (status) {
    case HealthStatus.HEALTHY:
      return 'text-green-600'
    case HealthStatus.WARNING:
      return 'text-yellow-600'
    case HealthStatus.CRITICAL:
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export default function BackupPage() {
  const [state, setState] = useState<BackupPageState>({
    backups: [],
    schedules: [],
    restoreJobs: [],
    stats: null,
    restoreStats: null,
    health: null,
    loading: true,
    searchTerm: '',
    selectedTab: 'overview',
    showCreateBackup: false,
    showCreateSchedule: false,
    showCreateRestore: false,
    selectedBackup: null,
    selectedSchedule: null,
    selectedRestore: null
  })

  const [createBackupForm, setCreateBackupForm] = useState<CreateBackupData>({
    name: '',
    description: '',
    type: BackupType.FULL,
    settings: {
      storage_provider: StorageProvider.LOCAL,
      encryption_enabled: true,
      compression_level: 'medium',
      include_patterns: ['**/*'],
      exclude_patterns: ['**/node_modules/**', '**/.git/**'],
      max_file_size: 100 * 1024 * 1024, // 100MB
      follow_symlinks: false,
      preserve_permissions: true,
      verify_integrity: true
    },
    tags: [],
    expires_at: undefined
  })

  const [createScheduleForm, setCreateScheduleForm] = useState<CreateScheduleData>({
    name: '',
    description: '',
    type: BackupType.INCREMENTAL,
    frequency: BackupFrequency.DAILY,
    cron_expression: '0 2 * * *', // 2 AM daily
    settings: {
      storage_provider: StorageProvider.LOCAL,
      encryption_enabled: true,
      compression_level: 'medium',
      include_patterns: ['**/*'],
      exclude_patterns: ['**/node_modules/**', '**/.git/**'],
      max_file_size: 100 * 1024 * 1024,
      follow_symlinks: false,
      preserve_permissions: true,
      verify_integrity: true
    },
    retention_policy: {
      keep_daily: 7,
      keep_weekly: 4,
      keep_monthly: 12,
      keep_yearly: 5,
      auto_delete_expired: true
    },
    notification_settings: {
      notify_on_success: false,
      notify_on_failure: true,
      notify_on_warning: true,
      email_recipients: [],
      webhook_url: undefined
    },
    tags: []
  })

  const [createRestoreForm, setCreateRestoreForm] = useState<CreateRestoreJobData>({
    name: '',
    description: '',
    backup_id: '',
    type: 'full' as any,
    target_location: '',
    settings: {
      overwrite_existing: false,
      preserve_permissions: true,
      verify_integrity: true,
      restore_metadata: true,
      exclude_patterns: [],
      dry_run: false
    },
    is_test_restore: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const [backupsResult, schedulesResult, restoreJobsResult, stats, restoreStats, health] = await Promise.all([
        BackupService.getBackups(),
        BackupService.getSchedules(),
        BackupService.getRestoreJobs(),
        BackupService.getBackupStats(),
        BackupService.getRestoreStats(),
        BackupService.getBackupHealth()
      ])

      setState(prev => ({
        ...prev,
        backups: backupsResult.backups,
        schedules: schedulesResult.schedules,
        restoreJobs: restoreJobsResult.restore_jobs,
        stats,
        restoreStats,
        health,
        loading: false
      }))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do backup')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleCreateBackup = async () => {
    try {
      await BackupService.createBackup(createBackupForm, 'current-user-id')
      toast.success('Backup iniciado com sucesso')
      setState(prev => ({ ...prev, showCreateBackup: false }))
      setCreateBackupForm({
        name: '',
        description: '',
        type: BackupType.FULL,
        settings: {
          storage_provider: StorageProvider.LOCAL,
          encryption_enabled: true,
          compression_level: 'medium',
          include_patterns: ['**/*'],
          exclude_patterns: ['**/node_modules/**', '**/.git/**'],
          max_file_size: 100 * 1024 * 1024,
          follow_symlinks: false,
          preserve_permissions: true,
          verify_integrity: true
        },
        tags: [],
        expires_at: undefined
      })
      loadData()
    } catch (error) {
      console.error('Erro ao criar backup:', error)
      toast.error('Erro ao criar backup')
    }
  }

  const handleCreateSchedule = async () => {
    try {
      await BackupService.createSchedule(createScheduleForm, 'current-user-id')
      toast.success('Agendamento criado com sucesso')
      setState(prev => ({ ...prev, showCreateSchedule: false }))
      loadData()
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      toast.error('Erro ao criar agendamento')
    }
  }

  const handleCreateRestore = async () => {
    try {
      await BackupService.createRestoreJob(createRestoreForm, 'current-user-id')
      toast.success('Restauração iniciada com sucesso')
      setState(prev => ({ ...prev, showCreateRestore: false }))
      loadData()
    } catch (error) {
      console.error('Erro ao criar restauração:', error)
      toast.error('Erro ao criar restauração')
    }
  }

  const handleDeleteBackup = async (backup: Backup) => {
    try {
      await BackupService.deleteBackup(backup.id)
      toast.success('Backup excluído com sucesso')
      loadData()
    } catch (error) {
      console.error('Erro ao excluir backup:', error)
      toast.error('Erro ao excluir backup')
    }
  }

  const filteredBackups = state.backups.filter(backup =>
    backup.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    backup.description?.toLowerCase().includes(state.searchTerm.toLowerCase())
  )

  const filteredSchedules = state.schedules.filter(schedule =>
    schedule.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    schedule.description?.toLowerCase().includes(state.searchTerm.toLowerCase())
  )

  const filteredRestoreJobs = state.restoreJobs.filter(job =>
    job.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(state.searchTerm.toLowerCase())
  )

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup e Recuperação</h1>
          <p className="text-muted-foreground">
            Gerencie backups, agendamentos e restaurações do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setState(prev => ({ ...prev, showCreateBackup: true }))}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Backup
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {state.health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status do Sistema
              <Badge className={getHealthStatusColor(state.health.overall_status)}>
                {state.health.overall_status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Último Backup</p>
                <p className="text-2xl font-bold">
                  {state.health.last_successful_backup
                    ? formatDistanceToNow(new Date(state.health.last_successful_backup), {
                        addSuffix: true,
                        locale: ptBR
                      })
                    : 'Nunca'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Backups Falharam</p>
                <p className="text-2xl font-bold text-red-600">
                  {state.health.failed_backups_count}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Conformidade</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Retenção e Criptografia</span>
                </div>
              </div>
            </div>
            {state.health.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Recomendações:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {state.health.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {state.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.stats.total_backups}</div>
              <p className="text-xs text-muted-foreground">
                {state.stats.successful_backups} bem-sucedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Espaço Utilizado</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBackupSize(state.stats.total_size)}</div>
              <p className="text-xs text-muted-foreground">
                {state.stats.compression_savings}% economia com compressão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(state.stats.average_backup_time / 60)}min
              </div>
              <p className="text-xs text-muted-foreground">
                Por backup completo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Backup</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {state.stats.next_scheduled_backup
                  ? formatDistanceToNow(new Date(state.stats.next_scheduled_backup), {
                      locale: ptBR
                    })
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Agendamento automático
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar backups, agendamentos..."
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={state.selectedTab} onValueChange={(value) => setState(prev => ({ ...prev, selectedTab: value }))}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
          <TabsTrigger value="restores">Restaurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Backups */}
            <Card>
              <CardHeader>
                <CardTitle>Backups Recentes</CardTitle>
                <CardDescription>Últimos backups executados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.backups.slice(0, 5).map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(backup.status)}
                        <div>
                          <p className="font-medium">{backup.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {backup.formatted_size} • {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(backup.status)}>
                        {backup.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Storage Health */}
            <Card>
              <CardHeader>
                <CardTitle>Saúde do Armazenamento</CardTitle>
                <CardDescription>Status dos provedores de armazenamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {state.health?.storage_health.map((storage, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{storage.provider}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatBackupSize(storage.used_space)} utilizados
                          </p>
                        </div>
                      </div>
                      <Badge className={getHealthStatusColor(storage.status)}>
                        {storage.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Backups ({filteredBackups.length})</h3>
            <Button onClick={() => setState(prev => ({ ...prev, showCreateBackup: true }))}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Backup
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredBackups.map((backup) => (
              <Card key={backup.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(backup.status)}
                      <div>
                        <h4 className="font-medium">{backup.name}</h4>
                        <p className="text-sm text-muted-foreground">{backup.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{backup.type}</span>
                          <span>{backup.formatted_size}</span>
                          <span>{format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                          {backup.creator_name && <span>por {backup.creator_name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(backup.status)}>
                        {backup.status}
                      </Badge>
                      {backup.status === BackupStatus.RUNNING && backup.progress_percentage !== undefined && (
                        <div className="w-24">
                          <Progress value={backup.progress_percentage} className="h-2" />
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setState(prev => ({ ...prev, selectedBackup: backup, showCreateRestore: true }))}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteBackup(backup)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Agendamentos ({filteredSchedules.length})</h3>
            <Button onClick={() => setState(prev => ({ ...prev, showCreateSchedule: true }))}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">{schedule.name}</h4>
                        <p className="text-sm text-muted-foreground">{schedule.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{schedule.frequency}</span>
                          <span>{schedule.type}</span>
                          {schedule.next_run_at && (
                            <span>
                              Próximo: {format(new Date(schedule.next_run_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.is_enabled ? 'default' : 'secondary'}>
                        {schedule.is_enabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Executar Agora
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {schedule.is_enabled ? (
                              <><Pause className="h-4 w-4 mr-2" />Pausar</>
                            ) : (
                              <><Play className="h-4 w-4 mr-2" />Ativar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="restores" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Restaurações ({filteredRestoreJobs.length})</h3>
            <Button onClick={() => setState(prev => ({ ...prev, showCreateRestore: true }))}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Restauração
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredRestoreJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="font-medium">{job.name}</h4>
                        <p className="text-sm text-muted-foreground">{job.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Backup: {job.backup_name}</span>
                          <span>{job.type}</span>
                          <span>{format(new Date(job.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                          {job.is_test_restore && <Badge variant="outline">Teste</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      {job.status === RestoreStatus.RUNNING && job.progress_percentage !== undefined && (
                        <div className="w-24">
                          <Progress value={job.progress_percentage} className="h-2" />
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          {job.rollback_available && (
                            <DropdownMenuItem>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reverter
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={state.showCreateBackup} onOpenChange={(open) => setState(prev => ({ ...prev, showCreateBackup: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Backup</DialogTitle>
            <DialogDescription>
              Configure um novo backup do sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backup-name">Nome</Label>
                <Input
                  id="backup-name"
                  value={createBackupForm.name}
                  onChange={(e) => setCreateBackupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do backup"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-type">Tipo</Label>
                <Select
                  value={createBackupForm.type}
                  onValueChange={(value) => setCreateBackupForm(prev => ({ ...prev, type: value as BackupType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BackupType.FULL}>Completo</SelectItem>
                    <SelectItem value={BackupType.INCREMENTAL}>Incremental</SelectItem>
                    <SelectItem value={BackupType.DIFFERENTIAL}>Diferencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-description">Descrição</Label>
              <Textarea
                id="backup-description"
                value={createBackupForm.description}
                onChange={(e) => setCreateBackupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do backup"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provedor de Armazenamento</Label>
                <Select
                  value={createBackupForm.settings.storage_provider}
                  onValueChange={(value) => setCreateBackupForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, storage_provider: value as StorageProvider }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StorageProvider.LOCAL}>Local</SelectItem>
                    <SelectItem value={StorageProvider.AWS_S3}>AWS S3</SelectItem>
                    <SelectItem value={StorageProvider.GOOGLE_CLOUD}>Google Cloud</SelectItem>
                    <SelectItem value={StorageProvider.AZURE_BLOB}>Azure Blob</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de Compressão</Label>
                <Select
                  value={createBackupForm.settings.compression_level}
                  onValueChange={(value) => setCreateBackupForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, compression_level: value as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="encryption"
                checked={createBackupForm.settings.encryption_enabled}
                onCheckedChange={(checked) => setCreateBackupForm(prev => ({
                  ...prev,
                  settings: { ...prev.settings, encryption_enabled: checked }
                }))}
              />
              <Label htmlFor="encryption">Habilitar criptografia</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setState(prev => ({ ...prev, showCreateBackup: false }))}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBackup}>
              Criar Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={state.showCreateSchedule} onOpenChange={(open) => setState(prev => ({ ...prev, showCreateSchedule: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Agendamento</DialogTitle>
            <DialogDescription>
              Configure um agendamento automático de backup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-name">Nome</Label>
                <Input
                  id="schedule-name"
                  value={createScheduleForm.name}
                  onChange={(e) => setCreateScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do agendamento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-frequency">Frequência</Label>
                <Select
                  value={createScheduleForm.frequency}
                  onValueChange={(value) => setCreateScheduleForm(prev => ({ ...prev, frequency: value as BackupFrequency }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BackupFrequency.HOURLY}>A cada hora</SelectItem>
                    <SelectItem value={BackupFrequency.DAILY}>Diário</SelectItem>
                    <SelectItem value={BackupFrequency.WEEKLY}>Semanal</SelectItem>
                    <SelectItem value={BackupFrequency.MONTHLY}>Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-description">Descrição</Label>
              <Textarea
                id="schedule-description"
                value={createScheduleForm.description}
                onChange={(e) => setCreateScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do agendamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setState(prev => ({ ...prev, showCreateSchedule: false }))}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSchedule}>
              Criar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Restore Dialog */}
      <Dialog open={state.showCreateRestore} onOpenChange={(open) => setState(prev => ({ ...prev, showCreateRestore: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Restauração</DialogTitle>
            <DialogDescription>
              Restaure dados de um backup existente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restore-name">Nome</Label>
                <Input
                  id="restore-name"
                  value={createRestoreForm.name}
                  onChange={(e) => setCreateRestoreForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da restauração"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restore-backup">Backup</Label>
                <Select
                  value={createRestoreForm.backup_id}
                  onValueChange={(value) => setCreateRestoreForm(prev => ({ ...prev, backup_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um backup" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.backups
                      .filter(b => b.status === BackupStatus.COMPLETED)
                      .map((backup) => (
                        <SelectItem key={backup.id} value={backup.id}>
                          {backup.name} - {backup.formatted_size}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restore-target">Local de Destino</Label>
              <Input
                id="restore-target"
                value={createRestoreForm.target_location}
                onChange={(e) => setCreateRestoreForm(prev => ({ ...prev, target_location: e.target.value }))}
                placeholder="Caminho para restauração"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="test-restore"
                checked={createRestoreForm.is_test_restore}
                onCheckedChange={(checked) => setCreateRestoreForm(prev => ({ ...prev, is_test_restore: checked }))}
              />
              <Label htmlFor="test-restore">Restauração de teste</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setState(prev => ({ ...prev, showCreateRestore: false }))}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRestore}>
              Iniciar Restauração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}