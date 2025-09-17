'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
// Alert component not available, using Card components instead;
import { Settings, Bell, Shield, Palette, Database, Users } from 'lucide-react';
// Using createClient instead of direct supabase import
import { createClient } from '@/lib/supabase/client';

interface UserSettings {
  id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  two_factor_enabled: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const supabaseClient = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      setUser(user);
      if (user) {
        loadSettings();
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabaseClient
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings({
          id: data.id,
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          theme: data.theme ?? 'system',
          language: data.language ?? 'pt-BR',
          timezone: data.timezone ?? 'America/Sao_Paulo',
          two_factor_enabled: data.two_factor_enabled ?? false
        });
      } else {
        // Criar configurações padrão
        const defaultSettings = {
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          theme: 'system',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          two_factor_enabled: false
        };

        const { data: newSettings, error: createError } = await supabaseClient
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar configurações:', createError);
        } else {
          setSettings({
            id: newSettings.id,
            ...defaultSettings
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !user) return;

    setSaving(true);
    try {
      const { error } = await supabaseClient
        .from('user_settings')
        .update({
          email_notifications: settings.email_notifications,
          push_notifications: settings.push_notifications,
          theme: settings.theme,
          language: settings.language,
          timezone: settings.timezone,
          two_factor_enabled: settings.two_factor_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) {
        throw error;
      }

      setMessage('Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage('Erro ao salvar configurações.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      {message && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <p className="text-green-800 text-sm">
              {message}
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizações importantes por email
                  </p>
                </div>
                <Switch
                  checked={settings?.email_notifications ?? false}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações em tempo real no navegador
                  </p>
                </div>
                <Switch
                  checked={settings?.push_notifications ?? false}
                  onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência e Idioma</CardTitle>
              <CardDescription>
                Personalize a aparência e o idioma da interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <select
                  id="theme"
                  className="w-full p-2 border rounded-md"
                  value={settings?.theme ?? 'system'}
                  onChange={(e) => updateSetting('theme', e.target.value)}
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <select
                  id="language"
                  className="w-full p-2 border rounded-md"
                  value={settings?.language ?? 'pt-BR'}
                  onChange={(e) => updateSetting('language', e.target.value)}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <select
                  id="timezone"
                  className="w-full p-2 border rounded-md"
                  value={settings?.timezone ?? 'America/Sao_Paulo'}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                >
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Gerencie suas configurações de segurança e privacidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma camada extra de segurança à sua conta
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {settings?.two_factor_enabled && (
                    <Badge variant="secondary">Ativo</Badge>
                  )}
                  <Switch
                    checked={settings?.two_factor_enabled ?? false}
                    onCheckedChange={(checked) => updateSetting('two_factor_enabled', checked)}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Alterar Senha
                </Button>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Gerenciar Sessões Ativas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Informações e configurações avançadas do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Versão do Sistema</Label>
                  <p className="text-sm text-muted-foreground">v3.0.0</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Última Atualização</Label>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Exportar Dados
                </Button>
              </div>
              <div className="space-y-2">
                <Button variant="destructive" className="w-full">
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}