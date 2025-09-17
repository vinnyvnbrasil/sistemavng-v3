import { useState } from 'react';
import Layout from '../components/Layout';
import { 
  Cog6ToothIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false
    },
    security: {
      twoFactor: false,
      sessionTimeout: '30'
    },
    general: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      theme: 'system'
    },
    integrations: {
      bling: true,
      supabase: true,
      vercel: false
    }
  });

  const tabs = [
    { id: 'general', name: 'Geral', icon: Cog6ToothIcon },
    { id: 'notifications', name: 'Notificações', icon: BellIcon },
    { id: 'security', name: 'Segurança', icon: ShieldCheckIcon },
    { id: 'integrations', name: 'Integrações', icon: CloudArrowUpIcon }
  ];

  const handleSettingChange = (category: string, key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    // Aqui você implementaria a lógica para salvar as configurações
    console.log('Salvando configurações:', settings);
    alert('Configurações salvas com sucesso!');
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text">
                Configurações do Sistema
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Gerencie as configurações e preferências do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Tabs e conteúdo */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl">
          {/* Tabs */}
          <div className="border-b border-gray-200/50 dark:border-gray-700/50">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Conteúdo das tabs */}
          <div className="p-4 sm:p-6">
            {/* Tab Geral */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Configurações Gerais
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Idioma
                      </label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fuso Horário
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                        <option value="America/New_York">New York (GMT-5)</option>
                        <option value="Europe/London">London (GMT+0)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Notificações */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Preferências de Notificação
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Notificações por Email', description: 'Receber notificações importantes por email' },
                      { key: 'push', label: 'Notificações Push', description: 'Receber notificações push no navegador' },
                      { key: 'sms', label: 'Notificações SMS', description: 'Receber notificações por SMS (recursos premium)' }
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{notification.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{notification.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                            onChange={(e) => handleSettingChange('notifications', notification.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Segurança */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Configurações de Segurança
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Autenticação de Dois Fatores</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Adicione uma camada extra de segurança à sua conta</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactor}
                          onChange={(e) => handleSettingChange('security', 'twoFactor', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timeout da Sessão (minutos)
                      </label>
                      <select
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="120">2 horas</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Integrações */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Integrações Ativas
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'bling', label: 'Bling ERP', description: 'Integração com sistema Bling para sincronização de dados', status: 'Conectado' },
                      { key: 'supabase', label: 'Supabase Database', description: 'Banco de dados em nuvem para armazenamento', status: 'Conectado' },
                      { key: 'vercel', label: 'Vercel Deploy', description: 'Deploy automático da aplicação', status: 'Desconectado' }
                    ].map((integration) => (
                      <div key={integration.key} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <p className="font-medium text-gray-900 dark:text-white">{integration.label}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              settings.integrations[integration.key as keyof typeof settings.integrations]
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {integration.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{integration.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input
                            type="checkbox"
                            checked={settings.integrations[integration.key as keyof typeof settings.integrations]}
                            onChange={(e) => handleSettingChange('integrations', integration.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary w-full sm:w-auto order-1 sm:order-2"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}