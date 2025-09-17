'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Project, ProjectStatus, ProjectPriority, UpdateProjectData } from '@/types/project'
import { ProjectService } from '@/lib/services/projects'

const statusOptions = [
  { value: 'planning', label: 'Planejamento' },
  { value: 'active', label: 'Ativo' },
  { value: 'on_hold', label: 'Em Pausa' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' }
]

const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' }
]

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as ProjectStatus,
    priority: 'medium' as ProjectPriority,
    start_date: '',
    end_date: '',
    deadline: '',
    budget: '',
    progress: 0,
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const projectData = await ProjectService.getProject(projectId)
      
      if (!projectData) {
        toast.error('Projeto não encontrado')
        router.push('/dashboard/projects')
        return
      }

      setProject(projectData)
      setFormData({
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status,
        priority: projectData.priority,
        start_date: projectData.start_date ? projectData.start_date.split('T')[0] : '',
        end_date: projectData.end_date ? projectData.end_date.split('T')[0] : '',
        deadline: projectData.deadline ? projectData.deadline.split('T')[0] : '',
        budget: projectData.budget ? projectData.budget.toString() : '',
        progress: projectData.progress,
        tags: projectData.tags || []
      })
    } catch (error) {
      console.error('Erro ao carregar projeto:', error)
      toast.error('Erro ao carregar projeto')
      router.push('/dashboard/projects')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do projeto é obrigatório'
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        newErrors.end_date = 'Data de fim deve ser posterior à data de início'
      }
    }

    if (formData.deadline && formData.start_date) {
      if (new Date(formData.deadline) < new Date(formData.start_date)) {
        newErrors.deadline = 'Prazo deve ser posterior à data de início'
      }
    }

    if (formData.budget && parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Orçamento deve ser um valor positivo'
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progresso deve estar entre 0 e 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    try {
      setSaving(true)
      
      const updateData: UpdateProjectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        deadline: formData.deadline || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        progress: formData.progress,
        tags: formData.tags.length > 0 ? formData.tags : null
      }

      await ProjectService.updateProject(projectId, updateData)
      toast.success('Projeto atualizado com sucesso!')
      router.push(`/dashboard/projects/${projectId}`)
    } catch (error: any) {
      console.error('Erro ao atualizar projeto:', error)
      toast.error(error.message || 'Erro ao atualizar projeto')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    if (!numericValue) return ''
    
    const number = parseFloat(numericValue) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleBudgetChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    if (numericValue) {
      const number = parseFloat(numericValue) / 100
      handleInputChange('budget', number.toString())
    } else {
      handleInputChange('budget', '')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Projeto não encontrado</h2>
        <p className="text-gray-600 mb-4">O projeto que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => router.push('/dashboard/projects')}>
          Voltar aos Projetos
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Projeto</h1>
            <p className="text-gray-600 mt-1">{project.name}</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Defina as informações principais do projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Projeto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Digite o nome do projeto"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva o projeto (opcional)"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleInputChange('status', value)}
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
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => handleInputChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progress">Progresso (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                    className={errors.progress ? 'border-red-500' : ''}
                  />
                  {errors.progress && (
                    <p className="text-sm text-red-600">{errors.progress}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Adicione tags para categorizar o projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder="Digite uma tag e pressione Enter"
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Adicionar
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
              </CardContent>
            </Card>
          </div>

          {/* Cronograma e Orçamento */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cronograma</CardTitle>
                <CardDescription>
                  Defina as datas do projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Fim Estimada</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={errors.end_date ? 'border-red-500' : ''}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-red-600">{errors.end_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo Final</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className={errors.deadline ? 'border-red-500' : ''}
                  />
                  {errors.deadline && (
                    <p className="text-sm text-red-600">{errors.deadline}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orçamento</CardTitle>
                <CardDescription>
                  Defina o orçamento do projeto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="budget">Valor (R$)</Label>
                  <Input
                    id="budget"
                    value={formData.budget ? formatCurrency(formData.budget) : ''}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    placeholder="0,00"
                    className={errors.budget ? 'border-red-500' : ''}
                  />
                  {errors.budget && (
                    <p className="text-sm text-red-600">{errors.budget}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
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
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}