import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  UserCircleIcon,
  KeyIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard: {
    showStats: boolean;
    showRecentActivity: boolean;
    autoRefresh: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
  };
}

// Mock de preferências do usuário
const mockPreferences: UserPreferences = {
  theme: 'system',
  language: 'pt-BR',
  notifications: {
    email: true,
    push: true,
    desktop: false,
  },
  dashboard: {
    showStats: true,
    showRecentActivity: true,
    autoRefresh: false,
  },
  privacy: {
    profileVisible: true,
    activityVisible: false,
  },
};

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados do formulário de perfil
  const [profileForm, setProfileForm] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    company: '',
    position: '',
  });
  
  // Estados do formulário de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Estados das preferências
  const [preferences, setPreferences] = useState<UserPreferences>(mockPreferences);
  
  // Validação de senha
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
    };
  };
  
  const passwordValidation = validatePassword(passwordForm.newPassword);
  
  // Salvar perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Nota: Atualização do perfil seria feita via API do Supabase
      // Por enquanto apenas simulamos o sucesso
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Alterar senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    
    if (!passwordValidation.isValid) {
      setMessage({ type: 'error', text: 'A senha não atende aos critérios de segurança.' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simular alteração de senha
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao alterar senha.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Salvar preferências
  const handleSavePreferences = async () => {
    setIsLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Preferências salvas com sucesso!' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar preferências.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Limpar mensagem após 5 segundos
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const tabs = [
    {
      id: 'profile' as const,
      name: 'Perfil',
      icon: UserCircleIcon,
      description: 'Informações pessoais e profissionais',
    },
    {
      id: 'security' as const,
      name: 'Segurança',
      icon: KeyIcon,
      description: 'Senha e configurações de segurança',
    },
    {
      id: 'preferences' as const,
      name: 'Preferências',
      icon: Cog6ToothIcon,
      description: 'Configurações do sistema e notificações',
    },
  ];
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil e Configurações</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie suas informações pessoais, segurança e preferências do sistema
          </p>
        </div>
        
        {/* Mensagem de feedback */}
        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="p-6">
            {/* Tab: Perfil */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Avatar */}
                  <div className="lg:col-span-1">
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                        {user?.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt={user.user_metadata?.name || 'Avatar'}
                            className="w-32 h-32 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="w-20 h-20 text-gray-400" />
                        )}
                      </div>
                      <button
                        type="button"
                        className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PaintBrushIcon className="-ml-0.5 mr-2 h-4 w-4" />
                        Alterar Foto
                      </button>
                    </div>
                  </div>
                  
                  {/* Formulário */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={profileForm.company}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={profileForm.position}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biografia
                      </label>
                      <textarea
                        rows={4}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Conte um pouco sobre você..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            )}
            
            {/* Tab: Segurança */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Alterar Senha</h3>
                  
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha Atual *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.current ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nova Senha *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.new ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      {/* Validação de senha */}
                      {passwordForm.newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-gray-600">A senha deve conter:</div>
                          <div className="space-y-1">
                            {[
                              { key: 'minLength', text: 'Pelo menos 8 caracteres' },
                              { key: 'hasUpper', text: 'Uma letra maiúscula' },
                              { key: 'hasLower', text: 'Uma letra minúscula' },
                              { key: 'hasNumber', text: 'Um número' },
                              { key: 'hasSpecial', text: 'Um caractere especial' },
                            ].map(({ key, text }) => (
                              <div key={key} className="flex items-center text-xs">
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  passwordValidation[key as keyof typeof passwordValidation] ? 'bg-green-400' : 'bg-gray-300'
                                }`} />
                                <span className={passwordValidation[key as keyof typeof passwordValidation] ? 'text-green-600' : 'text-gray-500'}>
                                  {text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Nova Senha *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.confirm ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">As senhas não coincidem</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || !passwordValidation.isValid || passwordForm.newPassword !== passwordForm.confirmPassword}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Tab: Preferências */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                {/* Tema */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Aparência</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tema
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Claro', icon: SunIcon },
                          { value: 'dark', label: 'Escuro', icon: MoonIcon },
                          { value: 'system', label: 'Sistema', icon: ComputerDesktopIcon },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => setPreferences(prev => ({ ...prev, theme: value as UserPreferences['theme'] }))}
                            className={`flex items-center justify-center p-3 border rounded-lg text-sm font-medium ${
                              preferences.theme === value
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value as UserPreferences['language'] }))}
                        className="block w-full max-w-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español (España)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Notificações */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notificações</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Notificações por Email', description: 'Receber atualizações importantes por email' },
                      { key: 'push', label: 'Notificações Push', description: 'Receber notificações no navegador' },
                      { key: 'desktop', label: 'Notificações Desktop', description: 'Mostrar notificações na área de trabalho' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{label}</div>
                          <div className="text-sm text-gray-500">{description}</div>
                        </div>
                        <button
                          onClick={() => setPreferences(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [key]: !prev.notifications[key as keyof typeof prev.notifications],
                            },
                          }))}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            preferences.notifications[key as keyof typeof preferences.notifications]
                              ? 'bg-primary-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              preferences.notifications[key as keyof typeof preferences.notifications]
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Dashboard */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dashboard</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'showStats', label: 'Mostrar Estatísticas', description: 'Exibir cards de estatísticas no dashboard' },
                      { key: 'showRecentActivity', label: 'Atividade Recente', description: 'Mostrar atividades recentes no dashboard' },
                      { key: 'autoRefresh', label: 'Atualização Automática', description: 'Atualizar dados automaticamente a cada 30 segundos' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{label}</div>
                          <div className="text-sm text-gray-500">{description}</div>
                        </div>
                        <button
                          onClick={() => setPreferences(prev => ({
                            ...prev,
                            dashboard: {
                              ...prev.dashboard,
                              [key]: !prev.dashboard[key as keyof typeof prev.dashboard],
                            },
                          }))}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            preferences.dashboard[key as keyof typeof preferences.dashboard]
                              ? 'bg-primary-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              preferences.dashboard[key as keyof typeof preferences.dashboard]
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Privacidade */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Privacidade</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'profileVisible', label: 'Perfil Público', description: 'Permitir que outros usuários vejam seu perfil' },
                      { key: 'activityVisible', label: 'Atividade Visível', description: 'Mostrar sua atividade para outros usuários' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{label}</div>
                          <div className="text-sm text-gray-500">{description}</div>
                        </div>
                        <button
                          onClick={() => setPreferences(prev => ({
                            ...prev,
                            privacy: {
                              ...prev.privacy,
                              [key]: !prev.privacy[key as keyof typeof prev.privacy],
                            },
                          }))}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            preferences.privacy[key as keyof typeof preferences.privacy]
                              ? 'bg-primary-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              preferences.privacy[key as keyof typeof preferences.privacy]
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Preferências'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}