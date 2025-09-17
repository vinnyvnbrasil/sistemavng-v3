export interface Project {
  id: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  deadline?: string
  budget?: number
  progress: number // 0-100
  owner_id: string
  team_members: string[]
  tags: string[]
  created_at: string
  updated_at: string
  created_by: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'manager' | 'member' | 'viewer'
  joined_at: string
}

export interface ProjectActivity {
  id: string
  project_id: string
  user_id: string
  action: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed' | 'status_changed'
  description: string
  metadata?: Record<string, any>
  created_at: string
}

export type ProjectStatus = Project['status']
export type ProjectPriority = Project['priority']
export type ProjectRole = ProjectMember['role']

export interface CreateProjectData {
  name: string
  description?: string
  status?: ProjectStatus
  priority?: ProjectPriority
  start_date?: string
  end_date?: string
  deadline?: string
  budget?: number
  team_members?: string[]
  tags?: string[]
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  progress?: number
}

export interface ProjectFilters {
  status?: ProjectStatus[]
  priority?: ProjectPriority[]
  owner_id?: string
  member_id?: string
  tags?: string[]
  search?: string
  date_range?: {
    start: string
    end: string
  }
}

export interface ProjectStats {
  total: number
  by_status: Record<ProjectStatus, number>
  by_priority: Record<ProjectPriority, number>
  completion_rate: number
  overdue: number
}