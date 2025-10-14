'use client'

// Página de Gerenciamento de Membros da Equipe
// Interface dedicada para gerenciar membros e seus roles

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Crown,
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Settings
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
  DialogTitle
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RoleSelector, RoleDisplay } from '@/components/rbac/role-selector'
import { RoleManagement } from '@/components/rbac/role-management'
import { PermissionGuard } from '@/components/rbac/permission-guard'
import { UserRole, ROLE_DEFINITIONS, TeamMember } from '@/types/rbac'
import { UserService } from '@/lib/services/users'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
  description?: string
  department?: string
  is_active: boolean
  avatar_url?: string
}

interface MemberFilters {
  search: string
  role: UserRole | 'all'
  status: 'all' | 'active' | 'inactive'
}

interface BulkAction {
  type: 'role_change' | 'remove' | 'activate' | 'deactivate'
  targetRole?: UserRole
}

export default function TeamMembersPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MemberFilters>({
    search: '',
    role: 'all',
    status: 'all'
  })
  
  // Estados para edição
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator')
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null)
  
  // Estados para adicionar membro
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('operator')
  
  // Estados para ações em lote
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)

  useEffect(() => {
    if (teamId) {
      loadTeamData()
    }
  }, [teamId])

  const loadTeamData = async () => {
    try {
      setLoading(true)
      
      const [teamData, membersData] = await Promise.all([
        UserService.getTeam(teamId),
        UserService.getTeamMembers(teamId)
      ])
      
      setTeam(teamData)
      setMembers(membersData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da equipe')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar membros
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         member.email?.toLowerCase().includes(filters.search.toLowerCase())
    const matchesRole = filters.role === 'all' || member.role === filters.role
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && member.is_active) ||
                         (filters.status === 'inactive' && !member.is_active)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // Estatísticas dos membros
  const memberStats = {
    total: members.length,
    active: members.filter(m => m.is_active).length,
    admin: members.filter(m => m.role === 'admin').length,
    leader: members.filter(m => m.role === 'leader').length,
    operator: members.filter(m => m.role === 'operator').length
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

  const handleBulkAction = async () => {
    if (!bulkAction || selectedMembers.length === 0) return

    try {
      switch (bulkAction.type) {
        case 'role_change':
          if (bulkAction.targetRole) {
            await Promise.all(
              selectedMembers.map(memberId => 
                UserService.updateTeamMemberRole(teamId, memberId, bulkAction.targetRole!)
              )
            )
            toast.success(`Roles atualizados para ${selectedMembers.length} membros`)
          }
          break
        case 'remove':
          await Promise.all(
            selectedMembers.map(memberId => 
              UserService.removeTeamMember(teamId, memberId)
            )
          )
          toast.success(`${selectedMembers.length} membros removidos da equipe`)
          break
      }
      
      setSelectedMembers([])
      setBulkAction(null)
      setShowBulkActions(false)
      loadTeamData()
    } catch (error) {
      console.error('Erro na ação em lote:', error)
      toast.error('Erro ao executar ação em lote')
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
            onClick={() => router.push(`/dashboard/teams/${teamId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Membros - {team.name}
            </h1>
            <p className="text-gray-600">
              Gerencie os membros e roles desta equipe
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedMembers.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBulkActions(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Ações em Lote ({selectedMembers.length})
            </Button>
          )}
          
          <PermissionGuard permission="teams:manage">
            <Button onClick={() => setShowAddMember(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{memberStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{memberStats.admin}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Líderes</CardTitle>
            <Crown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{memberStats.leader}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{memberStats.operator}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar membros..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value as UserRole | 'all' }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os roles</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="leader">Líderes</SelectItem>
                <SelectItem value="operator">Operadores</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as 'all' | 'active' | 'inactive' }))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de membros */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>
            {filteredMembers.length} de {members.length} membros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers(filteredMembers.map(m => m.user_id))
                        } else {
                          setSelectedMembers([])
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers(prev => [...prev, member.user_id])
                          } else {
                            setSelectedMembers(prev => prev.filter(id => id !== member.user_id))
                          }
                        }}
                        className="rounded"
                      />
                    </TableCell>
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
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
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
                            <XCircle className="h-4 w-4" />
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
                                Remover
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

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum membro encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Dialog para ações em lote */}
      <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ações em Lote</DialogTitle>
            <DialogDescription>
              Aplicar ação para {selectedMembers.length} membros selecionados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecione a ação</Label>
              <Select
                value={bulkAction?.type || ''}
                onValueChange={(value) => setBulkAction({ type: value as BulkAction['type'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role_change">Alterar Role</SelectItem>
                  <SelectItem value="remove">Remover da Equipe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {bulkAction?.type === 'role_change' && (
              <div>
                <Label>Novo role</Label>
                <RoleSelector
                  value={bulkAction.targetRole || 'operator'}
                  onChange={(role) => setBulkAction(prev => ({ ...prev!, targetRole: role }))}
                  allowedRoles={
                    currentUser?.role === 'admin' 
                      ? ['admin', 'leader', 'operator']
                      : ['operator']
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkActions(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkAction} 
              disabled={!bulkAction}
              variant={bulkAction?.type === 'remove' ? 'destructive' : 'default'}
            >
              Aplicar Ação
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

      {/* Alerta de segurança */}
      <PermissionGuard permission="system:manage">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Alterações de roles afetam diretamente as permissões dos usuários. 
            Certifique-se de que as mudanças estão alinhadas com as políticas de segurança.
          </AlertDescription>
        </Alert>
      </PermissionGuard>
    </div>
  )
}