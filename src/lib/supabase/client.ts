import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Durante o build, as variáveis podem não estar disponíveis
    // Retornamos valores padrão para evitar erros de build
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn('Supabase environment variables not found during build')
      return null as any
    }
    
    throw new Error(
      '@supabase/ssr: A URL e a chave de API do seu projeto são necessárias para criar um cliente Supabase!\n' +
      'Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Lazy initialization para evitar erros durante o build
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }
  return supabaseInstance
}

// Export a singleton instance for client-side usage (com lazy loading)
export const supabase = typeof window !== 'undefined' ? createClient() : null