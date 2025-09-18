'use client'

// Hook de Autenticação com RBAC
// Gerencia estado do usuário autenticado e suas permissões

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { User, Permission } from '@/types/rbac'
import { rbacService } from '@/lib/services/rbac-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  hasRole: (role: string) => boolean
  isAdmin: boolean
  isLeader: boolean
  isOperator: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Carrega usuário inicial
  useEffect(() => {
    const getInitialUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const userData = await rbacService.getUserById(session.user.id)
          setUser(userData)
        }
      } catch (error) {
        console.error('Erro ao carregar usuário inicial:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = await rbacService.getUserById(session.user.id)
          setUser(userData)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }

      if (data.user) {
        const userData = await rbacService.getUserById(data.user.id)
        setUser(userData)
        
        // Log da ação
        await rbacService.logAction('user_login', 'auth', data.user.id)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro interno do servidor' }
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true)
      
      if (user) {
        await rbacService.logAction('user_logout', 'auth', user.id)
      }
      
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função de registro
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }

      if (data.user) {
        // Criar perfil do usuário
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role: 'operator', // Função padrão
            is_active: true
          })

        return { success: true }
      }

      return { success: false, error: 'Erro ao criar usuário' }
    } catch (error) {
      console.error('Erro no registro:', error)
      return { success: false, error: 'Erro interno do servidor' }
    } finally {
      setLoading(false)
    }
  }

  // Função de reset de senha
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  // Função de atualização de perfil
  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      setLoading(true)

      const updatedUser = await rbacService.updateUser(user.id, data)
      setUser(updatedUser)

      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      return { success: false, error: 'Erro interno do servidor' }
    } finally {
      setLoading(false)
    }
  }

  // Função para recarregar dados do usuário
  const refreshUser = async () => {
    try {
      if (!user) return

      const userData = await rbacService.getUserById(user.id)
      setUser(userData)
    } catch (error) {
      console.error('Erro ao recarregar usuário:', error)
    }
  }

  // Funções de verificação de permissões
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    return rbacService.checkPermission(user.id, permission) as any // Simplificado para uso síncrono
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false
    return rbacService.checkAnyPermission(user.id, permissions) as any // Simplificado para uso síncrono
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false
    return rbacService.checkAllPermissions(user.id, permissions) as any // Simplificado para uso síncrono
  }

  // Função para verificar role
  const hasRole = (role: string): boolean => {
    if (!user) return false
    return user.role === role
  }

  // Verificações de função
  const isAdmin = user?.role === 'admin'
  const isLeader = user?.role === 'leader' || isAdmin
  const isOperator = user?.role === 'operator' || isLeader

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isLeader,
    isOperator,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}

// Hook para verificar se está autenticado
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login'
    }
  }, [user, loading])
  
  return { user, loading }
}

// Hook para verificar permissões específicas
export function usePermission(permission: Permission) {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setHasAccess(false)
        return
      }

      try {
        const access = await rbacService.checkPermission(user.id, permission)
        setHasAccess(access)
      } catch (error) {
        console.error('Erro ao verificar permissão:', error)
        setHasAccess(false)
      }
    }

    checkPermission()
  }, [user, permission])

  return hasAccess
}

// Hook para verificar múltiplas permissões
export function usePermissions(permissions: Permission[], requireAll = false) {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setHasAccess(false)
        return
      }

      try {
        const access = requireAll
          ? await rbacService.checkAllPermissions(user.id, permissions)
          : await rbacService.checkAnyPermission(user.id, permissions)
        
        setHasAccess(access)
      } catch (error) {
        console.error('Erro ao verificar permissões:', error)
        setHasAccess(false)
      }
    }

    checkPermissions()
  }, [user, permissions, requireAll])

  return hasAccess
}

// Hook para verificar função
export function useRole(roles: string[]) {
  const { user } = useAuth()
  
  if (!user) return false
  return roles.includes(user.role)
}