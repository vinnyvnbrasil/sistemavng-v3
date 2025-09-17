'use client'

// Página de Gerenciamento de Usuários
// Sistema completo de RBAC com criação, edição e controle de permissões

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  Building,
  UserCheck,
  UserX,
  Download,
  Upload,
  Settings
} from 'lucide-react'

import { 
  TeamMember, 
  UserRole, 
  UserFilters, 
  UserSearchParams, 
  UsersResponse,
  ROLE_DEFINITIONS,
  CreateUserForm,
  UpdateUserForm
} from '@/types/rbac'
import { rbacService } from '@/lib/services/rbac-service'
import { useAuth } from '@/hooks/use-auth'
import { PermissionGuard } from '@/components/rbac/permission-guard'

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800'
}

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  leader: 'bg-blue-100 text-blue-800',
  operator: 'bg-green-100 text-green-800'
}

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser, isAdmin, isLeader } = useAuth()
  
  // Estados
  const [users, setUsers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<UserFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [managers, setManagers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    by_role: {} as Record<UserRole, number>,
    by_department: {} as Record<string, number>
  })

  // Carrega dados iniciais
  useEffect(() => {
    if (currentUser) {
      loadUsers()
      loadDepartments()
      loadManagers()
      loadStats()
    }
  }, [currentUser, searchTerm, filters, currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      const params: UserSearchParams = {
        filters: {
          ...filters,
          search: searchTerm || undefined
        },
        page: currentPage,
        limit: 20,
        sort_field: 'full_name',
        sort_direction: 'asc'
      }

      const response = await rbacService.getUsers(params)
      
      setUsers(response.users)
      setTotalPages(response.total_pages)
      setTotalUsers(response.total)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    if (!currentUser) return
    
    try {
      const depts = await rbacService.getDepartments(currentUser.company_id)
      setDepartments(depts)
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }

  const loadManagers = async () => {
    if (!currentUser) return
    
    try {
      const mgrs = await rbacService.getManagers(currentUser.company_id)
      setManagers(mgrs)
    } catch (error) {
      console.error('Erro ao carregar gerentes:', error)
    }
  }

  const loadStats = async () => {
    if (!currentUser) return
    
    try {
      const teamStats = await rbacService.getTeamStats(currentUser.company_id)
      setStats(teamStats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleCreateUser = async (userData: CreateUserForm) => {
    if (!currentUser) return

    try {
      await rbacService.createUser(userData, currentUser.company_id)
      setShowCreateModal(false)
      loadUsers()
      loadStats()
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
    }
  }

  const handleUpdateUser = async (userData: UpdateUserForm) => {
    if (!editingUser) return

    try {
      await rbacService.updateUser(editingUser.user_id, userData)
      setShowEditModal(false)
      setEditingUser(null)
      loadUsers()
      loadStats()
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return

    try {
      await rbacService.deactivateUser(userId)
      loadUsers()
      loadStats()
    } catch (error) {
      console.error('Erro ao desativar usuário:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return

    try {
      await rbacService.deleteUser(userId)
      loadUsers()
      loadStats()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Tem certeza que deseja redefinir a senha deste usuário?')) return

    try {
      const newPassword = await rbacService.resetUserPassword(userId)
      alert(`Nova senha: ${newPassword}\nEnvie esta senha para o usuário de forma segura.`)
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600">
            Gerencie usuários, funções e permissões da sua equipe
          </p>
        </div>
        
        <PermissionGuard permission="users:create">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </button>
        </PermissionGuard>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.by_role.admin || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Departamentos</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.by_department).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por Função */}
          <select
            value={filters.role?.[0] || ''}
            onChange={(e) => handleFilterChange({ 
              role: e.target.value ? [e.target.value as UserRole] : undefined 
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as Funções</option>
            {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
              <option key={key} value={key}>{role.name}</option>
            ))}
          </select>

          {/* Filtro por Departamento */}
          <select
            value={filters.department?.[0] || ''}
            onChange={(e) => handleFilterChange({ 
              department: e.target.value ? [e.target.value] : undefined 
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Departamentos</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={filters.is_active === undefined ? '' : filters.is_active.toString()}
            onChange={(e) => handleFilterChange({ 
              is_active: e.target.value === '' ? undefined : e.target.value === 'true'
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando um novo usuário para sua equipe.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {member.user.avatar_url ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={member.user.avatar_url}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[member.role]}`}>
                          {ROLE_DEFINITIONS[member.role].name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.is_active ? statusColors.active : statusColors.inactive
                        }`}>
                          {member.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.user.last_login 
                          ? new Date(member.user.last_login).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGuard permission="users:update">
                            <button
                              onClick={() => {
                                setEditingUser(member)
                                setShowEditModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="users:manage_roles">
                            <button
                              onClick={() => handleResetPassword(member.user_id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Redefinir Senha"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          </PermissionGuard>

                          <PermissionGuard permission="users:delete">
                            {member.is_active ? (
                              <button
                                onClick={() => handleDeactivateUser(member.user_id)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Desativar"
                              >
                                <EyeOff className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(member.user_id)}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">{(currentPage - 1) * 20 + 1}</span>
                      {' '}até{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 20, totalUsers)}
                      </span>
                      {' '}de{' '}
                      <span className="font-medium">{totalUsers}</span>
                      {' '}resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Próximo
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modais serão implementados em componentes separados */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          departments={departments}
          managers={managers}
        />
      )}

      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          onSubmit={handleUpdateUser}
          departments={departments}
          managers={managers}
        />
      )}
    </div>
  )
}

// Componente Modal de Criação (simplificado)
function CreateUserModal({ 
  onClose, 
  onSubmit, 
  departments, 
  managers 
}: {
  onClose: () => void
  onSubmit: (data: CreateUserForm) => void
  departments: string[]
  managers: TeamMember[]
}) {
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    full_name: '',
    role: 'operator',
    phone: '',
    department: '',
    manager_id: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Criar Novo Usuário</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                <option key={key} value={key}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Criar Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente Modal de Edição (simplificado)
function EditUserModal({ 
  user, 
  onClose, 
  onSubmit, 
  departments, 
  managers 
}: {
  user: TeamMember
  onClose: () => void
  onSubmit: (data: UpdateUserForm) => void
  departments: string[]
  managers: TeamMember[]
}) {
  const [formData, setFormData] = useState<UpdateUserForm>({
    full_name: user.user.full_name,
    role: user.role,
    department: user.department || '',
    manager_id: user.manager_id || '',
    is_active: user.is_active
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Editar Usuário</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                <option key={key} value={key}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Usuário Ativo
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}