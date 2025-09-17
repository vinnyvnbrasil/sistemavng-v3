# 🗄️ Guia de Execução do Banco de Dados - Sistema VNG v3

## 📋 Pré-requisitos

1. ✅ Projeto criado no Supabase
2. ✅ Acesso ao painel de administração
3. ✅ Variáveis de ambiente configuradas no `.env.local`

## 🚀 Passos para Executar o Script SQL

### 1. Acessar o SQL Editor

1. Faça login no [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New Query"**

### 2. Executar o Script

1. Abra o arquivo `supabase-setup.sql` na raiz do projeto
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione Ctrl+Enter)

### 3. Verificar Execução

Após executar, você deve ver:
- ✅ Mensagem: "Configuração do banco de dados concluída com sucesso!"
- ✅ Todas as tabelas criadas na aba **"Table Editor"**

## 📊 Estrutura do Banco Criada

### Tabelas Principais:

#### 👥 **profiles**
- Perfis de usuários do sistema
- Conectada automaticamente com `auth.users`
- Campos: id, email, full_name, avatar_url, company_id, role

#### 🏢 **companies**
- Empresas cadastradas no sistema
- Campos: id, name, description, logo_url, website, phone, address

#### 📋 **projects**
- Projetos das empresas
- Campos: id, name, description, status, priority, dates, budget

#### ✅ **tasks**
- Tarefas dos projetos
- Campos: id, title, description, status, priority, due_date

#### 📝 **activities**
- Log de atividades do sistema
- Campos: id, type, title, description, entity_type, metadata

### 🔒 Segurança Implementada:

- ✅ **Row Level Security (RLS)** habilitado em todas as tabelas
- ✅ **Políticas de acesso** baseadas em empresa e papel do usuário
- ✅ **Triggers automáticos** para criação de perfil e atualização de timestamps
- ✅ **Índices otimizados** para performance

### 🎯 Funcionalidades Automáticas:

1. **Criação automática de perfil**: Quando um usuário se registra
2. **Atualização de timestamps**: Campo `updated_at` atualizado automaticamente
3. **Validação de dados**: Constraints e checks nos campos críticos
4. **Relacionamentos**: Foreign keys configuradas corretamente

## 🔍 Verificação Pós-Execução

### No Supabase Dashboard:

1. **Table Editor**: Verifique se todas as 5 tabelas foram criadas
2. **Authentication**: Teste o registro de um novo usuário
3. **SQL Editor**: Execute queries de teste:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Testar inserção de empresa
INSERT INTO companies (name, description) 
VALUES ('Teste', 'Empresa de teste');
```

## ⚠️ Possíveis Problemas e Soluções

### Erro: "Extension already exists"
- ✅ **Normal**: As extensões já estavam instaladas
- ✅ **Ação**: Continue normalmente

### Erro: "Table already exists"
- ✅ **Causa**: Script já foi executado antes
- ✅ **Ação**: Use `DROP TABLE` se necessário recriar

### Erro de permissão
- ❌ **Causa**: Usuário sem permissões adequadas
- 🔧 **Solução**: Use a service role key nas configurações

## 🎉 Próximos Passos

Após executar com sucesso:

1. ✅ Gerar tipos TypeScript automáticos
2. ✅ Testar conexões no código
3. ✅ Implementar funcionalidades do dashboard
4. ✅ Criar sistema de gestão de empresas

---

**💡 Dica**: Mantenha uma cópia de backup do script SQL para futuras reinstalações ou ambientes de desenvolvimento.