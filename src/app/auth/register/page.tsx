'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Check, X, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PasswordRequirement {
  text: string
  met: boolean
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const passwordRequirements: PasswordRequirement[] = [
    { text: 'Pelo menos 8 caracteres', met: formData.password.length >= 8 },
    { text: 'Pelo menos uma letra maiúscula', met: /[A-Z]/.test(formData.password) },
    { text: 'Pelo menos uma letra minúscula', met: /[a-z]/.test(formData.password) },
    { text: 'Pelo menos um número', met: /\d/.test(formData.password) },
  ]

  const isPasswordValid = passwordRequirements.every(req => req.met)
  const doPasswordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ''

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.email || !formData.password || !formData.fullName || !formData.companyName) {
      setError('Todos os campos são obrigatórios')
      setLoading(false)
      return
    }

    if (!isPasswordValid) {
      setError('A senha não atende aos requisitos mínimos')
      setLoading(false)
      return
    }

    if (!doPasswordsMatch) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.user) {
        setSuccess(true)
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.')
      }
    } catch (error: any) {
      console.error('Erro no registro:', error)
      setError(error.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Erro no registro com Google:', error)
      setError('Erro ao registrar com Google. Tente novamente.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Conta criada com sucesso!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enviamos um email de confirmação para {formData.email}. 
                Verifique sua caixa de entrada e clique no link para ativar sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Ir para Login
                </Link>
              </Button>
              <div className="text-center">
                <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                  ← Voltar ao início
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Criar conta
            </CardTitle>
            <CardDescription className="text-gray-600">
              Comece a usar o Sistema VNG hoje mesmo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da empresa</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Nome da sua empresa"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Crie uma senha segura"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {formData.password && (
                    <div className="space-y-2 mt-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center text-sm">
                          {req.met ? (
                            <Check className="w-4 h-4 text-green-600 mr-2" />
                          ) : (
                            <X className="w-4 h-4 text-red-500 mr-2" />
                          )}
                          <span className={req.met ? 'text-green-600' : 'text-red-500'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {formData.confirmPassword && (
                    <div className="flex items-center text-sm mt-2">
                      {doPasswordsMatch ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-green-600">Senhas coincidem</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-red-500">Senhas não coincidem</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || !isPasswordValid || !doPasswordsMatch}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Ou continue com</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full h-11"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>

            <div className="text-center text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}