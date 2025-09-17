'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Users, Tag, DollarSign, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { CreateProjectData, ProjectStatus, ProjectPriority } from '@/types/project'
import { ProjectService } from '@/lib/services/projects'

const statusOptions: { value: ProjectStatus; label: string; description: string }[] = [
  { value: 'planning', label: 'Planejamento', description: 'Projeto em fase de planejamento' },
  { value: 'active', label: 'Ativo', description: 'Projeto em desenvolvimento ativo' },
  { value: 'on_hold', label: 'Em Pausa', description: 'Projeto temporariamente pausado' }
]

const priorityOptions: { value: ProjectPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Média', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
]

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    deadline: '',
    budget: undefined,
    tags: []
  })
  const [tagInput, setTagInput] = useState('')

  const handleInputChange = (field: keyof CreateProjectData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!formData.name.trim()) {
      setError('Nome do projeto é obrigatório')
      return
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        setError('Data de início não pode ser posterior à data de fim')
        return
      }
    }

    if (formData.deadline && formData.start_date) {
      if (new Date(formData.deadline) < new Date(formData.start_date)) {
        setError('Prazo não pode ser anterior à data de início')
        return
      }
    }

    try {
      setLoading(true)
      const project = await ProjectService.createProject({
        ...formData,
        budget: formData.budget || undefined
      })
      
      toast.success('Projeto criado com sucesso!')
      router.push(`/dashboard/projects/${project.id}`)
    } catch (err: any) {
      console.error('Erro ao criar projeto:', err)
      setError(err.message || 'Erro ao criar projeto')
      toast.error('Erro ao criar projeto')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(numericValue) / 100)
    return formattedValue
  }

  const handleBudgetChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    handleInputChange('budget', Number(numericValue) / 100)
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
          <h1 className="text-3xl font-bold text-gray-900">Novo Projeto</h1>
          <p className="text-gray-600 mt-1">
            Crie um novo projeto e comece a organizar suas tarefas
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Defina as informações principais do projeto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input
                  id="name"
                  placeholder="Digite o nome do projeto"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo e escopo do projeto"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="status">Status Inicial</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger className="mt-1">
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

        {/* Cronograma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronograma
            </CardTitle>
            <CardDescription>
              Defina as datas importantes do projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="end_date">Data de Fim (Estimada)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="deadline">Prazo Final</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orçamento e Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
            <CardDescription>
              Orçamento e tags para organização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="budget" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Orçamento (opcional)
              </Label>
              <Input
                id="budget"
                placeholder="R$ 0,00"
                value={formData.budget ? formatCurrency(String(formData.budget * 100)) : ''}
                onChange={(e) => handleBudgetChange(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <div className="mt-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma tag e pressione Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Adicionar
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </div>
  )
}