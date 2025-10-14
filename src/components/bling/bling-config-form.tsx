'use client'

import React, { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Settings,
  Key,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Zap,
  Clock,
  AlertTriangle,
  Save,
  TestTube,
  Eye,
  EyeOff
} from 'lucide-react'
import { BlingConfig } from '@/types/bling'
import { toast } from 'sonner'

// Schema de validação para configuração do Bling
const blingConfigSchema = z.object({
  client_id: z.string().min(1, 'Client ID é obrigatório'),
  client_secret: z.string().min(1, 'Client Secret é obrigatório'),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  expires_at: z.string().optional(),
  webhook_url: z.string().url('URL do webhook deve ser válida').optional().or(z.literal('')),
  webhook_secret: z.string().optional(),
  auto_sync: z.boolean().default(false),
  sync_interval: z.number().min(5).max(1440).default(60),
  sync_orders: z.boolean().default(true),
  sync_products: z.boolean().default(true),
  sync_customers: z.boolean().default(true),
  rate_limit: z.number().min(1).max(100).default(10),
  timeout: z.number().min(5000).max(60000).default(30000),
  retry_attempts: z.number().min(0).max(10).default(3),
  notes: z.string().optional(),
})

type BlingConfigFormData = z.infer<typeof blingConfigSchema>

interface BlingConfigFormProps {
  config?: BlingConfig
  companyId: string
  onSave: (config: BlingConfigFormData) => Promise<void>
  onTest?: (config: BlingConfigFormData) => Promise<boolean>
  isLoading?: boolean
  className?: string
}

export function BlingConfigForm({
  config,
  companyId,
  onSave,
  onTest,
  isLoading = false,
  className
}: BlingConfigFormProps) {
  const [showSecrets, setShowSecrets] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const form = useForm<BlingConfigFormData>({
    resolver: zodResolver(blingConfigSchema),
    defaultValues: {
      client_id: config?.client_id || '',
      client_secret: config?.client_secret || '',
      access_token: config?.access_token || '',
      refresh_token: config?.refresh_token || '',
      expires_at: config?.expires_at || '',
      webhook_url: config?.webhook_url || '',
      webhook_secret: config?.webhook_secret || '',
      auto_sync: config?.auto_sync || false,
      sync_interval: config?.sync_interval || 60,
      sync_orders: config?.sync_orders !== false,
      sync_products: config?.sync_products !== false,
      sync_customers: config?.sync_customers !== false,
      rate_limit: config?.rate_limit || 10,
      timeout: config?.timeout || 30000,
      retry_attempts: config?.retry_attempts || 3,
      notes: config?.notes || '',
    }
  })

  const { watch, setValue } = form

  // Observar mudanças nos tokens para atualizar status
  const accessToken = watch('access_token')
  const expiresAt = watch('expires_at')

  const isTokenExpired = () => {
    if (!expiresAt) return false
    return new Date(expiresAt) <= new Date()
  }

  const getTokenStatus = () => {
    if (!accessToken) return { status: 'none', label: 'Não configurado', color: 'secondary' }
    if (isTokenExpired()) return { status: 'expired', label: 'Expirado', color: 'destructive' }
    return { status: 'valid', label: 'Válido', color: 'success' }
  }

  const handleSubmit = async (data: BlingConfigFormData) => {
    try {
      await onSave(data)
      toast.success('Configuração salva com sucesso!')
      setTestResult(null)
    } catch (error: any) {
      toast.error(`Erro ao salvar configuração: ${error.message}`)
    }
  }

  const handleTestConnection = async () => {
    if (!onTest) return

    setIsTestingConnection(true)
    setTestResult(null)

    try {
      const formData = form.getValues()
      const success = await onTest(formData)
      
      setTestResult({
        success,
        message: success 
          ? 'Conexão estabelecida com sucesso!' 
          : 'Falha na conexão. Verifique as credenciais.'
      })
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Erro no teste: ${error.message}`
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleAuthRedirect = () => {
    const clientId = form.getValues('client_id')
    if (!clientId) {
      toast.error('Informe o Client ID antes de autorizar')
      return
    }

    const redirectUri = `${window.location.origin}/api/auth/bling/callback`
    const authUrl = `https://bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(companyId)}&env=production`
    window.open(authUrl, '_blank')
  }

  const tokenStatus = getTokenStatus()

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Configurações de Autenticação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Autenticação
              </CardTitle>
              <CardDescription>
                Configure as credenciais de acesso à API do Bling v3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Seu Client ID do Bling" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showSecrets ? 'text' : 'password'}
                            placeholder="Seu Client Secret do Bling"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Status do Token</h4>
                    <p className="text-sm text-muted-foreground">
                      {accessToken ? 'Token configurado' : 'Nenhum token configurado'}
                    </p>
                  </div>
                  <Badge variant={tokenStatus.color as any}>
                    {tokenStatus.label}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAuthRedirect}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Autorizar no Bling
                  </Button>

                  {onTest && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                      className="flex items-center gap-2"
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      Testar Conexão
                    </Button>
                  )}
                </div>

                {testResult && (
                  <Alert variant={testResult.success ? 'default' : 'destructive'}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Sincronização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sincronização
              </CardTitle>
              <CardDescription>
                Configure como os dados serão sincronizados com o Bling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="auto_sync"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sincronização Automática</FormLabel>
                      <FormDescription>
                        Sincronizar dados automaticamente em intervalos regulares
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watch('auto_sync') && (
                <FormField
                  control={form.control}
                  name="sync_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo de Sincronização (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="5"
                          max="1440"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Intervalo entre 5 minutos e 24 horas (1440 minutos)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="sync_orders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Pedidos</FormLabel>
                        <FormDescription>
                          Sincronizar pedidos
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sync_products"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Produtos</FormLabel>
                        <FormDescription>
                          Sincronizar produtos
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sync_customers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Clientes</FormLabel>
                        <FormDescription>
                          Sincronizar clientes
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Avançadas
              </CardTitle>
              <CardDescription>
                Configurações técnicas para otimizar a integração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="rate_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Taxa (req/min)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="100"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Máximo de requisições por minuto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (ms)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="5000"
                          max="60000"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Tempo limite para requisições
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retry_attempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tentativas de Retry</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          max="10"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Tentativas em caso de falha
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="webhook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Webhook (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://seu-dominio.com/webhook/bling" />
                      </FormControl>
                      <FormDescription>
                        URL para receber notificações do Bling
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="webhook_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret do Webhook (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type={showSecrets ? 'text' : 'password'}
                          placeholder="Secret para validar webhooks"
                        />
                      </FormControl>
                      <FormDescription>
                        Chave secreta para validar webhooks
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
              <CardDescription>
                Adicione observações sobre esta configuração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Adicione notas sobre esta configuração..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Configuração
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}