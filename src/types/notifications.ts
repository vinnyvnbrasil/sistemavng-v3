export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  recipient_id: string
  sender_id?: string
  entity_type?: EntityType
  entity_id?: string
  metadata?: NotificationMetadata
  read_at?: string
  created_at: string
  updated_at: string
  expires_at?: string
  action_url?: string
  action_label?: string
  // Computed fields
  sender_name?: string
  sender_avatar?: string
  time_ago?: string
  is_read?: boolean
  is_expired?: boolean
}

export interface NotificationMetadata {
  [key: string]: any
  entity_name?: string
  old_value?: any
  new_value?: any
  additional_info?: string
  custom_data?: Record<string, any>
}

export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  title_template: string
  message_template: string
  priority: NotificationPriority
  is_active: boolean
  channels: NotificationChannel[]
  conditions?: NotificationCondition[]
  created_at: string
  updated_at: string
}

export interface NotificationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}

export interface NotificationPreference {
  id: string
  user_id: string
  type: NotificationType
  channels: NotificationChannel[]
  is_enabled: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  frequency: NotificationFrequency
  created_at: string
  updated_at: string
}

export interface NotificationChannel {
  type: ChannelType
  is_enabled: boolean
  settings?: ChannelSettings
}

export interface ChannelSettings {
  email?: EmailSettings
  push?: PushSettings
  sms?: SMSSettings
  webhook?: WebhookSettings
}

export interface EmailSettings {
  template_id?: string
  from_name?: string
  from_email?: string
  reply_to?: string
}

export interface PushSettings {
  sound?: string
  badge?: boolean
  vibration?: boolean
}

export interface SMSSettings {
  provider?: string
  template_id?: string
}

export interface WebhookSettings {
  url: string
  method: 'POST' | 'PUT' | 'PATCH'
  headers?: Record<string, string>
  auth_type?: 'none' | 'bearer' | 'basic' | 'api_key'
  auth_config?: Record<string, string>
}

export interface NotificationSubscription {
  id: string
  user_id: string
  entity_type: EntityType
  entity_id: string
  notification_types: NotificationType[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationBatch {
  id: string
  name: string
  notifications: CreateNotificationData[]
  status: BatchStatus
  total_count: number
  sent_count: number
  failed_count: number
  created_by: string
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface NotificationStats {
  total_notifications: number
  unread_notifications: number
  notifications_today: number
  notifications_this_week: number
  notifications_by_type: Array<{
    type: NotificationType
    count: number
    percentage: number
  }>
  notifications_by_priority: Array<{
    priority: NotificationPriority
    count: number
    percentage: number
  }>
  read_rate: number
  average_read_time: number
  most_active_hours: Array<{
    hour: number
    count: number
  }>
}

export interface RealTimeConnection {
  id: string
  user_id: string
  socket_id: string
  status: ConnectionStatus
  last_seen: string
  user_agent?: string
  ip_address?: string
  connected_at: string
}

export interface WebSocketMessage {
  type: MessageType
  payload: any
  timestamp: string
  id?: string
}

export interface CreateNotificationData {
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  recipient_id?: string
  recipient_ids?: string[]
  sender_id?: string
  entity_type?: EntityType
  entity_id?: string
  metadata?: NotificationMetadata
  action_url?: string
  action_label?: string
  expires_at?: string
  channels?: NotificationChannel[]
  template_id?: string
  template_data?: Record<string, any>
}

export interface UpdateNotificationData {
  title?: string
  message?: string
  priority?: NotificationPriority
  status?: NotificationStatus
  read_at?: string
  metadata?: NotificationMetadata
  action_url?: string
  action_label?: string
  expires_at?: string
}

export interface NotificationFilter {
  type?: NotificationType | NotificationType[]
  priority?: NotificationPriority | NotificationPriority[]
  status?: NotificationStatus | NotificationStatus[]
  is_read?: boolean
  sender_id?: string
  entity_type?: EntityType
  entity_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface NotificationSort {
  field: 'created_at' | 'updated_at' | 'priority' | 'type' | 'status'
  direction: 'asc' | 'desc'
}

export interface PaginatedNotifications {
  notifications: Notification[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Enums
export type NotificationType = 
  | 'system'
  | 'user_activity'
  | 'project_update'
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue'
  | 'file_shared'
  | 'file_uploaded'
  | 'comment_added'
  | 'mention'
  | 'team_invitation'
  | 'team_update'
  | 'security_alert'
  | 'backup_completed'
  | 'backup_failed'
  | 'report_generated'
  | 'maintenance'
  | 'custom'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'expired'

export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'

export type ChannelType = 'in_app' | 'email' | 'push' | 'sms' | 'webhook'

export type EntityType = 
  | 'user'
  | 'team'
  | 'project'
  | 'task'
  | 'file'
  | 'comment'
  | 'report'
  | 'system'
  | 'backup'
  | 'activity'

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

export type MessageType = 
  | 'notification'
  | 'notification_read'
  | 'notification_deleted'
  | 'user_online'
  | 'user_offline'
  | 'typing_start'
  | 'typing_stop'
  | 'ping'
  | 'pong'
  | 'error'

// Constants
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  system: 'Sistema',
  user_activity: 'Atividade do Usuário',
  project_update: 'Atualização de Projeto',
  task_assigned: 'Tarefa Atribuída',
  task_completed: 'Tarefa Concluída',
  task_overdue: 'Tarefa Atrasada',
  file_shared: 'Arquivo Compartilhado',
  file_uploaded: 'Arquivo Enviado',
  comment_added: 'Comentário Adicionado',
  mention: 'Menção',
  team_invitation: 'Convite de Equipe',
  team_update: 'Atualização de Equipe',
  security_alert: 'Alerta de Segurança',
  backup_completed: 'Backup Concluído',
  backup_failed: 'Backup Falhou',
  report_generated: 'Relatório Gerado',
  maintenance: 'Manutenção',
  custom: 'Personalizado'
}

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
}

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  delivered: 'Entregue',
  failed: 'Falhou',
  expired: 'Expirado'
}

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  in_app: 'No App',
  email: 'E-mail',
  push: 'Push',
  sms: 'SMS',
  webhook: 'Webhook'
}

export const NOTIFICATION_FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  immediate: 'Imediato',
  hourly: 'A cada hora',
  daily: 'Diário',
  weekly: 'Semanal',
  never: 'Nunca'
}

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  system: 'text-gray-600',
  user_activity: 'text-blue-600',
  project_update: 'text-green-600',
  task_assigned: 'text-purple-600',
  task_completed: 'text-green-600',
  task_overdue: 'text-red-600',
  file_shared: 'text-indigo-600',
  file_uploaded: 'text-blue-600',
  comment_added: 'text-teal-600',
  mention: 'text-orange-600',
  team_invitation: 'text-purple-600',
  team_update: 'text-blue-600',
  security_alert: 'text-red-600',
  backup_completed: 'text-green-600',
  backup_failed: 'text-red-600',
  report_generated: 'text-indigo-600',
  maintenance: 'text-yellow-600',
  custom: 'text-gray-600'
}

export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-blue-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600'
}

// Type Guards
export const isNotificationType = (value: string): value is NotificationType => {
  return Object.keys(NOTIFICATION_TYPE_LABELS).includes(value as NotificationType)
}

export const isNotificationPriority = (value: string): value is NotificationPriority => {
  return Object.keys(NOTIFICATION_PRIORITY_LABELS).includes(value as NotificationPriority)
}

export const isNotificationStatus = (value: string): value is NotificationStatus => {
  return Object.keys(NOTIFICATION_STATUS_LABELS).includes(value as NotificationStatus)
}

// Utility Functions
export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    system: '⚙️',
    user_activity: '👤',
    project_update: '📋',
    task_assigned: '📝',
    task_completed: '✅',
    task_overdue: '⏰',
    file_shared: '📤',
    file_uploaded: '📁',
    comment_added: '💬',
    mention: '👋',
    team_invitation: '👥',
    team_update: '🔄',
    security_alert: '🔒',
    backup_completed: '💾',
    backup_failed: '❌',
    report_generated: '📊',
    maintenance: '🔧',
    custom: '🔔'
  }
  return icons[type] || '🔔'
}

export const getNotificationColor = (priority: NotificationPriority): string => {
  const colors: Record<NotificationPriority, string> = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600'
  }
  return colors[priority]
}

export const getNotificationBadgeColor = (priority: NotificationPriority): string => {
  const colors: Record<NotificationPriority, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  }
  return colors[priority]
}

export const formatNotificationTime = (date: string): string => {
  const now = new Date()
  const notificationDate = new Date(date)
  const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Agora'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m atrás`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h atrás`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `${days}d atrás`
  }
}

export const validateNotificationData = (data: CreateNotificationData): string[] => {
  const errors: string[] = []

  if (!data.title?.trim()) {
    errors.push('Título é obrigatório')
  }

  if (!data.message?.trim()) {
    errors.push('Mensagem é obrigatória')
  }

  if (!isNotificationType(data.type)) {
    errors.push('Tipo de notificação inválido')
  }

  if (data.priority && !isNotificationPriority(data.priority)) {
    errors.push('Prioridade inválida')
  }

  if (!data.recipient_id && !data.recipient_ids?.length) {
    errors.push('Pelo menos um destinatário é obrigatório')
  }

  if (data.expires_at) {
    const expiryDate = new Date(data.expires_at)
    if (expiryDate <= new Date()) {
      errors.push('Data de expiração deve ser no futuro')
    }
  }

  return errors
}

export const createNotificationTemplate = (
  type: NotificationType,
  entityName?: string,
  userName?: string,
  additionalData?: Record<string, any>
): { title: string; message: string } => {
  const templates: Record<NotificationType, { title: string; message: string }> = {
    system: {
      title: 'Notificação do Sistema',
      message: 'Uma atualização do sistema foi realizada.'
    },
    user_activity: {
      title: 'Atividade do Usuário',
      message: `${userName || 'Um usuário'} realizou uma atividade.`
    },
    project_update: {
      title: 'Projeto Atualizado',
      message: `O projeto "${entityName || 'Projeto'}" foi atualizado.`
    },
    task_assigned: {
      title: 'Nova Tarefa Atribuída',
      message: `A tarefa "${entityName || 'Tarefa'}" foi atribuída a você.`
    },
    task_completed: {
      title: 'Tarefa Concluída',
      message: `A tarefa "${entityName || 'Tarefa'}" foi concluída.`
    },
    task_overdue: {
      title: 'Tarefa Atrasada',
      message: `A tarefa "${entityName || 'Tarefa'}" está atrasada.`
    },
    file_shared: {
      title: 'Arquivo Compartilhado',
      message: `O arquivo "${entityName || 'Arquivo'}" foi compartilhado com você.`
    },
    file_uploaded: {
      title: 'Novo Arquivo',
      message: `O arquivo "${entityName || 'Arquivo'}" foi enviado.`
    },
    comment_added: {
      title: 'Novo Comentário',
      message: `${userName || 'Alguém'} adicionou um comentário.`
    },
    mention: {
      title: 'Você foi Mencionado',
      message: `${userName || 'Alguém'} mencionou você em um comentário.`
    },
    team_invitation: {
      title: 'Convite de Equipe',
      message: `Você foi convidado para a equipe "${entityName || 'Equipe'}".`
    },
    team_update: {
      title: 'Equipe Atualizada',
      message: `A equipe "${entityName || 'Equipe'}" foi atualizada.`
    },
    security_alert: {
      title: 'Alerta de Segurança',
      message: 'Uma atividade suspeita foi detectada em sua conta.'
    },
    backup_completed: {
      title: 'Backup Concluído',
      message: 'O backup do sistema foi concluído com sucesso.'
    },
    backup_failed: {
      title: 'Falha no Backup',
      message: 'O backup do sistema falhou. Verifique os logs para mais detalhes.'
    },
    report_generated: {
      title: 'Relatório Gerado',
      message: `O relatório "${entityName || 'Relatório'}" foi gerado e está disponível.`
    },
    maintenance: {
      title: 'Manutenção Programada',
      message: 'O sistema entrará em manutenção em breve.'
    },
    custom: {
      title: 'Notificação',
      message: 'Você tem uma nova notificação.'
    }
  }

  return templates[type] || templates.custom
}