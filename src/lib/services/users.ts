import { supabase } from '@/lib/supabase'
import {
  User,
  UserProfile,
  Team,
  TeamMember,
  TeamInvitation,
  UserActivity,
  UserSession,
  CreateUserData,
  UpdateUserData,
  UpdateUserProfileData,
  CreateTeamData,
  UpdateTeamData,
  AddTeamMemberData,
  CreateTeamInvitationData,
  UserFilters,
  TeamFilters,
  UserActivityFilters,
  UserStats,
  TeamStats,
  UserSearchResult,
  TeamSearchResult,
  UserNotification,
  UserSettings,
  UserAuditLog,
  UserRole,
  TeamRole,
  InvitationStatus
} from '@/types/user'

export class UserService {
  // Gestão de Usuários
  static async getUsers(filters?: UserFilters, page = 1, limit = 20): Promise<UserSearchResult> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          user_profiles(*)
        `, { count: 'exact' })

      // Aplicar filtros
      if (filters?.role) {
        query = query.eq('role', filters.role)
      }
      if (filters?.department) {
        query = query.eq('user_profiles.department', filters.department)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }
      if (filters?.location) {
        query = query.eq('user_profiles.location', filters.location)
      }
      if (filters?.skills && filters.skills.length > 0) {
        query = query.contains('user_profiles.skills', filters.skills)
      }

      // Paginação
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Ordenação
      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        users: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit
      }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  static async getUser(userId: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_profiles(*)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Usuário não encontrado')

      return data
    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error)
      throw new Error(error.message || 'Erro ao buscar usuário')
    }
  }

  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // Criar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          full_name: userData.full_name,
          department: userData.department,
          position: userData.position,
          phone: userData.phone
        })
        .select()
        .single()

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError)
      }

      // Buscar usuário completo
      return await this.getUser(authData.user.id)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  static async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    try {
      // Atualizar dados principais do usuário
      const { error: userError } = await supabase
        .from('users')
        .update({
          role: userData.role,
          is_active: userData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (userError) throw userError

      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          department: userData.department,
          position: userData.position,
          phone: userData.phone,
          bio: userData.bio,
          skills: userData.skills,
          location: userData.location,
          timezone: userData.timezone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError)
      }

      // Registrar atividade
      await this.logUserActivity(userId, 'user_updated', 'user', userId, {
        updated_fields: Object.keys(userData)
      })

      return await this.getUser(userId)
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      // Desativar usuário em vez de excluir
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Registrar atividade
      await this.logUserActivity(userId, 'user_deactivated', 'user', userId)
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error)
      throw new Error(error.message || 'Erro ao desativar usuário')
    }
  }

  // Gestão de Perfis
  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Perfil não encontrado')

      return data
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error)
      throw new Error(error.message || 'Erro ao buscar perfil')
    }
  }

  static async updateUserProfile(userId: string, profileData: UpdateUserProfileData): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      // Registrar atividade
      await this.logUserActivity(userId, 'profile_updated', 'user_profile', userId, {
        updated_fields: Object.keys(profileData)
      })

      return data
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      throw new Error(error.message || 'Erro ao atualizar perfil')
    }
  }

  // Gestão de Equipes
  static async getTeams(filters?: TeamFilters, page = 1, limit = 20): Promise<TeamSearchResult> {
    try {
      let query = supabase
        .from('teams')
        .select(`
          *,
          manager:profiles!teams_manager_id_fkey(id, full_name, email),
          team_members(count)
        `, { count: 'exact' })

      // Aplicar filtros
      if (filters?.department) {
        query = query.eq('department', filters.department)
      }
      if (filters?.manager_id) {
        query = query.eq('manager_id', filters.manager_id)
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Paginação
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Ordenação
      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        teams: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit
      }
    } catch (error: any) {
      console.error('Erro ao buscar equipes:', error)
      throw new Error(error.message || 'Erro ao buscar equipes')
    }
  }

  static async getTeam(teamId: string): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          manager:profiles!teams_manager_id_fkey(id, full_name, email),
          team_members(
            *,
            user:profiles(id, full_name, email, avatar_url)
          )
        `)
        .eq('id', teamId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Equipe não encontrada')

      return data
    } catch (error: any) {
      console.error('Erro ao buscar equipe:', error)
      throw new Error(error.message || 'Erro ao buscar equipe')
    }
  }

  static async createTeam(teamData: CreateTeamData, createdBy: string): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...teamData,
          created_by: createdBy,
          member_count: 0
        })
        .select()
        .single()

      if (error) throw error

      // Registrar atividade
      await this.logUserActivity(createdBy, 'team_created', 'team', data.id, {
        team_name: teamData.name
      })

      return data
    } catch (error: any) {
      console.error('Erro ao criar equipe:', error)
      throw new Error(error.message || 'Erro ao criar equipe')
    }
  }

  static async updateTeam(teamId: string, teamData: UpdateTeamData, updatedBy: string): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update({
          ...teamData,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .select()
        .single()

      if (error) throw error

      // Registrar atividade
      await this.logUserActivity(updatedBy, 'team_updated', 'team', teamId, {
        updated_fields: Object.keys(teamData)
      })

      return data
    } catch (error: any) {
      console.error('Erro ao atualizar equipe:', error)
      throw new Error(error.message || 'Erro ao atualizar equipe')
    }
  }

  static async deleteTeam(teamId: string, deletedBy: string): Promise<void> {
    try {
      // Desativar equipe em vez de excluir
      const { error } = await supabase
        .from('teams')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)

      if (error) throw error

      // Registrar atividade
      await this.logUserActivity(deletedBy, 'team_deactivated', 'team', teamId)
    } catch (error: any) {
      console.error('Erro ao desativar equipe:', error)
      throw new Error(error.message || 'Erro ao desativar equipe')
    }
  }

  // Gestão de Membros da Equipe
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url, role, status)
        `)
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar membros da equipe:', error)
      throw new Error(error.message || 'Erro ao buscar membros da equipe')
    }
  }

  static async addTeamMember(teamId: string, memberData: AddTeamMemberData, addedBy: string): Promise<TeamMember> {
    try {
      // Verificar se o usuário já é membro
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', memberData.user_id)
        .eq('is_active', true)
        .single()

      if (existingMember) {
        throw new Error('Usuário já é membro desta equipe')
      }

      // Adicionar membro
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: memberData.user_id,
          role: memberData.role,
          added_by: addedBy
        })
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url)
        `)
        .single()

      if (error) throw error

      // Atualizar contador de membros
      await this.updateTeamMemberCount(teamId)

      // Registrar atividade
      await this.logUserActivity(addedBy, 'team_member_added', 'team', teamId, {
        user_id: memberData.user_id,
        role: memberData.role
      })

      return data
    } catch (error: any) {
      console.error('Erro ao adicionar membro à equipe:', error)
      throw new Error(error.message || 'Erro ao adicionar membro à equipe')
    }
  }

  static async removeTeamMember(teamId: string, userId: string, removedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId)

      if (error) throw error

      // Atualizar contador de membros
      await this.updateTeamMemberCount(teamId)

      // Registrar atividade
      await this.logUserActivity(removedBy, 'team_member_removed', 'team', teamId, {
        user_id: userId
      })
    } catch (error: any) {
      console.error('Erro ao remover membro da equipe:', error)
      throw new Error(error.message || 'Erro ao remover membro da equipe')
    }
  }

  static async updateTeamMemberRole(teamId: string, userId: string, role: TeamRole, updatedBy: string): Promise<TeamMember> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update({
          role,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url)
        `)
        .single()

      if (error) throw error

      // Registrar atividade
      await this.logUserActivity(updatedBy, 'team_member_role_updated', 'team', teamId, {
        user_id: userId,
        new_role: role
      })

      return data
    } catch (error: any) {
      console.error('Erro ao atualizar papel do membro:', error)
      throw new Error(error.message || 'Erro ao atualizar papel do membro')
    }
  }

  // Convites para Equipe
  static async createTeamInvitation(invitationData: CreateTeamInvitationData, invitedBy: string): Promise<TeamInvitation> {
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expira em 7 dias

      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          ...invitationData,
          invited_by: invitedBy,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select(`
          *,
          team:teams(id, name),
          inviter:profiles!team_invitations_invited_by_fkey(id, full_name, email)
        `)
        .single()

      if (error) throw error

      // TODO: Enviar email de convite

      // Registrar atividade
      await this.logUserActivity(invitedBy, 'team_invitation_sent', 'team', invitationData.team_id, {
        email: invitationData.email,
        role: invitationData.role
      })

      return data
    } catch (error: any) {
      console.error('Erro ao criar convite:', error)
      throw new Error(error.message || 'Erro ao criar convite')
    }
  }

  static async respondToTeamInvitation(invitationId: string, status: 'accepted' | 'declined', userId?: string): Promise<void> {
    try {
      // Buscar convite
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .single()

      if (invitationError) throw invitationError
      if (!invitation) throw new Error('Convite não encontrado')

      if (invitation.status !== 'pending') {
        throw new Error('Convite já foi respondido')
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Convite expirado')
      }

      // Atualizar status do convite
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ status })
        .eq('id', invitationId)

      if (updateError) throw updateError

      // Se aceito e temos userId, adicionar à equipe
      if (status === 'accepted' && userId) {
        await this.addTeamMember(invitation.team_id, {
          user_id: userId,
          role: invitation.role
        }, invitation.invited_by)
      }

      // Registrar atividade
      if (userId) {
        await this.logUserActivity(userId, `team_invitation_${status}`, 'team', invitation.team_id, {
          invitation_id: invitationId
        })
      }
    } catch (error: any) {
      console.error('Erro ao responder convite:', error)
      throw new Error(error.message || 'Erro ao responder convite')
    }
  }

  // Atividades do Usuário
  static async getUserActivities(filters?: UserActivityFilters, page = 1, limit = 20): Promise<UserActivity[]> {
    try {
      let query = supabase
        .from('user_activities')
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url)
        `)

      // Aplicar filtros
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters?.action) {
        query = query.eq('action', filters.action)
      }
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }
      if (filters?.entity_id) {
        query = query.eq('entity_id', filters.entity_id)
      }
      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date)
      }
      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date)
      }

      // Paginação
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Ordenação
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error)
      throw new Error(error.message || 'Erro ao buscar atividades')
    }
  }

  static async logUserActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          ip_address: ipAddress,
          user_agent: userAgent
        })

      if (error) {
        console.error('Erro ao registrar atividade:', error)
      }
    } catch (error) {
      console.error('Erro ao registrar atividade:', error)
    }
  }

  // Estatísticas
  static async getUserStats(): Promise<UserStats> {
    try {
      // Buscar estatísticas básicas
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role, status, is_active, created_at')

      if (usersError) throw usersError

      const totalUsers = users?.length || 0
      const activeUsers = users?.filter(u => u.is_active).length || 0

      // Agrupar por papel
      const usersByRole = users?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Agrupar por status
      const usersByStatus = users?.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Novos usuários este mês
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const newUsersThisMonth = users?.filter(u => 
        new Date(u.created_at) >= thisMonth
      ).length || 0

      // TODO: Implementar estatísticas de login
      const loginActivity = []

      // TODO: Implementar agrupamento por departamento
      const usersByDepartment = {}

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        users_by_role: usersByRole as Record<UserRole, number>,
        users_by_department: usersByDepartment,
        users_by_status: usersByStatus as Record<string, number>,
        new_users_this_month: newUsersThisMonth,
        login_activity: loginActivity
      }
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de usuários:', error)
      throw new Error(error.message || 'Erro ao buscar estatísticas de usuários')
    }
  }

  static async getTeamStats(): Promise<TeamStats> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('department, member_count, is_active, created_at, name')

      if (error) throw error

      const totalTeams = teams?.length || 0
      const activeTeams = teams?.filter(t => t.is_active).length || 0

      // Agrupar por departamento
      const teamsByDepartment = teams?.reduce((acc, team) => {
        if (team.department) {
          acc[team.department] = (acc[team.department] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      // Tamanho médio das equipes
      const averageTeamSize = teams?.length > 0 
        ? teams.reduce((sum, team) => sum + (team.member_count || 0), 0) / teams.length
        : 0

      // Maior equipe
      const largestTeam = teams?.reduce((largest, team) => {
        return (team.member_count || 0) > (largest?.member_count || 0) ? team : largest
      }, teams[0]) || null

      // TODO: Implementar crescimento de equipes
      const teamGrowth = []

      return {
        total_teams: totalTeams,
        active_teams: activeTeams,
        teams_by_department: teamsByDepartment,
        average_team_size: Math.round(averageTeamSize * 100) / 100,
        largest_team: largestTeam ? {
          name: largestTeam.name,
          member_count: largestTeam.member_count || 0
        } : { name: '', member_count: 0 },
        team_growth: teamGrowth
      }
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de equipes:', error)
      throw new Error(error.message || 'Erro ao buscar estatísticas de equipes')
    }
  }

  // Métodos auxiliares
  private static async updateTeamMemberCount(teamId: string): Promise<void> {
    try {
      const { count, error } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_active', true)

      if (error) throw error

      await supabase
        .from('teams')
        .update({ member_count: count || 0 })
        .eq('id', teamId)
    } catch (error) {
      console.error('Erro ao atualizar contador de membros:', error)
    }
  }

  // Busca de usuários para seleção
  static async searchUsers(query: string, limit = 10): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, role, department')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit)
        .order('full_name')

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  // Busca de equipes para seleção
  static async searchTeams(query: string, limit = 10): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, avatar_url, department, member_count')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(limit)
        .order('name')

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar equipes:', error)
      throw new Error(error.message || 'Erro ao buscar equipes')
    }
  }
}