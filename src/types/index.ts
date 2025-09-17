// Tipos de usuário e autenticação
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Tipos de empresa
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de integração Bling
export interface BlingIntegration {
  id: string;
  company_id: string;
  client_id: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  redirect_uri: string;
  environment: 'sandbox' | 'production';
  token_expires_at?: string;
  is_connected: boolean;
  active: boolean;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

// Tipos de pedidos
export interface Order {
  id: string;
  company_id: string;
  bling_id: string;
  number: string;
  customer_name: string;
  customer_email?: string;
  total_value: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_date: string;
  sync_status: 'synced' | 'pending' | 'error';
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

// Tipos de documentos
export interface Document {
  id: string;
  name: string;
  original_name: string;
  description: string;
  file_type: string;
  file_size: number;
  folder_id: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  path: string;
  created_at: string;
  updated_at: string;
}

// Tipos de tickets
export interface Ticket {
  id: string;
  company_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

// Tipos de dashboard
export interface DashboardStats {
  total_companies: number;
  active_integrations: number;
  orders_today: number;
  pending_tickets: number;
  sync_errors: number;
}

// Tipos de navegação
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
  children?: NavItem[];
}

// Tipos de formulários
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

// Tipos de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Tipos de paginação
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}