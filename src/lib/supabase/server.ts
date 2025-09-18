import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Server-side Supabase client for Server Components
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Durante o build, as variáveis podem não estar disponíveis
    // Retornamos null para evitar erros de build
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      console.warn('Supabase environment variables not found during build')
      return null as any
    }
    
    throw new Error(
      '@supabase/ssr: A URL e a chave de API do seu projeto são necessárias para criar um cliente Supabase!\n' +
      'Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas.'
    )
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Server-side Supabase client for Route Handlers
export function createRouteHandlerClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Durante o build, as variáveis podem não estar disponíveis
    // Retornamos null para evitar erros de build
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      console.warn('Supabase environment variables not found during build')
      return null as any
    }
    
    throw new Error(
      '@supabase/ssr: A URL e a chave de API do seu projeto são necessárias para criar um cliente Supabase!\n' +
      'Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas.'
    )
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

// Server-side Supabase client for Middleware
export function createMiddlewareClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Durante o build, as variáveis podem não estar disponíveis
    // Retornamos null para evitar erros de build
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      console.warn('Supabase environment variables not found during build')
      return null as any
    }
    
    throw new Error(
      '@supabase/ssr: A URL e a chave de API do seu projeto são necessárias para criar um cliente Supabase!\n' +
      'Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas.'
    )
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({
              name,
              value,
              ...options,
            })
          })
        },
      },
    }
  )
}