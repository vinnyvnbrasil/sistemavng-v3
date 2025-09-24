'use client'

// Página de Detalhes da Equipe com Sistema de Roles
// Visualização completa da equipe com gerenciamento de membros e roles

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Settings,
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  Shield,
  Crown,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RoleSelector, RoleDisplay } from '@/components/rbac/role-selector'
import { PermissionGuard } from '@/components/rbac/permission-guard'
import { UserRole, ROLE_DEFINITIONS, TeamMember } from '@/types/rbac'
import { useAuth } from '@/hooks/use-auth'
import { UserService } from '@/lib/services/users'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
  description?: string
  department?: string
  is_active: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
  member_count: number
}

interface TeamStats {
  totalMembers: number
  activeMembers: number
  adminCount: number
  leaderCount: number
  operatorCount: number
  averageTasksPerMember: number
  teamProductivity: number
}

export default function TeamDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, hasPermission } = useAuth()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator')
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('operator')

  useEffect(() => {
    if (teamId) {
      loadTeamData()
    }
  }, [teamId])

  const loadTeamData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados da equipe
      const teamData = await UserService.getTeam(teamId)
      setTeam(teamData)

      // Carregar membros da equipe
      const membersData = await UserService.getTeamMembers(teamId)
      setMembers(membersData)

      // Carregar estatísticas
      const statsData = await UserService.getTeamStats(teamId)
      setStats(statsData)

    } catch (error) {
      console.error('Erro ao carregar dados da equipe:', error)
      toast.error('Erro ao carregar dados da equipe')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      await UserService.updateTeamMemberRole(teamId, memberId, newRole)
      setEditingMember(null)
      toast.success('Role atualizado com sucesso!')
      loadTeamData()
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
      toast.error('Erro ao atualizar role')
    }
  }

  const handleRemoveMember = async () => {
    if (!removingMember) return

    try {
      await UserService.removeTeamMember(teamId, removingMember.user_id)
      setRemovingMember(null)
      toast.success('Membro removido da equipe!')
      loadTeamData()
    } catch (error) {
      console.error('Erro ao remover membro:', error)
      toast.error('Erro ao remover membro')
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return

    try {
      await UserService.addTeamMember(teamId, newMemberEmail, newMemberRole)
      setShowAddMember(false)
      setNewMemberEmail('')
      setNewMemberRole('operator')
      toast.success('Membro adicionado à equipe!')
      loadTeamData()
    } catch (error) {
      console.error('Erro ao adicionar membro:', error)
      toast.error('Erro ao adicionar membro')
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'leader':
        return <Crown className="h-4 w-4 text-blue-600" />
      case 'operator':
        return <User className="h-4 w-4 text-green-600" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const canManageTeam = () => {
    return hasPermission('teams:manage') || 
           (currentUser?.role === 'leader' && members.some(m => m.user_id === currentUser.id && m.role === 'leader'))
  }

  const canEditMemberRole = (member: TeamMember) => {
    if (!currentUser) return false
    
    // Admin pode editar qualquer role
    if (currentUser.role === 'admin') return true
    
    // Leader da equipe pode editar roles de operators
    const isTeamLeader = members.some(m => 
      m.user_id === currentUser.id && m.role === 'leader'
    )
    
    if (isTeamLeader && member.role === 'operator') return true
    
    return false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Equipe não encontrada</h2>
        <p className="text-gray-600 mb-4">A equipe que você está procurando não existe.</p>
        <Button onClick={() => router.push('/dashboard/teams')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Equipes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/teams')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={team.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {team.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {team.department && <span>{team.department}</span>}
                <Badge variant={team.is_active ? 'default' : 'secondary'}>
                  {team.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard permission="teams:manage">
            <Button
              variant="outline"
              onClick={() => setShowAddMember(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push(`/dashboard/teams/${teamId}/members`)}
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Membros
            </Button>
          </PermissionGuard>
          
          {canManageTeam() && (
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/teams/${teamId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Equipe
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeMembers} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.adminCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Líderes</CardTitle>
              <Crown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.leaderCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operadores</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.operatorCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>
                Gerencie os membros e seus roles nesta equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback>
                                {member.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingMember === member.user_id ? (
                            <RoleSelector
                              value={selectedRole}
                              onChange={setSelectedRole}
                              allowedRoles={
                                currentUser?.role === 'admin' 
                                  ? ['admin', 'leader', 'operator']
                                  : ['operator']
                              }
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {getRoleIcon(member.role)}
                              <Badge className={
                                member.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                                member.role === 'leader' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-green-100 text-green-800 border-green-200'
                              }>
                                {ROLE_DEFINITIONS[member.role].name}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {ROLE_DEFINITIONS[member.role].permissions.length} permissões
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingMember === member.user_id ? (
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleRoleChange(member.user_id, selectedRole)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMember(null)}
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {canEditMemberRole(member) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingMember(member.user_id)
                                      setSelectedRole(member.role)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Role
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <User className="h-4 w-4 mr-2" />
                                  Ver Perfil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {canManageTeam() && member.user_id !== currentUser?.id && (
                                  <DropdownMenuItem
                                    onClick={() => setRemovingMember(member)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover da Equipe
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.description && (
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Departamento</Label>
                  <p className="text-sm text-gray-600 mt-1">{team.department || 'Não definido'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {team.is_active ? 'Ativa' : 'Inativa'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Criada em</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(team.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Última atualização</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(team.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas atividades dos membros da equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Funcionalidade de atividades em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar membro */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
            <DialogDescription>
              Adicione um novo membro à equipe e defina seu role inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email do usuário</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Role inicial</Label>
              <RoleSelector
                value={newMemberRole}
                onChange={setNewMemberRole}
                allowedRoles={
                  currentUser?.role === 'admin' 
                    ? ['admin', 'leader', 'operator']
                    : ['operator']
                }
                showDescription
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberEmail.trim()}>
              Adicionar Membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para remover membro */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {removingMember?.name} da equipe? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}