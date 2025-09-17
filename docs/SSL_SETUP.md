# 🔒 Configuração SSL - Sistema VNG v3

Este guia fornece instruções detalhadas para configurar certificados SSL para o domínio sistemavng.com.br.

## 📋 Visão Geral

O Sistema VNG v3 utiliza HTTPS obrigatório para garantir a segurança das comunicações. O Vercel fornece certificados SSL automáticos via Let's Encrypt, mas também suportamos configurações personalizadas.

## 🚀 Configuração Automática (Vercel)

### 1. Certificados Let's Encrypt

O Vercel configura automaticamente certificados SSL quando você adiciona um domínio personalizado:

```bash
# Adicionar domínio (SSL automático)
vercel domains add sistemavng.com.br

# Verificar status do certificado
vercel certs ls
```

### 2. Verificação Automática

```bash
# Testar HTTPS
curl -I https://sistemavng.com.br

# Verificar certificado
openssl s_client -connect sistemavng.com.br:443 -servername sistemavng.com.br
```

## 🔧 Configuração Manual (Certificado Personalizado)

### 1. Gerar Certificado

#### Opção A: Let's Encrypt (Certbot)

```bash
# Instalar Certbot
sudo apt-get install certbot

# Gerar certificado
sudo certbot certonly --manual --preferred-challenges dns -d sistemavng.com.br -d www.sistemavng.com.br

# Certificados gerados em:
# /etc/letsencrypt/live/sistemavng.com.br/fullchain.pem
# /etc/letsencrypt/live/sistemavng.com.br/privkey.pem
```

#### Opção B: Certificado Comercial

```bash
# Gerar CSR (Certificate Signing Request)
openssl req -new -newkey rsa:2048 -nodes -keyout sistemavng.com.br.key -out sistemavng.com.br.csr

# Informações necessárias:
# Country Name: BR
# State: São Paulo
# City: São Paulo
# Organization: VNG Sistemas
# Organizational Unit: IT Department
# Common Name: sistemavng.com.br
# Email: admin@sistemavng.com.br
```

### 2. Configurar no Vercel

```bash
# Adicionar certificado personalizado
vercel certs add sistemavng.com.br /path/to/cert.pem /path/to/key.pem

# Verificar certificados
vercel certs ls
```

## 🛡️ Configurações de Segurança

### 1. Headers de Segurança

Configurados automaticamente via <mcfile name="vercel.json" path="C:\Users\vinny\OneDrive\Documentos\GitHub\sistemavng-v3\vercel.json"></mcfile>:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.bling.com.br https://*.supabase.co"
        }
      ]
    }
  ]
}
```

### 2. Redirecionamento HTTPS

```json
{
  "redirects": [
    {
      "source": "http://sistemavng.com.br/:path*",
      "destination": "https://sistemavng.com.br/:path*",
      "permanent": true
    },
    {
      "source": "http://www.sistemavng.com.br/:path*",
      "destination": "https://sistemavng.com.br/:path*",
      "permanent": true
    }
  ]
}
```

## 🔍 Verificação e Testes

### 1. Testes Básicos

```bash
# Verificar se HTTPS está funcionando
curl -I https://sistemavng.com.br

# Testar redirecionamento HTTP -> HTTPS
curl -I http://sistemavng.com.br

# Verificar certificado
curl -vI https://sistemavng.com.br 2>&1 | grep -i certificate
```

### 2. Testes Avançados

#### SSL Labs Test
```bash
# Usar SSL Labs para análise completa
# Acesse: https://www.ssllabs.com/ssltest/
# Digite: sistemavng.com.br
```

#### Verificação de Headers
```bash
# Verificar headers de segurança
curl -I https://sistemavng.com.br | grep -E "(Strict-Transport|X-Frame|X-Content|X-XSS|Referrer|Content-Security)"
```

#### Teste de Certificado
```bash
# Verificar detalhes do certificado
echo | openssl s_client -servername sistemavng.com.br -connect sistemavng.com.br:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer
```

### 3. Monitoramento Contínuo

#### Script de Monitoramento
```bash
#!/bin/bash
# ssl-monitor.sh

DOMAIN="sistemavng.com.br"
ALERT_DAYS=30

# Verificar expiração do certificado
EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt $ALERT_DAYS ]; then
    echo "ALERTA: Certificado SSL expira em $DAYS_UNTIL_EXPIRY dias!"
    # Enviar notificação (email, Slack, etc.)
else
    echo "Certificado SSL válido por mais $DAYS_UNTIL_EXPIRY dias"
fi
```

## 🔄 Renovação Automática

### 1. Let's Encrypt (Vercel)

O Vercel renova automaticamente certificados Let's Encrypt. Não é necessária ação manual.

### 2. Certificado Personalizado

```bash
# Configurar renovação automática com cron
# Editar crontab
crontab -e

# Adicionar linha para renovação mensal
0 2 1 * * /path/to/renew-ssl.sh
```

#### Script de Renovação
```bash
#!/bin/bash
# renew-ssl.sh

# Renovar certificado Let's Encrypt
certbot renew --quiet

# Atualizar no Vercel
if [ -f /etc/letsencrypt/live/sistemavng.com.br/fullchain.pem ]; then
    vercel certs add sistemavng.com.br \
        /etc/letsencrypt/live/sistemavng.com.br/fullchain.pem \
        /etc/letsencrypt/live/sistemavng.com.br/privkey.pem
fi
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Certificado Não Válido
```bash
# Verificar configuração DNS
dig sistemavng.com.br

# Verificar se domínio aponta para Vercel
nslookup sistemavng.com.br
```

#### 2. Mixed Content Warnings
```javascript
// Forçar HTTPS em todas as requisições
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
}
```

#### 3. Certificado Expirado
```bash
# Verificar data de expiração
openssl x509 -in cert.pem -noout -enddate

# Renovar certificado
certbot renew --force-renewal
```

## 📊 Monitoramento e Alertas

### 1. Configurar Alertas

#### Uptime Robot
```bash
# Configurar monitoramento em:
# https://uptimerobot.com/
# URL: https://sistemavng.com.br
# Tipo: HTTPS
# Intervalo: 5 minutos
```

#### StatusCake
```bash
# Configurar em:
# https://www.statuscake.com/
# Incluir verificação SSL
```

### 2. Logs e Métricas

```bash
# Ver logs do Vercel
vercel logs --function=api

# Monitorar métricas SSL
# Use ferramentas como:
# - Pingdom
# - New Relic
# - DataDog
```

## 🔐 Melhores Práticas

### 1. Configuração Segura

- ✅ Use sempre HTTPS
- ✅ Configure HSTS
- ✅ Implemente CSP
- ✅ Use certificados válidos
- ✅ Monitore expiração

### 2. Headers de Segurança

```javascript
// Configuração completa de headers
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
}
```

### 3. Testes Regulares

```bash
# Script de teste semanal
#!/bin/bash
# weekly-ssl-check.sh

echo "Verificando SSL para sistemavng.com.br..."

# Teste básico
curl -f -s https://sistemavng.com.br > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ HTTPS funcionando"
else
    echo "❌ HTTPS com problemas"
fi

# Verificar certificado
DAYS=$(echo | openssl s_client -servername sistemavng.com.br -connect sistemavng.com.br:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2 | xargs -I {} date -d {} +%s | xargs -I {} expr \( {} - $(date +%s) \) / 86400)

echo "Certificado expira em: $DAYS dias"

if [ $DAYS -lt 30 ]; then
    echo "⚠️  Certificado expira em breve!"
fi
```

## 📞 Suporte

### Recursos
- [Vercel SSL Docs](https://vercel.com/docs/concepts/projects/custom-domains#ssl)
- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs](https://www.ssllabs.com/)
- [Mozilla SSL Config](https://ssl-config.mozilla.org/)

### Contato
- Email: suporte@sistemavng.com.br
- Emergência SSL: +55 11 99999-9999

---

## ✅ Checklist SSL

### Configuração Inicial
- [ ] Domínio adicionado no Vercel
- [ ] DNS configurado corretamente
- [ ] Certificado SSL ativo
- [ ] HTTPS funcionando

### Segurança
- [ ] Headers de segurança configurados
- [ ] HSTS habilitado
- [ ] Redirecionamento HTTP -> HTTPS
- [ ] CSP configurado

### Monitoramento
- [ ] Alertas de expiração configurados
- [ ] Monitoramento de uptime ativo
- [ ] Logs sendo coletados
- [ ] Testes automatizados

### Manutenção
- [ ] Renovação automática configurada
- [ ] Backup dos certificados
- [ ] Documentação atualizada
- [ ] Equipe treinada