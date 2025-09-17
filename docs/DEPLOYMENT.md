# 🚀 Guia de Deploy para Produção - Sistema VNG v3

Este guia fornece instruções detalhadas para fazer o deploy do Sistema VNG v3 em produção usando Vercel.

## 📋 Pré-requisitos

### Ferramentas Necessárias
- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Vercel CLI](https://vercel.com/cli)
- [Git](https://git-scm.com/)

### Contas e Serviços
- Conta no [Vercel](https://vercel.com/)
- Projeto no [Supabase](https://supabase.com/)
- Aplicação registrada no [Bling](https://developer.bling.com.br/)
- Domínio registrado (ex: sistemavng.com.br)

## 🛠️ Configuração Inicial

### 1. Instalação do Vercel CLI

```bash
# Instalar globalmente
npm install -g vercel

# Fazer login
vercel login
```

### 2. Configuração do Projeto

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/sistemavng-v3.git
cd sistemavng-v3

# Instalar dependências
npm install

# Fazer build local para testar
npm run build
```

## 🔧 Configuração de Variáveis de Ambiente

### Método 1: Script Automatizado (Recomendado)

#### Windows (PowerShell)
```powershell
# Executar script de configuração
.\scripts\setup-production.ps1
```

#### Linux/macOS (Bash)
```bash
# Dar permissão de execução
chmod +x scripts/setup-production.sh

# Executar script
./scripts/setup-production.sh
```

### Método 2: Configuração Manual

#### 2.1. Variáveis Básicas

```bash
# URL da aplicação
vercel env add NEXTAUTH_URL production
# Valor: https://sistemavng.com.br

# Chave secreta (gerar nova)
vercel env add NEXTAUTH_SECRET production
# Valor: [chave gerada com openssl rand -base64 32]
```

#### 2.2. Supabase

```bash
# URL do projeto
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Valor: https://seu-projeto.supabase.co

# Chave pública
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Valor: [sua chave anon do Supabase]

# Chave de serviço
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Valor: [sua chave service role do Supabase]
```

#### 2.3. Bling API

```bash
# Client ID
vercel env add BLING_CLIENT_ID production
# Valor: [seu client id do Bling]

# Client Secret
vercel env add BLING_CLIENT_SECRET production
# Valor: [seu client secret do Bling]

# URL de callback
vercel env add BLING_REDIRECT_URI production
# Valor: https://sistemavng.com.br/api/auth/bling/callback

# URL da API
vercel env add BLING_API_URL production
# Valor: https://www.bling.com.br/Api/v3
```

#### 2.4. Configurações de Segurança

```bash
# Origens permitidas
vercel env add ALLOWED_ORIGINS production
# Valor: https://sistemavng.com.br

# CORS Origin
vercel env add CORS_ORIGIN production
# Valor: https://sistemavng.com.br
```

## 🌐 Configuração de Domínio

### 1. Adicionar Domínio no Vercel

```bash
# Adicionar domínio
vercel domains add sistemavng.com.br

# Verificar status
vercel domains ls
```

### 2. Configurar DNS

Configure os seguintes registros DNS no seu provedor:

| Tipo  | Nome | Valor                |
|-------|------|----------------------|
| CNAME | @    | cname.vercel-dns.com |
| CNAME | www  | cname.vercel-dns.com |

### 3. Verificar Configuração

```bash
# Verificar propagação DNS
nslookup sistemavng.com.br

# Testar HTTPS
curl -I https://sistemavng.com.br
```

## 🚀 Deploy

### 1. Deploy Inicial

```bash
# Deploy para produção
vercel --prod

# Ou usando o script
npm run deploy:prod
```

### 2. Deploy Automático (CI/CD)

Configure o deploy automático conectando o repositório GitHub ao Vercel:

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Configure as variáveis de ambiente
5. Deploy automático será ativado

### 3. Verificação do Deploy

```bash
# Verificar status
vercel ls

# Ver logs
vercel logs

# Testar aplicação
curl -f https://sistemavng.com.br/api/health
```

## 🔒 Configuração SSL

O Vercel configura automaticamente certificados SSL via Let's Encrypt. Para verificar:

1. Acesse https://sistemavng.com.br
2. Verifique o ícone de cadeado no navegador
3. Use ferramentas como [SSL Labs](https://www.ssllabs.com/ssltest/) para testar

## 📊 Monitoramento

### 1. Configurar Sentry (Opcional)

```bash
# Adicionar DSN do Sentry
vercel env add SENTRY_DSN production
# Valor: [seu DSN do Sentry]

# Configurar nível de log
vercel env add LOG_LEVEL production
# Valor: info
```

### 2. Monitoramento Vercel

- Analytics: Habilitado automaticamente
- Logs: Disponíveis no dashboard
- Métricas: Core Web Vitals

## 🔧 Configurações Avançadas

### 1. Headers de Segurança

Configurados automaticamente via `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 2. Redirects e Rewrites

```json
{
  "redirects": [
    {
      "source": "/admin",
      "destination": "/dashboard",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/bling/:path*",
      "destination": "https://www.bling.com.br/Api/v3/:path*"
    }
  ]
}
```

## 🧪 Testes em Produção

### 1. Smoke Tests

```bash
# Testar página inicial
curl -f https://sistemavng.com.br

# Testar API de saúde
curl -f https://sistemavng.com.br/api/health

# Testar autenticação
curl -f https://sistemavng.com.br/api/auth/session
```

### 2. Testes de Performance

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage

# WebPageTest
# Use https://www.webpagetest.org/
```

## 🔄 Rollback

### Em caso de problemas:

```bash
# Ver deployments
vercel ls

# Fazer rollback para versão anterior
vercel rollback [deployment-url]

# Ou promover deployment específico
vercel promote [deployment-url]
```

## 📝 Checklist de Deploy

### Pré-Deploy
- [ ] Testes locais passando
- [ ] Build local funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] DNS configurado
- [ ] Backup do banco de dados

### Deploy
- [ ] Deploy realizado com sucesso
- [ ] SSL funcionando
- [ ] Domínio personalizado ativo
- [ ] Redirects funcionando

### Pós-Deploy
- [ ] Smoke tests passando
- [ ] Monitoramento ativo
- [ ] Logs sem erros críticos
- [ ] Performance aceitável
- [ ] Funcionalidades principais testadas

## 🆘 Troubleshooting

### Problemas Comuns

#### 1. Build Falha
```bash
# Verificar logs
vercel logs

# Testar build local
npm run build

# Verificar dependências
npm audit
```

#### 2. Variáveis de Ambiente
```bash
# Listar variáveis
vercel env ls

# Verificar valor específico
vercel env pull .env.production
```

#### 3. DNS não Propaga
```bash
# Verificar propagação
dig sistemavng.com.br

# Usar DNS público
nslookup sistemavng.com.br 8.8.8.8
```

#### 4. SSL não Funciona
- Aguardar até 24h para propagação
- Verificar configuração DNS
- Contatar suporte Vercel se necessário

### Logs e Debugging

```bash
# Ver logs em tempo real
vercel logs --follow

# Logs específicos de função
vercel logs --function=api/auth

# Logs por período
vercel logs --since=1h
```

## 📞 Suporte

### Recursos
- [Documentação Vercel](https://vercel.com/docs)
- [Suporte Vercel](https://vercel.com/support)
- [Comunidade Next.js](https://nextjs.org/community)
- [Documentação Supabase](https://supabase.com/docs)
- [API Bling](https://developer.bling.com.br/)

### Contato
- Email: suporte@sistemavng.com.br
- GitHub Issues: [Reportar problema](https://github.com/seu-usuario/sistemavng-v3/issues)

---

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](../LICENSE) para detalhes.