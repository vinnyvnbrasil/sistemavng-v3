// Script para criar as tabelas teams e team_members no Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// SQL para criar as tabelas
const createTablesSQL = `
-- Criar tabela teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela team_members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- Habilitar RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_teams_updated_at();

-- Políticas RLS para teams
CREATE POLICY "Users can view company teams" ON teams
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage teams" ON teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
            AND company_id = teams.company_id
        )
    );

-- Políticas RLS para team_members
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (
        team_id IN (
            SELECT t.id FROM teams t
            JOIN profiles p ON p.company_id = t.company_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage team members" ON team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN teams t ON t.company_id = p.company_id
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'manager')
            AND t.id = team_members.team_id
        )
    );

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
`

async function createTables() {
  console.log('🚀 Criando tabelas teams e team_members...')
  
  // Primeiro, vamos verificar se as tabelas já existem
  try {
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('count')
      .limit(1)
    
    if (!teamsError) {
      console.log('ℹ️ Tabela teams já existe')
      return true
    }
    
    // Se chegou aqui, a tabela não existe, vamos tentar criar via SQL direto
    console.log('📝 Executando SQL para criar tabelas...')
    
    // Como não podemos executar SQL diretamente, vamos usar uma abordagem alternativa
    // Vamos tentar criar dados de exemplo para forçar a criação das tabelas
    console.log('⚠️ Não é possível criar tabelas via API. As tabelas devem ser criadas no painel do Supabase.')
    console.log('📋 SQL necessário:')
    console.log(createTablesSQL)
    
    return false
  } catch (error) {
    console.error('❌ Erro:', error.message)
    return false
  }
}

async function main() {
  console.log('🔄 Iniciando criação das tabelas...')
  
  const success = await createTables()
  
  if (success) {
    console.log('🎉 Processo concluído com sucesso!')
  } else {
    console.log('❌ Falha na criação das tabelas')
    process.exit(1)
  }
}

main()