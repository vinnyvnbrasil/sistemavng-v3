'use client'

// Componente de Seleção de Roles
// Interface visual para selecionar e alterar roles de usuários

import React from 'react'
import { Check, Shield, Users, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserRole, ROLE_DEFINITIONS, RoleDefinition } from '@/types/rbac'

interface RoleSelectorProps {
  value: UserRole
  onChange: (role: UserRole) => void
  disabled?: boolean
  showDescription?: boolean
  variant?: 'select' | 'cards'
  allowedRoles?: UserRole[]
}

export function RoleSelector({
  value,
  onChange,
  disabled = false,
  showDescription = false,
  variant = 'select',
  allowedRoles
}: RoleSelectorProps) {
  const availableRoles = allowedRoles || Object.keys(ROLE_DEFINITIONS) as UserRole[]

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'leader':
        return <Users className="h-4 w-4" />
      case 'operator':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'leader':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'operator':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availableRoles.map((role) => {
          const roleDefinition = ROLE_DEFINITIONS[role]
          const isSelected = value === role

          return (
            <Card
              key={role}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onChange(role)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(role)}
                    <CardTitle className="text-lg">{roleDefinition.name}</CardTitle>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <CardDescription>{roleDefinition.description}</CardDescription>
              </CardHeader>
              {showDescription && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Permissões:</p>
                    <div className="flex flex-wrap gap-1">
                      {roleDefinition.permissions.slice(0, 3).map((permission) => (
                        <Badge
                          key={permission}
                          variant="secondary"
                          className="text-xs"
                        >
                          {permission.split(':')[1]}
                        </Badge>
                      ))}
                      {roleDefinition.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{roleDefinition.permissions.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione um role">
          {value && (
            <div className="flex items-center gap-2">
              {getRoleIcon(value)}
              <span>{ROLE_DEFINITIONS[value].name}</span>
              <Badge className={getRoleColor(value)}>
                {ROLE_DEFINITIONS[value].role}
              </Badge>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => {
          const roleDefinition = ROLE_DEFINITIONS[role]
          return (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2 w-full">
                {getRoleIcon(role)}
                <div className="flex-1">
                  <div className="font-medium">{roleDefinition.name}</div>
                  {showDescription && (
                    <div className="text-sm text-gray-500">
                      {roleDefinition.description}
                    </div>
                  )}
                </div>
                <Badge className={getRoleColor(role)}>
                  {role}
                </Badge>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

// Componente para exibir role atual
interface RoleDisplayProps {
  role: UserRole
  showPermissions?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RoleDisplay({ role, showPermissions = false, size = 'md' }: RoleDisplayProps) {
  const roleDefinition = ROLE_DEFINITIONS[role]
  
  const getRoleIcon = (role: UserRole) => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    
    switch (role) {
      case 'admin':
        return <Shield className={iconSize} />
      case 'leader':
        return <Users className={iconSize} />
      case 'operator':
        return <User className={iconSize} />
      default:
        return <User className={iconSize} />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'leader':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'operator':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {getRoleIcon(role)}
        <span className={`font-medium ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>
          {roleDefinition.name}
        </span>
        <Badge className={getRoleColor(role)}>
          {role}
        </Badge>
      </div>
      
      {showPermissions && (
        <div className="space-y-2">
          <p className={`font-medium text-gray-700 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            Permissões ({roleDefinition.permissions.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {roleDefinition.permissions.map((permission) => (
              <Badge
                key={permission}
                variant="outline"
                className={`${size === 'sm' ? 'text-xs px-1 py-0' : 'text-xs'}`}
              >
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para comparar roles
interface RoleComparisonProps {
  roles: UserRole[]
}

export function RoleComparison({ roles }: RoleComparisonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {roles.map((role) => {
        const roleDefinition = ROLE_DEFINITIONS[role]
        
        return (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {role === 'admin' && <Shield className="h-5 w-5 text-red-600" />}
                {role === 'leader' && <Users className="h-5 w-5 text-blue-600" />}
                {role === 'operator' && <User className="h-5 w-5 text-green-600" />}
                {roleDefinition.name}
              </CardTitle>
              <CardDescription>{roleDefinition.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Permissões ({roleDefinition.permissions.length}):
                  </p>
                  <div className="space-y-1">
                    {roleDefinition.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2 text-sm">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}