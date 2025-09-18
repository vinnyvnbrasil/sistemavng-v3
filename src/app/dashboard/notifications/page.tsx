'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { NotificationService } from '@/lib/services/notifications'
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationFilter,
  NotificationSort,
  NotificationStats,
  PaginatedNotifications,
  WebSocketMessage,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_TYPE_COLORS,
  NOTIFICATION_PRIORITY_COLORS
} from '@/types/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Filter,
  Mail,
  MailOpen,
  MessageSquare,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  Webhook,
  BarChart3,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const NOTIFICATION_ICONS: Record<NotificationType, any> = {
  system: Settings,
  user_activity: User,
  project_update: BarChart3,
  task_assigned: Users,
  task_completed: CheckCircle,
  task_overdue: Clock,
  file_shared: Mail,
  file_uploaded: MailOpen,
  comment_added: MessageSquare,
  mention: User,
  team_invitation: Users,
  team_update: Activity,
  security_alert: AlertTriangle,
  backup_completed: CheckCircle,
  backup_failed: XCircle,
  report_generated: TrendingUp,
  maintenance: Settings,
  custom: Bell
}

const PRIORITY_ICONS = {
  low: Info,
  medium: Bell,
  high: AlertTriangle,
  urgent: Zap
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<PaginatedNotifications>({
    notifications: [],
    total: 0,
    page: 1,
    limit: 20,
    has_more: false
  })
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<NotificationFilter>({})
  const [sort, setSort] = useState<NotificationSort>({ field: 'created_at', direction: 'desc' })
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  // Load notifications
  const loadNotifications = useCallback(async (page = 1, resetData = false) => {
    if (!user) return

    try {
      setLoading(true)
      const currentFilter = {
        ...filter,
        search: searchTerm || undefined
      }

      const data = await NotificationService.getNotifications(
        user.id,
        currentFilter,
        sort,
        page,
        20
      )

      if (resetData || page === 1) {
        setNotifications(data)
      } else {
        setNotifications(prev => ({
          ...data,
          notifications: [...prev.notifications, ...data.notifications]
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      toast.error('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }, [user, filter, sort, searchTerm])

  // Load stats
  const loadStats = useCallback(async () => {
    if (!user) return

    try {
      const data = await NotificationService.getNotificationStats(user.id)
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }, [user])

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(async () => {
    if (!user || wsConnection) return

    try {
      const ws = await NotificationService.initializeWebSocket(user.id)
      setWsConnection(ws)
      setIsConnected(true)

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data)
        handleWebSocketMessage(message)
      }

      ws.onclose = () => {
        setIsConnected(false)
        setWsConnection(null)
      }
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error)
      setIsConnected(false)
    }
  }, [user, wsConnection])

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'notification':
        const newNotification = message.payload as Notification
        setNotifications(prev => ({
          ...prev,
          notifications: [newNotification, ...prev.notifications],
          total: prev.total + 1
        }))
        toast.success('Nova notificação recebida')
        break

      case 'notification_read':
        if (message.payload.all) {
          setNotifications(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => ({ ...n, is_read: true }))
          }))
        } else {
          const updatedNotification = message.payload as Notification
          setNotifications(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          }))
        }
        break

      case 'notification_deleted':
        const deletedId = message.payload.id
        setNotifications(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== deletedId),
          total: prev.total - 1
        }))
        break
    }
  }

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id)
      setNotifications(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        )
      }))
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
      toast.error('Erro ao marcar notificação como lida')
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      await NotificationService.markAllAsRead(user.id)
      setNotifications(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true }))
      }))
      toast.success('Todas as notificações foram marcadas como lidas')
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast.error('Erro ao marcar todas as notificações como lidas')
    }
  }

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await NotificationService.deleteNotification(id)
      setNotifications(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id),
        total: prev.total - 1
      }))
      toast.success('Notificação excluída')
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      toast.error('Erro ao excluir notificação')
    }
  }

  // Delete selected notifications
  const deleteSelected = async () => {
    try {
      await Promise.all(
        Array.from(selectedNotifications).map(id => 
          NotificationService.deleteNotification(id)
        )
      )
      setNotifications(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => !selectedNotifications.has(n.id)),
        total: prev.total - selectedNotifications.size
      }))
      setSelectedNotifications(new Set())
      toast.success(`${selectedNotifications.size} notificações excluídas`)
    } catch (error) {
      console.error('Erro ao excluir notificações:', error)
      toast.error('Erro ao excluir notificações selecionadas')
    }
  }

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const newFilter: NotificationFilter = {}

    switch (tab) {
      case 'unread':
        newFilter.is_read = false
        break
      case 'read':
        newFilter.is_read = true
        break
      case 'important':
        newFilter.priority = ['high', 'urgent']
        break
    }

    setFilter(newFilter)
  }

  // Apply filters
  const applyFilters = () => {
    loadNotifications(1, true)
    setShowFilters(false)
  }

  // Clear filters
  const clearFilters = () => {
    setFilter({})
    setSearchTerm('')
    setActiveTab('all')
    loadNotifications(1, true)
  }

  // Get notification icon
  const getNotificationIcon = (notification: Notification) => {
    const IconComponent = NOTIFICATION_ICONS[notification.type] || Bell
    return <IconComponent className="h-4 w-4" />
  }

  // Get priority icon
  const getPriorityIcon = (priority: NotificationPriority) => {
    const IconComponent = PRIORITY_ICONS[priority] || Bell
    return <IconComponent className="h-3 w-3" />
  }

  // Format notification time
  const formatNotificationTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR
    })
  }

  useEffect(() => {
    if (user) {
      loadNotifications(1, true)
      loadStats()
      initializeWebSocket()
    }

    return () => {
      if (wsConnection) {
        wsConnection.close()
      }
    }
  }, [user, filter, sort])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadNotifications(1, true)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Faça login para ver suas notificações</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Notificações</h1>
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Activity className="h-3 w-3 mr-1" />
                Online
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={!stats?.unread_notifications}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
          {selectedNotifications.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir ({selectedNotifications.size})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total_notifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BellRing className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Não lidas</p>
                  <p className="text-2xl font-bold">{stats.unread_notifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">{stats.notifications_today}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de leitura</p>
                  <p className="text-2xl font-bold">{stats.read_rate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={Array.isArray(filter.type) ? filter.type[0] : filter.type || ''}
                  onValueChange={(value) => setFilter(prev => ({ ...prev, type: value as NotificationType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={Array.isArray(filter.priority) ? filter.priority[0] : filter.priority || ''}
                  onValueChange={(value) => setFilter(prev => ({ ...prev, priority: value as NotificationPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    {Object.entries(NOTIFICATION_PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filter.is_read === undefined ? '' : filter.is_read ? 'read' : 'unread'}
                  onValueChange={(value) => {
                    if (value === '') {
                      setFilter(prev => ({ ...prev, is_read: undefined }))
                    } else {
                      setFilter(prev => ({ ...prev, is_read: value === 'read' }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="unread">Não lidas</SelectItem>
                    <SelectItem value="read">Lidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={applyFilters}>Aplicar Filtros</Button>
              <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas
            {stats?.unread_notifications ? (
              <Badge variant="secondary" className="ml-2">
                {stats.unread_notifications}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="read">Lidas</TabsTrigger>
          <TabsTrigger value="important">Importantes</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Notifications List */}
          <Card>
            <CardContent className="p-0">
              {loading && notifications.notifications.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications.notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-6">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {notifications.notifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-muted/50 transition-colors ${
                          !notification.is_read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedNotifications.has(notification.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedNotifications)
                              if (checked) {
                                newSelected.add(notification.id)
                              } else {
                                newSelected.delete(notification.id)
                              }
                              setSelectedNotifications(newSelected)
                            }}
                          />

                          <div className="flex-shrink-0">
                            {notification.sender_avatar ? (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={notification.sender_avatar} />
                                <AvatarFallback>
                                  {notification.sender_name?.charAt(0) || 'S'}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                NOTIFICATION_TYPE_COLORS[notification.type]
                              }`}>
                                {getNotificationIcon(notification)}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <h3 className={`text-sm font-medium ${
                                  !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {notification.title}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    NOTIFICATION_PRIORITY_COLORS[notification.priority]
                                  }`}
                                >
                                  {getPriorityIcon(notification.priority)}
                                  <span className="ml-1">
                                    {NOTIFICATION_PRIORITY_LABELS[notification.priority]}
                                  </span>
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatNotificationTime(notification.created_at)}
                                </span>
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className={`text-sm mt-1 ${
                              !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.message}
                            </p>
                            {notification.sender_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                De: {notification.sender_name}
                              </p>
                            )}
                            {notification.action_url && notification.action_label && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto mt-2"
                                onClick={() => window.open(notification.action_url, '_blank')}
                              >
                                {notification.action_label}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Load More */}
          {notifications.has_more && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => loadNotifications(notifications.page + 1)}
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Carregar mais'}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Estatísticas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notifications by Type */}
              <div>
                <h4 className="text-sm font-medium mb-3">Por Tipo</h4>
                <div className="space-y-2">
                  {stats.notifications_by_type.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${
                          NOTIFICATION_TYPE_COLORS[item.type]
                        }`} />
                        <span className="text-sm">
                          {NOTIFICATION_TYPE_LABELS[item.type]}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{item.count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications by Priority */}
              <div>
                <h4 className="text-sm font-medium mb-3">Por Prioridade</h4>
                <div className="space-y-2">
                  {stats.notifications_by_priority.map((item) => (
                    <div key={item.priority} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${
                          NOTIFICATION_PRIORITY_COLORS[item.priority]
                        }`} />
                        <span className="text-sm">
                          {NOTIFICATION_PRIORITY_LABELS[item.priority]}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{item.count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}