import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Fechar sidebar automaticamente no desktop
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Overlay para mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Conteúdo principal */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header onMenuToggle={() => setIsSidebarOpen(true)} isSidebarOpen={isSidebarOpen} />
        
        {/* Main content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 pt-4 sm:pt-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="space-y-4 sm:space-y-6">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 px-3 py-4 sm:px-4 lg:px-6 mt-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-2 sm:gap-0">
              <div className="font-medium">
                © 2024 Sistema VNG. Todos os direitos reservados.
              </div>
              <div className="flex space-x-3 sm:space-x-4">
                <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 font-medium">
                  Suporte
                </a>
                <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 font-medium">
                  Documentação
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}