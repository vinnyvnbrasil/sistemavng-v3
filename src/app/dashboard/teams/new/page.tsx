'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ArrowLeft, Save, Users } from 'lucide-react'
import { UserService } from '@/lib/services/users'
import { supabase } from '@/lib/supabase/client'

interface CreateTeamData {
  name: string
  description: string
  department: string
  manager_id?: string
  max_members: number
  is_active: boolean
  avatar_url?: string
  color?: string
}

export default function NewTeamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    description: '',
    department: '',
    max_members: 10,
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome da equipe é obrigatório')
      return
    }

    try {
      setLoading(true)
      
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error('Você precisa estar logado para criar uma equipe')
        router.push('/auth/login')
        return
      }

      await UserService.createTeam(formData, user.id)
      toast.success('Equipe criada com sucesso!')
      router.push('/dashboard/teams')
    } catch (error: any) {
      console.error('Erro ao criar equipe:', error)
      toast.error(error.message || 'Erro ao criar equipe')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateTeamData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Nova Equipe</h1>
          <p className="text-gray-600 mt-1">
            Crie uma nova equipe para sua organização
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Informações da Equipe
          </CardTitle>
          <CardDescription>
            Preencha as informações básicas da nova equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Equipe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Desenvolvimento Frontend"
                  required
                />
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleInputChange('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Vendas">Vendas</SelectItem>
                    <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Operações">Operações</SelectItem>
                    <SelectItem value="Suporte">Suporte</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Máximo de Membros */}
              <div className="space-y-2">
                <Label htmlFor="max_members">Máximo de Membros</Label>
                <Input
                  id="max_members"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_members}
                  onChange={(e) => handleInputChange('max_members', parseInt(e.target.value) || 10)}
                />
              </div>

              {/* Status Ativo */}
              <div className="space-y-2">
                <Label htmlFor="is_active">Equipe Ativa</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <span className="text-sm text-gray-600">
                    {formData.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o propósito e objetivos da equipe..."
                rows={4}
              />
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name.trim()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Equipe
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}