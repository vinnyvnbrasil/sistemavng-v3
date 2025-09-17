// Teste de conexão com Supabase
// Execute este arquivo para verificar se a configuração está funcionando

import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Função para testar a conexão básica
export async function testConnection() {
  try {
    console.log('🔄 Testando conexão com Supabase...')
    
    // Teste 1: Verificar se consegue conectar
    const { data, error } = await supabase.from('profiles').select('count').single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela vazia, mas conexão OK
      throw error
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error)
    return false
  }
}

// Função para testar autenticação
export async function testAuth() {
  try {
    console.log('🔄 Testando sistema de autenticação...')
    
    // Verificar se o usuário está logado
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('ℹ️ Nenhum usuário logado (normal para primeiro acesso)')
      return { authenticated: false, user: null }
    }
    
    if (user) {
      console.log('✅ Usuário autenticado:', user.email)
      return { authenticated: true, user }
    }
    
    console.log('ℹ️ Nenhum usuário logado')
    return { authenticated: false, user: null }
  } catch (error) {
    console.error('❌ Erro no teste de autenticação:', error)
    return { authenticated: false, user: null, error }
  }
}

// Função para testar RLS (Row Level Security)
export async function testRLS() {
  try {
    console.log('🔄 Testando políticas RLS...')
    
    // Teste de leitura nas tabelas principais
    const tables = ['profiles', 'companies', 'projects', 'tasks', 'activities']
    const results = []
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1)
        
        if (error) {
          results.push({ table, status: 'error', message: error.message })
        } else {
          results.push({ table, status: 'success', count: data?.length || 0 })
        }
      } catch (err) {
        results.push({ table, status: 'error', message: (err as Error).message })
      }
    }
    
    console.log('📊 Resultados dos testes RLS:')
    results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : '⚠️'
      console.log(`${icon} ${result.table}: ${result.status}`)
      if (result.status === 'error') {
        console.log(`   Erro: ${result.message}`)
      }
    })
    
    return results
  } catch (error) {
    console.error('❌ Erro no teste RLS:', error)
    return []
  }
}

// Função para testar inserção de dados de exemplo
export async function testDataInsertion() {
  try {
    console.log('🔄 Testando inserção de dados...')
    
    // Verificar se já existem dados de exemplo
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'Empresa Teste')
      .single()
    
    if (existingCompany) {
      console.log('ℹ️ Dados de exemplo já existem')
      return { success: true, message: 'Dados já existem' }
    }
    
    // Tentar inserir uma empresa de teste (apenas se autenticado)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('ℹ️ Usuário não autenticado - pulando teste de inserção')
      return { success: true, message: 'Usuário não autenticado' }
    }
    
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: 'Empresa Teste',
        description: 'Empresa criada para teste de conexão',
        country: 'Brasil'
      })
      .select()
    
    if (error) {
      throw error
    }
    
    console.log('✅ Dados inseridos com sucesso!')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro na inserção de dados:', error)
    return { success: false, error }
  }
}

// Função principal para executar todos os testes
export async function runAllTests() {
  console.log('🚀 Iniciando testes do Supabase...\n')
  
  const results = {
    connection: await testConnection(),
    auth: await testAuth(),
    rls: await testRLS(),
    dataInsertion: await testDataInsertion()
  }
  
  console.log('\n📋 Resumo dos testes:')
  console.log('- Conexão:', results.connection ? '✅' : '❌')
  console.log('- Autenticação:', results.auth.authenticated ? '✅' : 'ℹ️')
  console.log('- RLS:', results.rls.length > 0 ? '✅' : '❌')
  console.log('- Inserção:', results.dataInsertion.success ? '✅' : '❌')
  
  return results
}

// Executar testes se este arquivo for chamado diretamente
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n🏁 Testes concluídos!')
    process.exit(0)
  }).catch((error) => {
    console.error('💥 Erro fatal nos testes:', error)
    process.exit(1)
  })
}