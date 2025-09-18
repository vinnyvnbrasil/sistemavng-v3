import { supabase } from '@/lib/supabase'
import { 
  Project, 
  ProjectMember, 
  ProjectActivity, 
  CreateProjectData, 
  UpdateProjectData, 
  ProjectFilters,
  ProjectStats
} from '@/types/project'

export class ProjectService {
  // Criar projeto
  static async createProject(data: CreateProjectData): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const projectData = {
      ...data,
      owner_id: user.id,
      created_by: user.id,
      progress: 0,
      team_members: data.team_members || [],
      tags: data.tags || [],
      status: data.status || 'planning',
      priority: data.priority || 'medium'
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) throw error

    // Adicionar o criador como membro owner
    await this.addProjectMember(project.id, user.id, 'owner')

    // Registrar atividade
    await this.logActivity(project.id, user.id, 'created', `Projeto "${project.name}" foi criado`)

    return project
  }

  // Listar projetos
  static async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('projects')
      .select('*')

    // Aplicar filtros
    if (filters?.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters?.priority?.length) {
      query = query.in('priority', filters.priority)
    }

    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end)
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Obter projeto por ID
  static async getProject(id: string): Promise<Project | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  // Atualizar projeto
  static async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Verificar permissão
    const hasPermission = await this.hasProjectPermission(id, user.id, ['owner', 'manager'])
    if (!hasPermission) throw new Error('Sem permissão para editar este projeto')

    const { data: project, error } = await supabase
      .from('projects')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Registrar atividade
    await this.logActivity(id, user.id, 'updated', `Projeto "${project.name}" foi atualizado`)

    return project
  }

  // Deletar projeto
  static async deleteProject(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Verificar se é o owner
    const hasPermission = await this.hasProjectPermission(id, user.id, ['owner'])
    if (!hasPermission) throw new Error('Apenas o proprietário pode deletar o projeto')

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Adicionar membro ao projeto (usando team_members array)
  static async addProjectMember(projectId: string, userId: string, role: ProjectMember['role'] = 'member'): Promise<void> {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('team_members')
      .eq('id', projectId)
      .single()

    if (fetchError) throw fetchError

    const teamMembers = project.team_members || []
    if (!teamMembers.includes(userId)) {
      teamMembers.push(userId)
      
      const { error } = await supabase
        .from('projects')
        .update({ team_members: teamMembers })
        .eq('id', projectId)

      if (error) throw error
    }

    // Registrar atividade
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await this.logActivity(projectId, user.id, 'member_added', `Membro adicionado ao projeto`)
    }
  }

  // Remover membro do projeto (usando team_members array)
  static async removeProjectMember(projectId: string, userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('team_members, created_by')
      .eq('id', projectId)
      .single()

    if (fetchError) throw fetchError

    // Verificar se é o criador do projeto
    if (project.created_by !== user.id) {
      throw new Error('Sem permissão para remover membros')
    }

    const teamMembers = (project.team_members || []).filter((id: string) => id !== userId)
    
    const { error } = await supabase
      .from('projects')
      .update({ team_members: teamMembers })
      .eq('id', projectId)

    if (error) throw error

    // Registrar atividade
    await this.logActivity(projectId, user.id, 'member_removed', 'Membro removido do projeto')
  }

  // Obter membros do projeto
  static async getProjectMembers(projectId: string): Promise<any[]> {
    const { data: project, error } = await supabase
      .from('projects')
      .select('team_members, created_by')
      .eq('id', projectId)
      .single()

    if (error) throw error

    const memberIds = project.team_members || []
    if (memberIds.length === 0) return []

    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select(`
        *,
        profiles(id, full_name, email, avatar_url)
      `)
      .eq('project_id', projectId)

    if (membersError) throw membersError
    return members || []
  }

  // Verificar permissão no projeto
  static async hasProjectPermission(
    projectId: string, 
    userId: string, 
    requiredRoles: ProjectMember['role'][]
  ): Promise<boolean> {
    const { data: project, error } = await supabase
      .from('projects')
      .select('created_by, team_members')
      .eq('id', projectId)
      .single()

    if (error || !project) return false
    
    // O criador sempre tem permissão de owner
    if (project.created_by === userId && requiredRoles.includes('owner')) {
      return true
    }
    
    // Membros da equipe têm permissão de member
    if (project.team_members?.includes(userId) && requiredRoles.includes('member')) {
      return true
    }
    
    return false
  }

  // Registrar atividade
  static async logActivity(
    projectId: string,
    userId: string,
    action: ProjectActivity['action'],
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await supabase
      .from('activities')
      .insert({
        type: action,
        description,
        user_id: userId,
        related_table: 'projects',
        related_id: projectId,
        metadata
      })
  }

  // Obter atividades do projeto
  static async getProjectActivities(projectId: string, limit = 50): Promise<ProjectActivity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq('related_table', 'projects')
      .eq('related_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Obter estatísticas dos projetos
  static async getProjectStats(): Promise<ProjectStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: projects } = await supabase
      .from('projects')
      .select(`
        status,
        priority,
        progress,
        deadline,
        created_by,
        team_members
      `)
      .or(`created_by.eq.${user.id},team_members.cs.{${user.id}}`)

    if (!projects) {
      return {
        total: 0,
        by_status: { planning: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 },
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
        completion_rate: 0,
        overdue: 0
      }
    }

    const stats: ProjectStats = {
      total: projects.length,
      by_status: { planning: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 },
      by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
      completion_rate: 0,
      overdue: 0
    }

    const now = new Date()
    let totalProgress = 0

    projects.forEach((project: any) => {
      stats.by_status[project.status as keyof typeof stats.by_status]++
      stats.by_priority[project.priority as keyof typeof stats.by_priority]++
      totalProgress += project.progress

      if (project.deadline && new Date(project.deadline) < now && project.status !== 'completed') {
        stats.overdue++
      }
    })

    stats.completion_rate = projects.length > 0 ? totalProgress / projects.length : 0

    return stats
  }
}