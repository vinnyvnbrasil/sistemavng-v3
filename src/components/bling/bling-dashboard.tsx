"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  ShoppingCart, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlingStats {
  orders: {
    total: number;
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  products: {
    total: number;
    active: number;
    inactive: number;
    low_stock: number;
    trend: number;
  };
  customers: {
    total: number;
    new_today: number;
    new_week: number;
    new_month: number;
    trend: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  sync_status: {
    last_sync: string | null;
    last_successful_sync: string | null;
    active_syncs: number;
    failed_syncs_today: number;
  };
}

interface BlingSyncSummary {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  finished_at?: string;
  stats?: {
    total_processed: number;
    successful: number;
    errors: number;
  };
}

interface BlingDashboardProps {
  companyId: string;
}

const periodOptions = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' }
];

export function BlingDashboard({ companyId }: BlingDashboardProps) {
  const [stats, setStats] = useState<BlingStats | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<BlingSyncSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setError(null);
      
      const params = new URLSearchParams({
        company_id: companyId,
        start_date: format(subDays(new Date(), parseInt(selectedPeriod)), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        include_products: 'true',
        include_customers: 'true'
      });

      const response = await fetch(`/api/bling/stats?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar estatísticas do Bling');
    }
  };

  const fetchRecentSyncs = async () => {
    try {
      const params = new URLSearchParams({
        company_id: companyId,
        limit: '5'
      });

      const response = await fetch(`/api/bling/sync?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar sincronizações recentes');
      }

      const data = await response.json();
      setRecentSyncs(data.logs || []);
    } catch (err) {
      console.error('Erro ao carregar sincronizações recentes:', err);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchRecentSyncs()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentSyncs()]);
      setLoading(false);
    };

    loadData();
  }, [companyId, selectedPeriod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Bling</h1>
          <p className="text-muted-foreground">
            Visão geral das suas integrações e dados do Bling
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats && (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pedidos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.orders.total)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon(stats.orders.trend)}
                  <span className={getTrendColor(stats.orders.trend)}>
                    {Math.abs(stats.orders.trend)}% vs período anterior
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Hoje: {formatNumber(stats.orders.today)} | 
                  Semana: {formatNumber(stats.orders.week)}
                </div>
              </CardContent>
            </Card>

            {/* Produtos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.products.total)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon(stats.products.trend)}
                  <span className={getTrendColor(stats.products.trend)}>
                    {Math.abs(stats.products.trend)}% vs período anterior
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Ativos: {formatNumber(stats.products.active)} | 
                  Estoque baixo: {formatNumber(stats.products.low_stock)}
                </div>
              </CardContent>
            </Card>

            {/* Clientes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.customers.total)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon(stats.customers.trend)}
                  <span className={getTrendColor(stats.customers.trend)}>
                    {Math.abs(stats.customers.trend)}% vs período anterior
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Novos hoje: {formatNumber(stats.customers.new_today)} | 
                  Semana: {formatNumber(stats.customers.new_week)}
                </div>
              </CardContent>
            </Card>

            {/* Receita */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.revenue.month)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon(stats.revenue.trend)}
                  <span className={getTrendColor(stats.revenue.trend)}>
                    {Math.abs(stats.revenue.trend)}% vs período anterior
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Hoje: {formatCurrency(stats.revenue.today)} | 
                  Semana: {formatCurrency(stats.revenue.week)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status de Sincronização e Sincronizações Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status de Sincronização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status de Sincronização
                </CardTitle>
                <CardDescription>
                  Informações sobre as sincronizações com o Bling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Sincronização</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.sync_status.last_sync 
                      ? format(new Date(stats.sync_status.last_sync), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : 'Nunca'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Sincronização Bem-sucedida</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.sync_status.last_successful_sync 
                      ? format(new Date(stats.sync_status.last_successful_sync), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : 'Nunca'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sincronizações Ativas</span>
                  <Badge variant={stats.sync_status.active_syncs > 0 ? "default" : "secondary"}>
                    {stats.sync_status.active_syncs}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Falhas Hoje</span>
                  <Badge variant={stats.sync_status.failed_syncs_today > 0 ? "destructive" : "secondary"}>
                    {stats.sync_status.failed_syncs_today}
                  </Badge>
                </div>

                {stats.sync_status.failed_syncs_today > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Há {stats.sync_status.failed_syncs_today} sincronização(ões) que falharam hoje. 
                      Verifique os logs para mais detalhes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Sincronizações Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Sincronizações Recentes
                </CardTitle>
                <CardDescription>
                  Últimas 5 sincronizações executadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentSyncs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma sincronização encontrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSyncs.map((sync) => (
                      <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium capitalize">
                              {sync.sync_type === 'all' ? 'Todos' : sync.sync_type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(sync.started_at), 'dd/MM HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {sync.stats && (
                            <div className="text-xs text-muted-foreground">
                              {sync.stats.successful}/{sync.stats.total_processed}
                            </div>
                          )}
                          <Badge className={getStatusColor(sync.status)}>
                            {sync.status === 'completed' && 'Concluído'}
                            {sync.status === 'running' && 'Em execução'}
                            {sync.status === 'failed' && 'Falhou'}
                            {sync.status === 'pending' && 'Pendente'}
                            {sync.status === 'cancelled' && 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alertas e Recomendações */}
          {(stats.products.low_stock > 0 || stats.sync_status.failed_syncs_today > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Alertas e Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.products.low_stock > 0 && (
                  <Alert>
                    <Package className="h-4 w-4" />
                    <AlertDescription>
                      Você tem {stats.products.low_stock} produto(s) com estoque baixo. 
                      Considere reabastecer para evitar rupturas.
                    </AlertDescription>
                  </Alert>
                )}
                
                {stats.sync_status.failed_syncs_today > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Há sincronizações que falharam hoje. Verifique os logs e 
                      considere executar uma nova sincronização.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}