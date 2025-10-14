-- =====================================================
-- CRIAR TABELA BLING_CONFIGS (VERSÃO SIMPLES)
-- =====================================================
-- Script simples para criar apenas a tabela de configurações do Bling
-- Execute este script primeiro no Supabase SQL Editor

-- Criar a tabela bling_configs
CREATE TABLE IF NOT EXISTS bling_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    webhook_url TEXT,
    webhook_events JSONB DEFAULT '[]',
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    sync_errors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint de unicidade
    UNIQUE(company_id)
);

-- Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_bling_configs_company_id ON bling_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_bling_configs_sync_status ON bling_configs(sync_status);
CREATE INDEX IF NOT EXISTS idx_bling_configs_active ON bling_configs(is_active) WHERE is_active = true;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
CREATE TRIGGER update_bling_configs_updated_at 
    BEFORE UPDATE ON bling_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE bling_configs IS 'Configurações de integração com a API do Bling por empresa';
COMMENT ON COLUMN bling_configs.client_id IS 'Client ID da aplicação no Bling';
COMMENT ON COLUMN bling_configs.client_secret IS 'Client Secret da aplicação no Bling';
COMMENT ON COLUMN bling_configs.access_token IS 'Token de acesso atual';
COMMENT ON COLUMN bling_configs.refresh_token IS 'Token para renovar o access_token';
COMMENT ON COLUMN bling_configs.webhook_events IS 'Array de eventos do webhook habilitados';
COMMENT ON COLUMN bling_configs.sync_status IS 'Status da última sincronização: pending, syncing, completed, error';
COMMENT ON COLUMN bling_configs.sync_errors IS 'Array de erros da última sincronização';