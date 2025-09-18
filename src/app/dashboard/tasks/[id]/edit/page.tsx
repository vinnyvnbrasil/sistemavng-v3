'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  AlertCircle,
  Plus,
  X,
  Upload,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Task, UpdateTaskData, TaskPriority, TaskStatus, TaskAttachment } from '@/types/task'
import { TaskService } from '@/lib/services/tasks'

const priorityOptions = [
  { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Média', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
]

const statusOptions = [
  { value: 'todo', label: 'A Fazer' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'review', label: 'Em Revisão' },
  { value: 'done', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' }
]

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params?.id as string

  if (!taskId) {
    router.push('/dashboard/tasks')
    return null
  }

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateTaskData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    estimated_hours: 0,
    tags: [],
    project_id: '',
    assigned_to: ''
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [newAttachments, setNewAttachments] = useState<File[]>([])
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([])

  useEffect(() => {
    if (taskId) {
      loadTaskData()
      loadProjects()
      loadUsers()
    }
  }, [taskId])

  const loadTaskData = async () => {
    try {
      setLoading(true)
      const [taskData, attachmentsData] = await Promise.all([
        TaskService.getTask(taskId),
        TaskService.getTaskAttachments(taskId)
      ])

      setTask(taskData)
      setAttachments(attachmentsData)
      
      // Preencher formulário com dados da tarefa
      if (taskData) {
        setFormData({
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.due_date ? taskData.due_date.split('T')[0] : '',
          estimated_hours: taskData.estimated_hours || 0,
          tags: taskData.tags || [],
          project_id: taskData.project_id || '',
          assigned_to: taskData.assigned_to || ''
        })
      }
    } catch (error: any) {
      console.error('Erro ao carregar tarefa:', error)
      toast.error(error.message || 'Erro ao carregar tarefa')
      router.push('/dashboard/tasks')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      // TODO: Implementar carregamento de projetos
      setProjects([])
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    }
  }

  const loadUsers = async () => {
    try {
      // TODO: Implementar carregamento de usuários
      setUsers([])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = 'Título é obrigatório'
    }

    if (formData.title && formData.title.length > 200) {
      newErrors.title = 'Título deve ter no máximo 200 caracteres'
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Descrição deve ter no máximo 2000 caracteres'
    }

    if (formData.estimated_hours && (formData.estimated_hours < 0 || formData.estimated_hours > 1000)) {
      newErrors.estimated_hours = 'Horas estimadas devem estar entre 0 e 1000'
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        newErrors.due_date = 'Data de vencimento não pode ser no passado'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof UpdateTaskData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      const newTags = [...(formData.tags || []), tagInput.trim()]
      handleInputChange('tags', newTags)
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags?.filter(tag => tag !== tagToRemove) || []
    handleInputChange('tags', newTags)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewAttachments(prev => [...prev, ...files])
  }

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const markAttachmentForDeletion = (attachmentId: string) => {
    setAttachmentsToDelete(prev => [...prev, attachmentId])
    setAttachments(prev => prev.filter(att => att.id !== attachmentId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    try {
      setSaving(true)

      // Preparar dados da tarefa
      const taskData: UpdateTaskData = {
        ...formData,
        estimated_hours: formData.estimated_hours || undefined,
        due_date: formData.due_date || undefined,
        project_id: formData.project_id || undefined,
        assigned_to: formData.assigned_to || undefined
      }

      // Atualizar tarefa
      await TaskService.updateTask(taskId, taskData)

      // Excluir anexos marcados para exclusão
      if (attachmentsToDelete.length > 0) {
        for (const attachmentId of attachmentsToDelete) {
          try {
            await TaskService.deleteAttachment(attachmentId)
          } catch (error) {
            console.error('Erro ao excluir anexo:', error)
          }
        }
      }

      // Upload de novos anexos
      if (newAttachments.length > 0) {
        for (const file of newAttachments) {
          try {
            await TaskService.uploadAttachment(taskId, file)
          } catch (error) {
            console.error('Erro ao fazer upload do anexo:', error)
            toast.error(`Erro ao fazer upload do arquivo ${file.name}`)
          }
        }
      }

      toast.success('Tarefa atualizada com sucesso!')
      router.push(`/dashboard/tasks/${taskId}`)
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error(error.message || 'Erro ao atualizar tarefa')
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Tarefa</h1>
          <p className="text-gray-600 mt-1">
            Atualize as informações da tarefa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Atualize as informações principais da tarefa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Digite o título da tarefa..."
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva os detalhes da tarefa..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as TaskStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value as TaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={option.color}>{option.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atribuição e Prazos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Atribuição e Prazos
            </CardTitle>
            <CardDescription>
              Configure responsáveis e datas importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Projeto</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => handleInputChange('project_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => handleInputChange('assigned_to', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className={`pl-10 ${errors.due_date ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.due_date && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.due_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Horas Estimadas</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="estimated_hours"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.5"
                    placeholder="0"
                    value={formData.estimated_hours || ''}
                    onChange={(e) => handleInputChange('estimated_hours', parseFloat(e.target.value) || 0)}
                    className={`pl-10 ${errors.estimated_hours ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.estimated_hours && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.estimated_hours}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags e Anexos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags e Anexos
            </CardTitle>
            <CardDescription>
              Gerencie tags e anexos da tarefa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Anexos Existentes */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Anexos Atuais</Label>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{attachment.file_name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(attachment.file_size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => markAttachmentForDeletion(attachment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Novos Anexos */}
            <div className="space-y-2">
              <Label>Adicionar Novos Anexos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center text-center"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar arquivos ou arraste aqui
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 10MB por arquivo
                  </p>
                </label>
              </div>
              
              {newAttachments.length > 0 && (
                <div className="space-y-2">
                  {newAttachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        <Badge variant="secondary" className="text-xs">Novo</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNewAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}