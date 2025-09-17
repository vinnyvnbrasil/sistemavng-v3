import { supabase } from '@/lib/supabase'
import {
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
  TaskStats,
  TaskSearchParams,
  TaskSearchResult,
  TaskComment,
  TaskActivity,
  TaskTimeEntry,
  BulkTaskOperation,
  BulkTaskResult,
  TaskNotification,
  ProjectTaskSummary
} from '@/types/task'

export class TaskService {
  // CRUD Operations
  static async createTask(data: CreateTaskData): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const taskData = {
      ...data,
      created_by: user.id,
      status: data.status || 'todo'
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
        project:projects(id, name)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar tarefa:', error)
      throw new Error('Erro ao criar tarefa')
    }

    // Registrar atividade
    await this.createActivity(task.id, user.id, 'created', 'Tarefa criada')

    // Criar notificação se atribuída a alguém
    if (data.assigned_to && data.assigned_to !== user.id) {
      await this.createNotification({
        task_id: task.id,
        user_id: data.assigned_to,
        type: 'assigned',
        title: 'Nova tarefa atribuída',
        message: `Você foi atribuído à tarefa: ${data.title}`
      })
    }

    return task
  }

  static async getTasks(params: TaskSearchParams = {}): Promise<TaskSearchResult> {
    const {
      filters = {},
      sort_field = 'created_at',
      sort_direction = 'desc',
      page = 1,
      limit = 20
    } = params

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
        project:projects(id, name)
      `, { count: 'exact' })

    // Aplicar filtros
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority)
    }

    if (filters.assigned_to && filters.assigned_to.length > 0) {
      query = query.in('assigned_to', filters.assigned_to)
    }

    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id)
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }

    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }

    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    // Ordenação
    query = query.order(sort_field, { ascending: sort_direction === 'asc' })

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: tasks, error, count } = await query

    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      throw new Error('Erro ao buscar tarefas')
    }

    return {
      tasks: tasks || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    }
  }

  static async getTask(id: string): Promise<Task | null> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
        project:projects(id, name),
        comments:task_comments(
          id,
          content,
          created_at,
          updated_at,
          user:profiles(id, full_name, email, avatar_url)
        ),
        activities:task_activities(
          id,
          action,
          description,
          created_at,
          user:profiles(id, full_name, email, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Erro ao buscar tarefa:', error)
      throw new Error('Erro ao buscar tarefa')
    }

    return task
  }

  static async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Buscar tarefa atual para comparar mudanças
    const currentTask = await this.getTask(id)
    if (!currentTask) throw new Error('Tarefa não encontrada')

    const { data: task, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
        project:projects(id, name)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw new Error('Erro ao atualizar tarefa')
    }

    // Registrar atividades para mudanças importantes
    const activities = []

    if (data.status && data.status !== currentTask.status) {
      activities.push({
        action: 'status_changed',
        description: `Status alterado de ${currentTask.status} para ${data.status}`
      })

      // Notificar sobre conclusão
      if (data.status === 'done' && currentTask.assigned_to) {
        await this.createNotification({
          task_id: id,
          user_id: currentTask.assigned_to,
          type: 'completed',
          title: 'Tarefa concluída',
          message: `A tarefa "${currentTask.title}" foi marcada como concluída`
        })
      }
    }

    if (data.assigned_to && data.assigned_to !== currentTask.assigned_to) {
      activities.push({
        action: 'assigned',
        description: `Tarefa atribuída para ${(task as any).assigned_user?.full_name || 'usuário'}`
      })

      // Notificar novo responsável
      if (data.assigned_to) {
        await this.createNotification({
          task_id: id,
          user_id: data.assigned_to,
          type: 'assigned',
          title: 'Tarefa atribuída',
          message: `Você foi atribuído à tarefa: ${currentTask.title}`
        })
      }
    }

    if (data.priority && data.priority !== currentTask.priority) {
      activities.push({
        action: 'priority_changed',
        description: `Prioridade alterada de ${currentTask.priority} para ${data.priority}`
      })
    }

    // Criar atividades
    for (const activity of activities) {
      await this.createActivity(id, user.id, activity.action, activity.description)
    }

    return task
  }

  static async deleteTask(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar tarefa:', error)
      throw new Error('Erro ao deletar tarefa')
    }
  }

  // Comentários
  static async addComment(taskId: string, content: string): Promise<TaskComment> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: comment, error } = await supabase
      .from('task_comments')
      .insert([{
        task_id: taskId,
        content,
        created_by: user.id
      }])
      .select(`
        *,
        user:profiles(id, full_name, email, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Erro ao adicionar comentário:', error)
      throw new Error('Erro ao adicionar comentário')
    }

    // Registrar atividade
    await this.createActivity(taskId, user.id, 'commented', 'Adicionou um comentário')

    // Notificar responsável da tarefa
    const task = await this.getTask(taskId)
    if (task?.assigned_to && task.assigned_to !== user.id) {
      await this.createNotification({
        task_id: taskId,
        user_id: task.assigned_to,
        type: 'commented',
        title: 'Novo comentário',
        message: `${user.user_metadata?.full_name || user.email} comentou na tarefa: ${task.title}`
      })
    }

    return comment
  }

  static async getComments(taskId: string): Promise<TaskComment[]> {
    const { data: comments, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        user:profiles(id, full_name, email, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar comentários:', error)
      throw new Error('Erro ao buscar comentários')
    }

    return comments || []
  }

  // Atividades
  static async createActivity(
    taskId: string, 
    userId: string, 
    action: string, 
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('task_activities')
      .insert([{
        task_id: taskId,
        user_id: userId,
        action,
        description,
        metadata
      }])

    if (error) {
      console.error('Erro ao criar atividade:', error)
    }
  }

  static async getActivities(taskId: string): Promise<TaskActivity[]> {
    const { data: activities, error } = await supabase
      .from('task_activities')
      .select(`
        *,
        user:profiles(id, full_name, email, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar atividades:', error)
      throw new Error('Erro ao buscar atividades')
    }

    return activities || []
  }

  // Estatísticas
  static async getTaskStats(filters: TaskFilters = {}): Promise<TaskStats> {
    let query = supabase.from('tasks').select('status, priority, due_date, created_at, updated_at')

    // Aplicar filtros
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id)
    }

    if (filters.assigned_to && filters.assigned_to.length > 0) {
      query = query.in('assigned_to', filters.assigned_to)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      throw new Error('Erro ao buscar estatísticas')
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())

    const stats: TaskStats = {
      total: tasks?.length || 0,
      by_status: {
        todo: 0,
        in_progress: 0,
        review: 0,
        done: 0,
        cancelled: 0
      },
      by_priority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      overdue: 0,
      due_today: 0,
      due_this_week: 0,
      completed_this_week: 0,
      avg_completion_time: 0
    }

    if (!tasks) return stats

    let totalCompletionTime = 0
    let completedCount = 0

    tasks.forEach(task => {
      // Contar por status
      stats.by_status[task.status as keyof typeof stats.by_status]++

      // Contar por prioridade
      stats.by_priority[task.priority as keyof typeof stats.by_priority]++

      // Verificar prazos
      if (task.due_date) {
        const dueDate = new Date(task.due_date)
        
        if (dueDate < now && task.status !== 'done') {
          stats.overdue++
        }
        
        if (dueDate.toDateString() === today.toDateString()) {
          stats.due_today++
        }
        
        if (dueDate >= weekStart && dueDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          stats.due_this_week++
        }
      }

      // Contar concluídas esta semana
      if (task.status === 'completed' && task.updated_at) {
        const completedDate = new Date(task.updated_at)
        if (completedDate >= weekStart) {
          stats.completed_this_week++
        }

        // Calcular tempo médio de conclusão
        const createdDate = new Date(task.created_at)
        const completionTime = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60) // em horas
        totalCompletionTime += completionTime
        completedCount++
      }
    })

    if (completedCount > 0) {
      stats.avg_completion_time = totalCompletionTime / completedCount
    }

    return stats
  }

  // Operações em lote
  static async bulkUpdateTasks(operation: BulkTaskOperation): Promise<BulkTaskResult> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const result: BulkTaskResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (const taskId of operation.task_ids) {
      try {
        switch (operation.operation) {
          case 'update_status':
            await this.updateTask(taskId, { status: operation.data.status })
            break
          case 'update_priority':
            await this.updateTask(taskId, { priority: operation.data.priority })
            break
          case 'assign':
            await this.updateTask(taskId, { assigned_to: operation.data.assigned_to })
            break
          case 'add_tags':
            const task = await this.getTask(taskId)
            if (task) {
              const newTags = [...(task.tags || []), ...operation.data.tags]
              await this.updateTask(taskId, { tags: [...new Set(newTags)] })
            }
            break
          case 'delete':
            await this.deleteTask(taskId)
            break
        }
        result.success++
      } catch (error: any) {
        result.failed++
        result.errors.push({
          task_id: taskId,
          error: error.message
        })
      }
    }

    return result
  }

  // Notificações
  static async createNotification(data: Omit<TaskNotification, 'id' | 'read' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('task_notifications')
      .insert([{ ...data, read: false }])

    if (error) {
      console.error('Erro ao criar notificação:', error)
    }
  }

  static async getNotifications(userId: string): Promise<TaskNotification[]> {
    const { data: notifications, error } = await supabase
      .from('task_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar notificações:', error)
      throw new Error('Erro ao buscar notificações')
    }

    return notifications || []
  }

  // Resumo de tarefas por projeto
  static async getProjectTaskSummary(projectId: string): Promise<ProjectTaskSummary> {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, estimated_hours, actual_hours')
      .eq('project_id', projectId)

    if (error) {
      console.error('Erro ao buscar resumo de tarefas:', error)
      throw new Error('Erro ao buscar resumo de tarefas')
    }

    const summary: ProjectTaskSummary = {
      project_id: projectId,
      total_tasks: tasks?.length || 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      overdue_tasks: 0,
      completion_percentage: 0,
      estimated_total_hours: 0,
      actual_total_hours: 0
    }

    if (!tasks) return summary

    tasks.forEach(task => {
      if (task.status === 'done') {
        summary.completed_tasks++
      } else if (task.status === 'in_progress') {
        summary.in_progress_tasks++
      }

      summary.estimated_total_hours += task.estimated_hours || 0
      summary.actual_total_hours += task.actual_hours || 0
    })

    summary.completion_percentage = summary.total_tasks > 0 
      ? Math.round((summary.completed_tasks / summary.total_tasks) * 100)
      : 0

    return summary
  }
}