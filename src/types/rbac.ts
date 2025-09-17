// Sistema de Controle de Acesso Baseado em Funções (RBAC)
// Tipos e interfaces para gerenciamento de permissões e funções

export type UserRole = 'admin' | 'leader' | 'operator'

export type Permission = 
  // Permissões de Pedidos
  | 'orders:read'
  | 'orders:create'
  | 'orders:update'
  | 'orders:delete'
  | 'orders:sync'
  | 'orders:export'
  
  // Permissões de Tickets
  | 'tickets:read'
  | 'tickets:create'
  | 'tickets:update'
  | 'tickets:delete'
  | 'tickets:assign'
  | 'tickets:close'
  | 'tickets:export'
  
  // Permissões de Usuários
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:manage_roles'
  
  // Permissões de Configurações
  | 'settings:read'
  | 'settings:update'
  | 'settings:bling_config'
  | 'settings:marketplace_config'
  
  // Permissões de Relatórios
  | 'reports:read'
  | 'reports:export'
  | 'reports:advanced'
  
  // Permissões de Sistema
  | 'system:admin'
  | 'system:logs'
  | 'system:backup'

export interface RoleDefinition {
  role: UserRole
  name: string
  description: string
  permissions: Permission[]
  color: string
  icon: string
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  company_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
  
  // Campos específicos do perfil
  phone?: string
  department?: string
  manager_id?: string
  
  // Configurações pessoais
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'pt-BR' | 'en-US'
  timezone: string
  notifications: NotificationSettings
  dashboard_layout?: DashboardLayout
}

export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  
  // Tipos específicos de notificação
  new_orders: boolean
  order_updates: boolean
  new_tickets: boolean
  ticket_assignments: boolean
  sla_alerts: boolean
  system_alerts: boolean
}

export interface DashboardLayout {
  widgets: DashboardWidget[]
  layout: 'grid' | 'list'
  refresh_interval: number
}

export interface DashboardWidget {
  id: string
  type: 'orders_stats' | 'tickets_stats' | 'revenue_chart' | 'recent_activity'
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
  is_visible: boolean
}

export interface Company {
  id: string
  name: string
  document: string // CNPJ
  email: string
  phone?: string
  address?: Address
  
  // Configurações da empresa
  settings: CompanySettings
  
  // Plano e limites
  plan: 'basic' | 'professional' | 'enterprise'
  limits: CompanyLimits
  
  // Datas
  created_at: string
  updated_at: string
}

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  country: string
}

export interface CompanySettings {
  // Configurações gerais
  timezone: string
  currency: string
  date_format: string
  
  // Configurações de integração
  bling_config?: BlingConfig
  marketplace_configs: MarketplaceConfig[]
  
  // Configurações de tickets
  ticket_settings: TicketSettings
  
  // Configurações de notificação
  notification_settings: CompanyNotificationSettings
}

export interface BlingConfig {
  client_id: string
  client_secret: string
  access_token?: string
  refresh_token?: string
  expires_at?: string
  is_active: boolean
  last_sync?: string
}

export interface MarketplaceConfig {
  marketplace: string
  is_active: boolean
  credentials: Record<string, string>
  sync_settings: {
    auto_sync: boolean
    sync_interval: number // em minutos
    last_sync?: string
  }
}

export interface TicketSettings {
  auto_assign: boolean
  default_priority: 'low' | 'medium' | 'high' | 'urgent'
  sla_hours: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  escalation_rules: EscalationRule[]
}

export interface EscalationRule {
  id: string
  name: string
  conditions: EscalationCondition[]
  actions: EscalationAction[]
  is_active: boolean
}

export interface EscalationCondition {
  field: 'priority' | 'status' | 'time_elapsed' | 'marketplace'
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than'
  value: string | number
}

export interface EscalationAction {
  type: 'assign_to' | 'change_priority' | 'send_notification' | 'create_task'
  config: Record<string, any>
}

export interface CompanyNotificationSettings {
  email_from: string
  email_templates: EmailTemplate[]
  webhook_urls: WebhookConfig[]
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'ticket_created' | 'ticket_updated' | 'order_created' | 'sla_breach'
  is_active: boolean
}

export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  headers?: Record<string, string>
  is_active: boolean
}

export interface CompanyLimits {
  max_users: number
  max_orders_per_month: number
  max_tickets_per_month: number
  max_storage_gb: number
  api_calls_per_hour: number
}

export interface TeamMember {
  id: string
  user_id: string
  company_id: string
  role: UserRole
  department?: string
  manager_id?: string
  is_active: boolean
  joined_at: string
  
  // Dados do usuário
  user: Pick<User, 'email' | 'full_name' | 'avatar_url' | 'last_login'>
  
  // Estatísticas
  stats?: TeamMemberStats
}

export interface TeamMemberStats {
  tickets_assigned: number
  tickets_resolved: number
  avg_resolution_time: number // em horas
  orders_processed: number
  last_activity: string
}

export interface RolePermissionCheck {
  user: User
  permission: Permission
  resource?: string
  company_id?: string
}

export interface AuditLog {
  id: string
  user_id: string
  company_id: string
  action: string
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  
  // Dados do usuário para facilitar consultas
  user_email: string
  user_name: string
}

// Definições de funções padrão
export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  admin: {
    role: 'admin',
    name: 'Administrador',
    description: 'Acesso completo ao sistema',
    color: 'red',
    icon: 'Shield',
    permissions: [
      // Todas as permissões
      'orders:read', 'orders:create', 'orders:update', 'orders:delete', 'orders:sync', 'orders:export',
      'tickets:read', 'tickets:create', 'tickets:update', 'tickets:delete', 'tickets:assign', 'tickets:close', 'tickets:export',
      'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage_roles',
      'settings:read', 'settings:update', 'settings:bling_config', 'settings:marketplace_config',
      'reports:read', 'reports:export', 'reports:advanced',
      'system:admin', 'system:logs', 'system:backup'
    ]
  },
  leader: {
    role: 'leader',
    name: 'Líder',
    description: 'Gerencia equipe e operações',
    color: 'blue',
    icon: 'Users',
    permissions: [
      'orders:read', 'orders:create', 'orders:update', 'orders:sync', 'orders:export',
      'tickets:read', 'tickets:create', 'tickets:update', 'tickets:assign', 'tickets:close', 'tickets:export',
      'users:read', 'users:update',
      'settings:read', 'settings:update',
      'reports:read', 'reports:export', 'reports:advanced'
    ]
  },
  operator: {
    role: 'operator',
    name: 'Operador',
    description: 'Executa operações básicas',
    color: 'green',
    icon: 'User',
    permissions: [
      'orders:read', 'orders:update',
      'tickets:read', 'tickets:create', 'tickets:update',
      'settings:read',
      'reports:read'
    ]
  }
}

// Utilitários para verificação de permissões
export const hasPermission = (user: User, permission: Permission): boolean => {
  const roleDefinition = ROLE_DEFINITIONS[user.role]
  return roleDefinition.permissions.includes(permission)
}

export const hasAnyPermission = (user: User, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(user, permission))
}

export const hasAllPermissions = (user: User, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(user, permission))
}

export const canAccessResource = (user: User, resource: string, action: string): boolean => {
  const permission = `${resource}:${action}` as Permission
  return hasPermission(user, permission)
}

// Tipos para formulários e componentes
export interface CreateUserForm {
  email: string
  full_name: string
  role: UserRole
  phone?: string
  department?: string
  manager_id?: string
}

export interface UpdateUserForm {
  full_name?: string
  role?: UserRole
  phone?: string
  department?: string
  manager_id?: string
  is_active?: boolean
}

export interface UserFilters {
  role?: UserRole[]
  department?: string[]
  is_active?: boolean
  search?: string
}

export interface UserSearchParams {
  filters: UserFilters
  page: number
  limit: number
  sort_field: 'full_name' | 'email' | 'role' | 'created_at' | 'last_login'
  sort_direction: 'asc' | 'desc'
}

export interface UsersResponse {
  users: TeamMember[]
  total: number
  total_pages: number
  current_page: number
}

// Tipos para componentes de interface
export interface RoleSelectOption {
  value: UserRole
  label: string
  description: string
  color: string
  disabled?: boolean
}

export interface PermissionGroup {
  name: string
  description: string
  permissions: {
    permission: Permission
    label: string
    description: string
  }[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Pedidos',
    description: 'Gerenciamento de pedidos e sincronização',
    permissions: [
      { permission: 'orders:read', label: 'Visualizar', description: 'Ver lista e detalhes dos pedidos' },
      { permission: 'orders:create', label: 'Criar', description: 'Criar novos pedidos' },
      { permission: 'orders:update', label: 'Editar', description: 'Editar pedidos existentes' },
      { permission: 'orders:delete', label: 'Excluir', description: 'Excluir pedidos' },
      { permission: 'orders:sync', label: 'Sincronizar', description: 'Sincronizar com Bling API' },
      { permission: 'orders:export', label: 'Exportar', description: 'Exportar dados de pedidos' }
    ]
  },
  {
    name: 'Tickets',
    description: 'Sistema de suporte e atendimento',
    permissions: [
      { permission: 'tickets:read', label: 'Visualizar', description: 'Ver lista e detalhes dos tickets' },
      { permission: 'tickets:create', label: 'Criar', description: 'Criar novos tickets' },
      { permission: 'tickets:update', label: 'Editar', description: 'Editar tickets existentes' },
      { permission: 'tickets:delete', label: 'Excluir', description: 'Excluir tickets' },
      { permission: 'tickets:assign', label: 'Atribuir', description: 'Atribuir tickets para membros da equipe' },
      { permission: 'tickets:close', label: 'Fechar', description: 'Fechar e resolver tickets' },
      { permission: 'tickets:export', label: 'Exportar', description: 'Exportar dados de tickets' }
    ]
  },
  {
    name: 'Usuários',
    description: 'Gerenciamento de usuários e equipe',
    permissions: [
      { permission: 'users:read', label: 'Visualizar', description: 'Ver lista e perfis dos usuários' },
      { permission: 'users:create', label: 'Criar', description: 'Criar novos usuários' },
      { permission: 'users:update', label: 'Editar', description: 'Editar perfis de usuários' },
      { permission: 'users:delete', label: 'Excluir', description: 'Excluir usuários' },
      { permission: 'users:manage_roles', label: 'Gerenciar Funções', description: 'Alterar funções e permissões' }
    ]
  },
  {
    name: 'Configurações',
    description: 'Configurações do sistema e integrações',
    permissions: [
      { permission: 'settings:read', label: 'Visualizar', description: 'Ver configurações do sistema' },
      { permission: 'settings:update', label: 'Editar', description: 'Alterar configurações gerais' },
      { permission: 'settings:bling_config', label: 'Config. Bling', description: 'Configurar integração com Bling' },
      { permission: 'settings:marketplace_config', label: 'Config. Marketplaces', description: 'Configurar marketplaces' }
    ]
  },
  {
    name: 'Relatórios',
    description: 'Relatórios e análises',
    permissions: [
      { permission: 'reports:read', label: 'Visualizar', description: 'Ver relatórios básicos' },
      { permission: 'reports:export', label: 'Exportar', description: 'Exportar relatórios' },
      { permission: 'reports:advanced', label: 'Avançados', description: 'Acessar relatórios avançados' }
    ]
  },
  {
    name: 'Sistema',
    description: 'Administração do sistema',
    permissions: [
      { permission: 'system:admin', label: 'Administração', description: 'Acesso administrativo completo' },
      { permission: 'system:logs', label: 'Logs', description: 'Visualizar logs do sistema' },
      { permission: 'system:backup', label: 'Backup', description: 'Gerenciar backups' }
    ]
  }
]