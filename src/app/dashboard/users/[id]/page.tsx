'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Clock,
  Shield,
  User,
  Users,
  Activity,
  Settings,
  MoreHorizontal,
  UserCheck,
  UserX,
  MessageSquare,
  FileText,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { User as UserType, UserActivity, USER_ROLES, USER_STATUSES } from '@/types/user'
import { UserService } from '@/lib/services/users'

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string
  
  const [user, setUser] = useState<UserType | null>(null)
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      loadUser()
      loadActivities()
    }
  }, [userId])

  const loadUser = async () => {
    try {
      setLoading(true)
      const userData = await UserService.getUser(userId)
      setUser(userData)
    } catch (error: any) {
      console.error('Erro ao carregar usuário:', error)
      toast.error(error.message || 'Erro ao carregar usuário')
      router.push('/dashboard/users')
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    if (!userId) return
    
    setActivitiesLoading(true)
    try {
      const userActivities = await UserService.getUserActivities({ user_id: userId }, 1, 20)
      setActivities(userActivities)
    } catch (error) {
      console.error('Erro ao carregar atividades:', error)
      toast.error('Erro ao carregar atividades do usuário')
    } finally {
      setActivitiesLoading(false)
    }
  }

  const handleUserAction = async (action: string) => {
    if (!user) return

    try {
      setActionLoading(true)
      
      switch (action) {
        case 'edit':
          router.push(`/dashboard/users/${userId}/edit`)
          break
        case 'activate':
          await UserService.updateUser(userId, { is_active: true })
          toast.success('Usuário ativado com sucesso')
          loadUser()
          break
        case 'deactivate':
          await UserService.deleteUser(userId)
          toast.success('Usuário desativado com sucesso')
          loadUser()
          break
        case 'delete':
          await UserService.deleteUser(userId)
          toast.success('Usuário excluído com sucesso')
          router.push('/dashboard/users')
          break
        default:
          break
      }
    } catch (error: any) {
      console.error('Erro na ação do usuário:', error)
      toast.error(error.message || 'Erro ao executar ação')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getUserInitials = (user: UserType) => {
    if (user.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  const getRoleInfo = (role: string) => {
    return USER_ROLES.find(r => r.value === role) || USER_ROLES[0]
  }

  const getStatusInfo = (status: string) => {
    return USER_STATUSES.find(s => s.value === status) || USER_STATUSES[3]
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <User className="h-4 w-4" />
      case 'logout':
        return <User className="h-4 w-4" />
      case 'profile_update':
        return <Edit className="h-4 w-4" />
      case 'password_change':
        return <Shield className="h-4 w-4" />
      case 'project_created':
      case 'project_updated':
        return <FileText className="h-4 w-4" />
      case 'task_created':
      case 'task_updated':
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuário...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Usuário não encontrado</h3>
        <p className="text-gray-600 mb-4">O usuário solicitado não existe ou foi removido.</p>
        <Button onClick={() => router.push('/dashboard/users')}>
          Voltar para Usuários
        </Button>
      </div>
    )
  }

  const roleInfo = getRoleInfo(user.role)
  const statusInfo = getStatusInfo(user.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.full_name || 'Usuário'}
            </h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleUserAction('edit')}
            disabled={actionLoading}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleUserAction('edit')}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Usuário
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.is_active ? (
                <DropdownMenuItem 
                  onClick={() => handleUserAction('deactivate')}
                  className="text-orange-600"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Desativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => handleUserAction('activate')}
                  className="text-green-600"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Ativar
                </DropdownMenuItem>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleUserAction('delete')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-lg">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {user.full_name || 'Sem nome'}
                </h3>
                <p className="text-gray-600">{user.email}</p>
                
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    user.status === 'online' ? 'bg-green-500' :
                    user.status === 'away' ? 'bg-yellow-500' :
                    user.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>
                
                <Badge variant="secondary">
                  {roleInfo.label}
                </Badge>
                
                {!user.is_active && (
                  <Badge variant="destructive">
                    Inativo
                  </Badge>
                )}
              </div>
              
              {user.bio && (
                <p className="text-sm text-gray-600 text-center">
                  {user.bio}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Detalhadas */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="activity">Atividades</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    
                    {user.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Telefone</p>
                          <p className="text-sm text-gray-600">{user.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Localização</p>
                          <p className="text-sm text-gray-600">{user.location}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Membro desde</p>
                        <p className="text-sm text-gray-600">{formatDateOnly(user.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Informações Profissionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.department && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Departamento</p>
                        <p className="text-sm text-gray-600">{user.department}</p>
                      </div>
                    )}
                    
                    {user.position && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Cargo</p>
                        <p className="text-sm text-gray-600">{user.position}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900">Papel no Sistema</p>
                      <p className="text-sm text-gray-600">{roleInfo.label}</p>
                    </div>
                    
                    {user.last_login && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Último Login</p>
                        <p className="text-sm text-gray-600">{formatDate(user.last_login)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Atividades Recentes
                  </CardTitle>
                  <CardDescription>
                    Histórico de ações do usuário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className="flex-shrink-0 mt-1">
                            {getActivityIcon(activity.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.details?.description || activity.action}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">
                                {formatDate(activity.created_at)}
                              </p>
                            </div>
                            {activity.details && (
                              <div className="mt-2">
                                <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  {JSON.stringify(activity.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Nenhuma atividade registrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fuso Horário</p>
                      <p className="text-sm text-gray-600">{user.timezone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900">Idioma</p>
                      <p className="text-sm text-gray-600">
                        Português (Brasil)
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status da Conta</p>
                      <p className="text-sm text-gray-600">
                        {user.is_active ? 'Ativa' : 'Inativa'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900">Última Atualização</p>
                      <p className="text-sm text-gray-600">{formatDate(user.updated_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}