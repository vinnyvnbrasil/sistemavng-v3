-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/xzxjzbbrxapghmeqswmi/sql

-- Criar tabela bling_configs
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

-- Habilitar RLS
ALTER TABLE bling_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bling_configs_company_id ON bling_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_bling_configs_sync_status ON bling_configs(sync_status);
CREATE INDEX IF NOT EXISTS idx_bling_configs_active ON bling_configs(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
COMMENT ON COLUMN bling_configs.sync_status IS 'Status da última sincronização';
COMMENT ON COLUMN bling_configs.sync_errors IS 'Array de erros da última sincronização';

-- Verificar se foi criada
SELECT 'Tabela bling_configs criada com sucesso!' as message;