'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Phone, Building, MapPin, Calendar, Shield, Key, Bell } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  company: string | null
  position: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    position: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Obter usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        window.location.href = '/auth/login'
        return
      }
      setUser(currentUser)

      // Buscar perfil
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', error)
        toast.error('Erro ao carregar perfil')
        return
      }

      if (profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          company: profileData.company || '',
          position: profileData.position || ''
        })
      } else {
        // Criar perfil se não existir
        const newProfile = {
          id: currentUser.id,
          email: currentUser.email!,
          full_name: currentUser.user_metadata?.full_name || null,
          phone: null,
          company: null,
          position: null,
          avatar_url: currentUser.user_metadata?.avatar_url || null
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single()

        if (createError) {
          console.error('Erro ao criar perfil:', createError)
          toast.error('Erro ao criar perfil')
        } else {
          setProfile(createdProfile)
          setFormData({
            full_name: createdProfile.full_name || '',
            phone: createdProfile.phone || '',
            company: createdProfile.company || '',
            position: createdProfile.position || ''
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          company: formData.company || null,
          position: formData.position || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao salvar perfil:', error)
        toast.error('Erro ao salvar perfil')
        return
      }

      toast.success('Perfil atualizado com sucesso!')
      await loadProfile() // Recarregar dados
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        console.error('Erro ao alterar senha:', error)
        toast.error('Erro ao alterar senha')
        return
      }

      toast.success('Senha alterada com sucesso!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-lg">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">
                    {profile?.full_name || 'Nome não informado'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <Badge variant="secondary">
                    Membro desde {new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              </div>

              <Separator />

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Seu cargo na empresa"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>
                Gerencie sua senha e configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Digite sua nova senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirme sua nova senha"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferências
              </CardTitle>
              <CardDescription>
                Configure suas preferências de notificação e interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  As configurações de preferências serão implementadas em uma próxima versão.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}