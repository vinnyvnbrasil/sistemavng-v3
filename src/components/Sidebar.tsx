import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowsRightLeftIcon,
  TicketIcon,
  ShoppingCartIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Visão geral do sistema'
  },
  {
    name: 'Empresas',
    href: '/empresas',
    icon: BuildingOfficeIcon,
    description: 'Gestão multiempresa'
  },
  {
    name: 'Integração Bling',
    href: '/bling',
    icon: ArrowsRightLeftIcon,
    description: 'Configurações e sincronização'
  },
  {
    name: 'Documentos',
    href: '/documentos',
    icon: DocumentTextIcon,
    description: 'Gestão e organização de documentos'
  },
  {
    name: 'Tickets',
    href: '/tickets',
    icon: TicketIcon,
    description: 'Sistema de suporte e atendimento'
  },
  {
    name: 'Pedidos',
    href: '/pedidos',
    icon: ShoppingCartIcon,
    description: 'Sincronização de pedidos do Bling'
  },
  {
    name: 'Perfil',
    href: '/perfil',
    icon: UserCircleIcon,
    description: 'Configurações pessoais e preferências'
  },
  {
    name: 'Relatórios',
    href: '/reports',
    icon: CloudArrowUpIcon,
    description: 'Relatórios e análises'
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'Configurações do sistema'
  }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  // const location = useLocation();

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-xl border-r border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Menu de navegação principal"
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header da sidebar */}
          <div className="flex items-center justify-between h-12 px-3 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs">VNG</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-200">
                Sistema VNG
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Fechar menu de navegação"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const router = useRouter();
              const isActive = router.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    // Fechar sidebar no mobile após navegação
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={cn(
                    'group flex items-center px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 shadow-lg backdrop-blur-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100 backdrop-blur-sm'
                  )}
                  aria-label={`Navegar para ${item.name}: ${item.description}`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-xl" />
                  )}
                  <item.icon
                    className={cn(
                      'mr-3 h-4 w-4 flex-shrink-0 transition-all duration-200 relative z-10',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    )}
                  />
                  <div className="flex-1 relative z-10">
                    <div className="text-xs font-medium">{item.name}</div>
                    <div className={cn(
                      "text-xs mt-0.5 leading-tight transition-colors duration-200",
                      isActive
                        ? 'text-primary-600/70 dark:text-primary-400/70'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    )}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer da sidebar */}
          <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium">
              Sistema VNG v3.0.0
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
              © 2024 VNG Solutions
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}