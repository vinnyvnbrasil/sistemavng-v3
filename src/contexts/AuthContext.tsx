import React, { createContext, useEffect, useState } from 'react';
import type { User } from '../types/index.js';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { UserRole } from '../types/auth';

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ error?: string }>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Login de demonstração para admin
      if (email === 'admin@sistemavng.com' && password === 'admin123') {
        const mockUser = {
          id: 'demo-admin-id',
          email: 'admin@sistemavng.com',
          user_metadata: {
            name: 'Administrador',
            avatar_url: null,
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as SupabaseUser;
        
        setUser(mockUser);
        setLoading(false);
        return {};
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
      
      return {};
    } catch {
      return { error: 'Erro inesperado ao fazer login' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
      
      return {};
    } catch {
      return { error: 'Erro inesperado ao criar conta' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
      
      return {};
    } catch {
      return { error: 'Erro inesperado ao redefinir senha' };
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) {
        return { error: 'Usuário não autenticado' };
      }

      const { error } = await supabase.auth.updateUser({
        data: data,
      });
      
      if (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
      
      return {};
    } catch {
      return { error: 'Erro inesperado ao atualizar perfil' };
    }
  };

  // Mock role and permission checking for demo purposes
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    
    // For demo admin user, grant admin role
    if (user.email === 'admin@sistemavng.com') {
      return role === UserRole.ADMIN;
    }
    
    // Default to USER role for other authenticated users
    return role === UserRole.USER;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // For demo admin user, grant all permissions
    if (user.email === 'admin@sistemavng.com') {
      return true;
    }
    
    // Default permissions for regular users
    const userPermissions = ['read', 'view'];
    return userPermissions.includes(permission);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;