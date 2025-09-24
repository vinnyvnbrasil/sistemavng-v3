-- =====================================================
-- CRIAR TABELA BLING_CONFIGS
-- =====================================================
-- Script para criar a tabela de configurações do Bling
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bling_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL, -- Será criptografado na aplicação
    access_token TEXT, -- Será criptografado na aplicação
    refresh_token TEXT, -- Será criptografado na aplicação
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    webhook_url TEXT,
    webhook_events JSONB DEFAULT '[]',
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending', -- pending, syncing, completed, error
    sync_errors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id)
);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE bling_configs ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários podem ver configurações das empresas que têm acesso
CREATE POLICY "Users can view bling configs for their companies" ON bling_configs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id 
            FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

-- Política para INSERT - apenas admins e líderes podem criar configurações
CREATE POLICY "Admins and leaders can create bling configs" ON bling_configs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN team_members tm ON p.id = tm.user_id
            WHERE p.id = auth.uid() 
            AND tm.company_id = company_id
            AND tm.role IN ('admin', 'leader')
        )
    );

-- Política para UPDATE - apenas admins e líderes podem atualizar configurações
CREATE POLICY "Admins and leaders can update bling configs" ON bling_configs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN team_members tm ON p.id = tm.user_id
            WHERE p.id = auth.uid() 
            AND tm.company_id = company_id
            AND tm.role IN ('admin', 'leader')
        )
    );

-- Política para DELETE - apenas admins podem deletar configurações
CREATE POLICY "Only admins can delete bling configs" ON bling_configs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN team_members tm ON p.id = tm.user_id
            WHERE p.id = auth.uid() 
            AND tm.company_id = company_id
            AND tm.role = 'admin'
        )
    );

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por company_id
CREATE INDEX IF NOT EXISTS idx_bling_configs_company_id ON bling_configs(company_id);

-- Índice para busca por status de sincronização
CREATE INDEX IF NOT EXISTS idx_bling_configs_sync_status ON bling_configs(sync_status);

-- Índice para busca por configurações ativas
CREATE INDEX IF NOT EXISTS idx_bling_configs_active ON bling_configs(is_active) WHERE is_active = true;

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela bling_configs
CREATE TRIGGER update_bling_configs_updated_at 
    BEFORE UPDATE ON bling_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS DA TABELA
-- =====================================================

COMMENT ON TABLE bling_configs IS 'Configurações de integração com a API do Bling por empresa';
COMMENT ON COLUMN bling_configs.client_id IS 'Client ID da aplicação no Bling';
COMMENT ON COLUMN bling_configs.client_secret IS 'Client Secret da aplicação no Bling (criptografado)';
COMMENT ON COLUMN bling_configs.access_token IS 'Token de acesso atual (criptografado)';
COMMENT ON COLUMN bling_configs.refresh_token IS 'Token para renovar o access_token (criptografado)';
COMMENT ON COLUMN bling_configs.webhook_events IS 'Array de eventos do webhook habilitados';
COMMENT ON COLUMN bling_configs.sync_status IS 'Status da última sincronização: pending, syncing, completed, error';
COMMENT ON COLUMN bling_configs.sync_errors IS 'Array de erros da última sincronização';