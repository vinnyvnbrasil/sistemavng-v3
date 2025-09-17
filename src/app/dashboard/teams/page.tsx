'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  Grid3X3,
  List,
  Download,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Team, TeamStats } from '@/types/user'
import { UserService } from '@/lib/services/users'

type ViewMode = 'grid' | 'list'

interface TeamFilters {
  search: string
  department: string
  status: string
}

export default function TeamsPage() {
  const router = useRouter()
  
  const [teams, setTeams] = useState<Team[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filters, setFilters] = useState<TeamFilters>({
    search: '',
    department: '',
    status: ''
  })
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadTeams()
    loadStats()
  }, [])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const teamsData = await UserService.getTeams()
      setTeams(teamsData.teams)
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error)
      toast.error(error.message || 'Erro ao carregar equipes')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await UserService.getTeamStats()
      setStats(statsData)
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleDeleteTeam = async () => {
    if (!deleteTeam) return
    
    setDeleting(true)
    try {
      await UserService.deleteTeam(deleteTeam.id)
      toast.success('Equipe excluída com sucesso!')
      setTeams(teams.filter(team => team.id !== deleteTeam.id))
      setDeleteTeam(null)
      loadStats() // Reload stats
    } catch (error: any) {
      console.error('Erro ao excluir equipe:', error)
      toast.error(error.message || 'Erro ao excluir equipe')
    } finally {
      setDeleting(false)
    }
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         team.description?.toLowerCase().includes(filters.search.toLowerCase())
    const matchesDepartment = !filters.department || filters.department === 'all' || team.department === filters.department
    const matchesStatus = !filters.status || filters.status === 'all' || team.is_active.toString() === filters.status
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const getTeamInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Ativa
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        Inativa
      </Badge>
    )
  }

  const departments = Array.from(new Set(teams.map(team => team.department).filter(Boolean)))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando equipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as equipes da sua organização
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Export functionality
              toast.info('Funcionalidade de exportação em desenvolvimento')
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => router.push('/dashboard/teams/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Equipe
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Equipes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_teams}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Equipes Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_teams}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Membros</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_members}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Média por Equipe</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_teams > 0 ? Math.round(stats.total_members / stats.total_teams) : 0}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar equipes..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativas</SelectItem>
                  <SelectItem value="false">Inativas</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams List/Grid */}
      {filteredTeams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {teams.length === 0 ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe corresponde aos filtros'}
            </h3>
            <p className="text-gray-600 mb-4">
              {teams.length === 0 
                ? 'Comece criando sua primeira equipe.' 
                : 'Tente ajustar os filtros ou limpar a busca.'}
            </p>
            {teams.length === 0 && (
              <Button onClick={() => router.push('/dashboard/teams/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Equipe
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredTeams.map((team) => (
            viewMode === 'grid' ? (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={team.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getTeamInitials(team.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.department && (
                          <p className="text-sm text-gray-600">{team.department}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teams/${team.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teams/${team.id}/members`)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Gerenciar Membros
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteTeam(team)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {team.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {team.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{team.member_count || 0} membros</span>
                      {getStatusBadge(team.is_active)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key={team.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={team.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getTeamInitials(team.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">{team.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {team.department && <span>{team.department}</span>}
                          <span>{team.member_count || 0} membros</span>
                          {getStatusBadge(team.is_active)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/teams/${team.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/teams/${team.id}/members`)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Gerenciar Membros
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteTeam(team)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTeam} onOpenChange={() => setDeleteTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a equipe "{deleteTeam?.name}"? 
              Esta ação não pode ser desfeita e todos os membros serão removidos da equipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}