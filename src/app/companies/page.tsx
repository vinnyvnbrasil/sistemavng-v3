'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  Phone, 
  MapPin,
  Users,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowLeft,
  Home,
  Settings
} from 'lucide-react'
import type { Company, CompanyInsert, CompanyUpdate } from '@/lib/supabase/types'
import { toast } from 'sonner'

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState<CompanyInsert>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  })
  
  const supabase = createClient()

  // Carregar empresas
  const loadCompanies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setCompanies(data || [])
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  // Filtrar empresas por termo de busca
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: ''
    })
    setEditingCompany(null)
  }

  // Abrir dialog para criar nova empresa
  const handleCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Abrir dialog para editar empresa
  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
        name: company.name,
        cnpj: company.cnpj || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zip_code: company.zip_code || ''
      })
    setIsDialogOpen(true)
  }

  // Salvar empresa (criar ou atualizar)
  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Nome da empresa é obrigatório')
        return
      }

      if (editingCompany) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update(formData as CompanyUpdate)
          .eq('id', editingCompany.id)
        
        if (error) throw error
        
        toast.success('Empresa atualizada com sucesso!')
      } else {
        // Criar nova empresa
        const { error } = await supabase
          .from('companies')
          .insert([formData])
        
        if (error) throw error
        
        toast.success('Empresa criada com sucesso!')
      }
      
      setIsDialogOpen(false)
      resetForm()
      loadCompanies()
    } catch (err) {
      console.error('Erro ao salvar empresa:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar empresa')
    }
  }

  // Excluir empresa
  const handleDelete = async (company: Company) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${company.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id)
      
      if (error) throw error
      
      toast.success('Empresa excluída com sucesso!')
      loadCompanies()
    } catch (err) {
      console.error('Erro ao excluir empresa:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir empresa')
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
          <Button onClick={loadCompanies} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar empresas: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
            <p className="text-gray-600 text-sm">
              Gerencie as empresas do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadCompanies} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany 
                    ? 'Atualize as informações da empresa'
                    : 'Preencha os dados para criar uma nova empresa'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj || ''}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="empresa@exemplo.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code || ''}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, complemento"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Estado"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingCompany ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Companies Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-base">{company.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/companies/${company.id}/bling`)}
                      title="Configurações Bling"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(company)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(company)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {company.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {company.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-1 text-xs text-gray-600">
                  {company.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {(company.city || company.state) && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[company.city, company.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCompanies.length === 0 && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Comece criando sua primeira empresa'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Empresa
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}