#!/bin/bash

# =============================================================================
# SCRIPT DE CONFIGURAÇÃO PARA PRODUÇÃO - SISTEMA VNG V3
# =============================================================================

set -e

echo "🚀 Iniciando configuração de produção do Sistema VNG v3..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se o Vercel CLI está instalado
check_vercel_cli() {
    print_status "Verificando Vercel CLI..."
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI não encontrado. Instalando..."
        npm install -g vercel
    else
        print_success "Vercel CLI encontrado"
    fi
}

# Fazer login no Vercel
vercel_login() {
    print_status "Fazendo login no Vercel..."
    vercel login
}

# Configurar variáveis de ambiente no Vercel
setup_environment_variables() {
    print_status "Configurando variáveis de ambiente no Vercel..."
    
    # Variáveis básicas
    print_status "Configurando variáveis básicas..."
    
    # NEXTAUTH_URL
    read -p "Digite a URL de produção (ex: https://sistemavng.com.br): " NEXTAUTH_URL
    vercel env add NEXTAUTH_URL production <<< "$NEXTAUTH_URL"
    
    # NEXTAUTH_SECRET
    print_status "Gerando NEXTAUTH_SECRET..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
    print_success "NEXTAUTH_SECRET gerado e configurado"
    
    # Supabase
    print_status "Configurando Supabase..."
    read -p "Digite a URL do Supabase: " SUPABASE_URL
    read -p "Digite a chave pública (anon key) do Supabase: " SUPABASE_ANON_KEY
    read -p "Digite a chave de serviço do Supabase: " SUPABASE_SERVICE_KEY
    
    vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$SUPABASE_URL"
    vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
    vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_KEY"
    
    # Bling API
    print_status "Configurando Bling API..."
    read -p "Digite o CLIENT_ID do Bling: " BLING_CLIENT_ID
    read -p "Digite o CLIENT_SECRET do Bling: " BLING_CLIENT_SECRET
    
    vercel env add BLING_CLIENT_ID production <<< "$BLING_CLIENT_ID"
    vercel env add BLING_CLIENT_SECRET production <<< "$BLING_CLIENT_SECRET"
    vercel env add BLING_REDIRECT_URI production <<< "${NEXTAUTH_URL}/api/auth/bling/callback"
    vercel env add BLING_API_URL production <<< "https://www.bling.com.br/Api/v3"
    
    # Configurações de segurança
    print_status "Configurando segurança..."
    vercel env add ALLOWED_ORIGINS production <<< "$NEXTAUTH_URL"
    vercel env add CORS_ORIGIN production <<< "$NEXTAUTH_URL"
    
    print_success "Variáveis de ambiente configuradas com sucesso!"
}

# Configurar domínio personalizado
setup_custom_domain() {
    print_status "Configurando domínio personalizado..."
    read -p "Digite o domínio (ex: sistemavng.com.br): " DOMAIN
    
    print_status "Adicionando domínio ao projeto..."
    vercel domains add "$DOMAIN"
    
    print_warning "Certifique-se de configurar os registros DNS:"
    echo "  - Tipo: CNAME"
    echo "  - Nome: @ (ou www)"
    echo "  - Valor: cname.vercel-dns.com"
    
    read -p "Pressione Enter após configurar o DNS..."
    
    print_success "Domínio configurado!"
}

# Deploy para produção
deploy_to_production() {
    print_status "Fazendo deploy para produção..."
    
    # Build do projeto
    print_status "Fazendo build do projeto..."
    npm run build
    
    # Deploy
    print_status "Fazendo deploy..."
    vercel --prod
    
    print_success "Deploy realizado com sucesso!"
}

# Verificar saúde da aplicação
health_check() {
    print_status "Verificando saúde da aplicação..."
    
    read -p "Digite a URL da aplicação para verificar: " APP_URL
    
    if curl -f -s "$APP_URL" > /dev/null; then
        print_success "Aplicação está respondendo corretamente!"
    else
        print_error "Aplicação não está respondendo. Verifique os logs."
    fi
}

# Configurar monitoramento (opcional)
setup_monitoring() {
    print_status "Configurando monitoramento..."
    
    read -p "Deseja configurar Sentry para monitoramento? (y/n): " SETUP_SENTRY
    
    if [[ $SETUP_SENTRY == "y" || $SETUP_SENTRY == "Y" ]]; then
        read -p "Digite o DSN do Sentry: " SENTRY_DSN
        vercel env add SENTRY_DSN production <<< "$SENTRY_DSN"
        print_success "Sentry configurado!"
    fi
    
    # Configurar nível de log
    vercel env add LOG_LEVEL production <<< "info"
    print_success "Monitoramento configurado!"
}

# Menu principal
main_menu() {
    echo ""
    echo "============================================================================="
    echo "                    CONFIGURAÇÃO DE PRODUÇÃO - SISTEMA VNG V3"
    echo "============================================================================="
    echo ""
    echo "Escolha uma opção:"
    echo "1. Configuração completa (recomendado para primeira vez)"
    echo "2. Apenas variáveis de ambiente"
    echo "3. Apenas domínio personalizado"
    echo "4. Apenas deploy"
    echo "5. Verificação de saúde"
    echo "6. Configurar monitoramento"
    echo "7. Sair"
    echo ""
    read -p "Digite sua escolha (1-7): " choice
    
    case $choice in
        1)
            check_vercel_cli
            vercel_login
            setup_environment_variables
            setup_custom_domain
            deploy_to_production
            setup_monitoring
            health_check
            print_success "Configuração completa finalizada!"
            ;;
        2)
            check_vercel_cli
            vercel_login
            setup_environment_variables
            ;;
        3)
            check_vercel_cli
            vercel_login
            setup_custom_domain
            ;;
        4)
            check_vercel_cli
            deploy_to_production
            ;;
        5)
            health_check
            ;;
        6)
            check_vercel_cli
            vercel_login
            setup_monitoring
            ;;
        7)
            print_success "Saindo..."
            exit 0
            ;;
        *)
            print_error "Opção inválida. Tente novamente."
            main_menu
            ;;
    esac
}

# Verificar pré-requisitos
check_prerequisites() {
    print_status "Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado. Instale Node.js 18+ antes de continuar."
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não encontrado. Instale npm antes de continuar."
        exit 1
    fi
    
    # Verificar se está no diretório correto
    if [[ ! -f "package.json" ]]; then
        print_error "package.json não encontrado. Execute este script no diretório raiz do projeto."
        exit 1
    fi
    
    print_success "Pré-requisitos verificados!"
}

# Função principal
main() {
    clear
    check_prerequisites
    main_menu
}

# Executar função principal
main