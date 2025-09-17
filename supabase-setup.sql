-- Sistema VNG v3 - Configuração do Banco de Dados
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Brasil',
    postal_code TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Tabela de atividades/logs
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('project_created', 'task_created', 'task_updated', 'task_completed', 'user_joined', 'comment_added')),
    title TEXT NOT NULL,
    description TEXT,
    entity_type TEXT CHECK (entity_type IN ('project', 'task', 'user', 'company')),
    entity_id UUID,
    user_id UUID REFERENCES profiles(id),
    company_id UUID REFERENCES companies(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar foreign keys após criação de todas as tabelas
ALTER TABLE companies 
ADD CONSTRAINT fk_companies_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, company_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view profiles in same company" ON profiles;
CREATE POLICY "Users can view profiles in same company" ON profiles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Políticas RLS para companies
DROP POLICY IF EXISTS "Users can view own company" ON companies;
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage companies" ON companies;
CREATE POLICY "Admins can manage companies" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
            AND company_id = companies.id
        )
    );

-- Políticas RLS para projects
DROP POLICY IF EXISTS "Users can view company projects" ON projects;
CREATE POLICY "Users can view company projects" ON projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Managers can manage projects" ON projects;
CREATE POLICY "Managers can manage projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
            AND company_id = projects.company_id
        )
    );

-- Políticas RLS para tasks
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
CREATE POLICY "Users can view tasks" ON tasks
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN profiles pf ON p.company_id = pf.company_id
            WHERE pf.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;
CREATE POLICY "Users can update assigned tasks" ON tasks
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "Managers can manage tasks" ON tasks;
CREATE POLICY "Managers can manage tasks" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN projects pj ON pj.company_id = p.company_id
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'manager')
            AND pj.id = tasks.project_id
        )
    );

-- Políticas RLS para activities
DROP POLICY IF EXISTS "Users can view company activities" ON activities;
CREATE POLICY "Users can view company activities" ON activities
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create activities" ON activities;
CREATE POLICY "Users can create activities" ON activities
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Políticas RLS para teams
DROP POLICY IF EXISTS "Users can view company teams" ON teams;
CREATE POLICY "Users can view company teams" ON teams
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Managers can manage teams" ON teams;
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
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM teams 
            WHERE company_id IN (
                SELECT company_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Managers can manage team members" ON team_members;
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

-- Inserir dados de exemplo (opcional)
INSERT INTO companies (id, name, description) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Empresa Demo', 'Empresa de demonstração do sistema')
ON CONFLICT (id) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Comentários nas tabelas
COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema';
COMMENT ON TABLE companies IS 'Empresas cadastradas no sistema';
COMMENT ON TABLE projects IS 'Projetos das empresas';
COMMENT ON TABLE tasks IS 'Tarefas dos projetos';
COMMENT ON TABLE activities IS 'Log de atividades do sistema';
COMMENT ON TABLE teams IS 'Equipes das empresas';
COMMENT ON TABLE team_members IS 'Membros das equipes';

COMMENT ON COLUMN profiles.role IS 'Papel do usuário: admin, manager, user';
COMMENT ON COLUMN projects.status IS 'Status do projeto: active, completed, paused, cancelled';
COMMENT ON COLUMN tasks.status IS 'Status da tarefa: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN activities.type IS 'Tipo de atividade para categorização';

-- Finalização
SELECT 'Configuração do banco de dados concluída com sucesso!' as message;