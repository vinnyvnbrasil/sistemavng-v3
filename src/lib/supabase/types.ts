// Tipos do Supabase - Sistema VNG v3
// Baseado no schema definido em supabase-setup.sql

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          company_id: string | null
          role: 'admin' | 'manager' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          company_id?: string | null
          role?: 'admin' | 'manager' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          company_id?: string | null
          role?: 'admin' | 'manager' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'completed' | 'paused' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          start_date: string | null
          end_date: string | null
          budget: number | null
          company_id: string | null
          manager_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          company_id?: string | null
          manager_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          company_id?: string | null
          manager_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string | null
          project_id: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          project_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          project_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          type: 'project_created' | 'task_created' | 'task_updated' | 'task_completed' | 'user_joined' | 'comment_added'
          title: string
          description: string | null
          entity_type: 'project' | 'task' | 'user' | 'company' | null
          entity_id: string | null
          user_id: string | null
          company_id: string | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          type: 'project_created' | 'task_created' | 'task_updated' | 'task_completed' | 'user_joined' | 'comment_added'
          title: string
          description?: string | null
          entity_type?: 'project' | 'task' | 'user' | 'company' | null
          entity_id?: string | null
          user_id?: string | null
          company_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'project_created' | 'task_created' | 'task_updated' | 'task_completed' | 'user_joined' | 'comment_added'
          title?: string
          description?: string | null
          entity_type?: 'project' | 'task' | 'user' | 'company' | null
          entity_id?: string | null
          user_id?: string | null
          company_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'user'
      project_status: 'active' | 'completed' | 'paused' | 'cancelled'
      task_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      priority_level: 'low' | 'medium' | 'high' | 'urgent'
      activity_type: 'project_created' | 'task_created' | 'task_updated' | 'task_completed' | 'user_joined' | 'comment_added'
      entity_type: 'project' | 'task' | 'user' | 'company'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares para facilitar o uso
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type ActivityUpdate = Database['public']['Tables']['activities']['Update']

// Enums para facilitar o uso
export type UserRole = Database['public']['Enums']['user_role']
export type ProjectStatus = Database['public']['Enums']['project_status']
export type TaskStatus = Database['public']['Enums']['task_status']
export type PriorityLevel = Database['public']['Enums']['priority_level']
export type ActivityType = Database['public']['Enums']['activity_type']
export type EntityType = Database['public']['Enums']['entity_type']