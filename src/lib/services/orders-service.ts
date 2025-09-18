// =====================================================
// SERVIÇO DE PEDIDOS - INTEGRAÇÃO SUPABASE + BLING
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { BlingApiService } from './bling-api';
import type { 
  Order, 
  OrderFilters, 
  OrderStats, 
  CreateOrderData, 
  UpdateOrderData,
  OrderSyncStatus,
  BlingOrderResponse,
  BlingOrderListResponse
} from '@/types/orders';

export class OrdersService {
  private supabase = createClient();
  private blingApi = new BlingApiService({
    clientId: process.env.BLING_CLIENT_ID || '',
    clientSecret: process.env.BLING_CLIENT_SECRET || ''
  });

  // =====================================================
  // MÉTODOS DE CONSULTA
  // =====================================================

  async getOrders(
    companyId: string, 
    filters?: OrderFilters,
    page = 1,
    limit = 20
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    try {
      let query = this.supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }

        if (filters.marketplace && filters.marketplace.length > 0) {
          query = query.in('marketplace', filters.marketplace);
        }

        if (filters.date_from) {
          query = query.gte('order_date', filters.date_from);
        }

        if (filters.date_to) {
          query = query.lte('order_date', filters.date_to);
        }

        if (filters.customer_name) {
          query = query.ilike('customer_name', `%${filters.customer_name}%`);
        }

        if (filters.order_number) {
          query = query.ilike('order_number', `%${filters.order_number}%`);
        }

        if (filters.min_amount !== undefined) {
          query = query.gte('total_amount', filters.min_amount);
        }

        if (filters.max_amount !== undefined) {
          query = query.lte('total_amount', filters.max_amount);
        }

        if (filters.has_tracking !== undefined) {
          if (filters.has_tracking) {
            query = query.not('tracking_code', 'is', null);
          } else {
            query = query.is('tracking_code', null);
          }
        }

        if (filters.has_invoice !== undefined) {
          if (filters.has_invoice) {
            query = query.not('invoice_number', 'is', null);
          } else {
            query = query.is('invoice_number', null);
          }
        }
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        throw new Error(`Erro ao buscar pedidos: ${error instanceof Error ? error.message : String(error)}`);
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro no serviço de pedidos:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Pedido não encontrado
        }
        throw new Error(`Erro ao buscar pedido: ${error instanceof Error ? error.message : String(error)}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar pedido por ID:', error);
      throw error;
    }
  }

  async getOrderStats(companyId: string): Promise<OrderStats> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_order_stats', { company_uuid: companyId });

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error instanceof Error ? error.message : String(error)}`);
      }

      return data || {
        total: 0,
        total_amount: 0,
        by_status: {},
        by_marketplace: {},
        recent_orders: 0,
        average_order_value: 0,
        top_customers: [],
        monthly_revenue: []
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE MANIPULAÇÃO
  // =====================================================

  async createOrder(companyId: string, orderData: CreateOrderData): Promise<Order> {
    try {
      // Calcular total dos itens
      const itemsTotal = orderData.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        return sum + itemTotal;
      }, 0);

      // Calcular total final
      const totalAmount = itemsTotal - (orderData.discount_amount || 0) + (orderData.shipping_amount || 0);

      // Preparar dados para inserção
      const orderToInsert = {
        company_id: companyId,
        order_number: `VNG-${Date.now()}`, // Gerar número temporário
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        customer_document: orderData.customer_document,
        total_amount: totalAmount,
        discount_amount: orderData.discount_amount || 0,
        shipping_amount: orderData.shipping_amount || 0,
        status: 'pending',
        marketplace: orderData.marketplace,
        marketplace_order_id: orderData.marketplace_order_id,
        order_date: new Date().toISOString(),
        items: orderData.items.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price
        })),
        customer_address: orderData.customer_address,
        notes: orderData.notes,
        bling_order_id: '', // Será preenchido após sincronização
      };

      const { data, error } = await this.supabase
        .from('orders')
        .insert(orderToInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar pedido: ${error instanceof Error ? error.message : String(error)}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  async updateOrder(orderId: string, updateData: UpdateOrderData): Promise<Order> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar pedido: ${error instanceof Error ? error.message : String(error)}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      throw error;
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        throw new Error(`Erro ao deletar pedido: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      console.error('Erro ao deletar pedido:', error);
      throw error;
    }
  }

  // =====================================================
  // SINCRONIZAÇÃO COM BLING
  // =====================================================

  async syncOrdersFromBling(companyId: string): Promise<OrderSyncStatus> {
    try {
      // Verificar se a configuração do Bling existe
      const { data: blingConfig } = await this.supabase
        .from('bling_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (!blingConfig) {
        throw new Error('Configuração do Bling não encontrada ou inativa');
      }

      // Atualizar status de sincronização
      await this.supabase
        .from('bling_configs')
        .update({ 
          sync_status: 'syncing',
          sync_errors: []
        })
        .eq('company_id', companyId);

      let syncedCount = 0;
      let errors: string[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        try {
          // Buscar pedidos do Bling
          const blingOrders = await this.blingApi.getOrders({
            pagina: page,
            limite: limit
          });

          if (!blingOrders.data || blingOrders.data.length === 0) {
            hasMore = false;
            break;
          }

          // Processar cada pedido
          for (const blingOrder of blingOrders.data) {
            try {
              await this.syncSingleOrderFromBling(companyId, blingOrder as any);
              syncedCount++;
            } catch (error) {
              const errorMsg = `Erro ao sincronizar pedido ${blingOrder.numero}: ${error}`;
              errors.push(errorMsg);
              console.error(errorMsg);
            }
          }

          // Verificar se há mais páginas
          hasMore = blingOrders.data.length === limit;
          page++;

        } catch (error) {
          const errorMsg = `Erro ao buscar página ${page}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
          break;
        }
      }

      // Atualizar status final
      const finalStatus = errors.length > 0 ? 'error' : 'completed';
      await this.supabase
        .from('bling_configs')
        .update({
          sync_status: finalStatus,
          last_sync: new Date().toISOString(),
          sync_errors: errors
        })
        .eq('company_id', companyId);

      return {
        is_syncing: false,
        last_sync: new Date().toISOString(),
        sync_errors: errors,
        pending_sync: 0,
        total_synced: syncedCount
      };

    } catch (error) {
      // Atualizar status de erro
      await this.supabase
        .from('bling_configs')
        .update({
          sync_status: 'error',
          sync_errors: [error instanceof Error ? error.message : String(error)]
        })
        .eq('company_id', companyId);

      console.error('Erro na sincronização:', error);
      throw error;
    }
  }

  private async syncSingleOrderFromBling(
    companyId: string, 
    blingOrder: BlingOrderResponse['data']
  ): Promise<void> {
    try {
      // Verificar se o pedido já existe
      const { data: existingOrder } = await this.supabase
        .from('orders')
        .select('id')
        .eq('bling_order_id', blingOrder.id.toString())
        .eq('company_id', companyId)
        .single();

      // Converter dados do Bling para formato interno
      const orderData = this.convertBlingOrderToInternal(companyId, blingOrder);

      if (existingOrder) {
        // Atualizar pedido existente
        await this.supabase
          .from('orders')
          .update(orderData)
          .eq('id', existingOrder.id);
      } else {
        // Criar novo pedido
        await this.supabase
          .from('orders')
          .insert(orderData);
      }
    } catch (error) {
      console.error(`Erro ao sincronizar pedido ${blingOrder.numero}:`, error);
      throw error;
    }
  }

  private convertBlingOrderToInternal(
    companyId: string, 
    blingOrder: BlingOrderResponse['data']
  ): Partial<Order> {
    return {
      company_id: companyId,
      bling_order_id: blingOrder.id.toString(),
      order_number: blingOrder.numero,
      customer_name: blingOrder.contato.nome,
      customer_email: blingOrder.contato.email,
      customer_phone: blingOrder.contato.telefone,
      customer_document: blingOrder.contato.numeroDocumento,
      total_amount: blingOrder.total,
      discount_amount: blingOrder.desconto || 0,
      shipping_amount: blingOrder.frete || 0,
      status: this.mapBlingStatusToInternal(blingOrder.situacao.valor),
      marketplace: blingOrder.loja.nome,
      order_date: blingOrder.data,
      delivery_date: blingOrder.dataSaida,
      items: blingOrder.itens.map(item => ({
        id: item.id.toString(),
        bling_product_id: item.produto.id.toString(),
        sku: item.produto.codigo,
        name: item.produto.nome,
        description: item.descricao,
        quantity: item.quantidade,
        unit_price: item.valor,
        total_price: item.quantidade * item.valor
      })),
      customer_address: blingOrder.transporte.enderecoEntrega ? {
        street: blingOrder.transporte.enderecoEntrega.endereco,
        number: blingOrder.transporte.enderecoEntrega.numero,
        complement: blingOrder.transporte.enderecoEntrega.complemento,
        neighborhood: blingOrder.transporte.enderecoEntrega.bairro,
        city: blingOrder.transporte.enderecoEntrega.municipio,
        state: blingOrder.transporte.enderecoEntrega.uf,
        zip_code: blingOrder.transporte.enderecoEntrega.cep,
        country: blingOrder.transporte.enderecoEntrega.pais
      } : undefined,
      notes: blingOrder.observacoes,
      tracking_code: blingOrder.transporte.volumes?.[0]?.codigoRastreamento,
      sync_at: new Date().toISOString()
    };
  }

  private mapBlingStatusToInternal(blingStatus: string): Order['status'] {
    const statusMap: Record<string, Order['status']> = {
      'Em aberto': 'pending',
      'Atendido': 'confirmed',
      'Cancelado': 'cancelled',
      'Em andamento': 'processing',
      'Venda agrupada': 'processing',
      'Verificado': 'confirmed',
      'Estornado': 'refunded'
    };

    return statusMap[blingStatus] || 'pending';
  }

  async getSyncStatus(companyId: string): Promise<OrderSyncStatus> {
    try {
      const { data: blingConfig } = await this.supabase
        .from('bling_configs')
        .select('sync_status, last_sync, sync_errors')
        .eq('company_id', companyId)
        .single();

      if (!blingConfig) {
        return {
          is_syncing: false,
          last_sync: null,
          sync_errors: ['Configuração do Bling não encontrada'],
          pending_sync: 0,
          total_synced: 0
        };
      }

      const { data: ordersCount } = await this.supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId);

      return {
        is_syncing: blingConfig.sync_status === 'syncing',
        last_sync: blingConfig.last_sync,
        sync_errors: blingConfig.sync_errors || [],
        pending_sync: 0, // Implementar lógica se necessário
        total_synced: ordersCount?.length || 0
      };
    } catch (error) {
      console.error('Erro ao buscar status de sincronização:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  async getMarketplaces(companyId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('marketplace')
        .eq('company_id', companyId)
        .not('marketplace', 'is', null);

      if (error) {
        throw new Error(`Erro ao buscar marketplaces: ${error instanceof Error ? error.message : String(error)}`);
      }

      const marketplaces = [...new Set(data.map(item => item.marketplace))];
      return marketplaces.filter(Boolean);
    } catch (error) {
      console.error('Erro ao buscar marketplaces:', error);
      throw error;
    }
  }

  async getRecentOrders(companyId: string, limit = 10): Promise<Order[]> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao buscar pedidos recentes: ${error instanceof Error ? error.message : String(error)}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos recentes:', error);
      throw error;
    }
  }
}