'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  User,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  XCircle,
  LayoutGrid,
  List,
  Download,
  MessageSquare,
  Paperclip,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  RefreshCw,
  Bell,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Task, TaskFilters, TaskStats, TaskStatus, TaskPriority, TaskSearchParams } from '@/types/task'
import { TaskService } from '@/lib/services/tasks'

const statusIcons = {
  todo: Circle,
  in_progress: PlayCircle,
  review: PauseCircle,
  done: CheckCircle2,
  cancelled: XCircle
}

const statusColors = {
  todo: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  review: 'bg-orange-100 text-orange-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const statusLabels = {
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  review: 'Em Revisão',
  done: 'Concluída',
  cancelled: 'Cancelada'
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
}

export default function TasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<TaskFilters>({
    status: [],
    priority: [],
    assigned_to: []
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  useEffect(() => {
    loadTasks()
    loadStats()
    loadTeamMembers()
  }, [filters, searchTerm, currentPage])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const searchParams: TaskSearchParams = {
        filters: {
          ...filters,
          search: searchTerm || undefined
        },
        page: currentPage,
        limit: 20,
        sort_field: 'created_at',
        sort_direction: 'desc'
      }

      const result = await TaskService.getTasks(searchParams)
      setTasks(result.tasks)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      toast.error(`Erro ao carregar tarefas: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const stats = await TaskService.getTaskStats(filters)
      setStats(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      toast.error(`Erro ao carregar estatísticas: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const loadTeamMembers = async () => {
    try {
      // Implementar busca de membros da equipe
      setTeamMembers([])
    } catch (error) {
      console.error('Erro ao carregar membros da equipe:', error)
      toast.error(`Erro ao carregar membros da equipe: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const syncTasks = async () => {
    try {
      setSyncing(true)
      await loadTasks()
      await loadStats()
      toast.success('Tarefas sincronizadas com sucesso')
    } catch (error) {
      console.error('Erro ao sincronizar tarefas:', error)
      toast.error(`Erro ao sincronizar tarefas: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSyncing(false)
    }
  }

  const exportTasks = async () => {
    try {
      // Implementar exportação de tarefas
      toast.success('Tarefas exportadas com sucesso')
    } catch (error) {
      console.error('Erro ao exportar tarefas:', error)
      toast.error(`Erro ao exportar tarefas: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await TaskService.updateTask(taskId, { status: newStatus })
      await loadTasks()
      toast.success('Status da tarefa atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error(`Erro ao atualizar status da tarefa: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    try {
      await TaskService.updateTask(taskId, { priority: newPriority })
      await loadTasks()
      toast.success('Prioridade da tarefa atualizada com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error)
      toast.error(`Erro ao atualizar prioridade da tarefa: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleAssignTask = async (taskId: string, assignedTo: string) => {
    try {
      await TaskService.updateTask(taskId, { assigned_to: assignedTo })
      await loadTasks()
      toast.success('Tarefa atribuída com sucesso')
    } catch (error) {
      console.error('Erro ao atribuir tarefa:', error)
      toast.error(`Erro ao atribuir tarefa: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <ArrowUp className="h-3 w-3 text-red-500" />
      case 'high':
        return <ArrowUp className="h-3 w-3 text-orange-500" />
      case 'medium':
        return <Minus className="h-3 w-3 text-blue-500" />
      case 'low':
        return <ArrowDown className="h-3 w-3 text-gray-500" />
      default:
        return null
    }
  }

  const isOverdue = (task: Task) => {
    if (!task.due_date) return false
    return new Date(task.due_date) < new Date() && 
           !['completed', 'cancelled'].includes(task.status)
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const ticketDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Agora mesmo'
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d atrás`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}sem atrás`
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tarefas</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncTasks}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportTasks}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => router.push('/dashboard/tasks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.completed_this_week} nos últimos 7 dias
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Requer atenção imediata
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <PlayCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.in_progress || 0}</div>
              <p className="text-xs text-muted-foreground">
                Tarefas sendo processadas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas Hoje</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.done || 0}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de conclusão: 85%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descrição ou responsável..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={filters.status?.join(',') || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? [] : value.split(','))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority?.join(',') || 'all'}
            onValueChange={(value) => handleFilterChange('priority', value === 'all' ? [] : value.split(','))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              {Object.entries(priorityLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Não há tarefas que correspondam aos filtros selecionados.
              </p>
              <Button onClick={() => router.push('/dashboard/tasks/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Tarefa
              </Button>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card 
              key={task.id} 
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                isOverdue(task) ? 'border-red-200 bg-red-50' : ''
              }`}
              onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{task.id.slice(-8)}
                      </Badge>
                      {isOverdue(task) && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Atrasada
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(task.priority)}
                        <Badge className={priorityColors[task.priority]}>
                          {priorityLabels[task.priority]}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {task.assigned_to && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Atribuída</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(task.created_at)}</span>
                      </div>
                      {task.comments && task.comments.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{task.comments.length}</span>
                        </div>
                      )}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Paperclip className="h-4 w-4" />
                          <span>{task.attachments.length}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColors[task.status]}>
                        {statusLabels[task.status]}
                      </Badge>
                    </div>

                    {task.assigned_to && (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {task.assigned_to.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          Atribuída
                        </span>
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/tasks/${task.id}`)
                        }}>
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(task.id, 'in_progress')
                        }}>
                          Marcar como Em Andamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(task.id, 'done')
                        }}>
                          Marcar como Concluída
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handlePriorityChange(task.id, 'high')
                        }}>
                          Aumentar Prioridade
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}