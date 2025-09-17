// =====================================================
// TIPOS PARA SISTEMA DE PEDIDOS - BLING API V3
// =====================================================

export interface Order {
  id: string;
  bling_order_id: string;
  company_id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_document?: string;
  total_amount: number;
  discount_amount?: number;
  shipping_amount?: number;
  status: OrderStatus;
  marketplace?: string;
  marketplace_order_id?: string;
  order_date: string;
  delivery_date?: string;
  items: OrderItem[];
  customer_address?: CustomerAddress;
  notes?: string;
  tracking_code?: string;
  invoice_number?: string;
  invoice_url?: string;
  sync_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  bling_product_id: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  image_url?: string;
  category?: string;
  brand?: string;
}

export interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  reference?: string;
}

export type OrderStatus = 
  | 'pending'           // Pendente
  | 'confirmed'         // Confirmado
  | 'processing'        // Processando
  | 'shipped'           // Enviado
  | 'delivered'         // Entregue
  | 'cancelled'         // Cancelado
  | 'returned'          // Devolvido
  | 'refunded'          // Reembolsado
  | 'waiting_payment'   // Aguardando pagamento
  | 'payment_failed';   // Pagamento falhou

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  returned: 'Devolvido',
  refunded: 'Reembolsado',
  waiting_payment: 'Aguardando Pagamento',
  payment_failed: 'Pagamento Falhou'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
  refunded: 'bg-gray-100 text-gray-800',
  waiting_payment: 'bg-amber-100 text-amber-800',
  payment_failed: 'bg-red-100 text-red-800'
};

export interface OrderFilters {
  status?: OrderStatus[];
  marketplace?: string[];
  date_from?: string;
  date_to?: string;
  customer_name?: string;
  order_number?: string;
  min_amount?: number;
  max_amount?: number;
  has_tracking?: boolean;
  has_invoice?: boolean;
}

export interface OrderStats {
  total: number;
  total_amount: number;
  by_status: Record<OrderStatus, number>;
  by_marketplace: Record<string, number>;
  recent_orders: number;
  average_order_value: number;
  top_customers: Array<{
    name: string;
    email: string;
    total_orders: number;
    total_amount: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export interface OrderSyncStatus {
  is_syncing: boolean;
  last_sync: string | null;
  sync_errors: string[];
  pending_sync: number;
  total_synced: number;
}

// Tipos para criação/atualização de pedidos
export interface CreateOrderData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_document?: string;
  customer_address?: CustomerAddress;
  items: Omit<OrderItem, 'id' | 'total_price'>[];
  marketplace?: string;
  marketplace_order_id?: string;
  notes?: string;
  discount_amount?: number;
  shipping_amount?: number;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  tracking_code?: string;
  invoice_number?: string;
  invoice_url?: string;
  notes?: string;
  delivery_date?: string;
}

// Tipos para integração com Bling
export interface BlingOrderResponse {
  data: {
    id: number;
    numero: string;
    numeroLoja: string;
    data: string;
    dataSaida?: string;
    situacao: {
      id: number;
      valor: string;
    };
    loja: {
      id: number;
      nome: string;
    };
    contato: {
      id: number;
      nome: string;
      email?: string;
      telefone?: string;
      tipoPessoa: string;
      numeroDocumento?: string;
    };
    itens: Array<{
      id: number;
      codigo: string;
      descricao: string;
      quantidade: number;
      valor: number;
      produto: {
        id: number;
        nome: string;
        codigo: string;
      };
    }>;
    transporte: {
      enderecoEntrega: {
        endereco: string;
        numero: string;
        complemento?: string;
        bairro: string;
        cep: string;
        municipio: string;
        uf: string;
        pais: string;
      };
      volumes?: Array<{
        id: number;
        servico: string;
        codigoRastreamento?: string;
      }>;
    };
    vendedor?: {
      id: number;
      nome: string;
    };
    observacoes?: string;
    observacoesInternas?: string;
    desconto?: number;
    frete?: number;
    total: number;
  };
}

export interface BlingOrderListResponse {
  data: BlingOrderResponse['data'][];
  pagina: number;
  limite: number;
  total: number;
}

// Utilitários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatOrderNumber = (orderNumber: string): string => {
  return `#${orderNumber}`;
};

export const getOrderStatusIcon = (status: OrderStatus): string => {
  const icons: Record<OrderStatus, string> = {
    pending: '⏳',
    confirmed: '✅',
    processing: '⚙️',
    shipped: '🚚',
    delivered: '📦',
    cancelled: '❌',
    returned: '↩️',
    refunded: '💰',
    waiting_payment: '💳',
    payment_failed: '⚠️'
  };
  return icons[status] || '📋';
};

export const calculateOrderTotal = (items: OrderItem[], discount = 0, shipping = 0): number => {
  const itemsTotal = items.reduce((sum, item) => sum + item.total_price, 0);
  return itemsTotal - discount + shipping;
};

export const isOrderOverdue = (order: Order): boolean => {
  if (!order.delivery_date) return false;
  return new Date(order.delivery_date) < new Date() && order.status !== 'delivered';
};

export const getOrderPriority = (order: Order): 'low' | 'medium' | 'high' | 'urgent' => {
  if (order.status === 'cancelled' || order.status === 'delivered') return 'low';
  if (isOrderOverdue(order)) return 'urgent';
  if (order.total_amount > 1000) return 'high';
  if (order.status === 'pending' || order.status === 'waiting_payment') return 'medium';
  return 'low';
};