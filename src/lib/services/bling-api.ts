// Bling API V3 Integration Service
import { ApiResponse } from '@/types/api'

// Bling API Types
export interface BlingConfig {
  clientId: string
  clientSecret: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
}

export interface BlingOrder {
  id: number
  numero: string
  data: string
  dataEntrega?: string
  cliente: {
    id: number
    nome: string
    email?: string
    telefone?: string
  }
  itens: BlingOrderItem[]
  total: number
  situacao: {
    id: number
    valor: string
  }
  loja?: {
    id: number
    nome: string
  }
  marketplace?: string
  observacoes?: string
  desconto?: number
  frete?: number
}

export interface BlingOrderItem {
  id: number
  codigo?: string
  descricao: string
  quantidade: number
  valor: number
  produto?: {
    id: number
    nome: string
    codigo?: string
  }
}

export interface BlingProduct {
  id: number
  nome: string
  codigo?: string
  preco: number
  situacao: string
  formato: string
  descricaoCurta?: string
  descricaoComplementar?: string
  categoria?: {
    id: number
    descricao: string
  }
  estoque?: {
    minimo?: number
    maximo?: number
    atual?: number
  }
}

export interface BlingCustomer {
  id: number
  nome: string
  email?: string
  telefone?: string
  documento?: string
  endereco?: {
    endereco: string
    numero?: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
    cep: string
  }
}

// Bling API Service Class
export class BlingApiService {
  private baseUrl = 'https://www.bling.com.br/Api/v3'
  private config: BlingConfig

  constructor(config: BlingConfig) {
    this.config = config
  }

  // Authentication Methods
  async authenticate(): Promise<boolean> {
    try {
      if (!this.config.accessToken || this.isTokenExpired()) {
        await this.refreshAccessToken()
      }
      return true
    } catch (error) {
      console.error('Bling authentication failed:', error)
      return false
    }
  }

  private isTokenExpired(): boolean {
    if (!this.config.expiresAt) return true
    return new Date() >= this.config.expiresAt
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error('Refresh token not available')
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh access token')
    }

    const data = await response.json()
    this.config.accessToken = data.access_token
    this.config.refreshToken = data.refresh_token
    this.config.expiresAt = new Date(Date.now() + data.expires_in * 1000)
  }

  // Generic API Request Method
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    await this.authenticate()

    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Bling API request failed')
    }

    return {
      success: true,
      data: data.data,
      meta: data.meta,
    }
  }

  // Orders Methods
  async getOrders(params?: {
    dataInicial?: string
    dataFinal?: string
    situacao?: string
    loja?: number
    pagina?: number
    limite?: number
  }): Promise<ApiResponse<BlingOrder[]>> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/pedidos/vendas${queryParams.toString() ? `?${queryParams}` : ''}`
    return this.makeRequest<BlingOrder[]>(endpoint)
  }

  async getOrder(id: number): Promise<ApiResponse<BlingOrder>> {
    return this.makeRequest<BlingOrder>(`/pedidos/vendas/${id}`)
  }

  async updateOrderStatus(id: number, situacaoId: number): Promise<ApiResponse<BlingOrder>> {
    return this.makeRequest<BlingOrder>(`/pedidos/vendas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        situacao: { id: situacaoId }
      })
    })
  }

  // Products Methods
  async getProducts(params?: {
    codigo?: string
    nome?: string
    situacao?: string
    categoria?: number
    pagina?: number
    limite?: number
  }): Promise<ApiResponse<BlingProduct[]>> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/produtos${queryParams.toString() ? `?${queryParams}` : ''}`
    return this.makeRequest<BlingProduct[]>(endpoint)
  }

  async getProduct(id: number): Promise<ApiResponse<BlingProduct>> {
    return this.makeRequest<BlingProduct>(`/produtos/${id}`)
  }

  // Customers Methods
  async getCustomers(params?: {
    nome?: string
    email?: string
    documento?: string
    pagina?: number
    limite?: number
  }): Promise<ApiResponse<BlingCustomer[]>> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/contatos${queryParams.toString() ? `?${queryParams}` : ''}`
    return this.makeRequest<BlingCustomer[]>(endpoint)
  }

  async getCustomer(id: number): Promise<ApiResponse<BlingCustomer>> {
    return this.makeRequest<BlingCustomer>(`/contatos/${id}`)
  }

  // Sync Methods
  async syncOrders(companyId: string, lastSync?: Date): Promise<{
    success: boolean
    synced: number
    errors: string[]
  }> {
    const errors: string[] = []
    let synced = 0

    try {
      const params: any = {
        limite: 100,
        pagina: 1
      }

      if (lastSync) {
        params.dataInicial = lastSync.toISOString().split('T')[0]
      }

      let hasMore = true
      while (hasMore) {
        const response = await this.getOrders(params)
        
        if (response.success && response.data) {
          for (const order of response.data) {
            try {
              await this.saveOrderToDatabase(order, companyId)
              synced++
            } catch (error) {
              errors.push(`Failed to save order ${order.numero}: ${error}`)
            }
          }

          // Check if there are more pages
          hasMore = response.meta?.pages ? params.pagina < response.meta.pages : false
          params.pagina++
        } else {
          hasMore = false
        }
      }

      return { success: true, synced, errors }
    } catch (error) {
      errors.push(`Sync failed: ${error}`)
      return { success: false, synced, errors }
    }
  }

  private async saveOrderToDatabase(order: BlingOrder, companyId: string): Promise<void> {
    // This would integrate with your Supabase database
    // Implementation depends on your database service
    console.log('Saving order to database:', order.numero, 'for company:', companyId)
    
    // Example implementation:
    // await supabase.from('orders').upsert({
    //   bling_order_id: order.id.toString(),
    //   company_id: companyId,
    //   order_number: order.numero,
    //   customer_name: order.cliente.nome,
    //   customer_email: order.cliente.email,
    //   total_amount: order.total,
    //   status: order.situacao.valor,
    //   marketplace: order.marketplace,
    //   order_date: new Date(order.data),
    //   items: order.itens,
    //   sync_at: new Date()
    // })
  }

  // Webhook Methods
  async setupWebhook(url: string, events: string[]): Promise<ApiResponse<any>> {
    return this.makeRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url,
        events
      })
    })
  }

  // Utility Methods
  getOrderStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'Em aberto': 'bg-yellow-100 text-yellow-800',
      'Em andamento': 'bg-blue-100 text-blue-800',
      'Venda agendada': 'bg-purple-100 text-purple-800',
      'Em produção': 'bg-orange-100 text-orange-800',
      'Pronto para envio': 'bg-green-100 text-green-800',
      'Enviado': 'bg-blue-100 text-blue-800',
      'Entregue': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'Devolvido': 'bg-gray-100 text-gray-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  getMarketplaceIcon(marketplace?: string): string {
    const icons: Record<string, string> = {
      'Mercado Livre': '🛒',
      'Shopee': '🛍️',
      'Amazon': '📦',
      'Magazine Luiza': '🏪',
      'Americanas': '🛒',
      'Casas Bahia': '🏠',
      'Extra': '🛒'
    }
    return icons[marketplace || ''] || '🌐'
  }
}

// Factory function to create Bling API service
export function createBlingService(config: BlingConfig): BlingApiService {
  return new BlingApiService(config)
}

// Default export
export default BlingApiService