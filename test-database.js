// Script para testar a conexão e funcionalidades do banco de dados
// Execute com: node test-database.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  console.log('Certifique-se de que o arquivo .env.local existe e contém:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Função para testar conexão básica
async function testConnection() {
  console.log('🔄 Testando conexão com Supabase...')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    console.log('✅ Conexão estabelecida com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
    return false
  }
}

// Função para testar estrutura das tabelas
async function testTableStructure() {
  console.log('\n🔄 Testando estrutura das tabelas...')
  
  const tables = ['profiles', 'companies', 'projects', 'tasks', 'activities', 'teams', 'team_members']
  const results = []
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        results.push({ table, status: 'error', message: error.message })
      } else {
        results.push({ table, status: 'success', hasData: data && data.length > 0 })
      }
    } catch (err) {
      results.push({ table, status: 'error', message: err.message })
    }
  }
  
  console.log('📊 Resultados:')
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌'
    const dataInfo = result.hasData ? ' (com dados)' : ' (vazia)'
    console.log(`${icon} ${result.table}${result.status === 'success' ? dataInfo : ': ' + result.message}`)
  })
  
  return results
}

// Função para testar autenticação
async function testAuth() {
  console.log('\n🔄 Testando sistema de autenticação...')
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('ℹ️ Nenhum usuário logado (normal para primeiro acesso)')
      return { authenticated: false }
    }
    
    if (user) {
      console.log('✅ Usuário autenticado:', user.email)
      return { authenticated: true, user }
    }
    
    console.log('ℹ️ Nenhum usuário logado')
    return { authenticated: false }
  } catch (error) {
    console.error('❌ Erro no teste de autenticação:', error.message)
    return { authenticated: false, error }
  }
}

// Função para verificar dados de exemplo
async function checkSampleData() {
  console.log('\n🔄 Verificando dados de exemplo...')
  
  try {
    // Verificar empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5)
    
    if (companiesError) {
      console.log('⚠️ Erro ao buscar empresas:', companiesError.message)
    } else {
      console.log(`📊 Empresas encontradas: ${companies?.length || 0}`)
      if (companies && companies.length > 0) {
        companies.forEach(company => {
          console.log(`   - ${company.name} (${company.id})`)
        })
      }
    }
    
    // Verificar projetos
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, status')
      .limit(5)
    
    if (projectsError) {
      console.log('⚠️ Erro ao buscar projetos:', projectsError.message)
    } else {
      console.log(`📊 Projetos encontrados: ${projects?.length || 0}`)
      if (projects && projects.length > 0) {
        projects.forEach(project => {
          console.log(`   - ${project.name} (${project.status})`)
        })
      }
    }
    
    return { companies: companies?.length || 0, projects: projects?.length || 0 }
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message)
    return { companies: 0, projects: 0 }
  }
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes do banco de dados Sistema VNG v3\n')
  console.log('=' .repeat(50))
  
  const results = {
    connection: await testConnection(),
    tables: await testTableStructure(),
    auth: await testAuth(),
    sampleData: await checkSampleData()
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📋 RESUMO DOS TESTES:')
  console.log('=' .repeat(50))
  
  console.log('🔗 Conexão:', results.connection ? '✅ OK' : '❌ FALHOU')
  
  const successfulTables = results.tables.filter(t => t.status === 'success').length
  console.log(`🗄️ Tabelas: ${successfulTables}/${results.tables.length} OK`)
  
  console.log('🔐 Autenticação:', results.auth.authenticated ? '✅ Logado' : 'ℹ️ Não logado')
  
  console.log(`📊 Dados: ${results.sampleData.companies} empresas, ${results.sampleData.projects} projetos`)
  
  console.log('\n🎯 PRÓXIMOS PASSOS:')
  if (!results.connection) {
    console.log('1. ❗ Corrigir configuração do Supabase')
    console.log('2. ❗ Verificar variáveis de ambiente')
  } else if (successfulTables < results.tables.length) {
    console.log('1. ❗ Executar script SQL no Supabase')
    console.log('2. ❗ Verificar políticas RLS')
  } else if (results.sampleData.companies === 0) {
    console.log('1. ✅ Banco configurado corretamente!')
    console.log('2. 🔄 Executar dados de exemplo (opcional)')
    console.log('3. 🚀 Começar desenvolvimento das funcionalidades')
  } else {
    console.log('1. ✅ Tudo funcionando perfeitamente!')
    console.log('2. 🚀 Pronto para desenvolvimento')
  }
  
  console.log('\n🏁 Testes concluídos!')
  return results
}

// Executar testes
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { runTests, testConnection, testTableStructure, testAuth, checkSampleData }