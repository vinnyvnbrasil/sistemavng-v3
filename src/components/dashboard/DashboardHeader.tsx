'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Search, Settings, User, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DashboardHeaderProps {
  user: any
  profile: any
}

const pathNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/companies': 'Empresas',
  '/dashboard/projects': 'Pedidos',
  '/dashboard/tasks': 'Suporte',
  '/dashboard/teams': 'Equipe',
  '/dashboard/activities': 'Atividades',
  '/dashboard/bling': 'Bling ERP',
  '/dashboard/profile': 'Perfil',
  '/dashboard/settings': 'Configurações',
}

export default function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U'
  }

  const generateBreadcrumbs = () => {
    if (!pathname) return []
    
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    let currentPath = ''
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      const name = pathNames[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ name, path: currentPath })
    }
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm">
          <Link 
            href="/dashboard" 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Início
          </Link>
          {breadcrumbs.length > 1 && breadcrumbs.slice(1).map((breadcrumb, index) => (
            <div key={breadcrumb.path} className="flex items-center space-x-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {index === breadcrumbs.length - 2 ? (
                <span className="text-gray-900 font-medium">
                  {breadcrumb.name}
                </span>
              ) : (
                <Link 
                  href={breadcrumb.path}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {breadcrumb.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Right side - Actions and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Search Button */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
              <span className="sr-only">Notificações</span>
            </span>
          </Button>

          {/* User Menu - Desktop */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-gray-500 font-normal">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saindo...' : 'Sair'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile User Avatar */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-gray-500 font-normal">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saindo...' : 'Sair'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}