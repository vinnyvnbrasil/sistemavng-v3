import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '@supabase/ssr: A URL e a chave de API do seu projeto são necessárias para criar um cliente Supabase!\n' +
      'Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance for client-side usage
export const supabase = createClient()