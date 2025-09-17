'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Plus,
  Settings,
  AlertTriangle,
  Activity,
  Clock,
  User,
  Database,
  Lock,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  AuditLog,
  SystemLog,
  AuditRule,
  AuditReport,
  AuditStats,
  LogStats,
  AuditAction,
  ResourceType,
  AuditSeverity,
  AuditCategory,
  LogLevel,
  LogCategory,
  AuditLogFilter,
  SystemLogFilter,
  ReportFormat,
  ReportSchedule,
  ScheduleFrequency
} from '@/types/audit'
import { AuditService } from '@/lib/services/audit'

const auditService = new AuditService()

const severityColors = {
  [AuditSeverity.LOW]: 'bg-green-100 text-green-800',
  [AuditSeverity.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [AuditSeverity.HIGH]: 'bg-orange-100 text-orange-800',
  [AuditSeverity.CRITICAL]: 'bg-red-100 text-red-800'
}

const levelColors = {
  [LogLevel.DEBUG]: 'bg-gray-100 text-gray-800',
  [LogLevel.INFO]: 'bg-blue-100 text-blue-800',
  [LogLevel.WARN]: 'bg-yellow-100 text-yellow-800',
  [LogLevel.ERROR]: 'bg-red-100 text-red-800',
  [LogLevel.FATAL]: 'bg-red-200 text-red-900'
}

const categoryIcons = {
  [AuditCategory.AUTHENTICATION]: Lock,
  [AuditCategory.AUTHORIZATION]: Shield,
  [AuditCategory.DATA_ACCESS]: Eye,
  [AuditCategory.DATA_MODIFICATION]: Database,
  [AuditCategory.SYSTEM_ADMINISTRATION]: Settings,
  [AuditCategory.SECURITY]: AlertTriangle,
  [AuditCategory.PERFORMANCE]: Zap
}

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState('logs')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [auditRules, setAuditRules] = useState<AuditRule[]>([])
  const [auditReports, setAuditReports] = useState<AuditReport[]>([])
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null)
  const [logStats, setLogStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [auditFilter, setAuditFilter] = useState<AuditLogFilter>({})
  const [systemFilter, setSystemFilter] = useState<SystemLogFilter>({})
  const [selectedLog, setSelectedLog] = useState<AuditLog | SystemLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [newRule, setNewRule] = useState<Partial<AuditRule>>({
    name: '',
    description: '',
    conditions: [],
    actions: [],
    enabled: true,
    priority: 5
  })
  const [newReport, setNewReport] = useState<Partial<AuditReport>>({
    name: '',
    description: '',
    filters: {},
    format: ReportFormat.PDF,
    schedule: {
      frequency: ScheduleFrequency.WEEKLY,
      hour: 9,
      minute: 0,
      timezone: 'America/Sao_Paulo',
      enabled: false
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [auditResponse, systemResponse, rulesResponse, reportsResponse, auditStatsData, logStatsData] = await Promise.all([
        auditService.getAuditLogs(auditFilter),
        auditService.getSystemLogs(systemFilter),
        auditService.getAuditRules(),
        auditService.getAuditReports(),
        auditService.getAuditStats(),
        auditService.getLogStats()
      ])

      if (auditResponse.success && auditResponse.logs) {
        setAuditLogs(auditResponse.logs)
      }
      if (systemResponse.success && systemResponse.logs) {
        setSystemLogs(systemResponse.logs)
      }
      if (rulesResponse.success && rulesResponse.rules) {
        setAuditRules(rulesResponse.rules)
      }
      if (reportsResponse.success && reportsResponse.reports) {
        setAuditReports(reportsResponse.reports)
      }
      setAuditStats(auditStatsData)
      setLogStats(logStatsData)
    } catch (error) {
      console.error('Error loading audit data:', error)
      toast.error('Erro ao carregar dados de auditoria')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAuditLog = async (id: string) => {
    try {
      const response = await auditService.deleteAuditLog(id, 'current-user-id')
      if (response.success) {
        setAuditLogs(prev => prev.filter(log => log.id !== id))
        toast.success('Log de auditoria excluído com sucesso')
      } else {
        toast.error(response.message || 'Erro ao excluir log')
      }
    } catch (error) {
      console.error('Error deleting audit log:', error)
      toast.error('Erro ao excluir log de auditoria')
    }
  }

  const handleCreateRule = async () => {
    try {
      if (!newRule.name || !newRule.description) {
        toast.error('Nome e descrição são obrigatórios')
        return
      }

      const response = await auditService.createAuditRule({
        ...newRule,
        created_by: 'current-user-id'
      } as Omit<AuditRule, 'id' | 'created_at' | 'updated_at'>)

      if (response.success && response.data) {
        setAuditRules(prev => [response.data!, ...prev])
        setNewRule({
          name: '',
          description: '',
          conditions: [],
          actions: [],
          enabled: true,
          priority: 5
        })
        toast.success('Regra de auditoria criada com sucesso')
      } else {
        toast.error(response.message || 'Erro ao criar regra')
      }
    } catch (error) {
      console.error('Error creating audit rule:', error)
      toast.error('Erro ao criar regra de auditoria')
    }
  }

  const handleCreateReport = async () => {
    try {
      if (!newReport.name || !newReport.description) {
        toast.error('Nome e descrição são obrigatórios')
        return
      }

      const response = await auditService.createAuditReport({
        ...newReport,
        created_by: 'current-user-id'
      } as Omit<AuditReport, 'id' | 'created_at' | 'updated_at'>)

      if (response.success && response.data) {
        setAuditReports(prev => [response.data!, ...prev])
        setNewReport({
          name: '',
          description: '',
          filters: {},
          format: ReportFormat.PDF,
          schedule: {
            frequency: ScheduleFrequency.WEEKLY,
            hour: 9,
            minute: 0,
            timezone: 'America/Sao_Paulo',
            enabled: false
          }
        })
        toast.success('Relatório de auditoria criado com sucesso')
      } else {
        toast.error(response.message || 'Erro ao criar relatório')
      }
    } catch (error) {
      console.error('Error creating audit report:', error)
      toast.error('Erro ao criar relatório de auditoria')
    }
  }

  const handleGenerateReport = async (reportId: string) => {
    try {
      const response = await auditService.generateAuditReport(reportId, 'current-user-id')
      if (response.success) {
        toast.success('Relatório gerado com sucesso')
        if (response.file_url) {
          window.open(response.file_url, '_blank')
        }
      } else {
        toast.error(response.message || 'Erro ao gerar relatório')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Erro ao gerar relatório')
    }
  }

  const filteredAuditLogs = auditLogs.filter(log =>
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSystemLogs = systemLogs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Auditoria e Logs</h1>
          <p className="text-muted-foreground">
            Monitore atividades do sistema e eventos de segurança
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {auditStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStats.total_logs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {auditStats.logs_today} hoje
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos de Alto Risco</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{auditStats.high_risk_events}</div>
              <p className="text-xs text-muted-foreground">
                Hoje
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logins Falhados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStats.failed_logins}</div>
              <p className="text-xs text-muted-foreground">
                {auditStats.successful_logins} sucessos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modificações</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStats.data_modifications}</div>
              <p className="text-xs text-muted-foreground">
                Hoje
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros Avançados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Severidade</Label>
                <Select
                  value={auditFilter.severity as string || ''}
                  onValueChange={(value) => setAuditFilter(prev => ({ ...prev, severity: value as AuditSeverity }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value={AuditSeverity.LOW}>Baixa</SelectItem>
                    <SelectItem value={AuditSeverity.MEDIUM}>Média</SelectItem>
                    <SelectItem value={AuditSeverity.HIGH}>Alta</SelectItem>
                    <SelectItem value={AuditSeverity.CRITICAL}>Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={auditFilter.category as string || ''}
                  onValueChange={(value) => setAuditFilter(prev => ({ ...prev, category: value as AuditCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value={AuditCategory.AUTHENTICATION}>Autenticação</SelectItem>
                    <SelectItem value={AuditCategory.AUTHORIZATION}>Autorização</SelectItem>
                    <SelectItem value={AuditCategory.DATA_ACCESS}>Acesso a Dados</SelectItem>
                    <SelectItem value={AuditCategory.DATA_MODIFICATION}>Modificação de Dados</SelectItem>
                    <SelectItem value={AuditCategory.SYSTEM_ADMINISTRATION}>Administração</SelectItem>
                    <SelectItem value={AuditCategory.SECURITY}>Segurança</SelectItem>
                    <SelectItem value={AuditCategory.PERFORMANCE}>Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={auditFilter.date_from || ''}
                  onChange={(e) => setAuditFilter(prev => ({ ...prev, date_from: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={loadData} size="sm">
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="system">Logs do Sistema</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Registros de atividades e eventos de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredAuditLogs.map((log) => {
                    const CategoryIcon = categoryIcons[log.category] || Activity
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-center space-x-3">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{log.description}</span>
                              <Badge className={severityColors[log.severity]}>
                                {log.severity}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.user_id && (
                                <span className="mr-2">
                                  <User className="h-3 w-3 inline mr-1" />
                                  {log.user_id}
                                </span>
                              )}
                              <span>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Risco: {log.risk_score}/10
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label>Ação</Label>
                                    <p className="text-sm">{log.action}</p>
                                  </div>
                                  <div>
                                    <Label>Severidade</Label>
                                    <Badge className={severityColors[log.severity]}>
                                      {log.severity}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Categoria</Label>
                                    <p className="text-sm">{log.category}</p>
                                  </div>
                                  <div>
                                    <Label>Pontuação de Risco</Label>
                                    <p className="text-sm">{log.risk_score}/10</p>
                                  </div>
                                  <div>
                                    <Label>IP</Label>
                                    <p className="text-sm">{log.ip_address}</p>
                                  </div>
                                  <div>
                                    <Label>Data</Label>
                                    <p className="text-sm">
                                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Descrição</Label>
                                  <p className="text-sm">{log.description}</p>
                                </div>
                                {log.metadata && (
                                  <div>
                                    <Label>Metadados</Label>
                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Log</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este log de auditoria?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAuditLog(log.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Registros técnicos e de performance do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredSystemLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Badge className={levelColors[log.level]}>
                            {log.level}
                          </Badge>
                          <span className="font-medium">{log.message}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Regras de Auditoria</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Regra de Auditoria</DialogTitle>
                  <DialogDescription>
                    Configure uma nova regra para monitoramento automático
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newRule.name || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome da regra"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={newRule.description || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da regra"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Prioridade</Label>
                      <Select
                        value={newRule.priority?.toString() || '5'}
                        onValueChange={(value) => setNewRule(prev => ({ ...prev, priority: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Muito Baixa</SelectItem>
                          <SelectItem value="3">3 - Baixa</SelectItem>
                          <SelectItem value="5">5 - Média</SelectItem>
                          <SelectItem value="7">7 - Alta</SelectItem>
                          <SelectItem value="10">10 - Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newRule.enabled || false}
                        onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label>Ativa</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button onClick={handleCreateRule}>Criar Regra</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {auditRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline">
                        Prioridade: {rule.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Relatórios de Auditoria</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Relatório
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Relatório de Auditoria</DialogTitle>
                  <DialogDescription>
                    Configure um novo relatório automático
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newReport.name || ''}
                      onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do relatório"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={newReport.description || ''}
                      onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do relatório"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Formato</Label>
                      <Select
                        value={newReport.format || ReportFormat.PDF}
                        onValueChange={(value) => setNewReport(prev => ({ ...prev, format: value as ReportFormat }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ReportFormat.PDF}>PDF</SelectItem>
                          <SelectItem value={ReportFormat.CSV}>CSV</SelectItem>
                          <SelectItem value={ReportFormat.XLSX}>Excel</SelectItem>
                          <SelectItem value={ReportFormat.JSON}>JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Frequência</Label>
                      <Select
                        value={newReport.schedule?.frequency || ScheduleFrequency.WEEKLY}
                        onValueChange={(value) => setNewReport(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule!, frequency: value as ScheduleFrequency }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button onClick={handleCreateReport}>Criar Relatório</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {auditReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{report.format}</Badge>
                      <Button
                        onClick={() => handleGenerateReport(report.id)}
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Gerar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {report.last_generated_at && (
                      <p>
                        Último: {format(new Date(report.last_generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    )}
                    {report.schedule?.enabled && (
                      <p>
                        Próximo: {report.next_generation_at && format(new Date(report.next_generation_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}