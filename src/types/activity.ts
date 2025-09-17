export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  user_id: string
  user_name: string
  user_avatar?: string
  entity_type: EntityType
  entity_id: string
  entity_name?: string
  metadata?: ActivityMetadata
  created_at: string
  updated_at: string
}

export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_status_changed'
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_status_changed'
  | 'task_assigned'
  | 'task_completed'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_activated'
  | 'user_deactivated'
  | 'team_created'
  | 'team_updated'
  | 'team_deleted'
  | 'team_member_added'
  | 'team_member_removed'
  | 'comment_added'
  | 'file_uploaded'
  | 'file_deleted'
  | 'login'
  | 'logout'
  | 'password_changed'
  | 'profile_updated'

export type EntityType = 'project' | 'task' | 'user' | 'team' | 'comment' | 'file' | 'system'

export interface ActivityMetadata {
  old_value?: any
  new_value?: any
  changes?: string[]
  ip_address?: string
  user_agent?: string
  location?: string
  additional_info?: Record<string, any>
}

export interface ActivityFilter {
  user_id?: string
  entity_type?: EntityType
  entity_id?: string
  activity_type?: ActivityType
  date_from?: string
  date_to?: string
  search?: string
}

export interface ActivityStats {
  total_activities: number
  activities_today: number
  activities_this_week: number
  activities_this_month: number
  most_active_users: UserActivityStat[]
  activity_by_type: ActivityTypeStat[]
  activity_by_day: ActivityDayStat[]
}

export interface UserActivityStat {
  user_id: string
  user_name: string
  user_avatar?: string
  activity_count: number
}

export interface ActivityTypeStat {
  type: ActivityType
  count: number
  percentage: number
}

export interface ActivityDayStat {
  date: string
  count: number
}

export interface TimelineEvent {
  id: string
  date: string
  activities: Activity[]
}

export interface DashboardStats {
  total_projects: number
  active_projects: number
  completed_projects: number
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  overdue_tasks: number
  total_users: number
  active_users: number
  total_teams: number
  recent_activities: Activity[]
}

export interface ProjectProgress {
  project_id: string
  project_name: string
  progress_percentage: number
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  team_members: number
  status: string
  due_date?: string
}

export interface TaskDistribution {
  status: string
  count: number
  percentage: number
  color: string
}

export interface UserPerformance {
  user_id: string
  user_name: string
  user_avatar?: string
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
  completion_rate: number
  avg_completion_time: number
}

export interface TeamPerformance {
  team_id: string
  team_name: string
  team_avatar?: string
  total_members: number
  active_members: number
  completed_tasks: number
  pending_tasks: number
  completion_rate: number
  productivity_score: number
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  response_time: number
  error_rate: number
  active_sessions: number
  database_status: 'connected' | 'disconnected' | 'slow'
  storage_usage: number
  memory_usage: number
}

export interface NotificationSummary {
  total_notifications: number
  unread_notifications: number
  urgent_notifications: number
  recent_notifications: Notification[]
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  user_id: string
  is_read: boolean
  priority: NotificationPriority
  entity_type?: EntityType
  entity_id?: string
  action_url?: string
  created_at: string
  read_at?: string
}

export type NotificationType =
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  | 'project_deadline'
  | 'team_invitation'
  | 'comment_mention'
  | 'system_update'
  | 'security_alert'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface CreateActivityData {
  type: ActivityType
  title: string
  description?: string
  user_id: string
  entity_type: EntityType
  entity_id: string
  entity_name?: string
  metadata?: ActivityMetadata
}

export interface UpdateActivityData {
  title?: string
  description?: string
  metadata?: ActivityMetadata
}

// Activity type labels for UI
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  project_created: 'Projeto criado',
  project_updated: 'Projeto atualizado',
  project_deleted: 'Projeto excluído',
  project_status_changed: 'Status do projeto alterado',
  task_created: 'Tarefa criada',
  task_updated: 'Tarefa atualizada',
  task_deleted: 'Tarefa excluída',
  task_status_changed: 'Status da tarefa alterado',
  task_assigned: 'Tarefa atribuída',
  task_completed: 'Tarefa concluída',
  user_created: 'Usuário criado',
  user_updated: 'Usuário atualizado',
  user_deleted: 'Usuário excluído',
  user_activated: 'Usuário ativado',
  user_deactivated: 'Usuário desativado',
  team_created: 'Equipe criada',
  team_updated: 'Equipe atualizada',
  team_deleted: 'Equipe excluída',
  team_member_added: 'Membro adicionado à equipe',
  team_member_removed: 'Membro removido da equipe',
  comment_added: 'Comentário adicionado',
  file_uploaded: 'Arquivo enviado',
  file_deleted: 'Arquivo excluído',
  login: 'Login realizado',
  logout: 'Logout realizado',
  password_changed: 'Senha alterada',
  profile_updated: 'Perfil atualizado'
}

// Activity type colors for UI
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  project_created: 'bg-blue-100 text-blue-800',
  project_updated: 'bg-blue-100 text-blue-800',
  project_deleted: 'bg-red-100 text-red-800',
  project_status_changed: 'bg-yellow-100 text-yellow-800',
  task_created: 'bg-green-100 text-green-800',
  task_updated: 'bg-green-100 text-green-800',
  task_deleted: 'bg-red-100 text-red-800',
  task_status_changed: 'bg-yellow-100 text-yellow-800',
  task_assigned: 'bg-purple-100 text-purple-800',
  task_completed: 'bg-green-100 text-green-800',
  user_created: 'bg-indigo-100 text-indigo-800',
  user_updated: 'bg-indigo-100 text-indigo-800',
  user_deleted: 'bg-red-100 text-red-800',
  user_activated: 'bg-green-100 text-green-800',
  user_deactivated: 'bg-gray-100 text-gray-800',
  team_created: 'bg-cyan-100 text-cyan-800',
  team_updated: 'bg-cyan-100 text-cyan-800',
  team_deleted: 'bg-red-100 text-red-800',
  team_member_added: 'bg-green-100 text-green-800',
  team_member_removed: 'bg-orange-100 text-orange-800',
  comment_added: 'bg-gray-100 text-gray-800',
  file_uploaded: 'bg-blue-100 text-blue-800',
  file_deleted: 'bg-red-100 text-red-800',
  login: 'bg-green-100 text-green-800',
  logout: 'bg-gray-100 text-gray-800',
  password_changed: 'bg-yellow-100 text-yellow-800',
  profile_updated: 'bg-blue-100 text-blue-800'
}

// Entity type labels for UI
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  project: 'Projeto',
  task: 'Tarefa',
  user: 'Usuário',
  team: 'Equipe',
  comment: 'Comentário',
  file: 'Arquivo',
  system: 'Sistema'
}

// Notification priority labels
export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
}

// Notification priority colors
export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800'
}