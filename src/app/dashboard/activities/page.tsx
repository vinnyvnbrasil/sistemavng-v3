'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  Search,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ActivityService } from '@/lib/services/activities'
import {
  Activity as ActivityType,
  ActivityFilter,
  ActivityStats,
  DashboardStats,
  TimelineEvent,
  ActivityType as ActivityTypeEnum,
  EntityType,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS
} from '@/types/activity'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all')
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7')
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'stats'>('list')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadActivities()
  }, [searchTerm, selectedActivityType, selectedEntityType, selectedUser, dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadActivities(),
        loadStats(),
        loadDashboardStats(),
        loadTimelineEvents()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const filter: ActivityFilter = {}
      
      if (searchTerm) filter.search = searchTerm
      if (selectedActivityType !== 'all') filter.activity_type = selectedActivityType as ActivityTypeEnum
      if (selectedEntityType !== 'all') filter.entity_type = selectedEntityType as EntityType
      if (selectedUser !== 'all') filter.user_id = selectedUser
      
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
        filter.date_from = startDate.toISOString()
        filter.date_to = endDate.toISOString()
      }

      const data = await ActivityService.getActivities(filter)
      setActivities(data)
    } catch (error) {
      console.error('Erro ao carregar atividades:', error)
      toast.error('Erro ao carregar atividades')
    }
  }

  const loadStats = async () => {
    try {
      const data = await ActivityService.getActivityStats()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const data = await ActivityService.getDashboardStats()
      setDashboardStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas do dashboard:', error)
    }
  }

  const loadTimelineEvents = async () => {
    try {
      const days = parseInt(dateRange) || 7
      const data = await ActivityService.getTimelineEvents(days)
      setTimelineEvents(data)
    } catch (error) {
      console.error('Erro ao carregar timeline:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast.success('Dados atualizados com sucesso')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedActivityType('all')
    setSelectedEntityType('all')
    setSelectedUser('all')
    setDateRange('7')
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora mesmo'
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`
    return format(activityDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Atividades</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atividades e métricas do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.active_projects}</div>
              <p className="text-xs text-muted-foreground">
                de {dashboardStats.total_projects} projetos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.pending_tasks}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.overdue_tasks} em atraso
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.active_users}</div>
              <p className="text-xs text-muted-foreground">
                de {dashboardStats.total_users} usuários
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activities_today || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activities_this_week || 0} esta semana
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Atividade</label>
              <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Entidade</label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Último dia</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Visualização</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="stats">Estatísticas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList>
          <TabsTrigger value="list">Lista de Atividades</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>
                {activities.length} atividades encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={activity.user_avatar} />
                        <AvatarFallback>
                          {activity.user_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{activity.user_name}</span>
                            <Badge className={ACTIVITY_TYPE_COLORS[activity.type]}>
                              {ACTIVITY_TYPE_LABELS[activity.type]}
                            </Badge>
                            <Badge variant="outline">
                              {ENTITY_TYPE_LABELS[activity.entity_type]}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {formatRelativeTime(activity.created_at)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          )}
                          {activity.entity_name && (
                            <p className="text-sm text-blue-600">
                              {ENTITY_TYPE_LABELS[activity.entity_type]}: {activity.entity_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Atividades</CardTitle>
              <CardDescription>
                Visualização cronológica das atividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground text-sm font-medium">
                          {format(new Date(event.date), 'dd', { locale: ptBR })}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {format(new Date(event.date), 'EEEE, dd MMMM yyyy', { locale: ptBR })}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {event.activities.length} atividades
                          </p>
                        </div>
                      </div>
                      <div className="ml-12 space-y-3">
                        {event.activities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activity.user_avatar} />
                              <AvatarFallback className="text-xs">
                                {activity.user_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">{activity.user_name}</span>
                                <Badge className={ACTIVITY_TYPE_COLORS[activity.type]}>
                                  {ACTIVITY_TYPE_LABELS[activity.type]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(activity.created_at), 'HH:mm', { locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-sm">{activity.title}</p>
                              {activity.entity_name && (
                                <p className="text-xs text-muted-foreground">
                                  {ENTITY_TYPE_LABELS[activity.entity_type]}: {activity.entity_name}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {event !== timelineEvents[timelineEvents.length - 1] && (
                        <div className="absolute left-4 top-12 w-px h-6 bg-border" />
                      )}
                    </div>
                  ))}
                  {timelineEvents.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma atividade encontrada no período</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Atividades por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.activity_by_type.map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{ACTIVITY_TYPE_LABELS[item.type]}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuários Mais Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.most_active_users.map((user, index) => (
                    <div key={user.user_id} className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full text-primary-foreground text-xs font-medium">
                        {index + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_avatar} />
                        <AvatarFallback className="text-xs">
                          {user.user_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.activity_count} atividades
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Atividades por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.activity_by_day.map((day) => (
                    <div key={day.date} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{format(new Date(day.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        <span className="font-medium">{day.count} atividades</span>
                      </div>
                      <Progress 
                        value={stats.activity_by_day.length > 0 ? (day.count / Math.max(...stats.activity_by_day.map(d => d.count))) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}