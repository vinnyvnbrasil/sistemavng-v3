"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Plus, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Calendar,
  DollarSign,
  Truck,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlingOrderItem {
  id: string;
  codigo?: string;
  descricao: string;
  quantidade: number;
  valor: number;
  produto?: {
    id: string;
    nome: string;
  };
}

interface BlingOrder {
  id: string;
  numero?: string;
  numeroLoja?: string;
  data: string;
  dataSaida?: string;
  dataPrevista?: string;
  totalProdutos: number;
  total: number;
  situacao?: {
    id: number;
    valor: string;
  };
  contato?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  loja?: {
    id: string;
    nome: string;
  };
  transporte?: {
    transportadora?: string;
    servico?: string;
    codigoRastreamento?: string;
  };
  itens: BlingOrderItem[];
  observacoes?: string;
  observacoesInternas?: string;
  created_at?: string;
  updated_at?: string;
}

interface BlingOrdersProps {
  companyId: string;
}

const situacaoColors: Record<string, string> = {
  'Em aberto': 'bg-blue-100 text-blue-800',
  'Em andamento': 'bg-yellow-100 text-yellow-800',
  'Atendido': 'bg-green-100 text-green-800',
  'Cancelado': 'bg-red-100 text-red-800',
  'Em digitação': 'bg-gray-100 text-gray-800',
  'Verificado': 'bg-purple-100 text-purple-800'
};

export function BlingOrders({ companyId }: BlingOrdersProps) {
  const [orders, setOrders] = useState<BlingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<BlingOrder | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    emAberto: 0,
    emAndamento: 0,
    atendidos: 0,
    cancelados: 0,
    valorTotal: 0
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        company_id: companyId,
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (situacaoFilter !== 'all') {
        params.append('situacao', situacaoFilter);
      }
      if (dateFilter !== 'all') {
        params.append('date_filter', dateFilter);
      }
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }

      const response = await fetch(`/api/bling/orders?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar pedidos');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      setTotalItems(data.total || 0);
      
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar pedidos do Bling');
    } finally {
      setLoading(false);
    }
  };

  const syncOrders = async () => {
    try {
      const response = await fetch('/api/bling/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          sync_type: 'orders'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar pedidos');
      }

      toast.success('Sincronização de pedidos iniciada');
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar pedidos');
    }
  };

  const openViewDialog = (order: BlingOrder) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  useEffect(() => {
    fetchOrders();
  }, [companyId, currentPage, searchTerm, situacaoFilter, dateFilter, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  if (loading && orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos do Bling</CardTitle>
          <CardDescription>Gerencie seus pedidos sincronizados com o Bling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Em Aberto</p>
                <p className="text-lg font-semibold">{stats.emAberto}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-lg font-semibold">{stats.emAndamento}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Atendidos</p>
                <p className="text-lg font-semibold">{stats.atendidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <p className="text-lg font-semibold">{stats.cancelados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-semibold">{formatCurrency(stats.valorTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Pedidos do Bling
              </CardTitle>
              <CardDescription>
                Gerencie seus pedidos sincronizados com o Bling ({totalItems} pedidos)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                size="sm"
                onClick={syncOrders}
              >
                <Package className="h-4 w-4 mr-2" />
                Sincronizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as situações</SelectItem>
                <SelectItem value="Em aberto">Em aberto</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Atendido">Atendido</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="Em digitação">Em digitação</SelectItem>
                <SelectItem value="Verificado">Verificado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {dateFilter === 'custom' && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </>
            )}
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            #{order.numero || order.id}
                          </div>
                          {order.numeroLoja && (
                            <div className="text-sm text-muted-foreground">
                              Loja: {order.numeroLoja}
                            </div>
                          )}
                          {order.loja && (
                            <div className="text-xs text-muted-foreground">
                              {order.loja.nome}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.contato?.nome || 'N/A'}
                          </div>
                          {order.contato?.email && (
                            <div className="text-sm text-muted-foreground">
                              {order.contato.email}
                            </div>
                          )}
                          {order.contato?.telefone && (
                            <div className="text-xs text-muted-foreground">
                              {order.contato.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">
                            {formatDate(order.data)}
                          </div>
                          {order.dataSaida && (
                            <div className="text-xs text-muted-foreground">
                              Saída: {formatDate(order.dataSaida)}
                            </div>
                          )}
                          {order.dataPrevista && (
                            <div className="text-xs text-muted-foreground">
                              Prevista: {formatDate(order.dataPrevista)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">
                            {order.itens.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.totalProdutos} un.
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(order.total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={situacaoColors[order.situacao?.valor || 'Em digitação']}>
                          {order.situacao?.valor || 'Em digitação'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(order)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} pedidos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
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

          {/* Dialog de Visualização */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalhes do Pedido</DialogTitle>
                <DialogDescription>
                  Informações completas do pedido
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="items">Itens</TabsTrigger>
                    <TabsTrigger value="shipping">Entrega</TabsTrigger>
                    <TabsTrigger value="notes">Observações</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Número do Pedido</Label>
                        <p className="mt-1 text-lg font-semibold">
                          #{selectedOrder.numero || selectedOrder.id}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Situação</Label>
                        <div className="mt-1">
                          <Badge className={situacaoColors[selectedOrder.situacao?.valor || 'Em digitação']}>
                            {selectedOrder.situacao?.valor || 'Em digitação'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Data do Pedido</Label>
                        <p className="mt-1 text-sm">
                          {formatDateTime(selectedOrder.data)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Número da Loja</Label>
                        <p className="mt-1 text-sm">
                          {selectedOrder.numeroLoja || 'N/A'}
                        </p>
                      </div>
                      {selectedOrder.dataSaida && (
                        <div>
                          <Label className="text-sm font-medium">Data de Saída</Label>
                          <p className="mt-1 text-sm">
                            {formatDateTime(selectedOrder.dataSaida)}
                          </p>
                        </div>
                      )}
                      {selectedOrder.dataPrevista && (
                        <div>
                          <Label className="text-sm font-medium">Data Prevista</Label>
                          <p className="mt-1 text-sm">
                            {formatDateTime(selectedOrder.dataPrevista)}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedOrder.contato && (
                      <div>
                        <Label className="text-sm font-medium">Cliente</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium">{selectedOrder.contato.nome}</p>
                          {selectedOrder.contato.email && (
                            <p className="text-sm text-muted-foreground">{selectedOrder.contato.email}</p>
                          )}
                          {selectedOrder.contato.telefone && (
                            <p className="text-sm text-muted-foreground">{selectedOrder.contato.telefone}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Total de Produtos</Label>
                        <p className="mt-1 text-lg font-semibold">
                          {selectedOrder.totalProdutos} unidades
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Valor Total</Label>
                        <p className="mt-1 text-lg font-semibold">
                          {formatCurrency(selectedOrder.total)}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="items" className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Valor Unit.</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.itens.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {item.produto?.nome || item.descricao}
                                  </div>
                                  {item.descricao !== item.produto?.nome && (
                                    <div className="text-sm text-muted-foreground">
                                      {item.descricao}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm">
                                  {item.codigo || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {item.quantidade}
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatCurrency(item.valor)}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {formatCurrency(item.valor * item.quantidade)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="shipping" className="space-y-4">
                    {selectedOrder.transporte ? (
                      <div className="space-y-4">
                        {selectedOrder.transporte.transportadora && (
                          <div>
                            <Label className="text-sm font-medium">Transportadora</Label>
                            <p className="mt-1 text-sm">
                              {selectedOrder.transporte.transportadora}
                            </p>
                          </div>
                        )}
                        {selectedOrder.transporte.servico && (
                          <div>
                            <Label className="text-sm font-medium">Serviço</Label>
                            <p className="mt-1 text-sm">
                              {selectedOrder.transporte.servico}
                            </p>
                          </div>
                        )}
                        {selectedOrder.transporte.codigoRastreamento && (
                          <div>
                            <Label className="text-sm font-medium">Código de Rastreamento</Label>
                            <p className="mt-1 text-sm font-mono">
                              {selectedOrder.transporte.codigoRastreamento}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma informação de entrega disponível</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4">
                    {selectedOrder.observacoes && (
                      <div>
                        <Label className="text-sm font-medium">Observações</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {selectedOrder.observacoes}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedOrder.observacoesInternas && (
                      <div>
                        <Label className="text-sm font-medium">Observações Internas</Label>
                        <div className="mt-1 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {selectedOrder.observacoesInternas}
                          </p>
                        </div>
                      </div>
                    )}
                    {!selectedOrder.observacoes && !selectedOrder.observacoesInternas && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma observação disponível</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}