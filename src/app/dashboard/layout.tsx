import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/dashboard/DashboardNav'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <DashboardNav user={user} profile={profile} />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <DashboardHeader user={user} profile={profile} />
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}