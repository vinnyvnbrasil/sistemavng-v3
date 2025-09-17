-- Script para criar apenas as tabelas teams e team_members
-- Execute este script primeiro no Supabase

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    color TEXT,
    department TEXT,
    manager_id UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros das equipes
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at na tabela teams
CREATE OR REPLACE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para as novas tabelas
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

SELECT 'Tabelas teams e team_members criadas com sucesso!' as message;