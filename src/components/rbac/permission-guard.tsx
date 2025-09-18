'use client'

// Componente de Proteção por Permissões
// Controla a exibição de elementos baseado nas permissões do usuário

import React, { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Permission, UserRole } from '@/types/rbac'

interface PermissionGuardProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean // Para múltiplas permissões
}

export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null,
  requireAll = false 
}: PermissionGuardProps) {
  const { hasPermission } = useAuth()

  // Verifica se o usuário tem a permissão necessária
  const hasAccess = hasPermission(permission)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Componente para múltiplas permissões
interface MultiPermissionGuardProps {
  permissions: Permission[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean // true = AND, false = OR
}

export function MultiPermissionGuard({ 
  permissions, 
  children, 
  fallback = null,
  requireAll = false 
}: MultiPermissionGuardProps) {
  const { hasPermission } = useAuth()

  const hasAccess = requireAll
    ? permissions.every(permission => hasPermission(permission))
    : permissions.some(permission => hasPermission(permission))

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Componente para proteção baseada em roles
interface RoleGuardProps {
  roles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean
}

export function RoleGuard({
  roles,
  children,
  fallback = null,
  requireAll = false
}: RoleGuardProps) {
  const { hasRole } = useAuth()

  const hasAccess = requireAll
    ? roles.every(role => hasRole(role))
    : roles.some(role => hasRole(role))

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Hook para usar em componentes funcionais
export function usePermissionGuard(permission: Permission) {
  const { hasPermission } = useAuth()
  return hasPermission(permission)
}

// Hook para verificar múltiplas permissões
export function useMultiPermissionGuard(permissions: Permission[], requireAll = false) {
  const { hasPermission } = useAuth()
  
  return requireAll
    ? permissions.every(permission => hasPermission(permission))
    : permissions.some(permission => hasPermission(permission))
}

// Hook para verificar roles
export function useRoleGuard(roles: UserRole[], requireAll = false) {
  const { hasRole } = useAuth()
  
  return requireAll
    ? roles.every(role => hasRole(role))
    : roles.some(role => hasRole(role))
}

// Componente para proteger rotas inteiras
interface RouteGuardProps {
  permissions?: Permission[]
  roles?: UserRole[]
  children: ReactNode
  requireAll?: boolean
  fallback?: ReactNode
}

export function RouteGuard({ 
  permissions = [],
  roles = [],
  children, 
  requireAll = false,
  fallback 
}: RouteGuardProps) {
  const { hasPermission, hasRole, user, loading } = useAuth()

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redireciona se não estiver autenticado
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Verifica permissões
  let hasPermissionAccess = true
  if (permissions.length > 0) {
    hasPermissionAccess = requireAll
      ? permissions.every(permission => hasPermission(permission))
      : permissions.some(permission => hasPermission(permission))
  }

  // Verifica roles
  let hasRoleAccess = true
  if (roles.length > 0) {
    hasRoleAccess = requireAll
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role))
  }

  const hasAccess = hasPermissionAccess && hasRoleAccess

  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Componente para conteúdo baseado em role
interface RoleBasedContentProps {
  role: UserRole
  children: ReactNode
  fallback?: ReactNode
}

export function RoleBasedContent({ role, children, fallback = null }: RoleBasedContentProps) {
  const { hasRole } = useAuth()

  if (!hasRole(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// HOC para proteger componentes
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  permission: Permission,
  fallback?: ReactNode
) {
  return function ProtectedComponent(props: T) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

// HOC para proteger componentes com múltiplas permissões
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  permissions: Permission[],
  requireAll = false,
  fallback?: ReactNode
) {
  return function ProtectedComponent(props: T) {
    return (
      <MultiPermissionGuard 
        permissions={permissions} 
        requireAll={requireAll}
        fallback={fallback}
      >
        <Component {...props} />
      </MultiPermissionGuard>
    )
  }
}

// HOC para proteger componentes com roles
export function withRole<T extends object>(
  Component: React.ComponentType<T>,
  roles: UserRole[],
  requireAll = false,
  fallback?: ReactNode
) {
  return function ProtectedComponent(props: T) {
    return (
      <RoleGuard 
        roles={roles} 
        requireAll={requireAll}
        fallback={fallback}
      >
        <Component {...props} />
      </RoleGuard>
    )
  }
}