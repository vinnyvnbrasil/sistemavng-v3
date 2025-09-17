import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se o usuário está logado, redireciona para o dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Sistema VNG
            <span className="text-blue-600"> v3</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
            Gestão empresarial moderna, intuitiva e totalmente automatizada
          </p>
        </div>

        {/* Features Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-600">🚀 Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Construído com Next.js 14 para máxima velocidade e eficiência
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-600">🔒 Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Autenticação robusta e proteção de dados com Supabase
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-purple-600">📱 Responsivo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Interface moderna que funciona perfeitamente em qualquer dispositivo
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button asChild size="lg" className="text-lg px-8 py-3">
            <Link href="/auth/login">
              Fazer Login
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
            <Link href="/auth/register">
              Criar Conta
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-gray-500">
          <p>© 2024 Sistema VNG v3. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
