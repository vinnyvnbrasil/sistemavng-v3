'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedTasks: number
  pendingTasks: number
  totalUsers: number
  totalCompanies: number
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
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

      // Verificar autenticação
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw new Error('Erro de autenticação: ' + authError.message)
      }

      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      setUser(currentUser)

      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError)
      } else if (profileData) {
        setProfile(profileData)
      }

      // Carregar estatísticas básicas
      const statsData: DashboardStats = {
        totalProjects: 0,
        activeProjects: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalUsers: 1, // Pelo menos o usuário atual
        totalCompanies: 1 // Pelo menos uma empresa
      }

      // Tentar buscar projetos se a tabela existir
      try {
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, status')

        if (!projectsError && projects) {
          statsData.totalProjects = projects.length
          statsData.activeProjects = projects.filter(p => p.status === 'active').length
        }
      } catch (err) {
        console.log('Tabela projects não encontrada ou sem dados')
      }

      // Tentar buscar tarefas se a tabela existir
      try {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, status')

        if (!tasksError && tasks) {
          statsData.completedTasks = tasks.filter(t => t.status === 'completed').length
          statsData.pendingTasks = tasks.filter(t => t.status === 'pending').length
        }
      } catch (err) {
        console.log('Tabela tasks não encontrada ou sem dados')
      }

      // Tentar buscar usuários
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id')

        if (!profilesError && profiles) {
          statsData.totalUsers = profiles.length
        }
      } catch (err) {
        console.log('Erro ao buscar perfis')
      }

      // Tentar buscar empresas
      try {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id')

        if (!companiesError && companies) {
          statsData.totalCompanies = companies.length
        }
      } catch (err) {
        console.log('Erro ao buscar empresas')
      }

      setStats(statsData)

    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-700">Erro ao carregar dashboard</h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <Button 
            onClick={loadDashboardData} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Sistema VNG v3 - Gestão Empresarial Moderna
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Informações do usuário */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Informações do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              {profile && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p className="text-lg">{profile.full_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Função</p>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role || 'user'}
                    </Badge>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">ID do Usuário</p>
                <p className="text-sm font-mono text-gray-600">{user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeProjects || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingTasks || 0} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              usuários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">
              empresas ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/projects/new">
              <Button variant="outline" className="w-full justify-start">
                <FolderOpen className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </Link>
            <Link href="/dashboard/tasks/new">
              <Button variant="outline" className="w-full justify-start">
                <CheckSquare className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </Link>
            <Link href="/dashboard/users/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Status do Sistema
            </CardTitle>
            <CardDescription>
              Informações sobre o funcionamento do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Conexão com banco</span>
              <Badge variant="default">Ativo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Autenticação</span>
              <Badge variant="default">Funcionando</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sistema</span>
              <Badge variant="default">Online</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Progresso Geral
            </CardTitle>
            <CardDescription>
              Visão geral do progresso das atividades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Projetos Ativos</span>
                <span className="text-sm text-muted-foreground">
                  {stats?.activeProjects || 0}/{stats?.totalProjects || 0}
                </span>
              </div>
              <Progress 
                value={stats?.totalProjects ? (stats.activeProjects / stats.totalProjects) * 100 : 0} 
                className="h-2" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Tarefas Concluídas</span>
                <span className="text-sm text-muted-foreground">
                  {stats?.completedTasks || 0}/{(stats?.completedTasks || 0) + (stats?.pendingTasks || 0)}
                </span>
              </div>
              <Progress 
                value={
                  (stats?.completedTasks || 0) + (stats?.pendingTasks || 0) > 0 
                    ? ((stats?.completedTasks || 0) / ((stats?.completedTasks || 0) + (stats?.pendingTasks || 0))) * 100 
                    : 0
                } 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}