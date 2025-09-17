import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  CogIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { BlingIntegration } from '../types/index.js';

interface BlingConfigFormData {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  environment: 'sandbox' | 'production';
}

const initialFormData: BlingConfigFormData = {
  client_id: '',
  client_secret: '',
  redirect_uri: 'http://localhost:5173/bling/callback',
  environment: 'sandbox',
};

// Mock data para demonstração
const mockBlingConfig: BlingIntegration = {
  id: '1',
  company_id: '1',
  client_id: 'bling_client_123',
  client_secret: '***hidden***',
  redirect_uri: 'http://localhost:5173/bling/callback',
  environment: 'sandbox',
  access_token: 'access_token_example',
  refresh_token: 'refresh_token_example',
  token_expires_at: '2024-12-31T23:59:59Z',
  is_connected: true,
  active: true,
  last_sync: '2024-01-20T10:30:00Z',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T10:30:00Z',
};

export default function BlingIntegration() {
  const [config, setConfig] = useState<BlingIntegration | null>(mockBlingConfig);
  const [formData, setFormData] = useState<BlingConfigFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (config && isEditing) {
      setFormData({
        client_id: config.client_id,
        client_secret: '', // Por segurança, não preencher
        redirect_uri: config.redirect_uri,
        environment: config.environment,
      });
    }
  }, [config, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Aqui seria a integração com o Supabase
      const newConfig: BlingIntegration = {
        id: config?.id || Date.now().toString(),
        company_id: config?.company_id || '1',
        ...formData,
        access_token: config?.access_token,
        refresh_token: config?.refresh_token,
        token_expires_at: config?.token_expires_at,
        is_connected: config?.is_connected || false,
        active: config?.active || true,
        last_sync: config?.last_sync,
        created_at: config?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setConfig(newConfig);
      setIsEditing(false);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    }
  };

  const handleConnect = async () => {
    if (!config) {
      alert('Configure as credenciais antes de conectar.');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Simular processo de OAuth2
      const authUrl = `https://bling.com.br/oauth/authorize?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(config.redirect_uri)}&response_type=code&scope=read write`;
      
      // Em uma implementação real, abriria uma nova janela ou redirecionaria
      console.log('Auth URL:', authUrl);
      
      // Simular sucesso da conexão
      setTimeout(() => {
        const updatedConfig = {
          ...config,
          access_token: 'new_access_token_' + Date.now(),
          refresh_token: 'new_refresh_token_' + Date.now(),
          token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
          is_connected: true,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setConfig(updatedConfig);
        setIsConnecting(false);
        alert('Conectado com sucesso ao Bling!');
      }, 2000);
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setIsConnecting(false);
      alert('Erro ao conectar com o Bling. Verifique as configurações.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar do Bling?')) {
      return;
    }

    try {
      const updatedConfig = {
        ...config!,
        access_token: undefined,
        refresh_token: undefined,
        token_expires_at: undefined,
        is_connected: false,
        updated_at: new Date().toISOString(),
      };
      
      setConfig(updatedConfig);
      alert('Desconectado do Bling com sucesso!');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      alert('Erro ao desconectar. Tente novamente.');
    }
  };

  const handleTestConnection = async () => {
    if (!config?.is_connected) {
      setTestResult({ success: false, message: 'Não conectado ao Bling.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Simular teste de conexão
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% de chance de sucesso
        setTestResult({
          success,
          message: success 
            ? 'Conexão com o Bling está funcionando corretamente!' 
            : 'Falha na conexão. Verifique as credenciais ou tente reconectar.'
        });
        setIsTesting(false);
      }, 1500);
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setTestResult({ success: false, message: 'Erro interno ao testar conexão.' });
      setIsTesting(false);
    }
  };

  const getStatusColor = () => {
    if (!config) return 'text-gray-500';
    return config.is_connected ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = () => {
    if (!config) return XCircleIcon;
    return config.is_connected ? CheckCircleIcon : XCircleIcon;
  };

  const StatusIcon = getStatusIcon();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Integração Bling</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Configure e gerencie a integração com o sistema Bling ERP
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <StatusIcon className={`h-6 w-6 ${getStatusColor()}`} />
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {config?.is_connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        {config && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status da Conexão</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <LinkIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Ambiente</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 capitalize">{config.environment}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CogIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Client ID</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 font-mono">
                    {config.client_id ? `${config.client_id.substring(0, 8)}...` : 'Não configurado'}
                  </p>
                </div>
                
                {config.token_expires_at && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <InformationCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Token Expira</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(config.token_expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                
                {config.last_sync && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ArrowPathIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Última Sync</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(config.last_sync).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="mt-6 flex flex-wrap gap-3">
                {config.is_connected ? (
                  <>
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {isTesting ? (
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      ) : (
                        <CheckCircleIcon className="-ml-1 mr-2 h-4 w-4" />
                      )}
                      {isTesting ? 'Testando...' : 'Testar Conexão'}
                    </button>
                    
                    <button
                      onClick={handleDisconnect}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircleIcon className="-ml-1 mr-2 h-4 w-4" />
                      Desconectar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting || !config.client_id}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    ) : (
                      <LinkIcon className="-ml-1 mr-2 h-4 w-4" />
                    )}
                    {isConnecting ? 'Conectando...' : 'Conectar ao Bling'}
                  </button>
                )}
              </div>

              {/* Resultado do teste */}
              {testResult && (
                <div className={`mt-4 p-4 rounded-md ${
                  testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex">
                    {testResult.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    )}
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configurações */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Configurações</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <CogIcon className="-ml-1 mr-2 h-4 w-4" />
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                      Client ID *
                    </label>
                    <input
                      type="text"
                      id="client_id"
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Seu Client ID do Bling"
                    />
                  </div>

                  <div>
                    <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700">
                      Client Secret *
                    </label>
                    <input
                      type="password"
                      id="client_secret"
                      name="client_secret"
                      value={formData.client_secret}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Seu Client Secret do Bling"
                    />
                  </div>

                  <div>
                    <label htmlFor="redirect_uri" className="block text-sm font-medium text-gray-700">
                      Redirect URI *
                    </label>
                    <input
                      type="url"
                      id="redirect_uri"
                      name="redirect_uri"
                      value={formData.redirect_uri}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="http://localhost:5173/bling/callback"
                    />
                  </div>

                  <div>
                    <label htmlFor="environment" className="block text-sm font-medium text-gray-700">
                      Ambiente *
                    </label>
                    <select
                      id="environment"
                      name="environment"
                      value={formData.environment}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="sandbox">Sandbox (Testes)</option>
                      <option value="production">Produção</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {config ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">
                        {config.client_id || 'Não configurado'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {config.client_secret ? '••••••••••••••••' : 'Não configurado'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Redirect URI</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">
                        {config.redirect_uri || 'Não configurado'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ambiente</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {config.environment || 'Não configurado'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma configuração</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure as credenciais do Bling para começar a usar a integração.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <CogIcon className="-ml-1 mr-2 h-4 w-4" />
                        Configurar Agora
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documentação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Como configurar a integração com o Bling
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Acesse o painel do desenvolvedor do Bling</li>
                    <li>Crie uma nova aplicação OAuth2</li>
                    <li>Configure a Redirect URI como: <code className="bg-blue-100 px-1 rounded">http://localhost:5173/bling/callback</code></li>
                    <li>Copie o Client ID e Client Secret gerados</li>
                    <li>Cole as credenciais nos campos acima e salve</li>
                    <li>Clique em "Conectar ao Bling" para autorizar a aplicação</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}