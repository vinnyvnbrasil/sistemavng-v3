"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Play, 
  Square, 
  Eye, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlingSyncLog {
  id: string;
  company_id: string;
  sync_type: 'orders' | 'products' | 'customers' | 'all';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  finished_at?: string;
  started_by: string;
  options?: any;
  result?: any;
  stats?: {
    total_processed: number;
    successful: number;
    errors: number;
  };
  error_message?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface BlingSyncListProps {
  companyId: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  pending: Clock,
  running: RefreshCw,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: Square
};

const syncTypeLabels = {
  orders: 'Pedidos',
  products: 'Produtos',
  customers: 'Clientes',
  all: 'Todos'
};

export function BlingSyncList({ companyId }: BlingSyncListProps) {
  const [syncLogs, setSyncLogs] = useState<BlingSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<BlingSyncLog | null>(null);
  const [isStartingSyncDialogOpen, setIsStartingSyncDialogOpen] = useState(false);
  const [newSyncType, setNewSyncType] = useState<'orders' | 'products' | 'customers' | 'all'>('all');
  const [isStartingSync, setIsStartingSync] = useState(false);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchSyncLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        company_id: companyId,
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        params.append('sync_type', typeFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/bling/sync?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar logs de sincronização');
      }

      const data = await response.json();
      setSyncLogs(data.logs || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar logs de sincronização');
    } finally {
      setLoading(false);
    }
  };

  const startSync = async () => {
    try {
      setIsStartingSync(true);
      
      const response = await fetch('/api/bling/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          sync_type: newSyncType,
          options: {
            force_full_sync: false
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar sincronização');
      }

      const data = await response.json();
      toast.success('Sincronização iniciada com sucesso');
      setIsStartingSyncDialogOpen(false);
      fetchSyncLogs(); // Recarregar a lista
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar sincronização');
    } finally {
      setIsStartingSync(false);
    }
  };

  const cancelSync = async (syncId: string) => {
    try {
      const response = await fetch(`/api/bling/sync/${syncId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar sincronização');
      }

      toast.success('Sincronização cancelada');
      fetchSyncLogs(); // Recarregar a lista
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar sincronização');
    }
  };

  useEffect(() => {
    fetchSyncLogs();
  }, [companyId, currentPage, statusFilter, typeFilter, searchTerm]);

  // Auto-refresh para sincronizações em andamento
  useEffect(() => {
    const hasRunningSyncs = syncLogs.some(log => log.status === 'running' || log.status === 'pending');
    
    if (hasRunningSyncs) {
      const interval = setInterval(() => {
        fetchSyncLogs();
      }, 5000); // Atualizar a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [syncLogs]);

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds % 60}s`;
    } else {
      return `${diffSeconds}s`;
    }
  };

  if (loading && syncLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sincronizações do Bling</CardTitle>
          <CardDescription>Histórico de sincronizações com a API do Bling</CardDescription>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sincronizações do Bling</CardTitle>
            <CardDescription>Histórico de sincronizações com a API do Bling</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSyncLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={isStartingSyncDialogOpen} onOpenChange={setIsStartingSyncDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Nova Sincronização
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Iniciar Nova Sincronização</DialogTitle>
                  <DialogDescription>
                    Selecione o tipo de dados que deseja sincronizar com o Bling
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Sincronização</label>
                    <Select value={newSyncType} onValueChange={(value: any) => setNewSyncType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os dados</SelectItem>
                        <SelectItem value="orders">Apenas Pedidos</SelectItem>
                        <SelectItem value="products">Apenas Produtos</SelectItem>
                        <SelectItem value="customers">Apenas Clientes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsStartingSyncDialogOpen(false)}
                      disabled={isStartingSync}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={startSync} disabled={isStartingSync}>
                      {isStartingSync && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                      Iniciar Sincronização
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="running">Em execução</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="orders">Pedidos</SelectItem>
              <SelectItem value="products">Produtos</SelectItem>
              <SelectItem value="customers">Clientes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Iniciado em</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Estatísticas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma sincronização encontrada
                  </TableCell>
                </TableRow>
              ) : (
                syncLogs.map((log) => {
                  const StatusIcon = statusIcons[log.status];
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge className={statusColors[log.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {log.status === 'pending' && 'Pendente'}
                          {log.status === 'running' && 'Em execução'}
                          {log.status === 'completed' && 'Concluído'}
                          {log.status === 'failed' && 'Falhou'}
                          {log.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {syncTypeLabels[log.sync_type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(log.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.started_at), 'HH:mm:ss', { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDuration(log.started_at, log.finished_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.stats && (
                          <div className="text-xs space-y-1">
                            <div>Total: {log.stats.total_processed}</div>
                            <div className="text-green-600">Sucesso: {log.stats.successful}</div>
                            {log.stats.errors > 0 && (
                              <div className="text-red-600">Erros: {log.stats.errors}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {(log.status === 'running' || log.status === 'pending') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelSync(log.id)}
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
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

        {/* Dialog de detalhes */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Sincronização</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre a sincronização selecionada
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">
                      <Badge className={statusColors[selectedLog.status]}>
                        {selectedLog.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <div className="mt-1 text-sm">
                      {syncTypeLabels[selectedLog.sync_type]}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Iniciado em</label>
                    <div className="mt-1 text-sm">
                      {format(new Date(selectedLog.started_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </div>
                  </div>
                  {selectedLog.finished_at && (
                    <div>
                      <label className="text-sm font-medium">Finalizado em</label>
                      <div className="mt-1 text-sm">
                        {format(new Date(selectedLog.finished_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </div>
                    </div>
                  )}
                </div>

                {selectedLog.stats && (
                  <div>
                    <label className="text-sm font-medium">Estatísticas</label>
                    <div className="mt-1 grid grid-cols-3 gap-4 text-sm">
                      <div>Total: {selectedLog.stats.total_processed}</div>
                      <div className="text-green-600">Sucesso: {selectedLog.stats.successful}</div>
                      <div className="text-red-600">Erros: {selectedLog.stats.errors}</div>
                    </div>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <label className="text-sm font-medium">Mensagem de Erro</label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}

                {selectedLog.result && (
                  <div>
                    <label className="text-sm font-medium">Resultado</label>
                    <pre className="mt-1 p-3 bg-gray-50 border rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.result, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.options && (
                  <div>
                    <label className="text-sm font-medium">Opções</label>
                    <pre className="mt-1 p-3 bg-gray-50 border rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.options, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}