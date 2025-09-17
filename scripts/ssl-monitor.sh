#!/bin/bash

# =============================================================================
# SCRIPT DE MONITORAMENTO SSL - SISTEMA VNG V3
# =============================================================================

set -e

# Configurações
DOMAIN="sistemavng.com.br"
ALERT_DAYS=30
LOG_FILE="/var/log/ssl-monitor.log"
EMAIL_ALERT="admin@sistemavng.com.br"
WEBHOOK_URL=""  # Slack/Discord webhook (opcional)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log_message "INFO" "$1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log_message "SUCCESS" "$1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log_message "WARNING" "$1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_message "ERROR" "$1"
}

# Função para enviar alertas por email
send_email_alert() {
    local subject=$1
    local message=$2
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$EMAIL_ALERT"
        print_status "Alerta enviado por email para $EMAIL_ALERT"
    else
        print_warning "Comando 'mail' não encontrado. Instale mailutils para alertas por email."
    fi
}

# Função para enviar webhook (Slack/Discord)
send_webhook_alert() {
    local message=$1
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🔒 SSL Monitor - $message\"}" \
            "$WEBHOOK_URL" &> /dev/null
        print_status "Alerta enviado via webhook"
    fi
}

# Verificar se o domínio está acessível
check_domain_accessibility() {
    print_status "Verificando acessibilidade do domínio $DOMAIN..."
    
    if curl -f -s --max-time 10 "https://$DOMAIN" > /dev/null; then
        print_success "Domínio $DOMAIN está acessível via HTTPS"
        return 0
    else
        print_error "Domínio $DOMAIN não está acessível via HTTPS"
        return 1
    fi
}

# Verificar certificado SSL
check_ssl_certificate() {
    print_status "Verificando certificado SSL para $DOMAIN..."
    
    # Obter informações do certificado
    local cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null)
    
    if [[ -z "$cert_info" ]]; then
        print_error "Não foi possível obter informações do certificado SSL"
        return 1
    fi
    
    # Extrair data de expiração
    local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
    local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( ($expiry_timestamp - $current_timestamp) / 86400 ))
    
    # Extrair informações do certificado
    local subject=$(echo "$cert_info" | grep "subject" | cut -d= -f2-)
    local issuer=$(echo "$cert_info" | grep "issuer" | cut -d= -f2-)
    
    print_status "Informações do Certificado:"
    echo "  Subject: $subject"
    echo "  Issuer: $issuer"
    echo "  Expira em: $expiry_date"
    echo "  Dias até expiração: $days_until_expiry"
    
    # Verificar se está próximo da expiração
    if [[ $days_until_expiry -lt $ALERT_DAYS ]]; then
        local alert_message="⚠️ ALERTA: Certificado SSL para $DOMAIN expira em $days_until_expiry dias!"
        print_warning "$alert_message"
        
        # Enviar alertas
        send_email_alert "SSL Certificate Expiring Soon - $DOMAIN" "$alert_message"
        send_webhook_alert "$alert_message"
        
        return 2
    elif [[ $days_until_expiry -lt 0 ]]; then
        local alert_message="🚨 CRÍTICO: Certificado SSL para $DOMAIN EXPIROU há $((-$days_until_expiry)) dias!"
        print_error "$alert_message"
        
        # Enviar alertas críticos
        send_email_alert "SSL Certificate EXPIRED - $DOMAIN" "$alert_message"
        send_webhook_alert "$alert_message"
        
        return 3
    else
        print_success "Certificado SSL válido por mais $days_until_expiry dias"
        return 0
    fi
}

# Verificar headers de segurança
check_security_headers() {
    print_status "Verificando headers de segurança..."
    
    local headers=$(curl -I -s --max-time 10 "https://$DOMAIN" 2>/dev/null)
    
    if [[ -z "$headers" ]]; then
        print_error "Não foi possível obter headers HTTP"
        return 1
    fi
    
    # Lista de headers de segurança esperados
    local security_headers=(
        "strict-transport-security"
        "x-frame-options"
        "x-content-type-options"
        "x-xss-protection"
        "referrer-policy"
    )
    
    local missing_headers=()
    
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -i "$header" > /dev/null; then
            print_success "Header $header presente"
        else
            print_warning "Header $header ausente"
            missing_headers+=("$header")
        fi
    done
    
    if [[ ${#missing_headers[@]} -gt 0 ]]; then
        local alert_message="Headers de segurança ausentes em $DOMAIN: ${missing_headers[*]}"
        print_warning "$alert_message"
        send_webhook_alert "$alert_message"
        return 1
    else
        print_success "Todos os headers de segurança estão presentes"
        return 0
    fi
}

# Verificar redirecionamento HTTP para HTTPS
check_https_redirect() {
    print_status "Verificando redirecionamento HTTP -> HTTPS..."
    
    local redirect_response=$(curl -I -s --max-time 10 "http://$DOMAIN" 2>/dev/null)
    
    if echo "$redirect_response" | grep -i "location.*https" > /dev/null; then
        print_success "Redirecionamento HTTP -> HTTPS funcionando"
        return 0
    else
        print_warning "Redirecionamento HTTP -> HTTPS não configurado ou não funcionando"
        return 1
    fi
}

# Teste de performance SSL
ssl_performance_test() {
    print_status "Testando performance SSL..."
    
    local start_time=$(date +%s%N)
    
    if curl -f -s --max-time 10 "https://$DOMAIN" > /dev/null; then
        local end_time=$(date +%s%N)
        local duration=$(( ($end_time - $start_time) / 1000000 )) # Convert to milliseconds
        
        print_success "Conexão SSL estabelecida em ${duration}ms"
        
        if [[ $duration -gt 3000 ]]; then
            print_warning "Conexão SSL lenta (>${duration}ms)"
            return 1
        fi
        
        return 0
    else
        print_error "Falha na conexão SSL"
        return 1
    fi
}

# Verificar configuração TLS
check_tls_configuration() {
    print_status "Verificando configuração TLS..."
    
    # Verificar versões TLS suportadas
    local tls_versions=("1.2" "1.3")
    
    for version in "${tls_versions[@]}"; do
        if echo | openssl s_client -tls$version -connect "$DOMAIN:443" 2>/dev/null | grep -q "Verify return code: 0"; then
            print_success "TLS $version suportado"
        else
            print_warning "TLS $version não suportado ou com problemas"
        fi
    done
    
    # Verificar se TLS 1.0 e 1.1 estão desabilitados (boa prática)
    local old_tls_versions=("1.0" "1.1")
    
    for version in "${old_tls_versions[@]}"; do
        if echo | openssl s_client -tls$version -connect "$DOMAIN:443" 2>/dev/null | grep -q "Verify return code: 0"; then
            print_warning "TLS $version ainda habilitado (recomenda-se desabilitar)"
        else
            print_success "TLS $version desabilitado (boa prática)"
        fi
    done
}

# Gerar relatório
generate_report() {
    local report_file="/tmp/ssl-report-$(date +%Y%m%d-%H%M%S).txt"
    
    print_status "Gerando relatório em $report_file..."
    
    {
        echo "============================================================================="
        echo "RELATÓRIO DE MONITORAMENTO SSL - $(date)"
        echo "============================================================================="
        echo ""
        echo "Domínio: $DOMAIN"
        echo "Data/Hora: $(date)"
        echo ""
        
        # Executar todos os testes e capturar resultados
        echo "1. ACESSIBILIDADE DO DOMÍNIO"
        check_domain_accessibility && echo "✅ PASSOU" || echo "❌ FALHOU"
        echo ""
        
        echo "2. CERTIFICADO SSL"
        check_ssl_certificate
        case $? in
            0) echo "✅ PASSOU" ;;
            2) echo "⚠️ AVISO - EXPIRA EM BREVE" ;;
            3) echo "🚨 CRÍTICO - EXPIRADO" ;;
            *) echo "❌ FALHOU" ;;
        esac
        echo ""
        
        echo "3. HEADERS DE SEGURANÇA"
        check_security_headers && echo "✅ PASSOU" || echo "⚠️ AVISO"
        echo ""
        
        echo "4. REDIRECIONAMENTO HTTPS"
        check_https_redirect && echo "✅ PASSOU" || echo "⚠️ AVISO"
        echo ""
        
        echo "5. PERFORMANCE SSL"
        ssl_performance_test && echo "✅ PASSOU" || echo "⚠️ AVISO"
        echo ""
        
        echo "6. CONFIGURAÇÃO TLS"
        check_tls_configuration
        echo "✅ VERIFICADO"
        echo ""
        
        echo "============================================================================="
        echo "FIM DO RELATÓRIO"
        echo "============================================================================="
        
    } > "$report_file"
    
    print_success "Relatório gerado: $report_file"
    
    # Enviar relatório por email se configurado
    if [[ -n "$EMAIL_ALERT" ]]; then
        send_email_alert "SSL Monitoring Report - $DOMAIN" "$(cat $report_file)"
    fi
}

# Função principal
main() {
    echo "============================================================================="
    echo "                    MONITORAMENTO SSL - SISTEMA VNG V3"
    echo "============================================================================="
    echo ""
    
    # Criar diretório de log se não existir
    mkdir -p "$(dirname "$LOG_FILE")"
    
    print_status "Iniciando monitoramento SSL para $DOMAIN..."
    
    local overall_status=0
    
    # Executar verificações
    check_domain_accessibility || overall_status=1
    
    check_ssl_certificate
    local cert_status=$?
    if [[ $cert_status -gt $overall_status ]]; then
        overall_status=$cert_status
    fi
    
    check_security_headers || overall_status=1
    check_https_redirect || overall_status=1
    ssl_performance_test || overall_status=1
    check_tls_configuration
    
    echo ""
    echo "============================================================================="
    
    case $overall_status in
        0)
            print_success "✅ Todos os testes SSL passaram com sucesso!"
            ;;
        1)
            print_warning "⚠️ Alguns testes falharam, mas o SSL está funcionando"
            ;;
        2)
            print_warning "⚠️ Certificado SSL expira em breve - ação necessária"
            ;;
        3)
            print_error "🚨 Certificado SSL expirado - ação imediata necessária!"
            ;;
    esac
    
    echo "============================================================================="
    
    # Gerar relatório se solicitado
    if [[ "$1" == "--report" ]]; then
        generate_report
    fi
    
    exit $overall_status
}

# Verificar argumentos
case "$1" in
    --help|-h)
        echo "Uso: $0 [opções]"
        echo ""
        echo "Opções:"
        echo "  --report    Gerar relatório detalhado"
        echo "  --help      Mostrar esta ajuda"
        echo ""
        echo "Configurações:"
        echo "  DOMAIN: $DOMAIN"
        echo "  ALERT_DAYS: $ALERT_DAYS"
        echo "  LOG_FILE: $LOG_FILE"
        echo "  EMAIL_ALERT: $EMAIL_ALERT"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac