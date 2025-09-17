import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores, útil para otimizar pesquisas e chamadas de API
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de callbacks, útil para otimizar eventos de scroll, resize, etc.
 * @param callback - Função a ser executada
 * @param delay - Delay em milissegundos
 * @param deps - Dependências do callback
 * @returns Função debounced
 */
export function useDebouncedCallback<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = (...args: T) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}