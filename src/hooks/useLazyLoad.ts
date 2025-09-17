import { useState, useEffect, useRef } from 'react';

/**
 * Hook para lazy loading usando Intersection Observer
 * @param options - Opções do Intersection Observer
 * @returns [ref, isVisible, hasBeenVisible]
 */
export function useLazyLoad<T extends HTMLElement = HTMLElement>(options: IntersectionObserverInit = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);
        
        if (isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasBeenVisible, options]);

  return [ref, isVisible, hasBeenVisible] as const;
}

/**
 * Hook para preload de imagens
 * @param src - URL da imagem
 * @returns [isLoaded, error]
 */
export function useImagePreload(src: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setError(null);
    };
    
    img.onerror = () => {
      setError('Erro ao carregar imagem');
      setIsLoaded(false);
    };
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return [isLoaded, error] as const;
}

/**
 * Hook para virtual scrolling (otimização de listas grandes)
 * @param items - Array de itens
 * @param itemHeight - Altura de cada item
 * @param containerHeight - Altura do container
 * @returns Itens visíveis e propriedades de scroll
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
    item,
    index: startIndex + index
  }));
  
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
}