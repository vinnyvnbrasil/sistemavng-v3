'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  revenueGrowth: number
  ordersGrowth: number
  customersGrowth: number
  productsGrowth: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  recentOrders: Array<{
    id: string
    customer: string
    total: number
    status: string
    date: string
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }
      
      setCurrentUser(user)
      await loadAnalyticsData()
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      setRefreshing(true)
      
      // Simulated analytics data - replace with actual API calls
      const mockData: AnalyticsData = {
        totalRevenue: 125430.50,
        totalOrders: 1247,
        totalCustomers: 892,
        totalProducts: 156,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
        customersGrowth: 15.2,
        productsGrowth: 3.1,
        topProducts: [
          { id: '1', name: 'Produto Premium A', sales: 234, revenue: 23400 },
          { id: '2', name: 'Produto Standard B', sales: 189, revenue: 18900 },
          { id: '3', name: 'Produto Básico C', sales: 156, revenue: 15600 },
          { id: '4', name: 'Produto Especial D', sales: 123, revenue: 12300 },
          { id: '5', name: 'Produto Limitado E', sales: 98, revenue: 9800 }
        ],
        recentOrders: [
          { id: 'ORD-001', customer: 'João Silva', total: 299.90, status: 'completed', date: '2024-01-15' },
          { id: 'ORD-002', customer: 'Maria Santos', total: 189.50, status: 'processing', date: '2024-01-15' },
          { id: 'ORD-003', customer: 'Pedro Costa', total: 459.00, status: 'shipped', date: '2024-01-14' },
          { id: 'ORD-004', customer: 'Ana Oliveira', total: 129.90, status: 'completed', date: '2024-01-14' },
          { id: 'ORD-005', customer: 'Carlos Lima', total: 349.99, status: 'pending', date: '2024-01-13' }
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 45000 },
          { month: 'Fev', revenue: 52000 },
          { month: 'Mar', revenue: 48000 },
          { month: 'Abr', revenue: 61000 },
          { month: 'Mai', revenue: 55000 },
          { month: 'Jun', revenue: 67000 }
        ]
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{growth.toFixed(1)}%
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Erro ao carregar dados de analytics</p>
          <Button onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Análise detalhada do desempenho do seu negócio</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={loadAnalyticsData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
            {formatGrowth(analyticsData.revenueGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalOrders.toLocaleString()}</div>
            {formatGrowth(analyticsData.ordersGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalCustomers.toLocaleString()}</div>
            {formatGrowth(analyticsData.customersGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalProducts.toLocaleString()}</div>
            {formatGrowth(analyticsData.productsGrowth)}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Receita Mensal
                </CardTitle>
                <CardDescription>
                  Evolução da receita nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Gráfico de receita mensal</p>
                    <p className="text-sm">(Implementar com biblioteca de gráficos)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>
                  Últimos pedidos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>
                Ranking dos produtos com melhor desempenho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sales} vendas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Pedidos</CardTitle>
              <CardDescription>
                Estatísticas detalhadas sobre pedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{analyticsData.totalOrders}</p>
                  <p className="text-sm text-gray-600">Total de Pedidos</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(analyticsData.totalRevenue / analyticsData.totalOrders)}
                  </p>
                  <p className="text-sm text-gray-600">Ticket Médio</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {((analyticsData.totalOrders / analyticsData.totalCustomers) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Taxa de Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Clientes</CardTitle>
              <CardDescription>
                Insights sobre o comportamento dos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Métricas de Clientes</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de Clientes</span>
                      <span className="font-medium">{analyticsData.totalCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Novos Clientes (30d)</span>
                      <span className="font-medium text-green-600">+{Math.round(analyticsData.totalCustomers * 0.15)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clientes Ativos</span>
                      <span className="font-medium">{Math.round(analyticsData.totalCustomers * 0.68)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa de Retenção</span>
                      <span className="font-medium text-blue-600">73.2%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Valor por Cliente</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">LTV Médio</span>
                      <span className="font-medium">{formatCurrency(analyticsData.totalRevenue / analyticsData.totalCustomers * 2.3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compra Média</span>
                      <span className="font-medium">{formatCurrency(analyticsData.totalRevenue / analyticsData.totalOrders)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequência de Compra</span>
                      <span className="font-medium">2.1x/mês</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}