'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
// Removido import problemático - usando elementos HTML simples
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart3, 
  Users, 
  Building2, 
  FolderOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Plus,
  RefreshCw,
  CheckSquare,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import type { Project, Task, Company, Profile } from '@/lib/supabase/types'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedTasks: number
  pendingTasks: number
  totalUsers: number
  totalCompanies: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const supabase = createClient()

  // Função para carregar estatísticas do dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar usuário autenticado
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        window.location.href = '/auth/login'
        return
      }
      setUser(currentUser)

      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      setProfile(profileData)

      // Carregar estatísticas
      const [projectsResult, tasksResult, usersResult, companiesResult] = await Promise.all([
        supabase.from('projects').select('id, status').eq('created_by', currentUser.id),
        supabase.from('tasks').select('id, status').eq('assigned_to', currentUser.id),
        supabase.from('profiles').select('id'),
        supabase.from('companies').select('id')
      ])

      if (projectsResult.error) throw projectsResult.error
      if (tasksResult.error) throw tasksResult.error
      if (usersResult.error) throw usersResult.error
      if (companiesResult.error) throw companiesResult.error

      const projects = projectsResult.data || []
      const tasks = tasksResult.data || []
      const users = usersResult.data || []
      const companies = companiesResult.data || []

      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter((p: Project) => p.status === 'active').length,
        completedTasks: tasks.filter((t: Task) => t.status === 'completed').length,
        pendingTasks: tasks.filter((t: Task) => t.status === 'pending').length,
        totalUsers: users.length,
        totalCompanies: companies.length
      })

      // Carregar projetos recentes
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, companies(name)')
        .eq('created_by', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (projectsError) throw projectsError
      setRecentProjects(projectsData || [])

      // Carregar tarefas recentes
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .eq('assigned_to', currentUser.id)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(5)

      if (tasksError) throw tasksError
      setRecentTasks(tasksData || [])

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'active': case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'in_progress':
        return 'Em Andamento'
      case 'pending':
        return 'Pendente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar dados: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-64 mb-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 w-full bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  const statsCards = [
    {
      title: 'Empresas',
      value: stats?.totalCompanies || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dashboard/companies'
    },
    {
      title: 'Projetos',
      value: stats?.totalProjects || 0,
      icon: FolderOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/dashboard/projects'
    },
    {
        title: 'Tarefas',
        value: (stats?.completedTasks || 0) + (stats?.pendingTasks || 0),
        icon: CheckCircle2,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        href: '/tasks'
      },
    {
      title: 'Concluídas',
      value: stats?.completedTasks || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/dashboard/tasks?status=completed'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {profile?.full_name || user.email}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo ao seu painel de controle
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Projetos Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Projetos Recentes</CardTitle>
              <CardDescription>
                Seus projetos mais recentes
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/projects">
                Ver todos
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProjects && recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {(project as any).companies?.name || 'Sem empresa'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusText(project.status)}
                      </Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/projects/${project.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhum projeto encontrado</p>
                <Button asChild>
                  <Link href="/dashboard/projects/new">
                    Criar primeiro projeto
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarefas Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Tarefas Pendentes</CardTitle>
              <CardDescription>
                Suas próximas tarefas
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tasks">
                Ver todas
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTasks && recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {(task as any).projects?.name || 'Sem projeto'}
                      </p>
                      {task.due_date && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/tasks/${task.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhuma tarefa pendente</p>
                <Button asChild>
                  <Link href="/dashboard/tasks/new">
                    Criar primeira tarefa
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividade Recente
          </CardTitle>
          <CardDescription>
            Últimas atividades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Sistema de atividades será implementado em breve</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}