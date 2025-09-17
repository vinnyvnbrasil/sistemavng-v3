# 🚀 Deploy do Sistema VNG v3

Guia completo para fazer deploy da aplicação no GitHub, Vercel e configurar o Supabase.

## ✅ Status Atual

- [x] **GitHub**: Repositório configurado e atualizado
- [x] **Código**: Push realizado com sucesso
- [x] **Vercel Config**: Arquivo `vercel.json` criado
- [ ] **Deploy Vercel**: Pendente configuração
- [ ] **Variáveis de Ambiente**: Pendente configuração

## 📋 Próximos Passos

### 1. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Conecte sua conta do GitHub se ainda não estiver conectada
4. Selecione o repositório: `vinnyvnbrasil/sistema-vngv3`
5. A Vercel detectará automaticamente que é um projeto Vite
6. Clique em "Deploy"

### 2. Configurar Variáveis de Ambiente na Vercel

Após o deploy inicial, configure as variáveis de ambiente:

1. No dashboard da Vercel, vá para o projeto
2. Clique em "Settings" > "Environment Variables"
3. Adicione as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://xzxjzbbrxapghmeqswmi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eGp6YmJyeGFwZ2htZXFzd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzAzNTksImV4cCI6MjA3MzQ0NjM1OX0.qECRejpwQXvcaoUiQ974iwFK4cWenqyAG15MrFeSZos
VITE_APP_NAME="Sistema VNG"
VITE_APP_VERSION="2.0.0"
```

4. Clique em "Save" para cada variável
5. Faça um novo deploy clicando em "Deployments" > "Redeploy"

### 3. Configurar Supabase para Produção

1. Acesse o [dashboard do Supabase](https://supabase.com/dashboard)
2. Vá para o projeto: `xzxjzbbrxapghmeqswmi`
3. Em "Settings" > "API", verifique:
   - Project URL: `https://xzxjzbbrxapghmeqswmi.supabase.co`
   - Anon key: Já configurada
4. Em "Authentication" > "URL Configuration":
   - Adicione a URL da Vercel como "Site URL"
   - Adicione a URL da Vercel em "Redirect URLs"

### 4. Testar a Aplicação

1. Acesse a URL fornecida pela Vercel
2. Teste o login/cadastro
3. Verifique se todas as funcionalidades estão funcionando
4. Monitore os logs na Vercel em caso de erros

## 🔗 Links Importantes

- **GitHub**: https://github.com/vinnyvnbrasil/sistemavng-v3
- **Supabase**: https://supabase.com/dashboard/project/xzxjzbbrxapghmeqswmi
- **Vercel**: (será gerado após o deploy)

## 🛠️ Configurações Técnicas

### Vercel.json
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Build Settings
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🚨 Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Confirme se o comando `npm run build` funciona localmente

### Erro de Autenticação
- Verifique se as variáveis de ambiente estão corretas
- Confirme se a URL da Vercel está configurada no Supabase

### Erro 404 em Rotas
- O arquivo `vercel.json` já está configurado para SPA
- Todas as rotas serão redirecionadas para `index.html`

---

**Próximo passo**: Acesse [vercel.com](https://vercel.com) e siga o passo 1 do guia acima! 🚀