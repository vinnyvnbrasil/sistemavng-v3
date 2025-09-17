# 🚀 GUIA DE DEPLOY - VERCEL (Sistema VNG V3)

## 📋 CONFIGURAÇÕES DE VARIÁVEIS DE AMBIENTE NO VERCEL

### 🔧 CONFIGURAÇÃO NO DASHBOARD DO VERCEL

Acesse o dashboard do Vercel e configure as seguintes variáveis de ambiente:

#### **1. NEXT.JS - CONFIGURAÇÕES BÁSICAS**
```bash
NEXTAUTH_URL=https://sistemavng.com.br
NEXTAUTH_SECRET=wq81H4W0UAmekdkQ7zJrRXYh6Zh5gxnGRPcSN4LsmiI
```

#### **2. SUPABASE - CONFIGURAÇÕES**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xzxjzbbrxapghmeqswmi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eGp6YmJyeGFwZ2htZXFzd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzAzNTksImV4cCI6MjA3MzQ0NjM1OX0.qECRejpwQXvcaoUiQ974iwFK4cWenqyAG15MrFeSZos
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eGp6YmJyeGFwZ2htZXFzd21pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg3MDM1OSwiZXhwIjoyMDczNDQ2MzU5fQ.eu2bzdDn5cyieLpUxxZ-QsvYEgNsmRHnn4dI5edIld0
```

#### **3. BLING API V3 - CONFIGURAÇÕES**
```bash
BLING_CLIENT_ID=9839c2dd8d12791de6379c84198631bbeab9591f
BLING_CLIENT_SECRET=bb06d4f1ad45c5a3c6bf41f329579503e647a67c396c8a42d761619a7d2b
BLING_REDIRECT_URI=https://sistemavng.com.br/api/auth/bling/callback
```

#### **4. CONFIGURAÇÕES DA APLICAÇÃO**
```bash
NEXT_PUBLIC_APP_NAME="Sistema VNG"
NEXT_PUBLIC_APP_VERSION="3.0.0"
NEXT_PUBLIC_APP_DESCRIPTION="Sistema de Gestão Empresarial"
```

#### **5. FEATURE FLAGS**
```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_BLING_INTEGRATION=true
```

#### **6. CONFIGURAÇÕES DE API**
```bash
NEXT_PUBLIC_API_BASE_URL=https://sistemavng.com.br/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

#### **7. CONFIGURAÇÕES DE UPLOAD**
```bash
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif
```

#### **8. CONFIGURAÇÕES DE SEGURANÇA**
```bash
NEXT_PUBLIC_ENABLE_CSP=true
NEXT_PUBLIC_ENABLE_HTTPS_REDIRECT=true
```

#### **9. CONFIGURAÇÕES DE PRODUÇÃO**
```bash
NODE_ENV=production
```

## 🎯 PASSO A PASSO DO DEPLOY

### **1. Preparação do Repositório**
```bash
# Certifique-se de que o .env.local não está no Git
echo ".env.local" >> .gitignore

# Commit das alterações
git add .
git commit -m "feat: configurações finais para deploy"
git push origin main
```

### **2. Configuração no Vercel**

1. **Acesse o Dashboard do Vercel**
   - Vá para https://vercel.com/dashboard
   - Faça login com sua conta

2. **Importe o Projeto**
   - Clique em "New Project"
   - Conecte com GitHub
   - Selecione o repositório `sistemavng-v3`

3. **Configure as Variáveis de Ambiente**
   - Na seção "Environment Variables"
   - Adicione TODAS as variáveis listadas acima
   - **IMPORTANTE**: Use os valores de PRODUÇÃO (URLs com https://sistemavng.com.br)

4. **Configurações de Build**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### **3. Deploy**
```bash
# O deploy será automático após a configuração
# Monitore o processo no dashboard do Vercel
```

## 🔍 VERIFICAÇÕES PÓS-DEPLOY

### **1. URLs para Testar**
- ✅ **Homepage**: https://sistemavng.com.br
- ✅ **Login**: https://sistemavng.com.br/auth/login
- ✅ **API Health**: https://sistemavng.com.br/api/health
- ✅ **Bling Callback**: https://sistemavng.com.br/api/auth/bling/callback

### **2. Funcionalidades para Validar**
- [ ] Autenticação NextAuth funcionando
- [ ] Conexão com Supabase ativa
- [ ] Integração Bling operacional
- [ ] Upload de arquivos funcionando
- [ ] Modo escuro ativo
- [ ] Notificações habilitadas

### **3. Performance e Segurança**
- [ ] Headers de segurança configurados
- [ ] HTTPS redirecionamento ativo
- [ ] CSP (Content Security Policy) funcionando
- [ ] Cache configurado corretamente

## 🚨 TROUBLESHOOTING

### **Problemas Comuns**

#### **1. Erro de Autenticação**
```bash
# Verifique se NEXTAUTH_URL está correto
NEXTAUTH_URL=https://sistemavng.com.br
```

#### **2. Erro de Conexão Supabase**
```bash
# Verifique as URLs e chaves
NEXT_PUBLIC_SUPABASE_URL=https://xzxjzbbrxapghmeqswmi.supabase.co
```

#### **3. Erro de Callback Bling**
```bash
# Verifique a URL de callback
BLING_REDIRECT_URI=https://sistemavng.com.br/api/auth/bling/callback
```

#### **4. Build Falhando**
```bash
# Verifique se todas as dependências estão no package.json
npm install
npm run build
```

## 📊 MONITORAMENTO

### **1. Logs do Vercel**
- Acesse a aba "Functions" no dashboard
- Monitore logs em tempo real
- Configure alertas para erros

### **2. Analytics**
```bash
# Se habilitado
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### **3. Performance**
- Use o Lighthouse CI configurado
- Monitore Core Web Vitals
- Verifique tempos de resposta

## 🔄 ATUALIZAÇÕES FUTURAS

### **Deploy Automático**
- Pushes para `main` fazem deploy automático
- Use branches para desenvolvimento
- Configure preview deployments

### **Rollback**
```bash
# No dashboard do Vercel
# Vá para "Deployments"
# Clique em "Promote to Production" na versão anterior
```

## 📞 SUPORTE

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs

---

**✅ DEPLOY PRONTO!** Seu Sistema VNG V3 está configurado e pronto para produção no Vercel.