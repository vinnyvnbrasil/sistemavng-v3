export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  project_id: string
  assigned_to?: string
  created_by: string
  due_date?: string
  start_date?: string
  completed_date?: string
  estimated_hours?: number
  actual_hours?: number
  tags?: string[]
  dependencies?: string[] // IDs de outras tarefas
  attachments?: TaskAttachment[]
  comments?: TaskComment[]
  created_at: string
  updated_at: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_by: string
  created_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskActivity {
  id: string
  task_id: string
  user_id: string
  action: string
  description: string
  metadata?: Record<string, any>
  created_at: string
}

export interface CreateTaskData {
  title: string
  description?: string
  status?: TaskStatus
  priority: TaskPriority
  project_id: string
  assigned_to?: string
  due_date?: string
  start_date?: string
  estimated_hours?: number
  tags?: string[]
  dependencies?: string[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  project_id?: string
  assigned_to?: string
  due_date?: string
  start_date?: string
  completed_date?: string
  estimated_hours?: number
  actual_hours?: number
  tags?: string[]
  dependencies?: string[]
}

export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigned_to?: string[]
  project_id?: string
  due_date_from?: string
  due_date_to?: string
  created_by?: string
  tags?: string[]
  search?: string
}

export interface TaskStats {
  total: number
  by_status: Record<TaskStatus, number>
  by_priority: Record<TaskPriority, number>
  overdue: number
  due_today: number
  due_this_week: number
  completed_this_week: number
  avg_completion_time: number // em horas
}

export interface TaskBoard {
  id: string
  name: string
  project_id: string
  columns: TaskBoardColumn[]
  created_at: string
  updated_at: string
}

export interface TaskBoardColumn {
  id: string
  name: string
  status: TaskStatus
  order: number
  color?: string
  limit?: number // WIP limit
}

export interface TaskTimeEntry {
  id: string
  task_id: string
  user_id: string
  description?: string
  hours: number
  date: string
  created_at: string
  updated_at: string
}

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  tasks: TaskTemplateItem[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskTemplateItem {
  title: string
  description?: string
  priority: TaskPriority
  estimated_hours?: number
  tags?: string[]
  order: number
  dependencies?: number[] // índices de outras tarefas no template
}

// Tipos para relatórios e analytics
export interface TaskReport {
  period: {
    start: string
    end: string
  }
  stats: TaskStats
  productivity: {
    tasks_completed: number
    hours_logged: number
    avg_tasks_per_day: number
    efficiency_score: number // 0-100
  }
  trends: {
    completion_rate: number[]
    creation_rate: number[]
    labels: string[]
  }
  top_performers: {
    user_id: string
    tasks_completed: number
    hours_logged: number
  }[]
}

// Tipos para notificações de tarefas
export interface TaskNotification {
  id: string
  task_id: string
  user_id: string
  type: 'assigned' | 'due_soon' | 'overdue' | 'completed' | 'commented' | 'status_changed'
  title: string
  message: string
  read: boolean
  created_at: string
}

// Tipos para integração com projetos
export interface ProjectTaskSummary {
  project_id: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  completion_percentage: number
  estimated_total_hours: number
  actual_total_hours: number
}

// Tipos para busca e ordenação
export type TaskSortField = 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'status' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface TaskSearchParams {
  filters?: TaskFilters
  sort_field?: TaskSortField
  sort_direction?: SortDirection
  page?: number
  limit?: number
}

export interface TaskSearchResult {
  tasks: Task[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// Tipos para bulk operations
export interface BulkTaskOperation {
  task_ids: string[]
  operation: 'update_status' | 'update_priority' | 'assign' | 'add_tags' | 'delete'
  data: Record<string, any>
}

export interface BulkTaskResult {
  success: number
  failed: number
  errors: { task_id: string; error: string }[]
}