'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  FileImage,
  Mail,
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ReportService } from '@/lib/services/reports'
import {
  Report,
  ReportType,
  ReportCategory,
  ReportFormat,
  ReportStatus,
  ReportGenerationRequest,
  DashboardAnalytics,
  DateRange,
  getDateRangeFromPreset,
  REPORT_TYPE_LABELS,
  REPORT_CATEGORY_LABELS,
  REPORT_FORMAT_LABELS,
  REPORT_STATUS_LABELS
} from '@/types/reports'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('last_30_days'))
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set())

  // Form state for creating reports
  const [newReport, setNewReport] = useState<Partial<ReportGenerationRequest>>({
    name: '',
    type: 'dashboard' as ReportType,
    category: 'overview' as ReportCategory,
    format: 'dashboard' as ReportFormat,
    parameters: {
      date_range: dateRange,
      filters: {}
    },
    recipients: []
  })

  useEffect(() => {
    loadData()
  }, [selectedCategory, selectedStatus, dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [reportsData, analyticsData] = await Promise.all([
        ReportService.getReports(
          selectedCategory !== 'all' ? selectedCategory : undefined,
          selectedStatus !== 'all' ? selectedStatus : undefined
        ),
        ReportService.getDashboardAnalytics(dateRange)
      ])
      setReports(reportsData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = async () => {
    try {
      if (!newReport.name || !newReport.type || !newReport.category) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      const report = await ReportService.createReport(newReport as ReportGenerationRequest)
      setReports(prev => [report, ...prev])
      setIsCreateDialogOpen(false)
      setNewReport({
        name: '',
        type: 'dashboard' as ReportType,
        category: 'overview' as ReportCategory,
        format: 'dashboard' as ReportFormat,
        parameters: {
          date_range: dateRange,
          filters: {}
        },
        recipients: []
      })
      toast.success('Relatório criado com sucesso')
    } catch (error) {
      console.error('Erro ao criar relatório:', error)
      toast.error('Erro ao criar relatório')
    }
  }

  const handleGenerateReport = async (reportId: string) => {
    try {
      setGeneratingReports(prev => new Set(prev).add(reportId))
      const result = await ReportService.generateReport(reportId)
      
      if (result.status === 'completed') {
        toast.success('Relatório gerado com sucesso')
        loadData() // Reload to get updated report
      } else {
        toast.error(result.error_message || 'Erro ao gerar relatório')
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const handleDeleteReport = async (reportId: string, reportName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o relatório "${reportName}"?`)) {
      return
    }

    try {
      await ReportService.deleteReport(reportId)
      setReports(prev => prev.filter(r => r.id !== reportId))
      toast.success('Relatório excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir relatório:', error)
      toast.error('Erro ao excluir relatório')
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'generating':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e Analytics</h1>
          <p className="text-muted-foreground">
            Gere relatórios personalizados e visualize analytics do sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Relatório</DialogTitle>
              <DialogDescription>
                Configure os parâmetros do seu relatório personalizado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Relatório</Label>
                  <Input
                    id="name"
                    value={newReport.name || ''}
                    onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Relatório Mensal de Atividades"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newReport.category}
                    onValueChange={(value: ReportCategory) => 
                      setNewReport(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REPORT_CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newReport.type}
                    onValueChange={(value: ReportType) => 
                      setNewReport(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Formato</Label>
                  <Select
                    value={newReport.format}
                    onValueChange={(value: ReportFormat) => 
                      setNewReport(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REPORT_FORMAT_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={newReport.description || ''}
                  onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo deste relatório..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={newReport.is_public || false}
                  onCheckedChange={(checked) => 
                    setNewReport(prev => ({ ...prev, is_public: checked }))
                  }
                />
                <Label htmlFor="public">Tornar público</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateReport}>
                  Criar Relatório
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {analytics && (
            <>
              {/* Overview Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.total_users}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.overview.active_users} ativos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projetos</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.total_projects}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.overview.total_teams} equipes
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.total_tasks}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.overview.completed_tasks} concluídas
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      +{analytics.overview.growth_rate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      vs. período anterior
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade de Usuários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.user_analytics.user_activity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="active_users" 
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tipos de Atividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.activity_analytics.activity_types}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analytics.activity_analytics.activity_types.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar relatórios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value as ReportCategory | 'all')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {Object.entries(REPORT_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value as ReportStatus | 'all')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {Object.entries(REPORT_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="grid gap-4">
            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                        ? 'Tente ajustar os filtros de busca'
                        : 'Crie seu primeiro relatório para começar'}
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Relatório
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{report.name}</h3>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">{REPORT_STATUS_LABELS[report.status]}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {report.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Categoria: {REPORT_CATEGORY_LABELS[report.category]}</span>
                          <span>Tipo: {REPORT_TYPE_LABELS[report.type]}</span>
                          <span>Formato: {REPORT_FORMAT_LABELS[report.format]}</span>
                          <span>
                            Criado em {format(new Date(report.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        {report.last_generated && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Último gerado em {format(new Date(report.last_generated), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {report.status === 'completed' && report.file_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateReport(report.id)}
                          disabled={generatingReports.has(report.id)}
                        >
                          {generatingReports.has(report.id) ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteReport(report.id, report.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              {/* Performance Analytics */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tempo de Resposta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.performance_analytics.response_times}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="response_time" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Uso de Recursos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.performance_analytics.resource_usage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="cpu_usage" 
                          stackId="1"
                          stroke="#8884d8" 
                          fill="#8884d8" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="memory_usage" 
                          stackId="1"
                          stroke="#82ca9d" 
                          fill="#82ca9d" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Team Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Equipes</CardTitle>
                  <CardDescription>
                    Equipes com melhor desempenho no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.team_analytics.top_teams.map((team, index) => (
                      <div key={team.team_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{team.team_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {team.member_count} membros
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{team.metric_value}%</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {team.metric_type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}