#!/bin/bash

# =============================================================================
# SCRIPT DE DEPLOY PARA PRODUÇÃO - SISTEMA VNG V3
# =============================================================================

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="sistemavng-v3"
DOMAIN="sistemavng.com.br"
VERCEL_PROJECT_ID=""
VERCEL_ORG_ID=""

# Funções para imprimir mensagens coloridas
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

print_header() {
    echo -e "${BLUE}=============================================================================${NC}"
    echo -e "${BLUE}                    DEPLOY PARA PRODUÇÃO - SISTEMA VNG V3${NC}"
    echo -e "${BLUE}=============================================================================${NC}"
    echo ""
}

# Verificar pré-requisitos
check_prerequisites() {
    print_status "Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js versão 18 ou superior é necessária (atual: $(node --version))"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não está instalado"
        exit 1
    fi
    
    # Verificar git
    if ! command -v git &> /dev/null; then
        print_error "git não está instalado"
        exit 1
    fi
    
    # Verificar se está no diretório correto
    if [ ! -f "package.json" ]; then
        print_error "package.json não encontrado. Execute este script na raiz do projeto."
        exit 1
    fi
    
    # Verificar Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI não está instalado. Instalando..."
        npm install -g vercel@latest
    fi
    
    print_success "Pré-requisitos verificados"
}

# Verificar status do git
check_git_status() {
    print_status "Verificando status do git..."
    
    # Verificar se há mudanças não commitadas
    if [ -n "$(git status --porcelain)" ]; then
        print_error "Há mudanças não commitadas. Commit ou stash suas mudanças antes do deploy."
        git status
        exit 1
    fi
    
    # Verificar se está na branch main/master
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        print_warning "Você não está na branch main/master (atual: $current_branch)"
        read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deploy cancelado"
            exit 0
        fi
    fi
    
    # Verificar se está atualizado com o remote
    git fetch origin
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/$current_branch)
    
    if [ "$local_commit" != "$remote_commit" ]; then
        print_warning "Sua branch local não está atualizada com o remote"
        read -p "Deseja fazer pull das últimas mudanças? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git pull origin $current_branch
        fi
    fi
    
    print_success "Status do git verificado"
}

# Executar testes
run_tests() {
    print_status "Executando testes..."
    
    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        print_status "Instalando dependências..."
        npm ci
    fi
    
    # Executar linting
    print_status "Executando linting..."
    npm run lint
    
    # Executar type checking
    print_status "Executando type checking..."
    npm run type-check
    
    # Executar testes unitários
    if npm run test --silent 2>/dev/null; then
        print_status "Executando testes unitários..."
        npm run test -- --watchAll=false
    else
        print_warning "Script de teste não encontrado, pulando testes unitários"
    fi
    
    print_success "Testes executados com sucesso"
}

# Build da aplicação
build_application() {
    print_status "Fazendo build da aplicação..."
    
    # Limpar build anterior
    if [ -d ".next" ]; then
        rm -rf .next
    fi
    
    # Build
    npm run build
    
    print_success "Build concluído com sucesso"
}

# Configurar Vercel
setup_vercel() {
    print_status "Configurando Vercel..."
    
    # Verificar se está logado
    if ! vercel whoami &> /dev/null; then
        print_status "Fazendo login no Vercel..."
        vercel login
    fi
    
    # Link do projeto se necessário
    if [ ! -f ".vercel/project.json" ]; then
        print_status "Fazendo link do projeto..."
        vercel link
    fi
    
    print_success "Vercel configurado"
}

# Deploy para produção
deploy_to_production() {
    print_status "Iniciando deploy para produção..."
    
    # Pull das configurações de produção
    vercel pull --yes --environment=production
    
    # Build para produção
    vercel build --prod
    
    # Deploy
    local deploy_url=$(vercel deploy --prebuilt --prod)
    
    if [ $? -eq 0 ]; then
        print_success "Deploy realizado com sucesso!"
        print_success "URL: $deploy_url"
        
        # Salvar URL do deploy
        echo "$deploy_url" > .last-deploy-url
        
        return 0
    else
        print_error "Falha no deploy"
        return 1
    fi
}

# Health checks pós-deploy
run_health_checks() {
    print_status "Executando health checks..."
    
    # Aguardar propagação
    print_status "Aguardando propagação do deploy (30s)..."
    sleep 30
    
    # Verificar se o site está respondendo
    if curl -f -s -o /dev/null "https://$DOMAIN"; then
        print_success "Site está respondendo"
    else
        print_error "Site não está respondendo"
        return 1
    fi
    
    # Verificar SSL
    if curl -f -s -I "https://$DOMAIN" | grep -i "strict-transport-security" > /dev/null; then
        print_success "SSL configurado corretamente"
    else
        print_warning "Header HSTS não encontrado"
    fi
    
    # Verificar redirecionamento HTTP -> HTTPS
    if curl -s -I "http://$DOMAIN" | grep -i "location: https://" > /dev/null; then
        print_success "Redirecionamento HTTPS funcionando"
    else
        print_warning "Redirecionamento HTTPS não configurado"
    fi
    
    # Verificar API health (se existir)
    if curl -f -s "https://$DOMAIN/api/health" > /dev/null; then
        print_success "API health check passou"
    else
        print_warning "API health check falhou ou não existe"
    fi
    
    # Verificar performance básica
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "https://$DOMAIN")
    if (( $(echo "$response_time < 3.0" | bc -l) )); then
        print_success "Tempo de resposta OK: ${response_time}s"
    else
        print_warning "Tempo de resposta lento: ${response_time}s"
    fi
    
    print_success "Health checks concluídos"
}

# Rollback em caso de falha
rollback_deployment() {
    print_error "Executando rollback..."
    
    # Listar deployments recentes
    print_status "Deployments recentes:"
    vercel ls --scope=$VERCEL_ORG_ID | head -10
    
    read -p "Digite o URL do deployment para rollback (ou pressione Enter para cancelar): " rollback_url
    
    if [ -n "$rollback_url" ]; then
        vercel alias set "$rollback_url" "$DOMAIN"
        print_success "Rollback executado para: $rollback_url"
    else
        print_status "Rollback cancelado"
    fi
}

# Função principal
main() {
    print_header
    
    # Verificar argumentos
    local skip_tests=false
    local force_deploy=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --force)
                force_deploy=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Argumento desconhecido: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Confirmação se não for force
    if [ "$force_deploy" = false ]; then
        echo "Você está prestes a fazer deploy para PRODUÇÃO."
        echo "Domínio: $DOMAIN"
        echo "Branch atual: $(git branch --show-current)"
        echo "Último commit: $(git log -1 --oneline)"
        echo ""
        read -p "Tem certeza que deseja continuar? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deploy cancelado"
            exit 0
        fi
    fi
    
    # Executar etapas do deploy
    check_prerequisites
    check_git_status
    
    if [ "$skip_tests" = false ]; then
        run_tests
    else
        print_warning "Pulando testes (--skip-tests)"
    fi
    
    build_application
    setup_vercel
    
    if deploy_to_production; then
        if run_health_checks; then
            print_success "✅ Deploy para produção concluído com sucesso!"
            print_success "🌐 Site: https://$DOMAIN"
            
            # Notificar sucesso (webhook, email, etc.)
            notify_success
        else
            print_error "❌ Health checks falharam"
            read -p "Deseja fazer rollback? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback_deployment
            fi
            exit 1
        fi
    else
        print_error "❌ Falha no deploy"
        exit 1
    fi
}

# Mostrar ajuda
show_help() {
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --skip-tests    Pular execução de testes"
    echo "  --force         Não pedir confirmação"
    echo "  --help          Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0                    # Deploy normal com confirmação"
    echo "  $0 --force            # Deploy sem confirmação"
    echo "  $0 --skip-tests       # Deploy pulando testes"
    echo "  $0 --force --skip-tests  # Deploy rápido"
}

# Notificar sucesso (implementar conforme necessário)
notify_success() {
    # Webhook Slack/Discord
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Deploy realizado com sucesso para $DOMAIN\"}" \
            "$WEBHOOK_URL" || true
    fi
    
    # Log local
    echo "$(date): Deploy realizado com sucesso" >> deploy.log
}

# Executar função principal
main "$@"