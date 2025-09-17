'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  Upload,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { CreateUserData, USER_ROLES, USER_STATUSES } from '@/types/user'
import { UserService } from '@/lib/services/users'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  phone: string
  department: string
  position: string
  role: string
  status: string
  bio: string
  location: string
  timezone: string
  language: string
  is_active: boolean
  avatar_url: string
}

interface FormErrors {
  [key: string]: string
}

export default function NewUserPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    department: '',
    position: '',
    role: 'member',
    status: 'offline',
    bio: '',
    location: '',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    is_active: true,
    avatar_url: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres'
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem'
    }

    // Full Name
    if (!formData.full_name) {
      newErrors.full_name = 'Nome completo é obrigatório'
    }

    // Role
    if (!formData.role) {
      newErrors.role = 'Papel é obrigatório'
    }

    // Phone validation
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Telefone inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Arquivo muito grande. Máximo 5MB.')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas')
        return
      }
      
      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview('')
    setFormData(prev => ({ ...prev, avatar_url: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    setLoading(true)
    
    try {
      // Upload avatar if provided
      let avatarUrl = formData.avatar_url
      if (avatarFile) {
        // Here you would upload the file to your storage service
        // For now, we'll use the preview URL
        avatarUrl = avatarPreview
      }

      const userData: CreateUserData = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || undefined,
        department: formData.department || undefined,
        position: formData.position || undefined,
        role: formData.role as any,
        status: formData.status as any,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        timezone: formData.timezone,
        language: formData.language,
        is_active: formData.is_active,
        avatar_url: avatarUrl || undefined
      }

      const newUser = await UserService.createUser(userData)
      
      toast.success('Usuário criado com sucesso!')
      router.push(`/dashboard/users/${newUser.id}`)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      toast.error(error.message || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Usuário</h1>
          <p className="text-gray-600 mt-1">
            Crie um novo usuário no sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Dados principais do usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                      placeholder="usuario@exemplo.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className={errors.full_name ? 'border-red-500' : ''}
                      placeholder="Nome completo do usuário"
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-600">{errors.full_name}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={errors.password ? 'border-red-500' : ''}
                        placeholder="Mínimo 8 caracteres"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={errors.confirmPassword ? 'border-red-500' : ''}
                        placeholder="Confirme a senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                      placeholder="+55 11 99999-9999"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="São Paulo, SP"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informações Profissionais
                </CardTitle>
                <CardDescription>
                  Dados relacionados ao trabalho
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Tecnologia"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Desenvolvedor"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Papel no Sistema *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange('role', value)}
                    >
                      <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-sm text-red-600">{errors.role}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status Inicial</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Breve descrição sobre o usuário..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurações
                </CardTitle>
                <CardDescription>
                  Preferências e configurações do usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleInputChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleInputChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active">Usuário Ativo</Label>
                    <p className="text-sm text-gray-600">
                      Determina se o usuário pode fazer login no sistema
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Avatar e Ações */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Avatar</CardTitle>
                <CardDescription>
                  Foto do perfil do usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || formData.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {formData.full_name ? getUserInitials(formData.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 p-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Escolher Arquivo</span>
                      </div>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </Label>
                    
                    {(avatarPreview || formData.avatar_url) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeAvatar}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Máximo 5MB. Formatos: JPG, PNG, GIF
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Criando...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Criar Usuário
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}