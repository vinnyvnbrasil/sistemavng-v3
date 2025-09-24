// Script para criar usuário administrador no Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  console.log('Certifique-se de ter configurado:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Dados do usuário admin
const adminData = {
  email: 'vinnyvnbrasil@gmail.com',
  password: 'Admin123!@#',
  full_name: 'Administrador Sistema VNG',
  role: 'admin'
}

async function createAdminUser() {
  try {
    console.log('🚀 Iniciando criação do usuário administrador...')
    console.log(`📧 Email: ${adminData.email}`)
    
    // 1. Criar usuário no auth
    console.log('\n1️⃣ Criando usuário na autenticação...')
    let authData
    const { data: authResponse, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: {
        full_name: adminData.full_name,
        role: adminData.role
      }
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('⚠️  Usuário já existe na autenticação, buscando dados...')
        
        // Buscar usuário existente
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const existingUser = existingUsers.users.find(u => u.email === adminData.email)
        
        if (!existingUser) {
          throw new Error('Usuário não encontrado após verificação')
        }
        
        // Simular estrutura de resposta
        authData = { user: existingUser }
        console.log('✅ Usuário encontrado na autenticação!')
      } else {
        throw authError
      }
    } else {
      authData = authResponse
      console.log('✅ Usuário criado na autenticação com sucesso!')
    }

    const userId = authData.user.id
    console.log(`🆔 User ID: ${userId}`)

    // 2. Verificar se já existe perfil
    console.log('\n2️⃣ Verificando perfil existente...')
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('⚠️  Perfil já existe, atualizando...')
      
      // Atualizar perfil existente
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: 'Administrador',
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError)
        return
      }
      console.log('✅ Perfil atualizado com sucesso!')
    } else {
      // Criar novo perfil
      console.log('\n3️⃣ Criando perfil do usuário...')
      const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: adminEmail,
            full_name: 'Administrador',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError)
        return
      }
      console.log('✅ Perfil criado com sucesso!')
    }

    // 4. Verificar se precisa criar empresa padrão
    console.log('\n4️⃣ Verificando empresa padrão...')
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .limit(1)

    let companyId
    if (!companies || companies.length === 0) {
      console.log('📢 Criando empresa padrão...')
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'Sistema VNG',
          created_by: userId
        })
        .select()
        .single()

      if (companyError) {
        console.error('❌ Erro ao criar empresa:', companyError)
        return
      }

      companyId = newCompany.id
      console.log('✅ Empresa criada com sucesso!')
      console.log('🏢 Company ID:', companyId)
    } else {
      companyId = companies[0].id
      console.log('✅ Empresa padrão já existe!')
    }

    // 5. Finalizar
    console.log('\n✅ Usuário administrador configurado com sucesso!')
    console.log('📧 Email:', adminData.email)
    console.log('🆔 User ID:', userId)
    console.log('🏢 Company ID:', companyId)
    console.log('\n🎉 Agora você pode fazer login no sistema com as credenciais:')
    console.log('📧 Email: vinnyvnbrasil@gmail.com')
    console.log('🔑 Senha: (use a senha que você definiu)')
    console.log('\n💡 Dica: Acesse o painel administrativo para gerenciar o sistema!')

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário administrador:')
    console.error(error.message || error)
    
    if (error.details) {
      console.error('Detalhes:', error.details)
    }
    
    if (error.hint) {
      console.error('Dica:', error.hint)
    }
    
    process.exit(1)
  }
}

// Executar script
createAdminUser()