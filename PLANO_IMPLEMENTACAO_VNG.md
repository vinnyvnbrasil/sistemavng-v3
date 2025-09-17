# 🚀 Plano de Implementação - Sistema VNG v3

## 📊 Visão Geral do Projeto

O Sistema VNG v3 será uma plataforma completa para gestão de empresas com integração automática ao Bling API V3 para pedidos e sistema de tickets para suporte a clientes de marketplaces.

## 🎯 Funcionalidades Principais

### 1. 🛒 **Sistema de Pedidos Bling API V3**
- Integração automática com Bling API V3
- Sincronização de pedidos por empresa cadastrada
- Dashboard de vendas e métricas
- Gestão de produtos e estoque
- Relatórios de faturamento

### 2. 🎫 **Sistema de Tickets**
- Tickets por empresa/marketplace
- Categorização por plataforma (Mercado Livre, Shopee, Amazon, etc.)
- Sistema de prioridades e status
- Histórico de atendimentos
- Métricas de resolução

### 3. 👥 **Sistema de Controle de Acesso (RBAC)**
- **Admin**: Acesso total ao sistema
- **Líder**: Gestão da equipe e relatórios
- **Operador**: Atendimento de tickets e pedidos

### 4. 🏢 **Gestão Multi-Empresa**
- Cadastro de empresas com dados Bling
- Configurações específicas por empresa
- Isolamento de dados por empresa

## 📋 Fases de Implementação

### **FASE 1: Preparação da Base** (1-2 dias)
- [ ] Expandir tabela de empresas com dados Bling
- [ ] Criar tabelas para pedidos e tickets
- [ ] Implementar sistema de roles expandido
- [ ] Configurar variáveis de ambiente para Bling API

### **FASE 2: Sistema de Pedidos Bling** (3-4 dias)
- [ ] Substituir página Projects por Pedidos
- [ ] Implementar integração com Bling API V3
- [ ] Criar dashboard de vendas
- [ ] Sistema de sincronização automática
- [ ] Relatórios e métricas

### **FASE 3: Sistema de Tickets** (2-3 dias)
- [ ] Substituir página Tasks por Tickets
- [ ] Interface de criação/edição de tickets
- [ ] Sistema de categorização por marketplace
- [ ] Workflow de atendimento
- [ ] Métricas de suporte

### **FASE 4: Sistema de Membros** (1-2 dias)
- [ ] Expandir sistema de roles
- [ ] Interface de gestão de membros
- [ ] Controle de permissões por função
- [ ] Auditoria de ações

### **FASE 5: Produção** (1 dia)
- [ ] Configuração do domínio sistemavng.com.br
- [ ] Deploy em produção
- [ ] Testes finais
- [ ] Documentação

## 🗄️ Estrutura de Banco Necessária

### Novas Tabelas a Criar:

#### **bling_configs**
```sql
- id (UUID)
- company_id (UUID) → companies.id
- api_key (TEXT, encrypted)
- client_id (TEXT)
- client_secret (TEXT, encrypted)
- access_token (TEXT, encrypted)
- refresh_token (TEXT, encrypted)
- expires_at (TIMESTAMP)
- is_active (BOOLEAN)
```

#### **orders** (Pedidos do Bling)
```sql
- id (UUID)
- bling_order_id (TEXT)
- company_id (UUID) → companies.id
- customer_name (TEXT)
- customer_email (TEXT)
- total_amount (DECIMAL)
- status (TEXT)
- marketplace (TEXT)
- order_date (TIMESTAMP)
- items (JSONB)
- sync_at (TIMESTAMP)
```

#### **tickets**
```sql
- id (UUID)
- company_id (UUID) → companies.id
- title (TEXT)
- description (TEXT)
- status (TEXT) → 'open', 'in_progress', 'resolved', 'closed'
- priority (TEXT) → 'low', 'medium', 'high', 'urgent'
- marketplace (TEXT) → 'mercado_livre', 'shopee', 'amazon', etc.
- customer_name (TEXT)
- customer_email (TEXT)
- assigned_to (UUID) → profiles.id
- created_by (UUID) → profiles.id
- resolved_at (TIMESTAMP)
```

#### **ticket_messages**
```sql
- id (UUID)
- ticket_id (UUID) → tickets.id
- user_id (UUID) → profiles.id
- message (TEXT)
- is_internal (BOOLEAN)
- attachments (JSONB)
```

### Expansão de Tabelas Existentes:

#### **profiles** (adicionar campos)
```sql
- role → expandir para 'admin', 'leader', 'operator'
- permissions (JSONB)
- last_activity (TIMESTAMP)
```

#### **companies** (adicionar campos)
```sql
- bling_api_configured (BOOLEAN)
- marketplaces (JSONB)
- settings (JSONB)
```

## 🔧 Integrações Necessárias

### **Bling API V3**
- Autenticação OAuth2
- Endpoints de pedidos
- Sincronização automática
- Webhooks para atualizações

### **Marketplaces**
- Mercado Livre
- Shopee
- Amazon
- Magazine Luiza
- Outros conforme necessário

## 📈 Métricas e Relatórios

### **Dashboard de Pedidos**
- Vendas por período
- Produtos mais vendidos
- Faturamento por marketplace
- Gráficos de crescimento

### **Dashboard de Tickets**
- Tickets por status
- Tempo médio de resolução
- Satisfação do cliente
- Performance da equipe

## 🚀 Próximos Passos Imediatos

1. **Criar estrutura de banco expandida**
2. **Implementar integração Bling API V3**
3. **Substituir página Projects por Pedidos**
4. **Implementar sistema de tickets**
5. **Configurar domínio de produção**

## 📝 Observações Importantes

- Manter compatibilidade com estrutura atual
- Implementar logs de auditoria
- Garantir segurança dos dados da API
- Testes extensivos antes do deploy
- Backup automático dos dados