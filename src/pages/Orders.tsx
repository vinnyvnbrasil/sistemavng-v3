import { useState } from 'react';
import Layout from '../components/Layout';
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import type { Order } from '../types/index.js';

interface SyncLog {
  id: string;
  order_id: string;
  action: 'sync' | 'update' | 'error';
  message: string;
  details?: string;
  created_at: string;
}

// Mock data para demonstração
const mockOrders: Order[] = [
  {
    id: '1',
    company_id: 'comp1',
    bling_id: 'BL001',
    number: 'PED-2024-001',
    customer_name: 'João Silva Santos',
    customer_email: 'joao.silva@email.com',
    total_value: 1250.50,
    status: 'processing',
    order_date: '2024-01-20T10:30:00Z',
    sync_status: 'synced',
    created_at: '2024-01-20T10:30:00Z',
    updated_at: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    company_id: 'comp1',
    bling_id: 'BL002',
    number: 'PED-2024-002',
    customer_name: 'Maria Oliveira Costa',
    customer_email: 'maria.oliveira@email.com',
    total_value: 890.75,
    status: 'shipped',
    order_date: '2024-01-19T14:15:00Z',
    sync_status: 'pending',
    created_at: '2024-01-19T14:15:00Z',
    updated_at: '2024-01-20T09:00:00Z',
  },
  {
    id: '3',
    company_id: 'comp1',
    bling_id: 'BL003',
    number: 'PED-2024-003',
    customer_name: 'Carlos Eduardo Lima',
    customer_email: 'carlos.lima@email.com',
    total_value: 2150.00,
    status: 'delivered',
    order_date: '2024-01-18T16:45:00Z',
    sync_status: 'error',
    sync_error: 'Erro na API do Bling: Token expirado',
    created_at: '2024-01-18T16:45:00Z',
    updated_at: '2024-01-19T11:30:00Z',
  },
  {
    id: '4',
    company_id: 'comp2',
    bling_id: 'BL004',
    number: 'PED-2024-004',
    customer_name: 'Ana Paula Ferreira',
    customer_email: 'ana.ferreira@email.com',
    total_value: 675.25,
    status: 'pending',
    order_date: '2024-01-20T08:00:00Z',
    sync_status: 'synced',
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-01-20T08:00:00Z',
  },
  {
    id: '5',
    company_id: 'comp1',
    bling_id: 'BL005',
    number: 'PED-2024-005',
    customer_name: 'Roberto Almeida Souza',
    customer_email: 'roberto.souza@email.com',
    total_value: 3200.80,
    status: 'cancelled',
    order_date: '2024-01-17T12:20:00Z',
    sync_status: 'synced',
    created_at: '2024-01-17T12:20:00Z',
    updated_at: '2024-01-18T10:15:00Z',
  },
];

const mockSyncLogs: SyncLog[] = [
  {
    id: '1',
    order_id: '1',
    action: 'sync',
    message: 'Pedido sincronizado com sucesso',
    created_at: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    order_id: '2',
    action: 'sync',
    message: 'Aguardando sincronização',
    created_at: '2024-01-20T09:00:00Z',
  },
  {
    id: '3',
    order_id: '3',
    action: 'error',
    message: 'Falha na sincronização',
    details: 'Erro na API do Bling: Token de acesso expirado. Renovação necessária.',
    created_at: '2024-01-19T11:30:00Z',
  },
  {
    id: '4',
    order_id: '4',
    action: 'sync',
    message: 'Pedido sincronizado com sucesso',
    created_at: '2024-01-20T08:00:00Z',
  },
  {
    id: '5',
    order_id: '5',
    action: 'update',
    message: 'Status do pedido atualizado para cancelado',
    created_at: '2024-01-18T10:15:00Z',
  },
];

export default function Orders() {
  // const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(mockSyncLogs);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm ? 
      order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.bling_id.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSyncStatus = syncStatusFilter === 'all' || order.sync_status === syncStatusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.order_date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          matchesDate = orderDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          matchesDate = orderDate >= lastWeek;
          break;
        case 'month':
          matchesDate = orderDate >= lastMonth;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesSyncStatus && matchesDate;
  });

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'processing': return ArrowPathIcon;
      case 'shipped': return CloudArrowUpIcon;
      case 'delivered': return CheckCircleIcon;
      case 'cancelled': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obter cor do status de sincronização
  const getSyncStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Traduzir status
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Traduzir status de sincronização
  const translateSyncStatus = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced': return 'Sincronizado';
      case 'pending': return 'Pendente';
      case 'error': return 'Erro';
      default: return syncStatus;
    }
  };

  // Sincronizar pedidos
  const handleSyncOrders = async () => {
    setIsSyncing(true);
    
    try {
      // Simular sincronização
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar status dos pedidos pendentes
      setOrders(prev => prev.map(order => 
        order.sync_status === 'pending' 
          ? { ...order, sync_status: 'synced', updated_at: new Date().toISOString() }
          : order
      ));
      
      // Adicionar logs de sincronização
      const newLogs: SyncLog[] = orders
        .filter(order => order.sync_status === 'pending')
        .map(order => ({
          id: Date.now().toString() + order.id,
          order_id: order.id,
          action: 'sync',
          message: 'Pedido sincronizado com sucesso',
          created_at: new Date().toISOString(),
        }));
      
      setSyncLogs(prev => [...newLogs, ...prev]);
      alert('Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro durante a sincronização.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincronizar pedido individual
  const handleSyncOrder = async (orderId: string) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, sync_status: 'synced', sync_error: undefined, updated_at: new Date().toISOString() }
          : order
      ));
      
      const newLog: SyncLog = {
        id: Date.now().toString(),
        order_id: orderId,
        action: 'sync',
        message: 'Pedido sincronizado manualmente',
        created_at: new Date().toISOString(),
      };
      
      setSyncLogs(prev => [newLog, ...prev]);
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, sync_status: 'synced', sync_error: undefined } : null);
      }
      
      alert('Pedido sincronizado com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro ao sincronizar pedido.');
    }
  };

  // Obter logs do pedido
  const getOrderLogs = (orderId: string) => {
    return syncLogs.filter(log => log.order_id === orderId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Abrir detalhes do pedido
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // Calcular estatísticas
  const stats = {
    total: orders.length,
    synced: orders.filter(o => o.sync_status === 'synced').length,
    pending: orders.filter(o => o.sync_status === 'pending').length,
    errors: orders.filter(o => o.sync_status === 'error').length,
    totalValue: orders.reduce((sum, order) => sum + order.total_value, 0),
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sincronização de Pedidos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gerencie e monitore a sincronização de pedidos com o Bling
            </p>
          </div>
          
          <button
            onClick={handleSyncOrders}
            disabled={isSyncing}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`-ml-1 mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Todos'}
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Pedidos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sincronizados</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.synced}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendentes</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Com Erro</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.errors}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Valor Total</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status do Pedido
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status de Sincronização
              </label>
              <select
                value={syncStatusFilter}
                onChange={(e) => setSyncStatusFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">Todos</option>
                <option value="synced">Sincronizado</option>
                <option value="pending">Pendente</option>
                <option value="error">Erro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSyncStatusFilter('all');
                  setDateFilter('all');
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FunnelIcon className="-ml-1 mr-2 h-4 w-4" />
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum pedido encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || syncStatusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Aguardando sincronização de pedidos do Bling.'
                }
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                
                return (
                  <li key={order.id} className="hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusColor(order.status)
                            }`}>
                              <StatusIcon className="-ml-0.5 mr-1.5 h-3 w-3" />
                              {translateStatus(order.status)}
                            </div>
                            
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getSyncStatusColor(order.sync_status)
                            }`}>
                              {translateSyncStatus(order.sync_status)}
                            </div>
                            
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                              {order.bling_id}
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {order.number}
                              </p>
                              <p className="text-sm font-medium text-green-600">
                                R$ {order.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {order.customer_name}
                            </p>
                            {order.customer_email && (
                              <p className="text-xs text-gray-400">
                                {order.customer_email}
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <CalendarDaysIcon className="h-3 w-3 mr-1" />
                              {new Date(order.order_date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center">
                              <UserIcon className="h-3 w-3 mr-1" />
                              {order.customer_name}
                            </div>
                          </div>
                          
                          {order.sync_error && (
                            <div className="mt-2 flex items-center text-xs text-red-600">
                              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              {order.sync_error}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="inline-flex items-center p-2 border border-transparent rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            title="Ver detalhes"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {order.sync_status !== 'synced' && (
                            <button
                              onClick={() => handleSyncOrder(order.id)}
                              className="inline-flex items-center p-2 border border-transparent rounded-md text-primary-400 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              title="Sincronizar"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Pedido {selectedOrder.number}
                  </h3>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(selectedOrder.status)
                    }`}>
                      {translateStatus(selectedOrder.status)}
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getSyncStatusColor(selectedOrder.sync_status)
                    }`}>
                      {translateSyncStatus(selectedOrder.sync_status)}
                    </div>
                    <span className="text-xs text-gray-500">
                      Bling ID: {selectedOrder.bling_id}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detalhes do pedido */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Informações do Cliente</h4>
                    <dl className="grid grid-cols-1 gap-2">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Nome</dt>
                        <dd className="text-sm text-gray-900">{selectedOrder.customer_name}</dd>
                      </div>
                      {selectedOrder.customer_email && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Email</dt>
                          <dd className="text-sm text-gray-900">{selectedOrder.customer_email}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Detalhes do Pedido</h4>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Número</dt>
                        <dd className="text-sm text-gray-900">{selectedOrder.number}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Valor Total</dt>
                        <dd className="text-sm font-medium text-green-600">
                          R$ {selectedOrder.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Data do Pedido</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedOrder.order_date).toLocaleString('pt-BR')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Status</dt>
                        <dd className="text-sm text-gray-900">{translateStatus(selectedOrder.status)}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  {selectedOrder.sync_error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                        <h4 className="text-sm font-medium text-red-800">Erro de Sincronização</h4>
                      </div>
                      <p className="text-sm text-red-700 mt-2">{selectedOrder.sync_error}</p>
                    </div>
                  )}
                  
                  {/* Logs de sincronização */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Histórico de Sincronização</h4>
                    <div className="space-y-3">
                      {getOrderLogs(selectedOrder.id).map((log) => (
                        <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                log.action === 'error' ? 'bg-red-400' :
                                log.action === 'sync' ? 'bg-green-400' : 'bg-blue-400'
                              }`} />
                              <span className="text-xs font-medium text-gray-900">
                                {log.action === 'error' ? 'Erro' :
                                 log.action === 'sync' ? 'Sincronização' : 'Atualização'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700">{log.message}</p>
                          {log.details && (
                            <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Sidebar com ações */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Informações de Sincronização</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Status</dt>
                        <dd className={`text-sm font-medium ${
                          selectedOrder.sync_status === 'synced' ? 'text-green-600' :
                          selectedOrder.sync_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {translateSyncStatus(selectedOrder.sync_status)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Criado em</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Atualizado em</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedOrder.updated_at).toLocaleString('pt-BR')}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  {selectedOrder.sync_status !== 'synced' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Ações</h4>
                      <button
                        onClick={() => handleSyncOrder(selectedOrder.id)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" />
                        Sincronizar Agora
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}