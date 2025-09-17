import React, { memo, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import SupabaseTest from '../components/SupabaseTest';
import { useLazyLoad } from '../hooks/useLazyLoad';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Componente para cards de estatísticas otimizado com memo
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const StatsCard = memo(function StatsCard({ title, value, change, changeType, icon: Icon, color }: StatsCardProps) {
  const getChangeIcon = () => {
    if (changeType === 'increase') return ArrowTrendingUpIcon;
    if (changeType === 'decrease') return ArrowTrendingDownIcon;
    return null;
  };

  const ChangeIcon = getChangeIcon();

  const getIconColor = (color: string) => {
    switch (color) {
      case 'bg-blue-500': return 'bg-blue-500';
      case 'bg-green-500': return 'bg-green-500';
      case 'bg-purple-500': return 'bg-purple-500';
      case 'bg-orange-500': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const [ref, isVisible] = useLazyLoad<HTMLDivElement>({ threshold: 0.1 });
  
  return (
    <Card 
      ref={ref}
      className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group cursor-pointer"
    >
      <CardContent className="p-6">
        {isVisible ? (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{value}</p>
                {change && ChangeIcon && (
                  <Badge 
                    variant={changeType === 'increase' ? 'default' : changeType === 'decrease' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    <ChangeIcon className="h-3 w-3 mr-1" />
                    {change}
                  </Badge>
                )}
              </div>
            </div>
            <div className={cn(
              "p-3 rounded-lg shadow-sm transform transition-transform duration-300 group-hover:scale-110",
              getIconColor(color)
            )}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        ) : (
           <div className="h-24 flex items-center justify-center">
             <LoadingSpinner size="sm" />
           </div>
         )}
       </CardContent>
    </Card>
  );
});

// Componente para atividades recentes
interface Activity {
  id: string;
  type: 'order' | 'document' | 'ticket' | 'company';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

const ActivityItem = memo(function ActivityItem({ activity }: { activity: Activity }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700';
      case 'warning': return 'bg-yellow-100/80 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'error': return 'bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700';
      default: return 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return ChartBarIcon;
      case 'document': return DocumentTextIcon;
      case 'ticket': return ChatBubbleLeftRightIcon;
      case 'company': return BuildingOfficeIcon;
      default: return ClockIcon;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-gradient-to-br from-green-500 to-green-600';
      case 'document': return 'bg-gradient-to-br from-purple-500 to-purple-600';
      case 'ticket': return 'bg-gradient-to-br from-orange-500 to-orange-600';
      case 'company': return 'bg-gradient-to-br from-blue-500 to-blue-600';
      default: return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const Icon = getTypeIcon(activity.type);

  return (
    <div className="flex items-start space-x-4 py-4 transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg px-2 -mx-2">
      <div className="flex-shrink-0">
        <div className={`p-2 rounded-lg ${getIconColor(activity.type)} shadow-sm`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
            getStatusColor(activity.status)
          }`}>
            {activity.status === 'success' && 'Concluído'}
            {activity.status === 'warning' && 'Pendente'}
            {activity.status === 'error' && 'Erro'}
            {activity.status === 'info' && 'Ativo'}
          </span>
        </div>
        <div className="flex items-center mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{activity.time}</span>
        </div>
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { user } = useAuth();

  // Memoização dos dados das estatísticas para evitar recriação desnecessária
  const stats = useMemo(() => [
    {
      title: 'Empresas Ativas',
      value: '12',
      change: '+2 este mês',
      changeType: 'increase' as const,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Pedidos Sincronizados',
      value: '1,247',
      change: '+15% vs mês anterior',
      changeType: 'increase' as const,
      icon: ChartBarIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Documentos Armazenados',
      value: '3,456',
      change: '+234 esta semana',
      changeType: 'increase' as const,
      icon: DocumentTextIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Tickets Abertos',
      value: '23',
      change: '-5 vs semana anterior',
      changeType: 'decrease' as const,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-orange-500'
    }
  ], []);

  // Memoização das atividades recentes
  const recentActivities: Activity[] = useMemo(() => [
    {
      id: '1',
      type: 'order',
      title: 'Sincronização de Pedidos',
      description: 'Empresa ABC - 15 novos pedidos sincronizados',
      time: 'há 2 minutos',
      status: 'success'
    },
    {
      id: '2',
      type: 'company',
      title: 'Nova Empresa Cadastrada',
      description: 'XYZ Ltda foi adicionada ao sistema',
      time: 'há 1 hora',
      status: 'info'
    },
    {
      id: '3',
      type: 'document',
      title: 'Upload de Documento',
      description: 'Contrato_2024.pdf foi enviado',
      time: 'há 3 horas',
      status: 'success'
    },
    {
      id: '4',
      type: 'ticket',
      title: 'Ticket de Suporte',
      description: 'Problema na integração Bling - Em análise',
      time: 'há 5 horas',
      status: 'warning'
    }
  ], []);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 space-y-6 p-6">
          {/* Cabeçalho */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                Bem-vindo de volta, <span className="font-semibold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">{user?.user_metadata?.full_name || 'Usuário'}</span>!
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-6">
              <button className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200 shadow-lg hover:shadow-xl">
                <ClockIcon className="-ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                Atualizar
              </button>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Atividades recentes */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 transition-all duration-300 hover:shadow-xl h-fit">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Atividades Recentes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Acompanhe as últimas movimentações do sistema</p>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <div className="flow-root max-h-96 overflow-y-auto">
                    <ul className="-my-2 divide-y divide-gray-100/50 dark:divide-gray-700/50 space-y-1">
                      {recentActivities.map((activity) => (
                        <li key={activity.id}>
                          <ActivityItem activity={activity} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100/50 dark:border-gray-700/50">
                    <button className="w-full flex justify-center items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                      Ver todas as atividades
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 transition-all duration-300 hover:shadow-xl h-fit">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Ações Rápidas</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Acesso rápido às principais funcionalidades</p>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <div className="space-y-2 sm:space-y-3">
                    <button className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 rounded-xl flex items-center transition-all duration-200 group border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-200">
                        <BuildingOfficeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-semibold">Nova Empresa</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Cadastrar nova empresa</div>
                      </div>
                    </button>
                    <button className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 rounded-xl flex items-center transition-all duration-200 group border border-transparent hover:border-purple-200/50 dark:hover:border-purple-700/50">
                       <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-200">
                         <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                       </div>
                       <div>
                         <div className="text-sm sm:text-base font-semibold">Novo Documento</div>
                         <div className="text-xs text-gray-500 dark:text-gray-400">Upload de arquivo</div>
                       </div>
                     </button>
                    <button className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/30 dark:hover:to-red-900/30 rounded-xl flex items-center transition-all duration-200 group border border-transparent hover:border-orange-200/50 dark:hover:border-orange-700/50">
                       <div className="p-1.5 sm:p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-200">
                         <Cog6ToothIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                       </div>
                       <div>
                         <div className="text-sm sm:text-base font-semibold">Status do Sistema</div>
                         <div className="text-xs text-gray-500 dark:text-gray-400">Verificar integrações</div>
                       </div>
                     </button>
                    <button className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 rounded-xl flex items-center transition-all duration-200 group border border-transparent hover:border-green-200/50 dark:hover:border-green-700/50">
                       <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-200">
                         <ArrowsRightLeftIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                       </div>
                       <div>
                         <div className="text-sm sm:text-base font-semibold">Sincronizar Bling</div>
                         <div className="text-xs text-gray-500 dark:text-gray-400">Atualizar dados do Bling</div>
                       </div>
                     </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Teste Supabase - Movido para uma posição menos proeminente */}
            <div className="lg:col-span-3 mt-6">
              <SupabaseTest />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}