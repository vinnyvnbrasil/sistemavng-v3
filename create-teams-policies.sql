-- Script para criar políticas RLS das tabelas teams e team_members
-- Execute este script APÓS criar as tabelas teams e team_members

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

SELECT 'Políticas RLS para teams e team_members criadas com sucesso!' as message;