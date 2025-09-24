// Script para criar a tabela bling_configs no Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'Não configurada')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Configurada' : 'Não configurada')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBlingConfigsTable() {
  try {
    console.log('🚀 Iniciando criação da tabela bling_configs...')
    
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'create-bling-configs-table.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error)
      
      // Tentar executar diretamente via query
      console.log('🔄 Tentando executar SQL diretamente...')
      
      const { data: directData, error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'bling_configs')
      
      if (directError) {
        console.error('❌ Erro ao verificar tabela:', directError)
      } else {
        console.log('📋 Tabelas existentes:', directData)
      }
      
      // Executar SQL linha por linha
      const sqlLines = sqlContent.split(';').filter(line => line.trim())
      
      for (const line of sqlLines) {
        if (line.trim()) {
          try {
            console.log('🔧 Executando:', line.substring(0, 50) + '...')
            const { error: lineError } = await supabase.rpc('exec_sql', { sql: line + ';' })
            if (lineError) {
              console.warn('⚠️ Aviso na linha:', lineError.message)
            }
          } catch (lineErr) {
            console.warn('⚠️ Erro na linha:', lineErr.message)
          }
        }
      }
    } else {
      console.log('✅ SQL executado com sucesso!')
    }
    
    // Verificar se a tabela foi criada
    const { data: tableCheck, error: checkError } = await supabase
      .from('bling_configs')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Erro ao verificar tabela bling_configs:', checkError)
      
      // Tentar criar a tabela manualmente
      console.log('🔧 Tentando criar tabela manualmente...')
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS bling_configs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          client_id TEXT NOT NULL,
          client_secret TEXT NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          webhook_url TEXT,
          webhook_events TEXT[] DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'error')),
          last_sync_at TIMESTAMP WITH TIME ZONE,
          sync_errors TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(company_id)
        );
        
        ALTER TABLE bling_configs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view bling configs of their company" ON bling_configs
          FOR SELECT USING (
            company_id IN (
              SELECT company_id FROM profiles WHERE id = auth.uid()
            )
          );
        
        CREATE POLICY "Admins can manage bling configs" ON bling_configs
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() 
              AND role IN ('admin', 'manager')
              AND company_id = bling_configs.company_id
            )
          );
      `
      
      const { error: manualError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      
      if (manualError) {
        console.error('❌ Erro ao criar tabela manualmente:', manualError)
      } else {
        console.log('✅ Tabela criada manualmente com sucesso!')
      }
    } else {
      console.log('✅ Tabela bling_configs criada e acessível!')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar o script
createBlingConfigsTable()
  .then(() => {
    console.log('🎉 Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })