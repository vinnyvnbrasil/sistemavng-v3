'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  MessageSquare,
  Activity,
  Download,
  Eye,
  MoreVertical,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  XCircle,
  AlertCircle,
  Plus,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
import { Task, TaskComment, TaskActivity, TaskAttachment, TaskStatus } from '@/types/task'
import { TaskService } from '@/lib/services/tasks'

const statusIcons = {
  todo: Circle,
  in_progress: PlayCircle,
  review: PauseCircle,
  done: CheckCircle2,
  cancelled: XCircle
}

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const statusLabels = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  review: 'Em Revisão',
  done: 'Concluído',
  cancelled: 'Cancelado'
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [activities, setActivities] = useState<TaskActivity[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (taskId) {
      loadTaskData()
    }
  }, [taskId])

  const loadTaskData = async () => {
    try {
      setLoading(true)
      const [taskData, commentsData, activitiesData, attachmentsData] = await Promise.all([
        TaskService.getTask(taskId),
        TaskService.getTaskComments(taskId),
        TaskService.getTaskActivities(taskId),
        TaskService.getTaskAttachments(taskId)
      ])

      setTask(taskData)
      setComments(commentsData)
      setActivities(activitiesData)
      setAttachments(attachmentsData)
    } catch (error: any) {
      console.error('Erro ao carregar tarefa:', error)
      toast.error(error.message || 'Erro ao carregar tarefa')
      router.push('/dashboard/tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return

    try {
      await TaskService.updateTask(task.id, { status: newStatus })
      setTask(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success('Status atualizado com sucesso!')
      loadTaskData() // Recarregar para atualizar atividades
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error(error.message || 'Erro ao atualizar status')
    }
  }

  const handleDeleteTask = async () => {
    if (!task) return

    try {
      await TaskService.deleteTask(task.id)
      toast.success('Tarefa excluída com sucesso!')
      router.push('/dashboard/tasks')
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error(error.message || 'Erro ao excluir tarefa')
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !task) return

    try {
      setSubmittingComment(true)
      const newComment = await TaskService.addComment(task.id, commentText.trim())
      setComments(prev => [newComment, ...prev])
      setCommentText('')
      toast.success('Comentário adicionado!')
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error)
      toast.error(error.message || 'Erro ao adicionar comentário')
    } finally {
      setSubmittingComment(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate || !task) return false
    return new Date(dueDate) < new Date() && !['done', 'cancelled'].includes(task.status)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getProgressPercentage = () => {
    if (!task) return 0
    switch (task.status) {
      case 'todo': return 0
      case 'in_progress': return 50
      case 'review': return 80
      case 'done': return 100
      case 'cancelled': return 0
      default: return 0
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando tarefa...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tarefa não encontrada</h2>
        <p className="text-gray-600 mb-4">A tarefa que você está procurando não existe.</p>
        <Button onClick={() => router.push('/dashboard/tasks')}>
          Voltar para Tarefas
        </Button>
      </div>
    )
  }

  const StatusIcon = statusIcons[task.status]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className="h-5 w-5 text-gray-500" />
              <Badge className={statusColors[task.status]}>
                {statusLabels[task.status]}
              </Badge>
              <Badge variant="outline" className={priorityColors[task.priority]}>
                {priorityLabels[task.priority]}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Alterar Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                <Circle className="h-4 w-4 mr-2" />
                A Fazer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Em Progresso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('review')}>
                <PauseCircle className="h-4 w-4 mr-2" />
                Em Revisão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Concluído
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancelado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                // TODO: Implementar duplicação
              }}>
                Duplicar Tarefa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // TODO: Implementar exportação
              }}>
                Exportar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteTask}
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

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso da Tarefa</span>
            <span className="text-sm text-gray-600">{getProgressPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="comments">Comentários ({comments.length})</TabsTrigger>
              <TabsTrigger value="activity">Atividade ({activities.length})</TabsTrigger>
              <TabsTrigger value="attachments">Anexos ({attachments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  {task.description ? (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{task.description}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Nenhuma descrição fornecida</p>
                  )}
                </CardContent>
              </Card>

              {task.tags && task.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Comentário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Digite seu comentário..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || submittingComment}
                      >
                        {submittingComment ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Comentar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Nenhum comentário ainda</p>
                    </CardContent>
                  </Card>
                ) : (
                  comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={(comment as any).user?.avatar_url} />
                            <AvatarFallback>
                              {getInitials((comment as any).user?.full_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {(comment as any).user?.full_name || 'Usuário'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {activities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Nenhuma atividade registrada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Activity className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {(activity as any).user?.full_name || 'Sistema'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(activity.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700">{activity.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              {attachments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Nenhum anexo</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map((attachment) => (
                    <Card key={attachment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-gray-500" />
                            <div>
                              <p className="font-medium">{attachment.filename}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(attachment.file_size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações da Tarefa */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={statusColors[task.status]}>
                  {statusLabels[task.status]}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Prioridade</span>
                <Badge variant="outline" className={priorityColors[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>
              </div>

              {task.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vencimento</span>
                  <div className={`flex items-center gap-1 text-sm ${
                    isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    <Calendar className="h-3 w-3" />
                    {formatDateOnly(task.due_date)}
                    {isOverdue(task.due_date) && (
                      <AlertCircle className="h-3 w-3" />
                    )}
                  </div>
                </div>
              )}

              {task.estimated_hours && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estimativa</span>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {task.estimated_hours}h
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Criado em</span>
                <span className="text-sm text-gray-900">
                  {formatDateOnly(task.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Atualizado em</span>
                <span className="text-sm text-gray-900">
                  {formatDateOnly(task.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Responsável */}
          {(task as any).assigned_user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Responsável
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={(task as any).assigned_user.avatar_url} />
                    <AvatarFallback>
                      {getInitials((task as any).assigned_user.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {(task as any).assigned_user.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(task as any).assigned_user.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projeto */}
          {(task as any).project && (
            <Card>
              <CardHeader>
                <CardTitle>Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{(task as any).project.name}</p>
                  <p className="text-sm text-gray-600">
                    {(task as any).project.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push(`/dashboard/projects/${(task as any).project.id}`)}
                  >
                    Ver Projeto
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}