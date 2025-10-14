// =====================================================
// BLING API V3 INTEGRATION SERVICE - VERSÃO COMPLETA
// =====================================================

import { ApiResponse } from '@/types/api';
import { 
  BlingConfig, 
  BlingOrder, 
  BlingProduct, 
  BlingCustomer,
  BlingOrderFilters,
  BlingProductFilters,
  BlingCustomerFilters,
  BlingApiResponse,
  BlingListResponse,
  BlingAuthResponse,
  BlingSyncResult,
  BlingSyncOptions,
  BlingStats,
  BLING_ENDPOINTS,
  formatBlingDate,
  isBlingTokenExpired
} from '@/types/bling';

// =====================================================
// BLING API SERVICE CLASS - VERSÃO COMPLETA
// =====================================================

export class BlingApiService {
  private baseUrl = 'https://www.bling.com.br/Api/v3';
  private config: BlingConfig;

  constructor(config: BlingConfig) {
    this.config = config;
  }

  // =====================================================
  // MÉTODOS DE AUTENTICAÇÃO
  // =====================================================

  async authenticate(): Promise<boolean> {
    try {
      if (!this.config.access_token || isBlingTokenExpired(this.config.expires_at)) {
        return await this.refreshAccessToken();
      }
      return true;
    } catch (error) {
      console.error('Bling authentication failed:', error);
      return false;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.config.refresh_token) {
        throw new Error('Refresh token not available');
      }

      const response = await fetch(`${this.baseUrl}${BLING_ENDPOINTS.AUTH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refresh_token,
          client_id: this.config.client_id,
          client_secret: this.config.client_secret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const authData: BlingAuthResponse = await response.json();
      
      // Update config with new tokens
      this.config.access_token = authData.access_token;
      this.config.refresh_token = authData.refresh_token;
      this.config.expires_at = new Date(Date.now() + authData.expires_in * 1000).toISOString();

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private isTokenExpired(): boolean {
    return isBlingTokenExpired(this.config.expires_at);
  }

  // =====================================================
  // MÉTODOS GENÉRICOS DE REQUISIÇÃO
  // =====================================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BlingApiResponse<T>> {
    const authenticated = await this.authenticate();
    if (!authenticated) {
      throw new Error('Authentication failed');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Bling API request failed: ${response.statusText}`);
    }

    return data;
  }

  private async makeListRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<BlingListResponse<T>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    return this.makeRequest<T[]>(url) as Promise<BlingListResponse<T>>;
  }

  // =====================================================
  // MÉTODOS DE PEDIDOS
  // =====================================================

  async getOrders(filters?: BlingOrderFilters): Promise<BlingListResponse<BlingOrder>> {
    const params: Record<string, any> = {};
    
    if (filters?.dataInicial) params.dataInicial = formatBlingDate(filters.dataInicial);
    if (filters?.dataFinal) params.dataFinal = formatBlingDate(filters.dataFinal);
    if (filters?.situacao) params.situacao = filters.situacao;
    if (filters?.idSituacao) params.idSituacao = filters.idSituacao;
    if (filters?.numero) params.numero = filters.numero;
    if (filters?.idContato) params.idContato = filters.idContato;
    if (filters?.idVendedor) params.idVendedor = filters.idVendedor;
    if (filters?.dataAlteracao) params.dataAlteracao = formatBlingDate(filters.dataAlteracao);
    if (filters?.limite) params.limite = filters.limite;
    if (filters?.pagina) params.pagina = filters.pagina;

    return this.makeListRequest<BlingOrder>(BLING_ENDPOINTS.ORDERS, params);
  }

  async getOrder(id: string): Promise<BlingOrder | null> {
    try {
      const response = await this.makeRequest<BlingOrder>(`${BLING_ENDPOINTS.ORDERS}/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to get order ${id}:`, error);
      return null;
    }
  }

  async createOrder(orderData: Partial<BlingOrder>): Promise<BlingOrder | null> {
    try {
      const response = await this.makeRequest<BlingOrder>(BLING_ENDPOINTS.ORDERS, {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      return response.data || null;
    } catch (error) {
      console.error('Failed to create order:', error);
      return null;
    }
  }

  async updateOrder(id: string, orderData: Partial<BlingOrder>): Promise<BlingOrder | null> {
    try {
      const response = await this.makeRequest<BlingOrder>(`${BLING_ENDPOINTS.ORDERS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(orderData),
      });
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update order ${id}:`, error);
      return null;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`${BLING_ENDPOINTS.ORDERS}/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete order ${id}:`, error);
      return false;
    }
  }

  async getOrdersByDateRange(startDate: string, endDate: string): Promise<BlingOrder[]> {
    const response = await this.getOrders({
      dataInicial: startDate,
      dataFinal: endDate,
      limite: 100
    });
    return response.data || [];
  }

  async updateOrderStatus(id: string, situacaoId: number): Promise<BlingOrder | null> {
    return this.updateOrder(id, {
      situacao: { id: situacaoId }
    });
  }

  // =====================================================
  // MÉTODOS DE PRODUTOS
  // =====================================================

  async getProducts(filters?: BlingProductFilters): Promise<BlingListResponse<BlingProduct>> {
    const params: Record<string, any> = {};
    
    if (filters?.codigo) params.codigo = filters.codigo;
    if (filters?.nome) params.nome = filters.nome;
    if (filters?.tipo) params.tipo = filters.tipo;
    if (filters?.situacao) params.situacao = filters.situacao;
    if (filters?.formato) params.formato = filters.formato;
    if (filters?.dataInclusao) params.dataInclusao = formatBlingDate(filters.dataInclusao);
    if (filters?.dataAlteracao) params.dataAlteracao = formatBlingDate(filters.dataAlteracao);
    if (filters?.limite) params.limite = filters.limite;
    if (filters?.pagina) params.pagina = filters.pagina;

    return this.makeListRequest<BlingProduct>(BLING_ENDPOINTS.PRODUCTS, params);
  }

  async getProduct(id: string): Promise<BlingProduct | null> {
    try {
      const response = await this.makeRequest<BlingProduct>(`${BLING_ENDPOINTS.PRODUCTS}/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to get product ${id}:`, error);
      return null;
    }
  }

  async createProduct(productData: Partial<BlingProduct>): Promise<BlingProduct | null> {
    try {
      const response = await this.makeRequest<BlingProduct>(BLING_ENDPOINTS.PRODUCTS, {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      return response.data || null;
    } catch (error) {
      console.error('Failed to create product:', error);
      return null;
    }
  }

  async updateProduct(id: string, productData: Partial<BlingProduct>): Promise<BlingProduct | null> {
    try {
      const response = await this.makeRequest<BlingProduct>(`${BLING_ENDPOINTS.PRODUCTS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update product ${id}:`, error);
      return null;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`${BLING_ENDPOINTS.PRODUCTS}/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      return false;
    }
  }

  // =====================================================
  // MÉTODOS DE CLIENTES
  // =====================================================

  async getCustomers(filters?: BlingCustomerFilters): Promise<BlingListResponse<BlingCustomer>> {
    const params: Record<string, any> = {};
    
    if (filters?.nome) params.nome = filters.nome;
    if (filters?.cpfCnpj) params.cpfCnpj = filters.cpfCnpj;
    if (filters?.email) params.email = filters.email;
    if (filters?.situacao) params.situacao = filters.situacao;
    if (filters?.dataInclusao) params.dataInclusao = formatBlingDate(filters.dataInclusao);
    if (filters?.dataAlteracao) params.dataAlteracao = formatBlingDate(filters.dataAlteracao);
    if (filters?.limite) params.limite = filters.limite;
    if (filters?.pagina) params.pagina = filters.pagina;

    return this.makeListRequest<BlingCustomer>(BLING_ENDPOINTS.CUSTOMERS, params);
  }

  async getCustomer(id: string): Promise<BlingCustomer | null> {
    try {
      const response = await this.makeRequest<BlingCustomer>(`${BLING_ENDPOINTS.CUSTOMERS}/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to get customer ${id}:`, error);
      return null;
    }
  }

  async createCustomer(customerData: Partial<BlingCustomer>): Promise<BlingCustomer | null> {
    try {
      const response = await this.makeRequest<BlingCustomer>(BLING_ENDPOINTS.CUSTOMERS, {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
      return response.data || null;
    } catch (error) {
      console.error('Failed to create customer:', error);
      return null;
    }
  }

  async updateCustomer(id: string, customerData: Partial<BlingCustomer>): Promise<BlingCustomer | null> {
    try {
      const response = await this.makeRequest<BlingCustomer>(`${BLING_ENDPOINTS.CUSTOMERS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData),
      });
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update customer ${id}:`, error);
      return null;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`${BLING_ENDPOINTS.CUSTOMERS}/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete customer ${id}:`, error);
      return false;
    }
  }

  // =====================================================
  // MÉTODOS DE SINCRONIZAÇÃO
  // =====================================================

  async syncOrders(options?: BlingSyncOptions): Promise<BlingSyncResult> {
    const startTime = Date.now();
    const result: BlingSyncResult = {
      success: false,
      totalProcessed: 0,
      totalSuccess: 0,
      totalErrors: 0,
      errors: [],
      duration: 0,
      lastSyncDate: new Date().toISOString()
    };

    try {
      const filters: BlingOrderFilters = {
        limite: options?.batchSize || 100,
        pagina: 1
      };

      if (options?.dateRange) {
        filters.dataInicial = options.dateRange.start;
        filters.dataFinal = options.dateRange.end;
      }

      let hasMorePages = true;
      let currentPage = 1;

      while (hasMorePages) {
        filters.pagina = currentPage;
        
        const response = await this.getOrders(filters);
        const orders = response.data || [];
        
        if (orders.length === 0) {
          hasMorePages = false;
          break;
        }

        result.totalProcessed += orders.length;

        // Process each order
        for (const order of orders) {
          try {
            // Here you would implement your order processing logic
            // For example, save to database, update status, etc.
            
            if (options?.onOrderProcessed) {
              await options.onOrderProcessed(order);
            }
            
            result.totalSuccess++;
          } catch (error) {
            result.totalErrors++;
            result.errors.push({
              orderId: order.id?.toString() || 'unknown',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Check if there are more pages
        if (response.meta && response.meta.totalPages) {
          hasMorePages = currentPage < response.meta.totalPages;
        } else {
          hasMorePages = orders.length === (options?.batchSize || 100);
        }
        
        currentPage++;

        // Respect rate limits
        if (options?.delayBetweenRequests) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenRequests));
        }
      }

      result.success = result.totalErrors === 0;
      result.duration = Date.now() - startTime;

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      result.errors.push({
        orderId: 'sync_process',
        error: error instanceof Error ? error.message : 'Sync process failed'
      });
      return result;
    }
  }

  async syncProducts(options?: BlingSyncOptions): Promise<BlingSyncResult> {
    const startTime = Date.now();
    const result: BlingSyncResult = {
      success: false,
      totalProcessed: 0,
      totalSuccess: 0,
      totalErrors: 0,
      errors: [],
      duration: 0,
      lastSyncDate: new Date().toISOString()
    };

    try {
      const filters: BlingProductFilters = {
        limite: options?.batchSize || 100,
        pagina: 1
      };

      let hasMorePages = true;
      let currentPage = 1;

      while (hasMorePages) {
        filters.pagina = currentPage;
        
        const response = await this.getProducts(filters);
        const products = response.data || [];
        
        if (products.length === 0) {
          hasMorePages = false;
          break;
        }

        result.totalProcessed += products.length;

        // Process each product
        for (const product of products) {
          try {
            if (options?.onProductProcessed) {
              await options.onProductProcessed(product);
            }
            
            result.totalSuccess++;
          } catch (error) {
            result.totalErrors++;
            result.errors.push({
              productId: product.id?.toString() || 'unknown',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        hasMorePages = products.length === (options?.batchSize || 100);
        currentPage++;

        if (options?.delayBetweenRequests) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenRequests));
        }
      }

      result.success = result.totalErrors === 0;
      result.duration = Date.now() - startTime;

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      result.errors.push({
        productId: 'sync_process',
        error: error instanceof Error ? error.message : 'Sync process failed'
      });
      return result;
    }
  }

  async syncCustomers(companyId: string, lastSync?: Date): Promise<{
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
        const response = await this.getCustomers(params)
        
        if (response.success && response.data) {
          for (const customer of response.data) {
            try {
              await this.saveCustomerToDatabase(customer, companyId)
              synced++
            } catch (error) {
              errors.push(`Failed to save customer ${customer.nome}: ${error}`)
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
    // await supabase.from('projects').upsert({
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

  private async saveCustomerToDatabase(customer: BlingCustomer, companyId: string): Promise<void> {
    console.log('Saving customer to database:', customer.nome, 'for company:', companyId)
  }

  // =====================================================
  // MÉTODOS DE ESTATÍSTICAS E RELATÓRIOS
  // =====================================================

  async getStats(dateRange?: { start: string; end: string }): Promise<BlingStats> {
    try {
      const filters: BlingOrderFilters = {};
      
      if (dateRange) {
        filters.dataInicial = dateRange.start;
        filters.dataFinal = dateRange.end;
      }

      const ordersResponse = await this.getOrders(filters);
      const orders = ordersResponse.data || [];

      const stats: BlingStats = {
        totalOrders: orders.length,
        totalRevenue: 0,
        averageOrderValue: 0,
        topProducts: [],
        ordersByStatus: {},
        revenueByPeriod: {}
      };

      // Calculate revenue and order statistics
      orders.forEach(order => {
        const orderValue = parseFloat(order.total?.toString() || '0');
        stats.totalRevenue += orderValue;

        // Count orders by status
        const status = order.situacao?.valor || 'Unknown';
        stats.ordersByStatus[status] = (stats.ordersByStatus[status] || 0) + 1;
      });

      stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get Bling stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topProducts: [],
        ordersByStatus: {},
        revenueByPeriod: {}
      };
    }
  }

  // =====================================================
  // MÉTODOS DE WEBHOOK
  // =====================================================

  async setupWebhook(url: string, events: string[]): Promise<ApiResponse<any>> {
    return this.makeRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url,
        events
      })
    })
  }

  // =====================================================
  // MÉTODOS UTILITÁRIOS
  // =====================================================

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      // Try to make a simple request to test the connection
      await this.getOrders({ limite: 1 });
      return true;
    } catch (error) {
      console.error('Bling connection test failed:', error);
      return false;
    }
  }

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
    if (!marketplace) return '🏪';
    
    const icons: Record<string, string> = {
      'mercadolivre': '🟡',
      'shopee': '🟠',
      'amazon': '📦',
      'magalu': '🔵',
      'americanas': '🔴',
      'casasbahia': '🟤',
      'extra': '🟢',
      'pontofrio': '⚪',
      'submarino': '🔵',
      'netshoes': '👟',
      'dafiti': '👗',
      'centauro': '⚽',
      'Mercado Livre': '🛒',
      'Shopee': '🛍️',
      'Amazon': '📦',
      'Magazine Luiza': '🏪',
      'Americanas': '🛒',
      'Casas Bahia': '🏠',
      'Extra': '🛒',
      'default': '🏪'
    };

    return icons[marketplace.toLowerCase()] || icons[marketplace] || icons.default;
  }

  // Update configuration
  updateConfig(newConfig: Partial<BlingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration (without sensitive data)
  getConfig(): Omit<BlingConfig, 'client_secret' | 'access_token' | 'refresh_token'> {
    const { client_secret, access_token, refresh_token, ...safeConfig } = this.config;
    return safeConfig;
  }
}

// Factory function to create Bling API service
export function createBlingService(config: BlingConfig): BlingApiService {
  return new BlingApiService(config)
}

// Default export
export default BlingApiService