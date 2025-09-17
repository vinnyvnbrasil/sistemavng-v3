import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  TicketIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarDaysIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import type { Ticket, TicketComment } from '../types/index.js';

interface TicketFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
}

const initialFormData: TicketFormData = {
  title: '',
  description: '',
  priority: 'medium',
  category: '',
};

interface CommentFormData {
  content: string;
}

const initialCommentFormData: CommentFormData = {
  content: '',
};

// Mock data para demonstração
const mockTickets: Ticket[] = [
  {
    id: '1',
    company_id: 'comp1',
    title: 'Problema na sincronização de pedidos',
    description: 'Os pedidos não estão sendo sincronizados corretamente com o Bling. Alguns pedidos aparecem duplicados e outros não aparecem.',
    status: 'open',
    priority: 'high',
    category: 'Integração',
    assigned_to: 'user123',
    created_by: 'client456',
    created_at: '2024-01-20T10:30:00Z',
    updated_at: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    company_id: 'comp1',
    title: 'Erro ao fazer upload de documentos',
    description: 'Quando tento fazer upload de arquivos PDF maiores que 5MB, o sistema retorna erro 500.',
    status: 'in_progress',
    priority: 'medium',
    category: 'Documentos',
    assigned_to: 'user123',
    created_by: 'client789',
    created_at: '2024-01-19T14:15:00Z',
    updated_at: '2024-01-20T09:00:00Z',
  },
  {
    id: '3',
    company_id: 'comp2',
    title: 'Solicitação de nova funcionalidade',
    description: 'Gostaria de solicitar a implementação de relatórios personalizados para análise de vendas.',
    status: 'resolved',
    priority: 'low',
    category: 'Funcionalidade',
    assigned_to: 'user456',
    created_by: 'client123',
    created_at: '2024-01-18T16:45:00Z',
    updated_at: '2024-01-19T11:30:00Z',
  },
  {
    id: '4',
    company_id: 'comp1',
    title: 'Dashboard não carrega dados',
    description: 'O dashboard principal não está exibindo as estatísticas. Fica apenas com o loading infinito.',
    status: 'open',
    priority: 'urgent',
    category: 'Sistema',
    created_by: 'client456',
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-01-20T08:00:00Z',
  },
];

const mockComments: TicketComment[] = [
  {
    id: '1',
    ticket_id: '1',
    content: 'Estou investigando o problema. Parece ser relacionado à configuração da API do Bling.',
    author_id: 'user123',
    author_name: 'João Silva',
    created_at: '2024-01-20T11:00:00Z',
  },
  {
    id: '2',
    ticket_id: '1',
    content: 'Obrigado pelo retorno. Aguardo a resolução.',
    author_id: 'client456',
    author_name: 'Maria Santos',
    created_at: '2024-01-20T11:15:00Z',
  },
  {
    id: '3',
    ticket_id: '2',
    content: 'Identifiquei o problema. O limite de upload precisa ser ajustado no servidor.',
    author_id: 'user123',
    author_name: 'João Silva',
    created_at: '2024-01-20T09:00:00Z',
  },
];

const categories = [
  'Sistema',
  'Integração',
  'Documentos',
  'Funcionalidade',
  'Suporte',
  'Outros',
];

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [comments, setComments] = useState<TicketComment[]>(mockComments);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [ticketFormData, setTicketFormData] = useState<TicketFormData>(initialFormData);
  const [commentFormData, setCommentFormData] = useState<CommentFormData>(initialCommentFormData);

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchTerm ? 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return ClockIcon;
      case 'in_progress': return ExclamationTriangleIcon;
      case 'resolved': return CheckCircleIcon;
      case 'closed': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obter cor da prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Traduzir status
  const translateStatus = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  // Traduzir prioridade
  const translatePriority = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  // Criar novo ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newTicket: Ticket = {
        id: Date.now().toString(),
        company_id: 'comp1',
        title: ticketFormData.title,
        description: ticketFormData.description,
        status: 'open',
        priority: ticketFormData.priority,
        category: ticketFormData.category,
        created_by: user?.id || 'unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setTickets(prev => [newTicket, ...prev]);
      setIsCreateModalOpen(false);
      setTicketFormData(initialFormData);
      alert('Ticket criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      alert('Erro ao criar ticket.');
    }
  };

  // Adicionar comentário
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTicket) return;
    
    try {
      const newComment: TicketComment = {
        id: Date.now().toString(),
        ticket_id: selectedTicket.id,
        content: commentFormData.content,
        author_id: user?.id || 'unknown',
        author_name: user?.user_metadata?.name || 'Usuário',
        created_at: new Date().toISOString(),
      };
      
      setComments(prev => [...prev, newComment]);
      setCommentFormData(initialCommentFormData);
      
      // Atualizar status do ticket para "em andamento" se estiver aberto
      if (selectedTicket.status === 'open') {
        setTickets(prev => prev.map(ticket => 
          ticket.id === selectedTicket.id 
            ? { ...ticket, status: 'in_progress', updated_at: new Date().toISOString() }
            : ticket
        ));
        setSelectedTicket(prev => prev ? { ...prev, status: 'in_progress' } : null);
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário.');
    }
  };

  // Alterar status do ticket
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus as Ticket['status'], updated_at: new Date().toISOString() }
          : ticket
      ));
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as Ticket['status'] } : null);
      }
      
      alert('Status do ticket atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  // Obter comentários do ticket
  const getTicketComments = (ticketId: string) => {
    return comments.filter(comment => comment.ticket_id === ticketId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  // Abrir detalhes do ticket
  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Tickets</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gerencie solicitações de suporte e atendimento ao cliente
            </p>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Novo Ticket
          </button>
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
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">Todos</option>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Andamento</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">Todas</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">Todas</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FunnelIcon className="-ml-1 mr-2 h-4 w-4" />
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de tickets */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum ticket encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Crie seu primeiro ticket de suporte.'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                  Novo Ticket
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => {
                const StatusIcon = getStatusIcon(ticket.status);
                const ticketComments = getTicketComments(ticket.id);
                
                return (
                  <li key={ticket.id} className="hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusColor(ticket.status)
                            }`}>
                              <StatusIcon className="-ml-0.5 mr-1.5 h-3 w-3" />
                              {translateStatus(ticket.status)}
                            </div>
                            
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getPriorityColor(ticket.priority)
                            }`}>
                              {translatePriority(ticket.priority)}
                            </div>
                            
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                              <TagIcon className="-ml-0.5 mr-1.5 h-3 w-3" />
                              {ticket.category}
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {ticket.title}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                              {ticket.description}
                            </p>
                          </div>
                          
                          <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <UserIcon className="h-3 w-3 mr-1" />
                              Criado por: Cliente
                            </div>
                            <div className="flex items-center">
                              <CalendarDaysIcon className="h-3 w-3 mr-1" />
                              {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                            </div>
                            {ticketComments.length > 0 && (
                              <div className="flex items-center">
                                <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                                {ticketComments.length} comentário{ticketComments.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openTicketDetails(ticket)}
                            className="inline-flex items-center p-2 border border-transparent rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            title="Ver detalhes"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {ticket.status !== 'closed' && (
                            <select
                              value={ticket.status}
                              onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                              className="text-xs border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="open">Aberto</option>
                              <option value="in_progress">Em Andamento</option>
                              <option value="resolved">Resolvido</option>
                              <option value="closed">Fechado</option>
                            </select>
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

      {/* Modal de Criação de Ticket */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Novo Ticket</h3>
              
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label htmlFor="ticket_title" className="block text-sm font-medium text-gray-700">
                    Título *
                  </label>
                  <input
                    type="text"
                    id="ticket_title"
                    value={ticketFormData.title}
                    onChange={(e) => setTicketFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Descreva brevemente o problema"
                  />
                </div>
                
                <div>
                  <label htmlFor="ticket_description" className="block text-sm font-medium text-gray-700">
                    Descrição *
                  </label>
                  <textarea
                    id="ticket_description"
                    value={ticketFormData.description}
                    onChange={(e) => setTicketFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Descreva detalhadamente o problema ou solicitação"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ticket_priority" className="block text-sm font-medium text-gray-700">
                      Prioridade
                    </label>
                    <select
                      id="ticket_priority"
                      value={ticketFormData.priority}
                      onChange={(e) => setTicketFormData(prev => ({ ...prev, priority: e.target.value as TicketFormData['priority'] }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="ticket_category" className="block text-sm font-medium text-gray-700">
                      Categoria
                    </label>
                    <select
                      id="ticket_category"
                      value={ticketFormData.category}
                      onChange={(e) => setTicketFormData(prev => ({ ...prev, category: e.target.value }))}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setTicketFormData(initialFormData);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Criar Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Ticket */}
      {isDetailModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedTicket.title}
                  </h3>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(selectedTicket.status)
                    }`}>
                      {translateStatus(selectedTicket.status)}
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getPriorityColor(selectedTicket.priority)
                    }`}>
                      {translatePriority(selectedTicket.priority)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {selectedTicket.category}
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
                {/* Detalhes do ticket */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Descrição</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedTicket.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Comentários */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Comentários</h4>
                    <div className="space-y-4">
                      {getTicketComments(selectedTicket.id).map((comment) => (
                        <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-primary-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {comment.author_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Formulário de novo comentário */}
                    {selectedTicket.status !== 'closed' && (
                      <form onSubmit={handleAddComment} className="mt-4">
                        <div>
                          <label htmlFor="comment_content" className="block text-sm font-medium text-gray-700 mb-2">
                            Adicionar comentário
                          </label>
                          <textarea
                            id="comment_content"
                            value={commentFormData.content}
                            onChange={(e) => setCommentFormData(prev => ({ ...prev, content: e.target.value }))}
                            required
                            rows={3}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Digite seu comentário..."
                          />
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <ChatBubbleLeftRightIcon className="-ml-1 mr-2 h-4 w-4" />
                            Comentar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
                
                {/* Sidebar com informações */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Informações</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Criado em</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedTicket.created_at).toLocaleString('pt-BR')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Atualizado em</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedTicket.updated_at).toLocaleString('pt-BR')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Criado por</dt>
                        <dd className="text-sm text-gray-900">Cliente</dd>
                      </div>
                      {selectedTicket.assigned_to && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Atribuído para</dt>
                          <dd className="text-sm text-gray-900">Suporte</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {selectedTicket.status !== 'closed' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Ações</h4>
                      <div className="space-y-2">
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                          className="block w-full text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="open">Aberto</option>
                          <option value="in_progress">Em Andamento</option>
                          <option value="resolved">Resolvido</option>
                          <option value="closed">Fechado</option>
                        </select>
                      </div>
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