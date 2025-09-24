// Script para criar a tabela profiles no Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfilesTable() {
  try {
    console.log('🔧 Criando tabela profiles...');
    
    // Primeiro, vamos tentar criar a tabela usando SQL direto
    const createProfilesSQL = `
-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    company TEXT,
    position TEXT,
    role TEXT DEFAULT 'user',
    company_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

    console.log('📝 Executando SQL...');
    console.log('⚠️  IMPORTANTE: Execute o seguinte SQL no painel do Supabase (SQL Editor):');
    console.log('=====================================');
    console.log(createProfilesSQL);
    console.log('=====================================');
    
    // Tentar verificar se a tabela já existe
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (testError) {
      if (testError.code === '42P01') {
        console.log('❌ Tabela profiles não existe. Execute o SQL acima no painel do Supabase.');
      } else {
        console.error('❌ Erro ao testar tabela profiles:', testError);
      }
    } else {
      console.log('✅ Tabela profiles já existe e está funcionando!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createProfilesTable();