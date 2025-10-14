-- =====================================================
-- CRIAR TABELA BLING_SYNC_LOGS
-- =====================================================
-- Script para criar a tabela de logs de sincronização do Bling
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bling_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('orders', 'products', 'customers', 'all')),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Opções de sincronização
    options JSONB DEFAULT '{}',
    
    -- Resultados da sincronização
    result JSONB,
    
    -- Estatísticas da sincronização
    total_processed INTEGER DEFAULT 0,
    total_success INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    
    -- Mensagem de erro (se houver)
    error_message TEXT,
    
    -- Metadados adicionais
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para buscar logs por empresa
CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_company_id ON bling_sync_logs(company_id);

-- Índice para buscar logs por status
CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_status ON bling_sync_logs(status);

-- Índice para buscar logs por tipo de sincronização
CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_sync_type ON bling_sync_logs(sync_type);

-- Índice para buscar logs por data de início
CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_started_at ON bling_sync_logs(started_at DESC);

-- Índice composto para buscar logs ativos por empresa
CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_company_status ON bling_sync_logs(company_id, status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE TRIGGER update_bling_sync_logs_updated_at 
    BEFORE UPDATE ON bling_sync_logs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE bling_sync_logs ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários podem ver logs das empresas que têm acesso
CREATE POLICY "Users can view bling sync logs for their companies" ON bling_sync_logs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política para INSERT - usuários podem criar logs para empresas que têm acesso
CREATE POLICY "Users can create bling sync logs for their companies" ON bling_sync_logs
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política para UPDATE - usuários podem atualizar logs das empresas que têm acesso
CREATE POLICY "Users can update bling sync logs for their companies" ON bling_sync_logs
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política para DELETE - apenas admins podem deletar logs
CREATE POLICY "Admins can delete bling sync logs" ON bling_sync_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
            AND company_id = bling_sync_logs.company_id
        )
    );

-- =====================================================
-- COMENTÁRIOS DA TABELA
-- =====================================================

COMMENT ON TABLE bling_sync_logs IS 'Logs de sincronização com a API do Bling';
COMMENT ON COLUMN bling_sync_logs.id IS 'Identificador único do log';
COMMENT ON COLUMN bling_sync_logs.company_id IS 'ID da empresa proprietária do log';
COMMENT ON COLUMN bling_sync_logs.sync_type IS 'Tipo de sincronização (orders, products, customers, all)';
COMMENT ON COLUMN bling_sync_logs.status IS 'Status da sincronização (in_progress, completed, failed, cancelled)';
COMMENT ON COLUMN bling_sync_logs.started_at IS 'Data e hora de início da sincronização';
COMMENT ON COLUMN bling_sync_logs.completed_at IS 'Data e hora de conclusão da sincronização';
COMMENT ON COLUMN bling_sync_logs.started_by IS 'ID do usuário que iniciou a sincronização';
COMMENT ON COLUMN bling_sync_logs.options IS 'Opções utilizadas na sincronização (JSON)';
COMMENT ON COLUMN bling_sync_logs.result IS 'Resultado detalhado da sincronização (JSON)';
COMMENT ON COLUMN bling_sync_logs.total_processed IS 'Total de itens processados';
COMMENT ON COLUMN bling_sync_logs.total_success IS 'Total de itens processados com sucesso';
COMMENT ON COLUMN bling_sync_logs.total_errors IS 'Total de itens com erro';
COMMENT ON COLUMN bling_sync_logs.error_message IS 'Mensagem de erro principal (se houver)';
COMMENT ON COLUMN bling_sync_logs.metadata IS 'Metadados adicionais da sincronização (JSON)';

-- =====================================================
-- FUNÇÃO PARA LIMPEZA AUTOMÁTICA DE LOGS ANTIGOS
-- =====================================================

-- Função para limpar logs antigos (mais de 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_bling_sync_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM bling_sync_logs 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND status IN ('completed', 'failed', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentário da função
COMMENT ON FUNCTION cleanup_old_bling_sync_logs() IS 'Remove logs de sincronização do Bling com mais de 90 dias';

-- =====================================================
-- FUNÇÃO PARA ESTATÍSTICAS DE SINCRONIZAÇÃO
-- =====================================================

-- Função para obter estatísticas de sincronização por empresa
CREATE OR REPLACE FUNCTION get_bling_sync_stats(company_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_syncs BIGINT,
    successful_syncs BIGINT,
    failed_syncs BIGINT,
    in_progress_syncs BIGINT,
    avg_duration_minutes NUMERIC,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_types JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_syncs,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_syncs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_syncs,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_syncs,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) FILTER (WHERE completed_at IS NOT NULL) as avg_duration_minutes,
        MAX(started_at) as last_sync_at,
        jsonb_object_agg(
            sync_type, 
            jsonb_build_object(
                'count', COUNT(*),
                'success_rate', 
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)) * 100, 2)
                    ELSE 0 
                END
            )
        ) as sync_types
    FROM bling_sync_logs 
    WHERE company_id = company_uuid 
    AND started_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY sync_type;
END;
$$ LANGUAGE plpgsql;

-- Comentário da função
COMMENT ON FUNCTION get_bling_sync_stats(UUID, INTEGER) IS 'Retorna estatísticas de sincronização do Bling para uma empresa';

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tabela bling_sync_logs criada com sucesso!';
    RAISE NOTICE '📊 Índices, triggers e políticas RLS configurados';
    RAISE NOTICE '🔧 Funções utilitárias criadas';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '1. Verificar se a tabela foi criada corretamente';
    RAISE NOTICE '2. Testar as políticas RLS';
    RAISE NOTICE '3. Configurar limpeza automática de logs (opcional)';
END $$;