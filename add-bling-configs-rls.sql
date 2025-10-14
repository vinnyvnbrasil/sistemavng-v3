-- =====================================================
-- ADICIONAR POLÍTICAS RLS PARA BLING_CONFIGS
-- =====================================================
-- Execute este script APÓS criar a tabela bling_configs
-- Este script adiciona as políticas de segurança

-- Habilitar RLS na tabela
ALTER TABLE bling_configs ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários podem ver configurações das empresas que têm acesso
-- Usando a estrutura correta: teams -> team_members
CREATE POLICY "Users can view bling configs for their companies" ON bling_configs
    FOR SELECT USING (
        company_id IN (
            SELECT t.company_id 
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = auth.uid()
            AND tm.is_active = true
        )
    );

-- Política para INSERT - apenas líderes podem criar configurações
CREATE POLICY "Leaders can create bling configs" ON bling_configs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = auth.uid() 
            AND t.company_id = company_id
            AND tm.role = 'leader'
            AND tm.is_active = true
        )
    );

-- Política para UPDATE - apenas líderes podem atualizar configurações
CREATE POLICY "Leaders can update bling configs" ON bling_configs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = auth.uid() 
            AND t.company_id = company_id
            AND tm.role = 'leader'
            AND tm.is_active = true
        )
    );

-- Política para DELETE - apenas líderes podem deletar configurações
CREATE POLICY "Leaders can delete bling configs" ON bling_configs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = auth.uid() 
            AND t.company_id = company_id
            AND tm.role = 'leader'
            AND tm.is_active = true
        )
    );