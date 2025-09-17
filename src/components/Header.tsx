import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export default function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Use isSidebarOpen to avoid unused parameter warning
  console.log('Sidebar is open:', isSidebarOpen);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30 transition-all duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-18">
        {/* Menu toggle e logo */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 lg:hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm"
            aria-label="Abrir menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
              <span className="text-white font-bold text-sm sm:text-base">VNG</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hidden sm:block tracking-tight">
              Sistema VNG
            </span>
          </div>
        </div>

        {/* Ações do usuário */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Toggle de tema */}
          <ThemeToggle />
          
          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 relative backdrop-blur-sm"
              aria-label="Notificações"
            >
              <BellIcon className="h-5 w-5" />
              {/* Badge de notificação */}
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                <span className="text-xs text-white font-bold">3</span>
              </span>
            </button>

            {/* Menu de notificações */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 border border-gray-200/50 dark:border-gray-700/50">
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    Notificações
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    Nenhuma notificação no momento
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Menu do usuário */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm"
              aria-label="Menu do usuário"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-white/20 shadow-lg">
                <span className="text-white text-sm sm:text-base font-bold">{user?.user_metadata?.full_name?.charAt(0) || 'U'}</span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || 'Usuário'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </div>
              </div>
              <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu dropdown do usuário */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 border border-gray-200/50 dark:border-gray-700/50">
                <div className="py-1">
                  <a
                    href="/profile"
                    className="flex items-center px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <UserCircleIcon className="h-3 w-3 mr-2" />
                    Meu Perfil
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Cog6ToothIcon className="h-3 w-3 mr-2" />
                    Configurações
                  </a>
                  <hr className="my-0.5 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-3 w-3 mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </header>
  );
}