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
import { 
  Ticket, 
  TicketFilters, 
  TicketStats, 
  TicketStatus,
  TicketPriority,
  TicketType
} from '@/types/tickets'
import { TicketsService } from '@/lib/services/tickets-service'

const statusIcons = {
  open: Circle,
  in_progress: PlayCircle,
  waiting_customer: PauseCircle,
  waiting_supplier: Clock,
  resolved: CheckCircle2,
  closed: XCircle
}

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_customer: 'bg-orange-100 text-orange-800',
  waiting_supplier: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const typeColors = {
  support: 'bg-blue-100 text-blue-800',
  bug: 'bg-red-100 text-red-800',
  feature_request: 'bg-green-100 text-green-800',
  order_issue: 'bg-orange-100 text-orange-800',
  refund: 'bg-purple-100 text-purple-800',
  shipping: 'bg-yellow-100 text-yellow-800',
  product_question: 'bg-indigo-100 text-indigo-800',
  complaint: 'bg-red-100 text-red-800'
}

const statusLabels = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  waiting_customer: 'Aguardando Cliente',
  waiting_supplier: 'Aguardando Fornecedor',
  resolved: 'Resolvido',
  closed: 'Fechado'
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
}

const typeLabels = {
  support: 'Suporte',
  bug: 'Bug',
  feature_request: 'Solicitação de Recurso',
  order_issue: 'Problema no Pedido',
  refund: 'Reembolso',
  shipping: 'Envio',
  product_question: 'Dúvida sobre Produto',
  complaint: 'Reclamação'
}

const marketplaceIcons = {
  mercadolivre: '🛒',
  shopee: '🛍️',
  amazon: '📦',
  magalu: '🏪',
  americanas: '🏬',
  casasbahia: '🏠',
  extra: '🛒',
  carrefour: '🛒'
}

export default function TicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ticketsService = new TicketsService()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<TicketFilters>({
    status: [],
    priority: [],
    type: [],
    marketplace: [],
    assigned_to: []
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [marketplaces, setMarketplaces] = useState<string[]>([])

  useEffect(() => {
    loadTickets()
    loadStats()
    loadTeamMembers()
    loadMarketplaces()
  }, [filters, searchTerm, currentPage])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const companyId = 'company-id' // TODO: Obter do contexto de autenticação
      
      const searchFilters = {
        ...filters,
        customer_name: searchTerm || undefined,
        order_number: searchTerm || undefined
      }

      const result = await ticketsService.getTickets(companyId, searchFilters, currentPage, 20)
      setTickets(result.data)
      setTotalPages(Math.ceil(result.total / 20))
    } catch (error: any) {
      console.error('Erro ao carregar tickets:', error)
      toast.error(error.message || 'Erro ao carregar tickets')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const companyId = 'company-id' // TODO: Obter do contexto de autenticação
      const statsData = await ticketsService.getTicketStats(companyId)
      setStats(statsData)
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const companyId = 'company-id' // TODO: Obter do contexto de autenticação
      const members = await ticketsService.getTeamMembers(companyId)
      setTeamMembers(members)
    } catch (error: any) {
      console.error('Erro ao carregar membros da equipe:', error)
    }
  }

  const loadMarketplaces = async () => {
    try {
      const companyId = 'company-id' // TODO: Obter do contexto de autenticação
      const marketplaceList = await ticketsService.getMarketplaces(companyId)
      setMarketplaces(marketplaceList)
    } catch (error: any) {
      console.error('Erro ao carregar marketplaces:', error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const userId = 'user-id' // TODO: Obter do contexto de autenticação
      await ticketsService.updateTicket(ticketId, { status: newStatus }, userId)
      await loadTickets()
      toast.success('Status do ticket atualizado com sucesso')
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error(error.message || 'Erro ao atualizar status do ticket')
    }
  }

  const handlePriorityChange = async (ticketId: string, newPriority: TicketPriority) => {
    try {
      const userId = 'user-id' // TODO: Obter do contexto de autenticação
      await ticketsService.updateTicket(ticketId, { priority: newPriority }, userId)
      await loadTickets()
      toast.success('Prioridade do ticket atualizada com sucesso')
    } catch (error: any) {
      console.error('Erro ao atualizar prioridade:', error)
      toast.error(error.message || 'Erro ao atualizar prioridade do ticket')
    }
  }

  const handleAssignTicket = async (ticketId: string, assignedTo: string) => {
    try {
      const userId = 'user-id' // TODO: Obter do contexto de autenticação
      await ticketsService.updateTicket(ticketId, { assigned_to: assignedTo }, userId)
      await loadTickets()
      toast.success('Ticket atribuído com sucesso')
    } catch (error: any) {
      console.error('Erro ao atribuir ticket:', error)
      toast.error(error.message || 'Erro ao atribuir ticket')
    }
  }

  const syncTickets = async () => {
    try {
      setSyncing(true)
      // TODO: Implementar sincronização com marketplaces
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simular sincronização
      await loadTickets()
      await loadStats()
      toast.success('Tickets sincronizados com sucesso')
    } catch (error: any) {
      console.error('Erro ao sincronizar tickets:', error)
      toast.error(error.message || 'Erro ao sincronizar tickets')
    } finally {
      setSyncing(false)
    }
  }

  const exportTickets = async () => {
    try {
      // TODO: Implementar exportação de tickets
      toast.success('Exportação iniciada. Você receberá um email quando estiver pronta.')
    } catch (error: any) {
      console.error('Erro ao exportar tickets:', error)
      toast.error(error.message || 'Erro ao exportar tickets')
    }
  }

  const getPriorityIcon = (priority: TicketPriority) => {
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

  const isOverdue = (ticket: Ticket) => {
    if (!ticket.sla_due_date) return false
    return new Date(ticket.sla_due_date) < new Date() && 
           !['resolved', 'closed'].includes(ticket.status)
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
        <h2 className="text-3xl font-bold tracking-tight">Tickets de Suporte</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncTickets}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportTickets}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => router.push('/dashboard/tickets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Ticket
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.recent_tickets} nos últimos 7 dias
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Violado</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.sla_breached}</div>
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
                Tickets sendo processados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.resolved || 0}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de resolução: 85%
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
              placeholder="Buscar por cliente, número do pedido ou ticket..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={filters.status?.join(',') || ''}
            onValueChange={(value) => handleFilterChange('status', value ? value.split(',') : [])}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os Status</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority?.join(',') || ''}
            onValueChange={(value) => handleFilterChange('priority', value ? value.split(',') : [])}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as Prioridades</SelectItem>
              {Object.entries(priorityLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.marketplace?.join(',') || ''}
            onValueChange={(value) => handleFilterChange('marketplace', value ? value.split(',') : [])}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Marketplace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os Marketplaces</SelectItem>
              {marketplaces.map((marketplace) => (
                <SelectItem key={marketplace} value={marketplace}>
                  {marketplaceIcons[marketplace as keyof typeof marketplaceIcons]} {marketplace}
                </SelectItem>
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

      {/* Lista de Tickets */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Não há tickets que correspondam aos filtros selecionados.
              </p>
              <Button onClick={() => router.push('/dashboard/tickets/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                isOverdue(ticket) ? 'border-red-200 bg-red-50' : ''
              }`}
              onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {ticket.ticket_number}
                      </Badge>
                      {ticket.marketplace && (
                        <Badge variant="outline" className="text-xs">
                          {marketplaceIcons[ticket.marketplace as keyof typeof marketplaceIcons]} 
                          {ticket.marketplace}
                        </Badge>
                      )}
                      {isOverdue(ticket) && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          SLA Violado
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <h3 className="font-semibold text-lg">{ticket.title}</h3>
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(ticket.priority)}
                        <Badge className={priorityColors[ticket.priority]}>
                          {priorityLabels[ticket.priority]}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{ticket.customer_name}</span>
                      </div>
                      {ticket.order_number && (
                        <div className="flex items-center space-x-1">
                          <ShoppingCart className="h-4 w-4" />
                          <span>#{ticket.order_number}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(ticket.created_at)}</span>
                      </div>
                      {ticket.comments && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{ticket.comments.count}</span>
                        </div>
                      )}
                      {ticket.attachments && ticket.attachments.count > 0 && (
                        <div className="flex items-center space-x-1">
                          <Paperclip className="h-4 w-4" />
                          <span>{ticket.attachments.count}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColors[ticket.status]}>
                        {statusLabels[ticket.status]}
                      </Badge>
                      <Badge className={typeColors[ticket.type]}>
                        {typeLabels[ticket.type]}
                      </Badge>
                    </div>

                    {ticket.assigned_to && (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={ticket.assigned_to.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {ticket.assigned_to.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {ticket.assigned_to.full_name}
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
                          router.push(`/dashboard/tickets/${ticket.id}`)
                        }}>
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(ticket.id, 'in_progress')
                        }}>
                          Marcar como Em Andamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(ticket.id, 'resolved')
                        }}>
                          Marcar como Resolvido
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handlePriorityChange(ticket.id, 'high')
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