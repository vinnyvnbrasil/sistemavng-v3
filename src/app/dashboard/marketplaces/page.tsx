'use client'

// Página de Marketplaces - Integração Bling
// Dashboard completo para gerenciar vendas em múltiplos marketplaces

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  TrendingUp,
  Package,
  DollarSign,
  RefreshCw,
  Filter,
  Download,
  Search,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Settings,
  Sync,
  BarChart3,
  Users,
  Star
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { PermissionGuard } from '@/components/rbac/permission-guard'
import { useAuth } from '@/hooks/use-auth'
import { OrdersService } from '@/lib/services/orders-service'
import { BlingApiService } from '@/lib/services/bling-api'
import { toast } from 'sonner'

interface MarketplaceStats {
  name: string
  icon: string
  orders: number
  revenue: number
  growth: number
  status: 'active' | 'inactive' | 'error'
  lastSync?: Date
}

interface MarketplaceOrder {
  id: string
  orderNumber: string
  marketplace: string
  customer: string
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  date: Date
  items: number
  tracking?: string
}

interface MarketplaceFilters {
  search: string
  marketplace: string
  status: string
  dateRange: {
    from?: Date
    to?: Date
  }
}

export default function MarketplacesPage() {
  const router = useRouter()
  const { user, hasPermission } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats[]>([])
  const [orders, setOrders] = useState<MarketplaceOrder[]>([])
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    marketplace: 'all',
    status: 'all',
    dateRange: {}
  })
  
  // Estados para modais
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showSyncDialog, setShowSyncDialog] = useState(false)

  useEffect(() => {
    loadMarketplaceData()
  }, [])

  const loadMarketplaceData = async () => {
    try {
      setLoading(true)
      
      const [statsData, ordersData] = await Promise.all([
        loadMarketplaceStats(),
        loadMarketplaceOrders()
      ])
      
      setMarketplaceStats(statsData)
      setOrders(ordersData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados dos marketplaces')
    } finally {
      setLoading(false)
    }
  }

  const loadMarketplaceStats = async (): Promise<MarketplaceStats[]> => {
    // Simular dados dos marketplaces
    return [
      {
        name: 'Mercado Livre',
        icon: '🛒',
        orders: 156,
        revenue: 45230.50,
        growth: 12.5,
        status: 'active',
        lastSync: new Date()
      },
      {
        name: 'Shopee',
        icon: '🛍️',
        orders: 89,
        revenue: 23450.80,
        growth: 8.3,
        status: 'active',
        lastSync: new Date()
      },
      {
        name: 'Amazon',
        icon: '📦',
        orders: 67,
        revenue: 34567.20,
        growth: -2.1,
        status: 'active',
        lastSync: new Date()
      },
      {
        name: 'Magazine Luiza',
        icon: '🏪',
        orders: 34,
        revenue: 12890.40,
        growth: 15.7,
        status: 'active',
        lastSync: new Date()
      },
      {
        name: 'Americanas',
        icon: '🛒',
        orders: 23,
        revenue: 8765.30,
        growth: 5.2,
        status: 'inactive',
        lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ]
  }

  const loadMarketplaceOrders = async (): Promise<MarketplaceOrder[]> => {
    // Simular dados de pedidos
    return [
      {
        id: '1',
        orderNumber: 'MLB123456789',
        marketplace: 'Mercado Livre',
        customer: 'João Silva',
        total: 299.90,
        status: 'confirmed',
        date: new Date(),
        items: 2,
        tracking: 'BR123456789'
      },
      {
        id: '2',
        orderNumber: 'SHP987654321',
        marketplace: 'Shopee',
        customer: 'Maria Santos',
        total: 159.50,
        status: 'processing',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        items: 1
      },
      {
        id: '3',
        orderNumber: 'AMZ456789123',
        marketplace: 'Amazon',
        customer: 'Pedro Costa',
        total: 450.00,
        status: 'shipped',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000),
        items: 3,
        tracking: 'AMZ789456123'
      }
    ]
  }

  const handleSyncMarketplaces = async () => {
    try {
      setSyncing(true)
      setShowSyncDialog(false)
      
      // Simular sincronização
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast.success('Sincronização concluída com sucesso!')
      loadMarketplaceData()
    } catch (error) {
      console.error('Erro na sincronização:', error)
      toast.error('Erro durante a sincronização')
    } finally {
      setSyncing(false)
    }
  }

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
                         order.customer.toLowerCase().includes(filters.search.toLowerCase())
    const matchesMarketplace = filters.marketplace === 'all' || order.marketplace === filters.marketplace
    const matchesStatus = filters.status === 'all' || order.status === filters.status
    
    return matchesSearch && matchesMarketplace && matchesStatus
  })

  // Estatísticas gerais
  const totalStats = {
    orders: marketplaceStats.reduce((sum, stat) => sum + stat.orders, 0),
    revenue: marketplaceStats.reduce((sum, stat) => sum + stat.revenue, 0),
    activeMarketplaces: marketplaceStats.filter(stat => stat.status === 'active').length,
    avgGrowth: marketplaceStats.reduce((sum, stat) => sum + stat.growth, 0) / marketplaceStats.length
  }

  const getStatusIcon = (status: MarketplaceOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'processing':
        return <Package className="h-4 w-4 text-orange-600" />
      case 'shipped':
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: MarketplaceOrder['status']) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-orange-100 text-orange-800 border-orange-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }

    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    }

    return (
      <Badge className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1">{labels[status]}</span>
      </Badge>
    )
  }

  const getMarketplaceStatusBadge = (status: MarketplaceStats['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inativo</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Erro</Badge>
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplaces</h1>
          <p className="text-gray-600">
            Gerencie suas vendas em múltiplos marketplaces
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSyncDialog(true)}
            disabled={syncing}
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sync className="h-4 w-4 mr-2" />
            )}
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          
          <PermissionGuard permission="orders:manage">
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.orders}</div>
            <p className="text-xs text-muted-foreground">
              +{totalStats.avgGrowth.toFixed(1)}% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os marketplaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketplaces Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.activeMarketplaces}</div>
            <p className="text-xs text-muted-foreground">
              de {marketplaceStats.length} configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{totalStats.avgGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média dos marketplaces
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cards dos Marketplaces */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Marketplaces</h3>
              {marketplaceStats.map((marketplace, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{marketplace.icon}</div>
                        <div>
                          <h4 className="font-medium">{marketplace.name}</h4>
                          <p className="text-sm text-gray-600">
                            {marketplace.orders} pedidos • R$ {marketplace.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getMarketplaceStatusBadge(marketplace.status)}
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className={`h-3 w-3 ${marketplace.growth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={`text-xs ${marketplace.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {marketplace.growth >= 0 ? '+' : ''}{marketplace.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {marketplace.lastSync && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          Última sincronização: {marketplace.lastSync.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pedidos Recentes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pedidos Recentes</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-4 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{order.orderNumber}</div>
                            <div className="text-sm text-gray-600">
                              {order.marketplace} • {order.customer}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Aba Pedidos */}
        <TabsContent value="orders" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar pedidos..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select
                  value={filters.marketplace}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, marketplace: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Marketplace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {marketplaceStats.map((marketplace) => (
                      <SelectItem key={marketplace.name} value={marketplace.name}>
                        {marketplace.icon} {marketplace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos</CardTitle>
              <CardDescription>
                {filteredOrders.length} de {orders.length} pedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Marketplace</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{order.items} itens</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {marketplaceStats.find(m => m.name === order.marketplace)?.icon}
                            </span>
                            {order.marketplace}
                          </div>
                        </TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {order.date.toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowOrderDetails(true)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir no Marketplace
                              </DropdownMenuItem>
                              {order.tracking && (
                                <DropdownMenuItem>
                                  <Package className="h-4 w-4 mr-2" />
                                  Rastrear Envio
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum pedido encontrado com os filtros aplicados.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Análises */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Marketplace</CardTitle>
                <CardDescription>Comparativo de vendas e crescimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketplaceStats.map((marketplace, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{marketplace.icon}</span>
                          <span className="font-medium">{marketplace.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          R$ {marketplace.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Progress 
                        value={(marketplace.revenue / totalStats.revenue) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{marketplace.orders} pedidos</span>
                        <span>{((marketplace.revenue / totalStats.revenue) * 100).toFixed(1)}% do total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Pedidos</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['confirmed', 'processing', 'shipped', 'delivered'].map((status) => {
                    const count = orders.filter(order => order.status === status).length
                    const percentage = (count / orders.length) * 100
                    
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(status as MarketplaceOrder['status'])}
                          <span className="text-sm font-medium">{count} pedidos</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="text-xs text-gray-500 text-right">
                          {percentage.toFixed(1)}% do total
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Sincronização */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar Marketplaces</DialogTitle>
            <DialogDescription>
              Isso irá buscar os pedidos mais recentes de todos os marketplaces configurados.
              O processo pode levar alguns minutos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSyncMarketplaces}>
              <Sync className="h-4 w-4 mr-2" />
              Sincronizar Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Pedido */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber} - {selectedOrder?.marketplace}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informações do Pedido</h4>
                  <div className="space-y-1 text-sm">
                    <div>Número: {selectedOrder.orderNumber}</div>
                    <div>Data: {selectedOrder.date.toLocaleString('pt-BR')}</div>
                    <div>Status: {getStatusBadge(selectedOrder.status)}</div>
                    <div>Itens: {selectedOrder.items}</div>
                    {selectedOrder.tracking && (
                      <div>Rastreamento: {selectedOrder.tracking}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <div>Nome: {selectedOrder.customer}</div>
                    <div>
                      Total: R$ {selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Fechar
            </Button>
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir no Marketplace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de sincronização */}
      {syncing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Sincronizando dados dos marketplaces... Isso pode levar alguns minutos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}