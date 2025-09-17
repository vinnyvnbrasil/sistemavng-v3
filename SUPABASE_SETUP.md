# 🔧 Configuração Manual do Supabase

Este guia detalha como configurar manualmente o Supabase para o Sistema VNG v3.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Acesso ao SQL Editor do Supabase

## 🚀 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha:
   - **Name**: `sistemavng-v3`
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima
6. Clique em "Create new project"
7. Aguarde a criação (pode levar alguns minutos)

### 2. Obter Credenciais

1. No painel do projeto, vá para **Settings** → **API**
2. Copie:
   - **Project URL** (algo como: `https://xyzabc123.supabase.co`)
   - **anon public** key (chave longa começando com `eyJ...`)

### 3. Configurar Variáveis de Ambiente

1. No projeto local, copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite o arquivo `.env.local` com suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://seuprojetoid.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. Executar Script SQL

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor SQL
5. Clique em "Run" (ou pressione Ctrl+Enter)
6. Aguarde a execução (pode levar alguns segundos)

### 5. Verificar Configuração

1. Vá para **Table Editor** no painel do Supabase
2. Verifique se as seguintes tabelas foram criadas:
   - ✅ `profiles`
   - ✅ `companies`
   - ✅ `projects`
   - ✅ `tasks`
   - ✅ `activities`

3. Vá para **Authentication** → **Users**
4. Verifique se não há usuários (normal para início)

### 6. Testar Conectividade

1. Inicie o projeto local:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:5173`
3. Faça login com:
   - **Email**: `admin@sistemavng.com`
   - **Senha**: `admin123`

4. No dashboard, clique em "Executar Testes" no componente de teste
5. Verifique se todos os testes passam:
   - ✅ Conexão
   - ✅ Autenticação
   - ✅ Tabelas

## 🔍 Estrutura do Banco Criada

### Tabelas Principais

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `profiles` | Perfis de usuários | id, email, full_name, role |
| `companies` | Empresas cadastradas | id, name, cnpj, status |
| `projects` | Projetos das empresas | id, name, company_id, status |
| `tasks` | Tarefas dos projetos | id, title, project_id, status |
| `activities` | Log de atividades | id, type, description, user_id |

### Dados de Exemplo Inseridos

- ✅ 1 perfil de administrador
- ✅ 1 empresa exemplo
- ✅ 1 projeto piloto
- ✅ 2 tarefas de exemplo
- ✅ 3 atividades de log

### Políticas de Segurança (RLS)

- ✅ Usuários só veem seus próprios dados
- ✅ Admins têm acesso completo
- ✅ Proteção contra acesso não autorizado

## 🚨 Solução de Problemas

### Erro: "Variáveis de ambiente não encontradas"

**Solução**: Verifique se o arquivo `.env.local` existe e contém as variáveis corretas.

### Erro: "Failed to fetch" ou "Network error"

**Possíveis causas**:
1. URL do Supabase incorreta
2. Chave anônima incorreta
3. Projeto Supabase pausado/inativo

**Solução**: 
1. Verifique as credenciais no arquivo `.env.local`
2. Confirme se o projeto está ativo no painel do Supabase

### Erro: "relation does not exist"

**Causa**: Script SQL não foi executado ou falhou.

**Solução**:
1. Execute novamente o script `supabase-setup.sql`
2. Verifique se não há erros no SQL Editor

### Tabelas não aparecem no Table Editor

**Causa**: Script SQL falhou silenciosamente.

**Solução**:
1. Vá para **SQL Editor**
2. Execute cada seção do script separadamente
3. Verifique erros em cada execução

### Login de demonstração não funciona

**Causa**: Sistema está tentando autenticar via Supabase em vez de usar o mock.

**Solução**: O login `admin@sistemavng.com` / `admin123` é um mock no código. Para login real:
1. Registre um usuário via interface
2. Ou use o Supabase Auth para criar usuários

## 📞 Suporte

Se encontrar problemas:

1. ✅ Verifique este guia novamente
2. ✅ Use o componente de teste integrado no dashboard
3. ✅ Consulte os logs do navegador (F12 → Console)
4. ✅ Verifique os logs do Supabase (painel → Logs)

## 🔄 Resetar Configuração

Para recomeçar do zero:

1. No painel do Supabase, vá para **Settings** → **General**
2. Role até o final e clique em "Delete Project"
3. Crie um novo projeto
4. Siga este guia novamente

---

**✅ Configuração concluída com sucesso!**

Após seguir todos os passos, seu Sistema VNG v3 estará totalmente funcional com Supabase.