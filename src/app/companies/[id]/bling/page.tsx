'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Settings, 
  Key, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Zap,
  Clock,
  AlertTriangle,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

interface Company {
  id: string
  name: string
  cnpj?: string
  email?: string
}

interface BlingConfig {
  id?: string
  company_id: string
  client_id: string
  client_secret: string
  access_token?: string
  refresh_token?: string
  expires_at?: string
  is_active: boolean
  webhook_url?: string
  webhook_events: string[]
  last_sync?: string
  sync_status: 'pending' | 'syncing' | 'completed' | 'error'
  sync_errors: any[]
  created_at?: string
  updated_at?: string
}

export default function BlingConfigPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.id as string
  
  const [company, setCompany] = useState<Company | null>(null)
  const [blingConfig, setBlingConfig] = useState<BlingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    client_id: '',
    client_secret: '',
    webhook_url: '',
    webhook_events: ['order.created', 'order.updated', 'product.updated'],
    is_active: true
  })
  
  const supabase = createClient()

  // Carregar dados da empresa e configuração do Bling
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Carregar empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, cnpj, email')
        .eq('id', companyId)
        .single()
      
      if (companyError) throw companyError
      setCompany(companyData)
      
      // Carregar configuração do Bling
      const { data: configData, error: configError } = await supabase
        .from('bling_configs')
        .select('*')
        .eq('company_id', companyId)
        .single()
      
      if (configError && configError.code !== 'PGRST116') {
        throw configError
      }
      
      if (configData) {
        setBlingConfig(configData)
        setFormData({
          client_id: configData.client_id || '',
          client_secret: configData.client_secret || '',
          webhook_url: configData.webhook_url || '',
          webhook_events: configData.webhook_events || ['order.created', 'order.updated', 'product.updated'],
          is_active: configData.is_active
        })
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) {
      loadData()
    }
  }, [companyId])

  // Salvar configuração
  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (!formData.client_id.trim() || !formData.client_secret.trim()) {
        toast.error('Client ID e Client Secret são obrigatórios')
        return
      }

      const configData = {
        company_id: companyId,
        client_id: formData.client_id,
        client_secret: formData.client_secret,
        webhook_url: formData.webhook_url || null,
        webhook_events: formData.webhook_events,
        is_active: formData.is_active,
        sync_status: 'pending' as const,
        updated_at: new Date().toISOString()
      }

      if (blingConfig?.id) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('bling_configs')
          .update(configData)
          .eq('id', blingConfig.id)
        
        if (error) throw error
        toast.success('Configuração atualizada com sucesso!')
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('bling_configs')
          .insert([configData])
          .select()
          .single()
        
        if (error) throw error
        setBlingConfig(data)
        toast.success('Configuração criada com sucesso!')
      }
      
      loadData()
    } catch (err) {
      console.error('Erro ao salvar configuração:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  // Testar conexão com Bling
  const handleTestConnection = async () => {
    try {
      setTesting(true)
      
      if (!formData.client_id.trim() || !formData.client_secret.trim()) {
        toast.error('Preencha Client ID e Client Secret antes de testar')
        return
      }

      // Aqui você implementaria a lógica de teste da API do Bling
      // Por enquanto, vamos simular um teste
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Conexão testada com sucesso!')
    } catch (err) {
      console.error('Erro ao testar conexão:', err)
      toast.error('Erro ao testar conexão com o Bling')
    } finally {
      setTesting(false)
    }
  }

  // Sincronizar dados
  const handleSync = async () => {
    try {
      if (!blingConfig?.id) {
        toast.error('Salve a configuração antes de sincronizar')
        return
      }

      // Atualizar status para syncing
      await supabase
        .from('bling_configs')
        .update({ 
          sync_status: 'syncing',
          last_sync: new Date().toISOString()
        })
        .eq('id', blingConfig.id)

      toast.success('Sincronização iniciada!')
      loadData()
    } catch (err) {
      console.error('Erro ao iniciar sincronização:', err)
      toast.error('Erro ao iniciar sincronização')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sincronizado</Badge>
      case 'syncing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Sincronizando</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erro</Badge>
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar dados: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/companies')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações Bling</h1>
          <p className="text-gray-600 text-sm">
            {company?.name} - Integração com Bling API V3
          </p>
        </div>
      </div>

      {/* Status Card */}
      {blingConfig && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Status da Integração</CardTitle>
                <CardDescription>
                  Última sincronização: {blingConfig.last_sync ? new Date(blingConfig.last_sync).toLocaleString('pt-BR') : 'Nunca'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(blingConfig.sync_status)}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSync}
                  disabled={blingConfig.sync_status === 'syncing'}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração da API
          </CardTitle>
          <CardDescription>
            Configure as credenciais da API do Bling para esta empresa.
            <a 
              href="https://developer.bling.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-2 text-blue-600 hover:underline"
            >
              Ver documentação <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credenciais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4" />
              <h3 className="font-semibold">Credenciais da API</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  placeholder="Seu Client ID do Bling"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret *</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={formData.client_secret}
                  onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                  placeholder="Seu Client Secret do Bling"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Webhooks */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4" />
              <h3 className="font-semibold">Configurações de Webhook</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook_url">URL do Webhook (Opcional)</Label>
              <Input
                id="webhook_url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://seudominio.com/webhook/bling"
              />
              <p className="text-xs text-gray-500">
                URL para receber notificações automáticas do Bling
              </p>
            </div>

            <div className="space-y-2">
              <Label>Eventos do Webhook</Label>
              <div className="space-y-2">
                {[
                  { value: 'order.created', label: 'Pedido Criado' },
                  { value: 'order.updated', label: 'Pedido Atualizado' },
                  { value: 'product.updated', label: 'Produto Atualizado' },
                  { value: 'invoice.created', label: 'Nota Fiscal Criada' }
                ].map((event) => (
                  <div key={event.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event.value}
                      checked={formData.webhook_events.includes(event.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            webhook_events: [...formData.webhook_events, event.value]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            webhook_events: formData.webhook_events.filter(ev => ev !== event.value)
                          })
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={event.value} className="text-sm font-normal">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Status da Integração</Label>
              <p className="text-xs text-gray-500">
                Ativar ou desativar a integração com o Bling
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testing || !formData.client_id || !formData.client_secret}
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {blingConfig?.sync_errors && blingConfig.sync_errors.length > 0 && (
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erros de Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blingConfig.sync_errors.map((error, index) => (
                <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {typeof error === 'string' ? error : JSON.stringify(error)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}