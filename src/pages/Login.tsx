import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail } from '../utils';

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirecionar se já estiver logado
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        setErrors({ general: error });
      }
    } catch {
      setErrors({ general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Glass card container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg transform transition-transform duration-300 hover:scale-105">
              <span className="text-white font-bold text-2xl">VNG</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Bem-vindo de volta
            </h2>
            <p className="mt-3 text-center text-sm text-gray-600">
              Ou{' '}
              <Link
                to="/register"
                className="font-semibold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                crie uma nova conta
              </Link>
            </p>
          </div>
        
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="text-sm text-red-700 font-medium">{errors.general}</div>
              </div>
            )}
            
            <div className="space-y-5">
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white/80 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 group-hover:border-gray-300'
                    }`}
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 font-medium animate-in slide-in-from-top-1 duration-200">{errors.email}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 bg-white/50 backdrop-blur-sm border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white/80 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 group-hover:border-gray-300'
                    }`}
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 font-medium animate-in slide-in-from-top-1 duration-200">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Entrando...
                  </div>
                ) : (
                  <span className="flex items-center">
                    Entrar
                    <svg className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}