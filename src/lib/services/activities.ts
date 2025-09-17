import { supabase } from '@/lib/supabase'
import {
  Activity,
  ActivityFilter,
  ActivityStats,
  CreateActivityData,
  UpdateActivityData,
  DashboardStats,
  ProjectProgress,
  TaskDistribution,
  UserPerformance,
  TeamPerformance,
  SystemHealth,
  NotificationSummary,
  Notification,
  TimelineEvent,
  ActivityType,
  EntityType
} from '@/types/activity'

export class ActivityService {
  // Activity Management
  static async getActivities(filter?: ActivityFilter): Promise<Activity[]> {
    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (filter) {
        if (filter.user_id) {
          query = query.eq('user_id', filter.user_id)
        }
        if (filter.entity_type) {
          query = query.eq('entity_type', filter.entity_type)
        }
        if (filter.entity_id) {
          query = query.eq('entity_id', filter.entity_id)
        }
        if (filter.activity_type) {
          query = query.eq('type', filter.activity_type)
        }
        if (filter.date_from) {
          query = query.gte('created_at', filter.date_from)
        }
        if (filter.date_to) {
          query = query.lte('created_at', filter.date_to)
        }
        if (filter.search) {
          query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
        }
      }

      const { data, error } = await query.limit(100)

      if (error) throw error

      return data.map(activity => ({
        ...activity,
        user_name: activity.user?.full_name || 'Usuário Desconhecido',
        user_avatar: activity.user?.avatar_url
      }))
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
      throw new Error('Falha ao carregar atividades')
    }
  }

  static async getActivityById(id: string): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Atividade não encontrada')

      return {
        ...data,
        user_name: data.user?.full_name || 'Usuário Desconhecido',
        user_avatar: data.user?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao buscar atividade:', error)
      throw new Error('Falha ao carregar atividade')
    }
  }

  static async createActivity(activityData: CreateActivityData): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          type: activityData.type,
          title: activityData.title,
          description: activityData.description,
          user_id: activityData.user_id,
          entity_type: activityData.entity_type,
          entity_id: activityData.entity_id,
          entity_name: activityData.entity_name,
          metadata: activityData.metadata
        })
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .single()

      if (error) throw error

      return {
        ...data,
        user_name: data.user?.full_name || 'Usuário Desconhecido',
        user_avatar: data.user?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao criar atividade:', error)
      throw new Error('Falha ao registrar atividade')
    }
  }

  static async updateActivity(id: string, updateData: UpdateActivityData): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update({
          title: updateData.title,
          description: updateData.description,
          metadata: updateData.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .single()

      if (error) throw error

      return {
        ...data,
        user_name: data.user?.full_name || 'Usuário Desconhecido',
        user_avatar: data.user?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error)
      throw new Error('Falha ao atualizar atividade')
    }
  }

  static async deleteActivity(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao excluir atividade:', error)
      throw new Error('Falha ao excluir atividade')
    }
  }

  // Activity Statistics
  static async getActivityStats(): Promise<ActivityStats> {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Total activities
      const { count: totalActivities } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })

      // Activities today
      const { count: activitiesToday } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Activities this week
      const { count: activitiesThisWeek } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Activities this month
      const { count: activitiesThisMonth } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString())

      // Most active users
      const { data: mostActiveUsers } = await supabase
        .from('activities')
        .select(`
          user_id,
          user:profiles(full_name, avatar_url)
        `)
        .gte('created_at', monthAgo.toISOString())

      const userActivityMap = new Map()
      mostActiveUsers?.forEach(activity => {
        const userId = activity.user_id
        const current = userActivityMap.get(userId) || {
          user_id: userId,
          user_name: activity.user?.full_name || 'Usuário Desconhecido',
          user_avatar: activity.user?.avatar_url,
          activity_count: 0
        }
        current.activity_count++
        userActivityMap.set(userId, current)
      })

      const mostActiveUsersArray = Array.from(userActivityMap.values())
        .sort((a, b) => b.activity_count - a.activity_count)
        .slice(0, 5)

      // Activity by type
      const { data: activityByType } = await supabase
        .from('activities')
        .select('type')
        .gte('created_at', monthAgo.toISOString())

      const typeMap = new Map()
      activityByType?.forEach(activity => {
        const current = typeMap.get(activity.type) || 0
        typeMap.set(activity.type, current + 1)
      })

      const totalTypeActivities = activityByType?.length || 0
      const activityByTypeArray = Array.from(typeMap.entries()).map(([type, count]) => ({
        type: type as ActivityType,
        count,
        percentage: totalTypeActivities > 0 ? (count / totalTypeActivities) * 100 : 0
      }))

      // Activity by day (last 7 days)
      const activityByDay = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
        
        const { count } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString())

        activityByDay.push({
          date: date.toISOString().split('T')[0],
          count: count || 0
        })
      }

      return {
        total_activities: totalActivities || 0,
        activities_today: activitiesToday || 0,
        activities_this_week: activitiesThisWeek || 0,
        activities_this_month: activitiesThisMonth || 0,
        most_active_users: mostActiveUsersArray,
        activity_by_type: activityByTypeArray,
        activity_by_day: activityByDay
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de atividades:', error)
      throw new Error('Falha ao carregar estatísticas')
    }
  }

  // Dashboard Statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Projects stats
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: completedProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Tasks stats
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })

      const { count: pendingTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: inProgressTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')

      const { count: completedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Overdue tasks
      const now = new Date().toISOString()
      const { count: overdueTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', now)
        .neq('status', 'completed')

      // Users stats
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Teams stats
      const { count: totalTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })

      // Recent activities
      const recentActivities = await this.getActivities()

      return {
        total_projects: totalProjects || 0,
        active_projects: activeProjects || 0,
        completed_projects: completedProjects || 0,
        total_tasks: totalTasks || 0,
        pending_tasks: pendingTasks || 0,
        in_progress_tasks: inProgressTasks || 0,
        completed_tasks: completedTasks || 0,
        overdue_tasks: overdueTasks || 0,
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_teams: totalTeams || 0,
        recent_activities: recentActivities.slice(0, 10)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error)
      throw new Error('Falha ao carregar estatísticas do dashboard')
    }
  }

  // Project Progress
  static async getProjectsProgress(): Promise<ProjectProgress[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          due_date,
          tasks(id, status),
          project_members(user_id)
        `)
        .eq('status', 'active')

      if (error) throw error

      return projects.map(project => {
        const totalTasks = project.tasks?.length || 0
        const completedTasks = project.tasks?.filter(task => task.status === 'completed').length || 0
        const overdueTasks = project.tasks?.filter(task => {
          return task.status !== 'completed' && project.due_date && new Date(project.due_date) < new Date()
        }).length || 0

        return {
          project_id: project.id,
          project_name: project.name,
          progress_percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          overdue_tasks: overdueTasks,
          team_members: project.project_members?.length || 0,
          status: project.status,
          due_date: project.due_date
        }
      })
    } catch (error) {
      console.error('Erro ao buscar progresso dos projetos:', error)
      throw new Error('Falha ao carregar progresso dos projetos')
    }
  }

  // Task Distribution
  static async getTaskDistribution(): Promise<TaskDistribution[]> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status')

      if (error) throw error

      const statusMap = new Map()
      tasks?.forEach(task => {
        const current = statusMap.get(task.status) || 0
        statusMap.set(task.status, current + 1)
      })

      const total = tasks?.length || 0
      const statusColors = {
        pending: '#f59e0b',
        in_progress: '#3b82f6',
        completed: '#10b981',
        cancelled: '#ef4444'
      }

      return Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: statusColors[status as keyof typeof statusColors] || '#6b7280'
      }))
    } catch (error) {
      console.error('Erro ao buscar distribuição de tarefas:', error)
      throw new Error('Falha ao carregar distribuição de tarefas')
    }
  }

  // Timeline Events
  static async getTimelineEvents(days: number = 7): Promise<TimelineEvent[]> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

      const activities = await this.getActivities({
        date_from: startDate.toISOString(),
        date_to: endDate.toISOString()
      })

      // Group activities by date
      const eventMap = new Map<string, Activity[]>()
      activities.forEach(activity => {
        const date = activity.created_at.split('T')[0]
        const existing = eventMap.get(date) || []
        existing.push(activity)
        eventMap.set(date, existing)
      })

      // Convert to timeline events
      const events: TimelineEvent[] = []
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const dayActivities = eventMap.get(dateStr) || []
        
        events.push({
          id: dateStr,
          date: dateStr,
          activities: dayActivities.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        })
      }

      return events
    } catch (error) {
      console.error('Erro ao buscar eventos da timeline:', error)
      throw new Error('Falha ao carregar timeline')
    }
  }

  // System Health (mock data for now)
  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      // In a real implementation, you would check actual system metrics
      return {
        status: 'healthy',
        uptime: 99.9,
        response_time: 120,
        error_rate: 0.1,
        active_sessions: 45,
        database_status: 'connected',
        storage_usage: 65,
        memory_usage: 78
      }
    } catch (error) {
      console.error('Erro ao buscar saúde do sistema:', error)
      throw new Error('Falha ao carregar saúde do sistema')
    }
  }

  // Helper method to log activity
  static async logActivity(
    type: ActivityType,
    title: string,
    userId: string,
    entityType: EntityType,
    entityId: string,
    options?: {
      description?: string
      entityName?: string
      metadata?: any
    }
  ): Promise<void> {
    try {
      await this.createActivity({
        type,
        title,
        description: options?.description,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: options?.entityName,
        metadata: options?.metadata
      })
    } catch (error) {
      // Don't throw error for logging failures to avoid breaking main operations
      console.error('Erro ao registrar atividade:', error)
    }
  }
}