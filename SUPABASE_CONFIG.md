# Configuração do Supabase - Sistema VNG v3

## Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Acesso ao painel de administração

## Passos para Configuração

### 1. Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em "New Project"
3. Escolha sua organização
4. Defina:
   - **Name**: Sistema VNG v3
   - **Database Password**: Crie uma senha segura
   - **Region**: Escolha a região mais próxima (ex: South America)
5. Clique em "Create new project"

### 2. Obter Credenciais

Após criar o projeto:

1. Vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL**: `https://[seu-projeto-id].supabase.co`
   - **anon public**: Chave pública (anon key)
   - **service_role**: Chave de serviço (service role key)

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[sua-service-role-key]

# Database
DATABASE_URL=postgresql://postgres:[sua-senha]@db.[seu-projeto-id].supabase.co:5432/postgres

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-secret-key-aqui
```

### 4. Executar Script SQL

1. No painel do Supabase, vá para **SQL Editor**
2. Copie e execute o conteúdo do arquivo `supabase-setup.sql`
3. Isso criará todas as tabelas e funções necessárias

### 5. Configurar Autenticação

1. Vá para **Authentication** > **Settings**
2. Configure:
   - **Site URL**: `http://localhost:3000` (desenvolvimento)
   - **Redirect URLs**: 
     - `http://localhost:3000/dashboard`
     - `http://localhost:3000/auth/callback`

### 6. Configurar Providers (Opcional)

Para login com Google:

1. Vá para **Authentication** > **Providers**
2. Ative o **Google Provider**
3. Configure:
   - **Client ID**: Obtido no Google Cloud Console
   - **Client Secret**: Obtido no Google Cloud Console

## Verificação

Após configurar:

1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Acesse `http://localhost:3000`
3. Teste o registro e login
4. Verifique se o dashboard carrega corretamente

## Troubleshooting

### Erro: "Invalid supabaseUrl"
- Verifique se a URL do Supabase está correta no `.env.local`
- Certifique-se de que não há espaços extras
- A URL deve começar com `https://`

### Erro de Autenticação
- Verifique se as chaves estão corretas
- Confirme se o projeto está ativo no Supabase
- Verifique se as URLs de redirecionamento estão configuradas

### Erro de Banco de Dados
- Execute o script SQL no Supabase
- Verifique se as tabelas foram criadas corretamente
- Confirme se as políticas RLS estão ativas

## Próximos Passos

Após a configuração:

1. Configure o deploy na Vercel
2. Atualize as URLs para produção
3. Configure domínio personalizado
4. Implemente backup automático

---

**Importante**: Nunca commite o arquivo `.env.local` no Git. Ele já está no `.gitignore`.