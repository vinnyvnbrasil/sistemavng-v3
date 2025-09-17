-- =====================================================
-- SISTEMA VNG V3 - ESTRUTURA DE BANCO EXPANDIDA
-- =====================================================
-- Este script expande a estrutura existente com:
-- 1. Configurações Bling API V3
-- 2. Sistema de Pedidos
-- 3. Sistema de Tickets
-- 4. Sistema de Roles Expandido
-- =====================================================

-- 1. EXPANDIR TABELA PROFILES COM NOVOS CAMPOS
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Atualizar enum de roles para incluir novas funções
DO $$ 
BEGIN
    -- Verificar se o tipo existe e recriá-lo se necessário
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        DROP TYPE user_role CASCADE;
    END IF;
    
    CREATE TYPE user_role AS ENUM ('admin', 'leader', 'operator', 'viewer');
    
    -- Adicionar coluna role se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'operator';
    ELSE
        -- Se já existe, apenas alterar o tipo
        ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;
    END IF;
END $$;

-- 2. EXPANDIR TABELA COMPANIES COM CAMPOS BLING
-- =====================================================
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS bling_api_configured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marketplaces JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}';

-- 3. CRIAR TABELA BLING_CONFIGS
-- =====================================================
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

-- 4. CRIAR TABELA ORDERS (PEDIDOS DO BLING)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bling_order_id TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_document TEXT,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    marketplace TEXT,
    marketplace_order_id TEXT,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    items JSONB NOT NULL DEFAULT '[]',
    customer_address JSONB DEFAULT '{}',
    notes TEXT,
    tracking_code TEXT,
    invoice_number TEXT,
    invoice_url TEXT,
    sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bling_order_id, company_id),
    UNIQUE(order_number, company_id)
);

-- 5. CRIAR TABELA TICKETS
-- =====================================================
CREATE TYPE ticket_status AS ENUM (
    'open', 'in_progress', 'waiting_customer', 
    'waiting_internal', 'resolved', 'closed', 'cancelled'
);

CREATE TYPE ticket_priority AS ENUM (
    'low', 'medium', 'high', 'urgent', 'critical'
);

CREATE TYPE marketplace_type AS ENUM (
    'mercado_livre', 'shopee', 'amazon', 'magazine_luiza',
    'americanas', 'casas_bahia', 'extra', 'shopify', 'vtex',
    'tray', 'nuvemshop', 'loja_integrada', 'woocommerce',
    'magento', 'opencart', 'other'
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    marketplace marketplace_type NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    order_number TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes para performance
    INDEX idx_tickets_company_id (company_id),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_priority (priority),
    INDEX idx_tickets_marketplace (marketplace),
    INDEX idx_tickets_assigned_to (assigned_to),
    INDEX idx_tickets_created_by (created_by),
    INDEX idx_tickets_created_at (created_at)
);

-- 6. CRIAR TABELA TICKET_MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    message_type TEXT DEFAULT 'comment', -- comment, status_change, assignment, resolution
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_ticket_messages_ticket_id (ticket_id),
    INDEX idx_ticket_messages_user_id (user_id),
    INDEX idx_ticket_messages_created_at (created_at)
);

-- 7. CRIAR TABELA TICKET_ATTACHMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    message_id UUID REFERENCES ticket_messages(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (ticket_id IS NOT NULL OR message_id IS NOT NULL),
    
    -- Indexes
    INDEX idx_ticket_attachments_ticket_id (ticket_id),
    INDEX idx_ticket_attachments_message_id (message_id),
    INDEX idx_ticket_attachments_uploaded_by (uploaded_by)
);

-- 8. CRIAR TABELA TEAM_MEMBERS (MEMBROS DA EQUIPE)
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'operator',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    last_access TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id, user_id),
    
    -- Indexes
    INDEX idx_team_members_company_id (company_id),
    INDEX idx_team_members_user_id (user_id),
    INDEX idx_team_members_role (role)
);

-- 9. CRIAR TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas tabelas
DROP TRIGGER IF EXISTS update_bling_configs_updated_at ON bling_configs;
CREATE TRIGGER update_bling_configs_updated_at 
    BEFORE UPDATE ON bling_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_messages_updated_at ON ticket_messages;
CREATE TRIGGER update_ticket_messages_updated_at 
    BEFORE UPDATE ON ticket_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON team_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Bling Configs
ALTER TABLE bling_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view bling configs for their companies" ON bling_configs;
CREATE POLICY "Users can view bling configs for their companies" ON bling_configs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can manage bling configs" ON bling_configs;
CREATE POLICY "Admins can manage bling configs" ON bling_configs
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'leader') 
            AND is_active = true
        )
    );

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view orders for their companies" ON orders;
CREATE POLICY "Users can view orders for their companies" ON orders
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage orders for their companies" ON orders;
CREATE POLICY "Users can manage orders for their companies" ON orders
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tickets for their companies" ON tickets;
CREATE POLICY "Users can view tickets for their companies" ON tickets
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
        AND created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Users can update tickets for their companies" ON tickets;
CREATE POLICY "Users can update tickets for their companies" ON tickets
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Ticket Messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
CREATE POLICY "Users can view ticket messages" ON ticket_messages
    FOR SELECT USING (
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE company_id IN (
                SELECT company_id FROM team_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "Users can create ticket messages" ON ticket_messages;
CREATE POLICY "Users can create ticket messages" ON ticket_messages
    FOR INSERT WITH CHECK (
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE company_id IN (
                SELECT company_id FROM team_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
        AND user_id = auth.uid()
    );

-- Team Members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view team members for their companies" ON team_members;
CREATE POLICY "Users can view team members for their companies" ON team_members
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;
CREATE POLICY "Admins can manage team members" ON team_members
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'leader') 
            AND is_active = true
        )
    );

-- 11. INSERIR DADOS DE EXEMPLO
-- =====================================================

-- Atualizar empresa exemplo com dados Bling
UPDATE companies 
SET 
    bling_api_configured = false,
    marketplaces = '["mercado_livre", "shopee", "amazon"]',
    settings = '{"auto_sync": true, "sync_interval": 30, "webhook_enabled": false}',
    cnpj = '12.345.678/0001-90',
    phone = '(11) 99999-9999',
    address = '{"street": "Rua Exemplo, 123", "city": "São Paulo", "state": "SP", "zip": "01234-567"}'
WHERE name = 'Empresa Exemplo';

-- Inserir membro admin na equipe
INSERT INTO team_members (company_id, user_id, role, permissions, is_active, joined_at)
SELECT 
    c.id,
    p.id,
    'admin',
    '{"all": true}',
    true,
    NOW()
FROM companies c, profiles p
WHERE c.name = 'Empresa Exemplo' 
AND p.email = 'admin@sistemavng.com'
ON CONFLICT (company_id, user_id) DO UPDATE SET
    role = 'admin',
    permissions = '{"all": true}',
    is_active = true;

-- Inserir tickets de exemplo
INSERT INTO tickets (
    company_id, title, description, status, priority, marketplace,
    customer_name, customer_email, order_number, created_by
)
SELECT 
    c.id,
    'Problema com entrega do pedido #12345',
    'Cliente relata que o produto chegou danificado. Necessário providenciar troca.',
    'open',
    'high',
    'mercado_livre',
    'João Silva',
    'joao.silva@email.com',
    '12345',
    p.id
FROM companies c, profiles p
WHERE c.name = 'Empresa Exemplo' 
AND p.email = 'admin@sistemavng.com'
ON CONFLICT DO NOTHING;

INSERT INTO tickets (
    company_id, title, description, status, priority, marketplace,
    customer_name, customer_email, order_number, created_by
)
SELECT 
    c.id,
    'Dúvida sobre prazo de entrega',
    'Cliente quer saber quando o produto será entregue.',
    'in_progress',
    'medium',
    'shopee',
    'Maria Santos',
    'maria.santos@email.com',
    '67890',
    p.id
FROM companies c, profiles p
WHERE c.name = 'Empresa Exemplo' 
AND p.email = 'admin@sistemavng.com'
ON CONFLICT DO NOTHING;

-- 12. CRIAR FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter estatísticas de tickets
CREATE OR REPLACE FUNCTION get_ticket_stats(company_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'open', COUNT(*) FILTER (WHERE status = 'open'),
        'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
        'closed', COUNT(*) FILTER (WHERE status = 'closed'),
        'by_priority', json_build_object(
            'low', COUNT(*) FILTER (WHERE priority = 'low'),
            'medium', COUNT(*) FILTER (WHERE priority = 'medium'),
            'high', COUNT(*) FILTER (WHERE priority = 'high'),
            'urgent', COUNT(*) FILTER (WHERE priority = 'urgent'),
            'critical', COUNT(*) FILTER (WHERE priority = 'critical')
        ),
        'by_marketplace', json_build_object(
            'mercado_livre', COUNT(*) FILTER (WHERE marketplace = 'mercado_livre'),
            'shopee', COUNT(*) FILTER (WHERE marketplace = 'shopee'),
            'amazon', COUNT(*) FILTER (WHERE marketplace = 'amazon'),
            'other', COUNT(*) FILTER (WHERE marketplace NOT IN ('mercado_livre', 'shopee', 'amazon'))
        )
    ) INTO result
    FROM tickets
    WHERE company_id = company_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de pedidos
CREATE OR REPLACE FUNCTION get_order_stats(company_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'total_amount', COALESCE(SUM(total_amount), 0),
        'by_status', json_build_object(
            'pending', COUNT(*) FILTER (WHERE status = 'pending'),
            'processing', COUNT(*) FILTER (WHERE status = 'processing'),
            'shipped', COUNT(*) FILTER (WHERE status = 'shipped'),
            'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
            'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
        ),
        'by_marketplace', json_build_object(
            'mercado_livre', COUNT(*) FILTER (WHERE marketplace = 'mercado_livre'),
            'shopee', COUNT(*) FILTER (WHERE marketplace = 'shopee'),
            'amazon', COUNT(*) FILTER (WHERE marketplace = 'amazon'),
            'other', COUNT(*) FILTER (WHERE marketplace NOT IN ('mercado_livre', 'shopee', 'amazon'))
        ),
        'recent_orders', COUNT(*) FILTER (WHERE order_date >= NOW() - INTERVAL '7 days')
    ) INTO result
    FROM orders
    WHERE company_id = company_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para criar toda a estrutura necessária do VNG v3
-- =====================================================