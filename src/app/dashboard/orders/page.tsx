'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Plus, Filter, MoreHorizontal, ShoppingCart, Clock, CheckCircle, 
  AlertCircle, Package, TrendingUp, RefreshCw, Eye, Edit, Trash2,
  ExternalLink, Download, Calendar, MapPin, Phone, Mail, User
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OrdersService } from '@/lib/services/orders-service';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// Types for orders
interface Order {
  id: string;
  bling_order_id?: string;
  company_id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  marketplace?: string;
  order_date: string;
  items: any[];
  customer_address?: any;
  tracking_code?: string;
  invoice_url?: string;
  created_at: string;
  updated_at: string;
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue: number;
}

const ORDER_STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatOrderNumber = (orderNumber: string) => {
  return `#${orderNumber}`;
};

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'confirmed':
      return <CheckCircle className="h-4 w-4" />;
    case 'processing':
      return <RefreshCw className="h-4 w-4" />;
    case 'shipped':
      return <Package className="h-4 w-4" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [marketplaces, setMarketplaces] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const ordersService = new OrdersService();
  const supabase = createClient();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (companyId) {
      loadOrders();
      loadStats();
      loadMarketplaces();
    }
  }, [currentPage, statusFilter, marketplaceFilter, searchTerm, companyId]);

  const initializeAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      // Buscar company_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
      } else {
        toast.error('Empresa não encontrada para o usuário');
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!companyId) return;

    try {
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        marketplace: marketplaceFilter !== 'all' ? marketplaceFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 10
      };

      const result = await ordersService.getOrders(companyId, filters);
      setOrders(result.data);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    }
  };

  const loadStats = async () => {
    if (!companyId) return;

    try {
      const statsData = await ordersService.getOrderStats(companyId);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const loadMarketplaces = async () => {
    if (!companyId) return;

    try {
      const marketplacesData = await ordersService.getMarketplaces(companyId);
      setMarketplaces(marketplacesData);
    } catch (error) {
      console.error('Erro ao carregar marketplaces:', error);
    }
  };

  const handleSyncOrders = async () => {
    if (!companyId) {
      toast.error('ID da empresa não disponível');
      return;
    }

    setSyncing(true);
    try {
      // Implementar sincronização com Bling
      toast.success('Sincronização iniciada!');
      await loadOrders();
      await loadStats();
    } catch (error) {
      console.error('Erro ao sincronizar pedidos:', error);
      toast.error('Erro ao sincronizar pedidos');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await ordersService.updateOrder(orderId, { status: newStatus });
      toast.success('Status do pedido atualizado!');
      await loadOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error(`Erro ao atualizar status do pedido: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSyncOrders} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.pending} pendentes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: {formatCurrency(stats.averageOrderValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processando</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.confirmed} confirmados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregues</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.shipped} enviados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Marketplace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {marketplaces.map((marketplace) => (
              <SelectItem key={marketplace} value={marketplace}>
                {marketplace}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Pedidos */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="shipped">Enviados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {formatOrderNumber(order.order_number)}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {order.customer_name}
                          </span>
                          {order.customer_email && (
                            <span className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {order.customer_email}
                            </span>
                          )}
                          {order.marketplace && (
                            <Badge variant="outline">{order.marketplace}</Badge>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={ORDER_STATUS_COLORS[order.status]}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{ORDER_STATUS_LABELS[order.status]}</span>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {order.tracking_code && (
                            <DropdownMenuItem>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Rastrear Pedido
                            </DropdownMenuItem>
                          )}
                          {order.invoice_url && (
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Baixar Nota Fiscal
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Data: {new Date(order.order_date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {orders.filter(order => order.status === 'pending').map((order) => (
              <Card key={order.id} className="border-l-4 border-l-yellow-400">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{formatOrderNumber(order.order_number)}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-4 w-4 mr-1" />
                        Pendente
                      </Badge>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleUpdateOrderStatus(order.id, value as Order['status'])}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmar</SelectItem>
                          <SelectItem value="processing">Processar</SelectItem>
                          <SelectItem value="cancelled">Cancelar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(order.total_amount)} • {order.items.length} item(s)
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => handleViewOrder(order)}>
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shipped" className="space-y-4">
          <div className="grid gap-4">
            {orders.filter(order => order.status === 'shipped').map((order) => (
              <Card key={order.id} className="border-l-4 border-l-blue-400">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{formatOrderNumber(order.order_number)}</CardTitle>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Package className="h-4 w-4 mr-1" />
                      Enviado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{order.customer_name}</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                    {order.tracking_code && (
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Código: {order.tracking_code}</span>
                        <Button variant="link" size="sm" className="p-0 h-auto">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes do pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido {selectedOrder && formatOrderNumber(selectedOrder.order_number)}
            </DialogTitle>
            <DialogDescription>
              Informações completas do pedido
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações do cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Nome:</span>
                      <p className="font-medium">{selectedOrder.customer_name}</p>
                    </div>
                    {selectedOrder.customer_email && (
                      <div>
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <p className="font-medium">{selectedOrder.customer_email}</p>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div>
                        <span className="text-sm text-muted-foreground">Telefone:</span>
                        <p className="font-medium">{selectedOrder.customer_phone}</p>
                      </div>
                    )}
                  </div>
                  {selectedOrder.customer_address && (
                    <div>
                      <span className="text-sm text-muted-foreground">Endereço:</span>
                      <p className="font-medium">
                        {JSON.stringify(selectedOrder.customer_address)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Itens do pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{item.name || item.description || 'Item'}</p>
                          <p className="text-sm text-muted-foreground">
                            Qtd: {item.quantity || 1}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(item.price || item.value || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={ORDER_STATUS_COLORS[selectedOrder.status]}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{ORDER_STATUS_LABELS[selectedOrder.status]}</span>
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Marketplace:</span>
                      <p className="font-medium">{selectedOrder.marketplace || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Data do Pedido:</span>
                      <p className="font-medium">
                        {new Date(selectedOrder.order_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {selectedOrder.tracking_code && (
                      <div>
                        <span className="text-sm text-muted-foreground">Código de Rastreamento:</span>
                        <p className="font-medium">{selectedOrder.tracking_code}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}