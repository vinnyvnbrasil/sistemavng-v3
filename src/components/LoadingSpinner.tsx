import { cn } from '../utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export default function LoadingSpinner({ 
  size = 'md', 
  className, 
  text 
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <div 
        className={cn(
          'loading-spinner',
          sizeClasses[size]
        )}
        role="status"
        aria-label={text || 'Carregando'}
      />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {text}
        </p>
      )}
    </div>
  );
}

// Componente de loading para páginas inteiras
export function PageLoading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

// Componente de loading para cards/seções
export function SectionLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Componente de loading inline
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {text}
        </span>
      )}
    </div>
  );
}