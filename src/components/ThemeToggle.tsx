import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-xl
        bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
        border border-gray-200/50 dark:border-gray-700/50
        hover:bg-white/90 dark:hover:bg-gray-800/90
        transition-all duration-200
        shadow-lg hover:shadow-xl
        group
        ${className}
      `}
      title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      <div className="relative w-5 h-5">
        {/* Ícone do Sol */}
        <SunIcon 
          className={`
            absolute inset-0 w-5 h-5 text-yellow-500
            transition-all duration-300 transform
            ${theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-180 scale-75'
            }
          `}
        />
        
        {/* Ícone da Lua */}
        <MoonIcon 
          className={`
            absolute inset-0 w-5 h-5 text-blue-400
            transition-all duration-300 transform
            ${theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-180 scale-75'
            }
          `}
        />
      </div>
      
      {/* Efeito de brilho */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
};