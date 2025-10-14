'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Activity, 
  Package, 
  ShoppingCart,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { BlingSyncList } from '@/components/bling/bling-sync-list'
import { BlingDashboard } from '@/components/bling/bling-dashboard'
import { BlingProducts } from '@/components/bling/bling-products'
import { BlingOrders } from '@/components/bling/bling-orders'
import { BlingConfigForm } from '@/components/bling/bling-config-form'

interface BlingConfig {
  id: string
  company_id: string
  client_id: string
  client_secret?: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  auto_sync_enabled: boolean
  sync_interval: number
  sync_orders: boolean
  sync_products: boolean
  sync_customers: boolean
  rate_limit: number
  timeout: number
  retry_attempts: number
  webhook_url?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CompanyData {
  id: string
  name: string
}

export default function BlingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [blingConfig, setBlingConfig] = useState<BlingConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const supabase = createClient()

  // Carregar dados iniciais
  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar usuário autenticado
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        window.location.href = '/auth/login'
        return
      }
      setUser(currentUser)

      // Carregar empresas do usuário
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('created_by', currentUser.id)
        .order('name')

      if (companiesError) throw companiesError

      setCompanies(companiesData || [])
      
      // Selecionar primeira empresa por padrão
      if (companiesData && companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id)
      }

    } catch (err: any) {
      console.error('Erro ao carregar dados iniciais:', err)
      setError(err.message || 'Erro ao carregar dados')
      toast.error('Erro ao carregar dados iniciais')
    } finally {
      setLoading(false)
    }
  }

  // Carregar configuração do Bling para empresa selecionada
  const loadBlingConfig = async (companyId: string) => {
    if (!companyId) return

    try {
      setConfigLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('Sessão inválida. Faça login novamente.')
      }

      const response = await fetch(`/api/bling/config?company_id=${companyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setBlingConfig(result.data || null)
      } else {
        setBlingConfig(null)
        if (result?.error) {
          toast.error(result.error)
        }
      }

    } catch (err: any) {
      console.error('Erro ao carregar configuração do Bling:', err)
      toast.error(err.message || 'Erro ao carregar configuração do Bling')
    } finally {
      setConfigLoading(false)
    }
  }

  // Testar conexão com Bling
  const testBlingConnection = async () => {
    if (!selectedCompany) {
      toast.error('Selecione uma empresa primeiro')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('Sessão inválida. Faça login novamente.')
      }

      const response = await fetch('/api/bling/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          company_id: selectedCompany,
          test_type: 'connection'
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const summary = result.data?.summary
        if (summary) {
          toast.success(`Conexão testada: ${summary.successful_tests}/${summary.total_tests} sucesso`)
        } else {
          toast.success('Conexão com Bling testada com sucesso!')
        }
      } else {
        toast.error(result.error || 'Erro ao testar conexão')
      }
    } catch (err: any) {
      console.error('Erro ao testar conexão:', err)
      toast.error(err.message || 'Erro ao testar conexão com Bling')
    }
  }

  // Efeitos
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      loadBlingConfig(selectedCompany)
    }
  }, [selectedCompany])

  // Listener para mensagens do OAuth do Bling (callback abre janela e envia postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.origin !== window.location.origin) return
        const data = event.data as any
        if (data?.type === 'bling_auth') {
          if (data.success) {
            toast.success(data.message || 'Autorização do Bling concluída!')
            const targetCompany = data.companyId || selectedCompany
            if (targetCompany) {
              loadBlingConfig(targetCompany)
            }
          } else {
            toast.error(data.message || 'Falha na autorização do Bling')
          }
        }
      } catch (e) {}
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [selectedCompany])

  // Estados de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando integração Bling...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-700">Erro ao carregar integração Bling</h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <Button 
            onClick={loadInitialData} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Package className="h-12 w-12 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Nenhuma empresa encontrada</h3>
          <p className="text-sm text-gray-600 mt-1">
            Você precisa ter pelo menos uma empresa cadastrada para usar a integração Bling
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard/companies'} 
            className="mt-4"
          >
            Cadastrar Empresa
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            Integração Bling
          </h1>
          <p className="text-muted-foreground">
            Gerencie sua integração com o ERP Bling - Sincronização de pedidos, produtos e clientes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={testBlingConnection}
            disabled={!blingConfig || configLoading}
          >
            <Activity className="h-4 w-4 mr-2" />
            Testar Conexão
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadBlingConfig(selectedCompany)}
            disabled={configLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${configLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status da Configuração */}
      {selectedCompany && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {blingConfig ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Configuração ativa</p>
                      <p className="text-sm text-muted-foreground">
                        Última atualização: {new Date(blingConfig.updated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Configuração necessária</p>
                      <p className="text-sm text-muted-foreground">
                        Configure as credenciais do Bling para começar
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {blingConfig && (
                  <>
                    <Badge variant={blingConfig.is_active ? "default" : "secondary"}>
                      {blingConfig.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    {blingConfig.auto_sync_enabled && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Auto-sync
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sincronizações
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          {blingConfig ? (
            <BlingDashboard companyId={selectedCompany} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure as credenciais do Bling na aba "Configuração" para visualizar o dashboard.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Sincronizações */}
        <TabsContent value="sync" className="space-y-4">
          {blingConfig ? (
            <BlingSyncList companyId={selectedCompany} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure as credenciais do Bling na aba "Configuração" para gerenciar sincronizações.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Produtos */}
        <TabsContent value="products" className="space-y-4">
          {blingConfig ? (
            <BlingProducts companyId={selectedCompany} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure as credenciais do Bling na aba "Configuração" para gerenciar produtos.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Pedidos */}
        <TabsContent value="orders" className="space-y-4">
          {blingConfig ? (
            <BlingOrders companyId={selectedCompany} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure as credenciais do Bling na aba "Configuração" para gerenciar pedidos.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Configuração */}
        <TabsContent value="config" className="space-y-4">
          <BlingConfigForm 
            companyId={selectedCompany}
            config={blingConfig}
            onSave={async (formData) => {
              try {
                // Obter token de sessão para autenticação na API
                const { data: { session } } = await supabase.auth.getSession()
                const accessToken = session?.access_token
                if (!accessToken) {
                  throw new Error('Sessão inválida. Faça login novamente.')
                }

                const payload = {
                  company_id: selectedCompany,
                  client_id: formData.client_id,
                  client_secret: formData.client_secret,
                  redirect_uri: `${window.location.origin}/api/auth/bling/callback`,
                  environment: 'production',
                  webhook_url: formData.webhook_url || undefined,
                  is_active: true,
                }

                let response: Response
                if (!blingConfig) {
                  // Criar configuração (POST)
                  response = await fetch('/api/bling/config', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(payload),
                  })
                } else {
                  // Atualizar configuração (PUT)
                  response = await fetch(`/api/bling/config?company_id=${selectedCompany}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(payload),
                  })
                }

                const result = await response.json()
                if (!response.ok || !result.success) {
                  throw new Error(result.error || 'Falha ao salvar configuração')
                }

                // Recarregar configuração atualizada
                await loadBlingConfig(selectedCompany)
                toast.success('Configuração salva com sucesso!')
              } catch (err: any) {
                console.error('Erro ao salvar configuração do Bling:', err)
                toast.error(err.message || 'Erro ao salvar configuração do Bling')
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}