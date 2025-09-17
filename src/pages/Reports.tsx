import Layout from '../components/Layout';
import { ChartBarIcon, DocumentChartBarIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Reports() {
  const reportCards = [
    {
      title: 'Vendas Mensais',
      description: 'Relatório de vendas do mês atual',
      icon: CurrencyDollarIcon,
      color: 'from-green-500 to-emerald-600',
      value: 'R$ 125.430,00',
      change: '+12.5%'
    },
    {
      title: 'Pedidos Processados',
      description: 'Total de pedidos processados',
      icon: ChartBarIcon,
      color: 'from-blue-500 to-cyan-600',
      value: '1.247',
      change: '+8.2%'
    },
    {
      title: 'Documentos Gerados',
      description: 'Documentos criados no período',
      icon: DocumentChartBarIcon,
      color: 'from-purple-500 to-pink-600',
      value: '892',
      change: '+15.3%'
    },
    {
      title: 'Taxa de Crescimento',
      description: 'Crescimento comparado ao mês anterior',
      icon: ArrowTrendingUpIcon,
      color: 'from-orange-500 to-red-600',
      value: '18.7%',
      change: '+2.1%'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text">
                Relatórios e Análises
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Acompanhe o desempenho do seu negócio com relatórios detalhados
              </p>
            </div>
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reportCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {card.change}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Área de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de vendas */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vendas por Período
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">
                Gráfico de vendas será implementado aqui
              </p>
            </div>
          </div>

          {/* Gráfico de pedidos */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pedidos por Status
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">
                Gráfico de pedidos será implementado aqui
              </p>
            </div>
          </div>
        </div>

        {/* Tabela de relatórios */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Relatórios Disponíveis
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { name: 'Relatório de Vendas Mensal', date: '2024-01-15', status: 'Disponível' },
                { name: 'Análise de Pedidos', date: '2024-01-14', status: 'Processando' },
                { name: 'Relatório Financeiro', date: '2024-01-13', status: 'Disponível' },
                { name: 'Análise de Clientes', date: '2024-01-12', status: 'Disponível' }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{report.date}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'Disponível' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {report.status}
                    </span>
                    {report.status === 'Disponível' && (
                      <button className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium text-sm">
                        Baixar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}