// =====================================================
// TIPOS PARA BLING API V3 - INTEGRAÇÃO COMPLETA
// =====================================================

// =====================================================
// CONFIGURAÇÃO E AUTENTICAÇÃO
// =====================================================

export interface BlingConfig {
  id: string;
  company_id: string;
  client_id: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  webhook_url?: string;
  webhook_events: BlingWebhookEvent[];
  is_active: boolean;
  sync_status: BlingSyncStatus;
  sync_errors: string[];
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export type BlingSyncStatus = 'pending' | 'syncing' | 'completed' | 'error';

export type BlingWebhookEvent = 
  | 'order.created'
  | 'order.updated' 
  | 'order.cancelled'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'customer.created'
  | 'customer.updated'
  | 'invoice.created'
  | 'invoice.updated';

export interface BlingAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// =====================================================
// ESTRUTURAS DE DADOS DO BLING
// =====================================================

export interface BlingOrder {
  id: number;
  numero: string;
  numeroLoja?: string;
  data: string;
  dataSaida?: string;
  dataEntrega?: string;
  situacao: {
    id: number;
    valor: string;
  };
  loja: {
    id: number;
    nome: string;
  };
  contato: BlingCustomer;
  itens: BlingOrderItem[];
  transporte?: BlingShipping;
  vendedor?: {
    id: number;
    nome: string;
  };
  observacoes?: string;
  observacoesInternas?: string;
  desconto?: number;
  frete?: number;
  total: number;
  totais: {
    produtos: number;
    servicos: number;
    desconto: number;
    frete: number;
    seguro: number;
    despesas: number;
    total: number;
  };
}

export interface BlingOrderItem {
  id: number;
  codigo: string;
  descricao: string;
  quantidade: number;
  valor: number;
  desconto?: number;
  produto: {
    id: number;
    nome: string;
    codigo: string;
    tipo?: string;
    situacao?: string;
  };
  categoria?: {
    id: number;
    descricao: string;
  };
}

export interface BlingCustomer {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  celular?: string;
  tipoPessoa: 'F' | 'J'; // Física ou Jurídica
  numeroDocumento?: string;
  inscricaoEstadual?: string;
  endereco?: BlingAddress;
  enderecoEntrega?: BlingAddress;
  observacoes?: string;
  situacao?: string;
  clienteDesde?: string;
}

export interface BlingAddress {
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  pais: string;
  codigoMunicipio?: string;
  codigoPais?: string;
}

export interface BlingShipping {
  transportadora?: {
    id: number;
    nome: string;
  };
  enderecoEntrega: BlingAddress;
  volumes?: BlingVolume[];
  servico?: string;
  prazoEntrega?: number;
  frete?: number;
  seguro?: number;
}

export interface BlingVolume {
  id: number;
  servico: string;
  codigoRastreamento?: string;
  urlRastreamento?: string;
  dataEnvio?: string;
  dataEntrega?: string;
  valorDeclarado?: number;
  peso?: number;
  dimensoes?: {
    altura: number;
    largura: number;
    comprimento: number;
  };
}

export interface BlingProduct {
  id: number;
  nome: string;
  codigo?: string;
  preco: number;
  precoPromocional?: number;
  precoCusto?: number;
  situacao: string;
  tipo: string;
  formato: string;
  descricaoCurta?: string;
  descricaoComplementar?: string;
  categoria?: {
    id: number;
    descricao: string;
  };
  marca?: {
    id: number;
    descricao: string;
  };
  estoque?: {
    minimo?: number;
    maximo?: number;
    atual?: number;
    reservado?: number;
    pendente?: number;
  };
  dimensoes?: {
    peso?: number;
    altura?: number;
    largura?: number;
    comprimento?: number;
  };
  tributacao?: {
    origem?: string;
    ncm?: string;
    cest?: string;
  };
  imagens?: Array<{
    id: number;
    url: string;
    ordem: number;
  }>;
}

// =====================================================
// RESPOSTAS DA API
// =====================================================

export interface BlingApiResponse<T> {
  data: T;
  errors?: Array<{
    type: string;
    message: string;
    field?: string;
  }>;
}

export interface BlingListResponse<T> extends BlingApiResponse<T[]> {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface BlingOrderListResponse extends BlingListResponse<BlingOrder> {}
export interface BlingProductListResponse extends BlingListResponse<BlingProduct> {}
export interface BlingCustomerListResponse extends BlingListResponse<BlingCustomer> {}

// =====================================================
// PARÂMETROS DE CONSULTA
// =====================================================

export interface BlingOrderFilters {
  dataInicial?: string;
  dataFinal?: string;
  situacao?: number[];
  loja?: number[];
  vendedor?: number[];
  contato?: number;
  numero?: string;
  numeroLoja?: string;
  pagina?: number;
  limite?: number;
}

export interface BlingProductFilters {
  codigo?: string;
  nome?: string;
  situacao?: string;
  tipo?: string;
  categoria?: number;
  marca?: number;
  estoqueMinimo?: boolean;
  pagina?: number;
  limite?: number;
}

export interface BlingCustomerFilters {
  nome?: string;
  email?: string;
  documento?: string;
  situacao?: string;
  tipoPessoa?: 'F' | 'J';
  pagina?: number;
  limite?: number;
}

// =====================================================
// WEBHOOKS
// =====================================================

export interface BlingWebhookPayload {
  event: BlingWebhookEvent;
  data: {
    id: number;
    numero?: string;
    situacao?: {
      id: number;
      valor: string;
    };
    timestamp: string;
  };
  retries: number;
  created_at: string;
}

// =====================================================
// SINCRONIZAÇÃO
// =====================================================

export interface BlingSyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

export interface BlingSyncOptions {
  syncOrders?: boolean;
  syncProducts?: boolean;
  syncCustomers?: boolean;
  dateFrom?: string;
  dateTo?: string;
  batchSize?: number;
}

// =====================================================
// ESTATÍSTICAS E MÉTRICAS
// =====================================================

export interface BlingStats {
  orders: {
    total: number;
    today: number;
    thisMonth: number;
    byStatus: Record<string, number>;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
  };
  customers: {
    total: number;
    new: number;
  };
  revenue: {
    today: number;
    thisMonth: number;
    thisYear: number;
  };
}

// =====================================================
// UTILITÁRIOS E CONSTANTES
// =====================================================

export const BLING_ORDER_STATUS: Record<number, string> = {
  1: 'Aguardando',
  2: 'Em andamento',
  3: 'Venda agendada',
  4: 'Finalizado',
  5: 'Cancelado',
  6: 'Aguardando pagamento',
  7: 'Pagamento em análise',
  8: 'Pago',
  9: 'Enviado',
  10: 'Entregue',
  11: 'Devolvido'
};

export const BLING_PRODUCT_TYPES = [
  'P', // Produto
  'S', // Serviço
  'N'  // Produto e Serviço
] as const;

export const BLING_PRODUCT_FORMATS = [
  'S', // Simples
  'V', // Com variações
  'E'  // Com composição
] as const;

export const BLING_ENDPOINTS = {
  AUTH: '/oauth/token',
  ORDERS: '/pedidos/vendas',
  PRODUCTS: '/produtos',
  CUSTOMERS: '/contatos',
  CATEGORIES: '/categorias/produtos',
  BRANDS: '/marcas',
  STORES: '/lojas'
} as const;

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

export const formatBlingDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseBlingDate = (dateString: string): Date => {
  return new Date(dateString);
};

export const getBlingOrderStatusLabel = (statusId: number): string => {
  return BLING_ORDER_STATUS[statusId] || 'Desconhecido';
};

export const isBlingTokenExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return true;
  return new Date(expiresAt) <= new Date();
};