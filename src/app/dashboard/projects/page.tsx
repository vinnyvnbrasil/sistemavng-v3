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
import { 
  Order, 
  OrderFilters, 
  OrderStats, 
  ORDER_STATUS_LABELS, 
  ORDER_STATUS_COLORS,
  formatCurrency,
  formatOrderNumber,
  getOrderStatusIcon,
  getOrderPriority
} from '@/types/orders';
import { toast } from 'sonner';

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
  
  const ordersService = new OrdersService();
  const companyId = 'temp-company-id'; // TODO: Obter do contexto de autenticação

  useEffect(() => {
    loadOrders();
    loadStats();
    loadMarketplaces();
  }, [currentPage, statusFilter, marketplaceFilter, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const filters: OrderFilters = {};
      if (statusFilter !== 'all') {
        filters.status = [statusFilter as any];
      }
      if (marketplaceFilter !== 'all') {
        filters.marketplace = [marketplaceFilter];
      }
      if (searchTerm) {
        filters.customer_name = searchTerm;
      }

      const result = await ordersService.getOrders(companyId, filters, currentPage, 20);
      setOrders(result.data);
      setTotalPages(Math.ceil(result.total / result.limit));
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await ordersService.getOrderStats(companyId);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadMarketplaces = async () => {
    try {
      const marketplacesData = await ordersService.getMarketplaces(companyId);
      setMarketplaces(marketplacesData);
    } catch (error) {
      console.error('Erro ao carregar marketplaces:', error);
    }
  };

  const handleSyncOrders = async () => {
    try {
      setSyncing(true);
      toast.info('Iniciando sincronização com Bling...');
      
      const syncResult = await ordersService.syncOrdersFromBling(companyId);
      
      if (syncResult.sync_errors.length > 0) {
        toast.warning(`Sincronização concluída com ${syncResult.sync_errors.length} erros`);
      } else {
        toast.success(`${syncResult.total_synced} pedidos sincronizados com sucesso!`);
      }
      
      // Recarregar dados
      await loadOrders();
      await loadStats();
    } catch (error) {
      console.error('Erro na sincronização:', error);
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
      toast.error('Erro ao atualizar status do pedido');
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (order: Order) => {
    const priority = getOrderPriority(order);
    const colors = {
      low: 'border-l-gray-300',
      medium: 'border-l-blue-400',
      high: 'border-l-orange-400',
      urgent: 'border-l-red-500'
    };
    return colors[priority];
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleSyncOrders}
            disabled={syncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Bling'}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="orders">Todos os Pedidos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="shipped">Enviados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.recent_orders || 0} nos últimos 7 dias
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.total_amount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ticket médio: {formatCurrency(stats?.average_order_value || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.by_status?.pending || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando processamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregues</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.by_status?.delivered || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Concluídos com sucesso
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de marketplaces */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos por Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats?.by_marketplace || {}).map(([marketplace, count]) => (
                  <div key={marketplace} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{marketplace}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${((count as number) / (stats?.total || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, número do pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                  <SelectItem key={status} value={status}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por marketplace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Marketplaces</SelectItem>
                {marketplaces.map((marketplace) => (
                  <SelectItem key={marketplace} value={marketplace}>{marketplace}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando pedidos...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className={`border-l-4 ${getPriorityColor(order)}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Data do Pedido:</span>
                        <p className="font-medium">
                          {new Date(order.order_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor Total:</span>
                        <p className="font-medium text-green-600">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Itens:</span>
                        <p className="font-medium">{order.items.length} produto(s)</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Código de Rastreamento:</span>
                        <p className="font-medium">
                          {order.tracking_code || 'Não disponível'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Paginação */}
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
                    {selectedOrder.customer_document && (
                      <div>
                        <span className="text-sm text-muted-foreground">Documento:</span>
                        <p className="font-medium">{selectedOrder.customer_document}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedOrder.customer_address && (
                    <div className="mt-4">
                      <span className="text-sm text-muted-foreground">Endereço de Entrega:</span>
                      <p className="font-medium">
                        {selectedOrder.customer_address.street}, {selectedOrder.customer_address.number}
                        {selectedOrder.customer_address.complement && `, ${selectedOrder.customer_address.complement}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.customer_address.neighborhood}, {selectedOrder.customer_address.city} - {selectedOrder.customer_address.state}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CEP: {selectedOrder.customer_address.zip_code}
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
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity}x {formatCurrency(item.unit_price)}
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            {formatCurrency(item.total_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.total_amount - (selectedOrder.shipping_amount || 0) + (selectedOrder.discount_amount || 0))}</span>
                      </div>
                      {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Desconto:</span>
                          <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                        </div>
                      )}
                      {selectedOrder.shipping_amount && selectedOrder.shipping_amount > 0 && (
                        <div className="flex justify-between">
                          <span>Frete:</span>
                          <span>{formatCurrency(selectedOrder.shipping_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
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
                        {new Date(selectedOrder.order_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {selectedOrder.delivery_date && (
                      <div>
                        <span className="text-sm text-muted-foreground">Data de Entrega:</span>
                        <p className="font-medium">
                          {new Date(selectedOrder.delivery_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {selectedOrder.tracking_code && (
                      <div>
                        <span className="text-sm text-muted-foreground">Código de Rastreamento:</span>
                        <p className="font-medium">{selectedOrder.tracking_code}</p>
                      </div>
                    )}
                    {selectedOrder.invoice_number && (
                      <div>
                        <span className="text-sm text-muted-foreground">Nota Fiscal:</span>
                        <p className="font-medium">{selectedOrder.invoice_number}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedOrder.notes && (
                    <div className="mt-4">
                      <span className="text-sm text-muted-foreground">Observações:</span>
                      <p className="font-medium">{selectedOrder.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}