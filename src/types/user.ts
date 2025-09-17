export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  department?: string
  position?: string
  phone?: string
  bio?: string
  skills?: string[]
  location?: string
  timezone?: string
  status: UserStatus
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer'

export type UserStatus = 'online' | 'away' | 'busy' | 'offline'

export interface UserProfile {
  id: string
  user_id: string
  full_name?: string
  avatar_url?: string
  department?: string
  position?: string
  phone?: string
  bio?: string
  skills?: string[]
  location?: string
  timezone?: string
  social_links?: SocialLinks
  preferences?: UserPreferences
  created_at: string
  updated_at: string
}

export interface SocialLinks {
  linkedin?: string
  github?: string
  twitter?: string
  website?: string
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  notifications?: NotificationPreferences
  dashboard_layout?: string
  timezone?: string
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  task_assignments: boolean
  project_updates: boolean
  mentions: boolean
  deadlines: boolean
  team_activities: boolean
}

export interface Team {
  id: string
  name: string
  description?: string
  avatar_url?: string
  color?: string
  department?: string
  manager_id?: string
  is_active: boolean
  member_count: number
  created_at: string
  updated_at: string
  created_by: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  joined_at: string
  added_by: string
  is_active: boolean
  user?: User
}

export type TeamRole = 'leader' | 'member'

export interface TeamInvitation {
  id: string
  team_id: string
  email: string
  role: TeamRole
  invited_by: string
  status: InvitationStatus
  expires_at: string
  created_at: string
  team?: Team
  inviter?: User
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface UserActivity {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: User
}

export interface UserSession {
  id: string
  user_id: string
  token: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
  last_activity: string
  expires_at: string
  created_at: string
}

// DTOs para criação e atualização
export interface CreateUserData {
  email: string
  password: string
  full_name?: string
  role?: UserRole
  department?: string
  position?: string
  phone?: string
}

export interface UpdateUserData {
  full_name?: string
  avatar_url?: string
  department?: string
  position?: string
  phone?: string
  bio?: string
  skills?: string[]
  location?: string
  timezone?: string
  role?: UserRole
  is_active?: boolean
}

export interface UpdateUserProfileData {
  full_name?: string
  avatar_url?: string
  department?: string
  position?: string
  phone?: string
  bio?: string
  skills?: string[]
  location?: string
  timezone?: string
  social_links?: SocialLinks
  preferences?: UserPreferences
}

export interface CreateTeamData {
  name: string
  description?: string
  avatar_url?: string
  color?: string
  department?: string
  manager_id?: string
}

export interface UpdateTeamData {
  name?: string
  description?: string
  avatar_url?: string
  color?: string
  department?: string
  manager_id?: string
  is_active?: boolean
}

export interface AddTeamMemberData {
  user_id: string
  role: TeamRole
}

export interface CreateTeamInvitationData {
  team_id: string
  email: string
  role: TeamRole
}

// Filtros e consultas
export interface UserFilters {
  role?: UserRole
  department?: string
  status?: UserStatus
  is_active?: boolean
  search?: string
  skills?: string[]
  location?: string
}

export interface TeamFilters {
  department?: string
  manager_id?: string
  is_active?: boolean
  search?: string
}

export interface UserActivityFilters {
  user_id?: string
  action?: string
  entity_type?: string
  entity_id?: string
  start_date?: string
  end_date?: string
}

// Estatísticas e relatórios
export interface UserStats {
  total_users: number
  active_users: number
  users_by_role: Record<UserRole, number>
  users_by_department: Record<string, number>
  users_by_status: Record<UserStatus, number>
  new_users_this_month: number
  login_activity: {
    date: string
    count: number
  }[]
}

export interface TeamStats {
  total_teams: number
  active_teams: number
  teams_by_department: Record<string, number>
  average_team_size: number
  largest_team: {
    name: string
    member_count: number
  }
  team_growth: {
    date: string
    count: number
  }[]
}

// Permissões
export interface UserPermissions {
  can_create_projects: boolean
  can_manage_users: boolean
  can_manage_teams: boolean
  can_view_analytics: boolean
  can_manage_system: boolean
  can_export_data: boolean
}

// Configurações de usuário
export interface UserSettings {
  id: string
  user_id: string
  notifications: NotificationPreferences
  privacy: {
    show_email: boolean
    show_phone: boolean
    show_location: boolean
    allow_mentions: boolean
  }
  security: {
    two_factor_enabled: boolean
    session_timeout: number
    login_notifications: boolean
  }
  created_at: string
  updated_at: string
}

// Tipos para componentes
export interface UserSelectOption {
  value: string
  label: string
  avatar?: string
  role?: UserRole
  department?: string
}

export interface TeamSelectOption {
  value: string
  label: string
  avatar?: string
  department?: string
  member_count?: number
}

// Tipos para formulários
export interface UserFormData extends CreateUserData {
  confirm_password?: string
}

export interface TeamFormData extends CreateTeamData {
  initial_members?: string[]
}

// Tipos para notificações
export interface UserNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  is_read: boolean
  created_at: string
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'project_updated'
  | 'team_invitation'
  | 'mention'
  | 'deadline_reminder'
  | 'system_update'

// Tipos para busca e paginação
export interface UserSearchResult {
  users: User[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface TeamSearchResult {
  teams: Team[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Tipos para importação/exportação
export interface UserImportData {
  email: string
  full_name?: string
  role?: UserRole
  department?: string
  position?: string
  phone?: string
}

export interface UserExportData extends User {
  team_names?: string[]
  project_count?: number
  task_count?: number
  last_activity?: string
}

// Tipos para auditoria
export interface UserAuditLog {
  id: string
  user_id: string
  action: string
  target_type: string
  target_id: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  performed_by: string
  performer?: User
}

// Constantes
export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
  { value: 'manager', label: 'Gerente', description: 'Gerencia equipes e projetos' },
  { value: 'member', label: 'Membro', description: 'Acesso padrão a projetos e tarefas' },
  { value: 'viewer', label: 'Visualizador', description: 'Apenas visualização' }
]

export const USER_STATUSES: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online', label: 'Online', color: 'bg-green-100 text-green-800' },
  { value: 'away', label: 'Ausente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'busy', label: 'Ocupado', color: 'bg-red-100 text-red-800' },
  { value: 'offline', label: 'Offline', color: 'bg-gray-100 text-gray-800' }
]

export const TEAM_ROLES: { value: TeamRole; label: string; description: string }[] = [
  { value: 'leader', label: 'Líder', description: 'Gerencia a equipe' },
  { value: 'member', label: 'Membro', description: 'Membro da equipe' }
]