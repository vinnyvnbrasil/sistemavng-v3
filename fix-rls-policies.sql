-- Políticas temporárias mais permissivas para desenvolvimento
-- Execute este script no SQL Editor do Supabase

-- Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Ou alternativamente, criar políticas mais permissivas
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view company activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;
DROP POLICY IF EXISTS "Users can view company projects" ON projects;
DROP POLICY IF EXISTS "Managers can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view company teams" ON teams;
DROP POLICY IF EXISTS "Managers can manage teams" ON teams;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Managers can manage team members" ON team_members;

-- Criar políticas permissivas para desenvolvimento
CREATE POLICY "Allow all access to activities" ON activities FOR ALL USING (true);
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all access to teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all access to team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all access to companies" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all access to profiles" ON profiles FOR ALL USING (true);

-- Reabilitar RLS com políticas permissivas
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

SELECT 'Políticas RLS atualizadas para desenvolvimento!' as message;