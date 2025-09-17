// Ticket System Types
export interface Ticket {
  id: string
  company_id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  marketplace: Marketplace
  customer_name: string
  customer_email?: string
  customer_phone?: string
  order_number?: string
  assigned_to?: string
  created_by: string
  resolved_at?: Date
  created_at: Date
  updated_at: Date
  
  // Relations
  company?: Company
  assignee?: Profile
  creator?: Profile
  messages?: TicketMessage[]
  attachments?: TicketAttachment[]
}

export interface TicketMessage {
  id: string
  ticket_id: string
  user_id: string
  message: string
  is_internal: boolean
  created_at: Date
  
  // Relations
  user?: Profile
  attachments?: TicketAttachment[]
}

export interface TicketAttachment {
  id: string
  ticket_id?: string
  message_id?: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_by: string
  created_at: Date
  
  // Relations
  uploader?: Profile
}

// Enums
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  WAITING_INTERNAL = 'waiting_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum Marketplace {
  MERCADO_LIVRE = 'mercado_livre',
  SHOPEE = 'shopee',
  AMAZON = 'amazon',
  MAGAZINE_LUIZA = 'magazine_luiza',
  AMERICANAS = 'americanas',
  CASAS_BAHIA = 'casas_bahia',
  EXTRA = 'extra',
  SHOPIFY = 'shopify',
  VTEX = 'vtex',
  TRAY = 'tray',
  NUVEMSHOP = 'nuvemshop',
  LOJA_INTEGRADA = 'loja_integrada',
  WOOCOMMERCE = 'woocommerce',
  MAGENTO = 'magento',
  OPENCART = 'opencart',
  OTHER = 'other'
}

// Form Types
export interface CreateTicketData {
  title: string
  description: string
  priority: TicketPriority
  marketplace: Marketplace
  customer_name: string
  customer_email?: string
  customer_phone?: string
  order_number?: string
  assigned_to?: string
}

export interface UpdateTicketData {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  marketplace?: Marketplace
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  order_number?: string
  assigned_to?: string
}

export interface CreateTicketMessageData {
  message: string
  is_internal: boolean
  attachments?: File[]
}

// Filter and Search Types
export interface TicketFilters {
  status?: TicketStatus[]
  priority?: TicketPriority[]
  marketplace?: Marketplace[]
  assigned_to?: string[]
  created_by?: string[]
  date_from?: Date
  date_to?: Date
  search?: string
}

export interface TicketSortOptions {
  field: 'created_at' | 'updated_at' | 'priority' | 'status' | 'title'
  direction: 'asc' | 'desc'
}

// Statistics Types
export interface TicketStats {
  total: number
  by_status: Record<TicketStatus, number>
  by_priority: Record<TicketPriority, number>
  by_marketplace: Record<Marketplace, number>
  avg_resolution_time: number // in hours
  resolution_rate: number // percentage
  customer_satisfaction: number // percentage
}

export interface TicketMetrics {
  today: TicketStats
  week: TicketStats
  month: TicketStats
  quarter: TicketStats
}

// Utility Types
export interface TicketStatusConfig {
  label: string
  color: string
  bgColor: string
  icon: string
  description: string
}

export interface TicketPriorityConfig {
  label: string
  color: string
  bgColor: string
  icon: string
  description: string
  weight: number
}

export interface MarketplaceConfig {
  label: string
  icon: string
  color: string
  bgColor: string
  website?: string
  support_url?: string
}

// Constants
export const TICKET_STATUS_CONFIG: Record<TicketStatus, TicketStatusConfig> = {
  [TicketStatus.OPEN]: {
    label: 'Aberto',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '🔴',
    description: 'Ticket recém criado, aguardando atendimento'
  },
  [TicketStatus.IN_PROGRESS]: {
    label: 'Em Andamento',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '🔵',
    description: 'Ticket sendo atendido pela equipe'
  },
  [TicketStatus.WAITING_CUSTOMER]: {
    label: 'Aguardando Cliente',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '🟡',
    description: 'Aguardando resposta do cliente'
  },
  [TicketStatus.WAITING_INTERNAL]: {
    label: 'Aguardando Interno',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '🟠',
    description: 'Aguardando ação interna da equipe'
  },
  [TicketStatus.RESOLVED]: {
    label: 'Resolvido',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '🟢',
    description: 'Problema resolvido, aguardando confirmação'
  },
  [TicketStatus.CLOSED]: {
    label: 'Fechado',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '⚫',
    description: 'Ticket finalizado com sucesso'
  },
  [TicketStatus.CANCELLED]: {
    label: 'Cancelado',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    icon: '⚪',
    description: 'Ticket cancelado pelo cliente ou equipe'
  }
}

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, TicketPriorityConfig> = {
  [TicketPriority.LOW]: {
    label: 'Baixa',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '⬇️',
    description: 'Problema menor, sem urgência',
    weight: 1
  },
  [TicketPriority.MEDIUM]: {
    label: 'Média',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '➡️',
    description: 'Problema moderado, atenção normal',
    weight: 2
  },
  [TicketPriority.HIGH]: {
    label: 'Alta',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '⬆️',
    description: 'Problema importante, requer atenção',
    weight: 3
  },
  [TicketPriority.URGENT]: {
    label: 'Urgente',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '🔺',
    description: 'Problema crítico, atenção imediata',
    weight: 4
  },
  [TicketPriority.CRITICAL]: {
    label: 'Crítico',
    color: 'text-red-800',
    bgColor: 'bg-red-200',
    icon: '🚨',
    description: 'Sistema parado, máxima prioridade',
    weight: 5
  }
}

export const MARKETPLACE_CONFIG: Record<Marketplace, MarketplaceConfig> = {
  [Marketplace.MERCADO_LIVRE]: {
    label: 'Mercado Livre',
    icon: '🛒',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    website: 'https://mercadolivre.com.br',
    support_url: 'https://contato.mercadolivre.com.br'
  },
  [Marketplace.SHOPEE]: {
    label: 'Shopee',
    icon: '🛍️',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    website: 'https://shopee.com.br',
    support_url: 'https://help.shopee.com.br'
  },
  [Marketplace.AMAZON]: {
    label: 'Amazon',
    icon: '📦',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    website: 'https://amazon.com.br',
    support_url: 'https://sellercentral.amazon.com.br'
  },
  [Marketplace.MAGAZINE_LUIZA]: {
    label: 'Magazine Luiza',
    icon: '🏪',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    website: 'https://magazineluiza.com.br'
  },
  [Marketplace.AMERICANAS]: {
    label: 'Americanas',
    icon: '🛒',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    website: 'https://americanas.com.br'
  },
  [Marketplace.CASAS_BAHIA]: {
    label: 'Casas Bahia',
    icon: '🏠',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    website: 'https://casasbahia.com.br'
  },
  [Marketplace.EXTRA]: {
    label: 'Extra',
    icon: '🛒',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    website: 'https://extra.com.br'
  },
  [Marketplace.SHOPIFY]: {
    label: 'Shopify',
    icon: '🛍️',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    website: 'https://shopify.com'
  },
  [Marketplace.VTEX]: {
    label: 'VTEX',
    icon: '🏬',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    website: 'https://vtex.com'
  },
  [Marketplace.TRAY]: {
    label: 'Tray',
    icon: '🛒',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    website: 'https://tray.com.br'
  },
  [Marketplace.NUVEMSHOP]: {
    label: 'Nuvemshop',
    icon: '☁️',
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    website: 'https://nuvemshop.com.br'
  },
  [Marketplace.LOJA_INTEGRADA]: {
    label: 'Loja Integrada',
    icon: '🏪',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    website: 'https://lojaintegrada.com.br'
  },
  [Marketplace.WOOCOMMERCE]: {
    label: 'WooCommerce',
    icon: '🛒',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    website: 'https://woocommerce.com'
  },
  [Marketplace.MAGENTO]: {
    label: 'Magento',
    icon: '🛍️',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    website: 'https://magento.com'
  },
  [Marketplace.OPENCART]: {
    label: 'OpenCart',
    icon: '🛒',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    website: 'https://opencart.com'
  },
  [Marketplace.OTHER]: {
    label: 'Outro',
    icon: '🌐',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
}

// Helper Types
export interface Company {
  id: string
  name: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  role: string
}