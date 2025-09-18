// Serviço de Controle de Acesso Baseado em Funções (RBAC)
// Gerenciamento de usuários, funções, permissões e auditoria

import { createClient } from '@supabase/supabase-js'
import { 
  User, 
  TeamMember, 
  UserRole, 
  Permission, 
  CreateUserForm, 
  UpdateUserForm, 
  UserFilters, 
  UserSearchParams, 
  UsersResponse,
  AuditLog,
  Company,
  CompanySettings,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  ROLE_DEFINITIONS
} from '@/types/rbac'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export class RBACService {
  // ==================== USUÁRIOS ====================
  
  /**
   * Busca usuários com filtros e paginação
   */
  async getUsers(params: UserSearchParams, companyId: string): Promise<UsersResponse> {
    try {
      let query = supabase
        .from('team_members')
        .select(`
          *,
          user:users(email, full_name, avatar_url, last_login)
        `)
        .eq('company_id', companyId)

      // Aplicar filtros
      if (params.filters.role?.length) {
        query = query.in('role', params.filters.role)
      }

      if (params.filters.department?.length) {
        query = query.in('department', params.filters.department)
      }

      if (params.filters.is_active !== undefined) {
        query = query.eq('is_active', params.filters.is_active)
      }

      if (params.filters.search) {
        query = query.or(`
          user.full_name.ilike.%${params.filters.search}%,
          user.email.ilike.%${params.filters.search}%
        `)
      }

      // Contar total
      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

      // Aplicar filtros para contagem
      let countQuery = supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

      if (params.filters.role) {
        countQuery = countQuery.eq('role', params.filters.role)
      }

      if (params.filters.is_active !== undefined) {
        countQuery = countQuery.eq('is_active', params.filters.is_active)
      }

      if (params.filters.search) {
        countQuery = countQuery.or(`
          user.full_name.ilike.%${params.filters.search}%,
          user.email.ilike.%${params.filters.search}%
        `)
      }

      const { count: filteredCount } = await countQuery

      // Aplicar ordenação e paginação
      const { data, error } = await query
        .order(params.sort_field, { ascending: params.sort_direction === 'asc' })
        .range(
          (params.page - 1) * params.limit,
          params.page * params.limit - 1
        )

      if (error) throw error

      return {
        users: data as TeamMember[],
        total: filteredCount || 0,
        total_pages: Math.ceil((filteredCount || 0) / params.limit),
        current_page: params.page
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }
  }

  /**
   * Busca usuário por ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
  }

  /**
   * Busca usuário atual autenticado
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      return await this.getUserById(user.id)
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error)
      return null
    }
  }

  /**
   * Cria novo usuário
   */
  async createUser(userData: CreateUserForm, companyId: string): Promise<User> {
    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: this.generateTemporaryPassword(),
        email_confirm: true
      })

      if (authError) throw authError

      // Criar perfil do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          company_id: companyId,
          phone: userData.phone,
          is_active: true
        })
        .select()
        .single()

      if (userError) throw userError

      // Criar membro da equipe
      await supabase
        .from('team_members')
        .insert({
          user_id: authData.user.id,
          company_id: companyId,
          role: userData.role,
          department: userData.department,
          manager_id: userData.manager_id,
          is_active: true
        })

      // Log da ação
      await this.logAction('user_created', 'user', authData.user.id, {
        email: userData.email,
        role: userData.role
      })

      return user
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      throw error
    }
  }

  /**
   * Atualiza usuário
   */
  async updateUser(userId: string, userData: UpdateUserForm): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Atualizar membro da equipe se necessário
      if (userData.role || userData.department) {
        await supabase
          .from('team_members')
          .update({
            role: userData.role,
            department: userData.department,
            is_active: userData.is_active
          })
          .eq('user_id', userId)
      }

      // Log da ação
      await this.logAction('user_updated', 'user', userId, userData)

      return data
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  }

  /**
   * Desativa usuário
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)

      await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('user_id', userId)

      // Log da ação
      await this.logAction('user_deactivated', 'user', userId)
    } catch (error) {
      console.error('Erro ao desativar usuário:', error)
      throw error
    }
  }

  /**
   * Exclui usuário
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // Remover da equipe
      await supabase
        .from('team_members')
        .delete()
        .eq('user_id', userId)

      // Remover perfil
      await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      // Remover do auth
      await supabase.auth.admin.deleteUser(userId)

      // Log da ação
      await this.logAction('user_deleted', 'user', userId)
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      throw error
    }
  }

  // ==================== PERMISSÕES ====================

  /**
   * Verifica se usuário tem permissão específica
   */
  async checkPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)
      if (!user) return false

      return hasPermission(user, permission)
    } catch (error) {
      console.error('Erro ao verificar permissão:', error)
      return false
    }
  }

  /**
   * Verifica se usuário tem qualquer uma das permissões
   */
  async checkAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)
      if (!user) return false

      return hasAnyPermission(user, permissions)
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      return false
    }
  }

  /**
   * Verifica se usuário tem todas as permissões
   */
  async checkAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)
      if (!user) return false

      return hasAllPermissions(user, permissions)
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      return false
    }
  }

  /**
   * Busca permissões do usuário
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const user = await this.getUserById(userId)
      if (!user) return []

      const roleDefinition = ROLE_DEFINITIONS[user.role]
      return roleDefinition.permissions
    } catch (error) {
      console.error('Erro ao buscar permissões:', error)
      return []
    }
  }

  // ==================== EMPRESA ====================

  /**
   * Busca configurações da empresa
   */
  async getCompanySettings(companyId: string): Promise<CompanySettings | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', companyId)
        .single()

      if (error) throw error
      return data?.settings || null
    } catch (error) {
      console.error('Erro ao buscar configurações da empresa:', error)
      return null
    }
  }

  /**
   * Atualiza configurações da empresa
   */
  async updateCompanySettings(companyId: string, settings: Partial<CompanySettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ settings })
        .eq('id', companyId)

      if (error) throw error

      // Log da ação
      await this.logAction('company_settings_updated', 'company', companyId, settings)
    } catch (error) {
      console.error('Erro ao atualizar configurações da empresa:', error)
      throw error
    }
  }

  // ==================== AUDITORIA ====================

  /**
   * Registra ação no log de auditoria
   */
  async logAction(
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return

      await supabase
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          company_id: currentUser.company_id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: details || {},
          user_email: currentUser.email,
          user_name: currentUser.full_name
        })
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error)
    }
  }

  /**
   * Busca logs de auditoria
   */
  async getAuditLogs(
    companyId: string,
    filters?: {
      user_id?: string
      action?: string
      resource_type?: string
      date_from?: string
      date_to?: string
    },
    page = 1,
    limit = 50
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters?.action) {
        query = query.eq('action', filters.action)
      }

      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error

      return {
        logs: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return { logs: [], total: 0 }
    }
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Gera senha temporária
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  /**
   * Busca departamentos disponíveis
   */
  async getDepartments(companyId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('department')
        .eq('company_id', companyId)
        .not('department', 'is', null)

      if (error) throw error

      const departments = [...new Set(data.map(item => item.department).filter(Boolean))]
      return departments.sort()
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error)
      return []
    }
  }

  /**
   * Busca gerentes disponíveis
   */
  async getManagers(companyId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:users(email, full_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .in('role', ['admin', 'leader'])
        .eq('is_active', true)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar gerentes:', error)
      return []
    }
  }

  /**
   * Busca estatísticas da equipe
   */
  async getTeamStats(companyId: string): Promise<{
    total_users: number
    active_users: number
    by_role: Record<UserRole, number>
    by_department: Record<string, number>
  }> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('role, department, is_active')
        .eq('company_id', companyId)

      if (error) throw error

      const stats = {
        total_users: data.length,
        active_users: data.filter(u => u.is_active).length,
        by_role: {} as Record<UserRole, number>,
        by_department: {} as Record<string, number>
      }

      // Contar por função
      data.forEach(user => {
        stats.by_role[user.role as keyof typeof stats.by_role] = (stats.by_role[user.role as keyof typeof stats.by_role] || 0) + 1
      })

      // Contar por departamento
      data.forEach(user => {
        if (user.department) {
          stats.by_department[user.department] = (stats.by_department[user.department] || 0) + 1
        }
      })

      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas da equipe:', error)
      return {
        total_users: 0,
        active_users: 0,
        by_role: {} as Record<UserRole, number>,
        by_department: {} as Record<string, number>
      }
    }
  }

  /**
   * Envia convite por email para novo usuário
   */
  async sendUserInvite(email: string, temporaryPassword: string): Promise<void> {
    try {
      // Implementar envio de email
      // Por enquanto, apenas log
      console.log(`Convite enviado para ${email} com senha temporária: ${temporaryPassword}`)
    } catch (error) {
      console.error('Erro ao enviar convite:', error)
      throw error
    }
  }

  /**
   * Redefine senha do usuário
   */
  async resetUserPassword(userId: string): Promise<string> {
    try {
      const newPassword = this.generateTemporaryPassword()
      
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (error) throw error

      // Log da ação
      await this.logAction('password_reset', 'user', userId)

      return newPassword
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      throw error
    }
  }
}

// Instância singleton do serviço
export const rbacService = new RBACService()