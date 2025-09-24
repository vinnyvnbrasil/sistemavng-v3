'use client'

// Componente Principal de Gerenciamento de Roles
// Interface completa para administrar roles e permissões de usuários

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Users, 
  User, 
  Edit, 
  Save, 
  X, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  AlertTriangle
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserRole, ROLE_DEFINITIONS, User as UserType } from '@/types/rbac'
import { RoleSelector, RoleDisplay, RoleComparison } from './role-selector'
import { PermissionGuard } from './permission-guard'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface RoleManagementProps {
  users?: UserType[]
  onUserRoleChange?: (userId: string, newRole: UserRole) => Promise<void>
  onRefresh?: () => void
}

export function RoleManagement({ 
  users = [], 
  onUserRoleChange,
  onRefresh 
}: RoleManagementProps) {
  const { user: currentUser, hasPermission } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator')
  const [isLoading, setIsLoading] = useState(false)
  const [showRoleComparison, setShowRoleComparison] = useState(false)

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Estatísticas de roles
  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    leader: users.filter(u => u.role === 'leader').length,
    operator: users.filter(u => u.role === 'operator').length,
    total: users.length
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!onUserRoleChange) return

    setIsLoading(true)
    try {
      await onUserRoleChange(userId, newRole)
      setEditingUser(null)
      toast.success('Role atualizado com sucesso!')
      onRefresh?.()
    } catch (error) {
      toast.error('Erro ao atualizar role')
      console.error('Erro ao atualizar role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'leader':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'operator':
        return <User className="h-4 w-4 text-green-600" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'leader':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'operator':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canEditRole = (targetUser: UserType) => {
    if (!currentUser) return false
    
    // Admin pode editar qualquer role
    if (currentUser.role === 'admin') return true
    
    // Leader pode editar apenas operators
    if (currentUser.role === 'leader' && targetUser.role === 'operator') return true
    
    // Não pode editar próprio role
    if (currentUser.id === targetUser.id) return false
    
    return false
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{roleStats.admin}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Líderes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{roleStats.leader}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{roleStats.operator}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Gerenciar Usuários</TabsTrigger>
          <TabsTrigger value="roles">Comparar Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filtros e busca */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Roles</CardTitle>
              <CardDescription>
                Gerencie os roles e permissões dos usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os roles</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="leader">Líderes</SelectItem>
                    <SelectItem value="operator">Operadores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela de usuários */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Role Atual</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingUser === user.id ? (
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
                              {getRoleIcon(user.role)}
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {ROLE_DEFINITIONS[user.role].name}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {ROLE_DEFINITIONS[user.role].permissions.length} permissões
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingUser === user.id ? (
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleRoleChange(user.id, selectedRole)}
                                disabled={isLoading}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(null)}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <PermissionGuard permission="users:manage">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {canEditRole(user) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingUser(user.id)
                                        setSelectedRole(user.role)
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar Role
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </PermissionGuard>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado com os filtros aplicados.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Roles</CardTitle>
              <CardDescription>
                Compare as permissões e responsabilidades de cada role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleComparison roles={['admin', 'leader', 'operator']} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertas de segurança */}
      <PermissionGuard permission="system:manage">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Alterações de roles afetam diretamente as permissões dos usuários. 
            Certifique-se de que as mudanças estão alinhadas com as políticas de segurança da empresa.
          </AlertDescription>
        </Alert>
      </PermissionGuard>
    </div>
  )
}

export default RoleManagement