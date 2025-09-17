# Sistema VNG v3

Sistema de gestão empresarial integrado com Bling API V3, desenvolvido com Next.js 14, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Dashboard Completo**: Visão geral com métricas e estatísticas
- **Gestão de Pedidos**: Integração completa com Bling API V3
- **Sistema de Tickets**: Gerenciamento de suporte e atendimento
- **Controle de Usuários**: Sistema RBAC (Role-Based Access Control)
- **Autenticação**: Login/logout com Supabase Auth
- **Interface Responsiva**: Design moderno com Tailwind CSS

### 🎯 Principais Recursos
- **Sincronização Automática**: Dados sempre atualizados com o Bling
- **Controle de Permissões**: 3 níveis de acesso (Admin, Líder, Operador)
- **Dashboard Interativo**: Gráficos e métricas em tempo real
- **Sistema de Filtros**: Busca avançada em todos os módulos
- **Notificações**: Alertas e atualizações em tempo real

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL)
- **API**: Bling API V3
- **Deploy**: Vercel
- **Domínio**: sistemavng.com.br

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Conta no Bling (API V3)
- Domínio configurado (sistemavng.com.br)

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/sistemavng-v3.git
cd sistemavng-v3
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

#### Desenvolvimento (.env.local)
```env
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Bling API V3
BLING_CLIENT_ID=your-bling-client-id
BLING_CLIENT_SECRET=your-bling-client-secret
BLING_REDIRECT_URI=http://localhost:3000/api/auth/bling/callback
```

#### Produção (.env.production)
```env
# Next.js
NEXTAUTH_URL=https://sistemavng.com.br
NEXTAUTH_SECRET=your-production-nextauth-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Bling API V3
BLING_CLIENT_ID=your-bling-client-id
BLING_CLIENT_SECRET=your-bling-client-secret
BLING_REDIRECT_URI=https://sistemavng.com.br/api/auth/bling/callback
```

### 4. Configure o banco de dados

Execute os scripts SQL no Supabase para criar as tabelas necessárias:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'operador',
  company_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bling_id BIGINT UNIQUE,
  number VARCHAR(50),
  status VARCHAR(50),
  total DECIMAL(10,2),
  customer_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de tickets
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'aberto',
  priority VARCHAR(50) DEFAULT 'media',
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Execute o projeto

#### Desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

#### Produção
```bash
npm run build
npm start
# ou
yarn build
yarn start
```

## 🌐 Deploy

### Vercel (Recomendado)

1. **Conecte o repositório ao Vercel**
2. **Configure as variáveis de ambiente** no painel do Vercel
3. **Configure o domínio personalizado**: sistemavng.com.br
4. **Deploy automático** a cada push na branch main

### Configuração do Domínio

1. **DNS**: Aponte o domínio para os servidores do Vercel
2. **SSL**: Certificado automático via Let's Encrypt
3. **CDN**: Distribuição global automática

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Páginas do dashboard
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes de interface
│   └── rbac/             # Componentes de controle de acesso
├── lib/                  # Utilitários e configurações
│   └── services/         # Serviços de API
├── types/                # Definições TypeScript
└── hooks/                # Custom Hooks
```

## 🔐 Sistema RBAC

### Níveis de Acesso

1. **Admin**: Acesso total ao sistema
2. **Líder**: Gerenciamento de equipe e relatórios
3. **Operador**: Acesso básico às funcionalidades

### Permissões

- `orders.read` - Visualizar pedidos
- `orders.write` - Criar/editar pedidos
- `tickets.read` - Visualizar tickets
- `tickets.write` - Criar/editar tickets
- `users.read` - Visualizar usuários
- `users.write` - Gerenciar usuários

## 🔗 Integração Bling API V3

### Endpoints Utilizados

- `/pedidos` - Gestão de pedidos
- `/contatos` - Gestão de clientes
- `/produtos` - Catálogo de produtos
- `/situacoes` - Status dos pedidos

### Sincronização

- **Automática**: A cada 5 minutos
- **Manual**: Botão de sincronização
- **Webhook**: Atualizações em tempo real

## 📊 Monitoramento

### Métricas Disponíveis

- Total de pedidos
- Faturamento mensal
- Tickets abertos
- Performance da API

### Logs

- Erros de API
- Ações de usuários
- Sincronizações
- Autenticação

## 🛡️ Segurança

### Implementações

- **HTTPS**: Certificado SSL obrigatório
- **CORS**: Configurado para domínio específico
- **Headers de Segurança**: CSP, HSTS, etc.
- **Rate Limiting**: Proteção contra spam
- **Validação**: Sanitização de dados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: suporte@sistemavng.com.br
- **Documentação**: [docs.sistemavng.com.br](https://docs.sistemavng.com.br)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/sistemavng-v3/issues)

## 🔄 Changelog

### v3.0.0 (2024-01-XX)
- ✅ Integração completa com Bling API V3
- ✅ Sistema RBAC implementado
- ✅ Dashboard interativo
- ✅ Gestão de pedidos e tickets
- ✅ Deploy em produção (sistemavng.com.br)

---

**Sistema VNG v3** - Desenvolvido com ❤️ para otimizar sua gestão empresarial.
