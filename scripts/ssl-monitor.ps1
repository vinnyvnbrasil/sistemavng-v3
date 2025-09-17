# =============================================================================
# SCRIPT DE MONITORAMENTO SSL - SISTEMA VNG V3 (PowerShell)
# =============================================================================

param(
    [switch]$Report,
    [switch]$Help,
    [string]$Domain = "sistemavng.com.br",
    [int]$AlertDays = 30,
    [string]$LogFile = "$env:TEMP\ssl-monitor.log",
    [string]$EmailAlert = "admin@sistemavng.com.br",
    [string]$WebhookUrl = ""
)

# Configurar política de execução se necessário
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Cores para output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Função para logging
function Write-LogMessage {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Escrever no console e no arquivo de log
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

# Funções para imprimir mensagens coloridas
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
    Write-LogMessage -Level "INFO" -Message $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
    Write-LogMessage -Level "SUCCESS" -Message $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
    Write-LogMessage -Level "WARNING" -Message $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
    Write-LogMessage -Level "ERROR" -Message $Message
}

# Função para enviar alertas por email
function Send-EmailAlert {
    param(
        [string]$Subject,
        [string]$Message
    )
    
    if ($EmailAlert) {
        try {
            # Configurar e enviar email (requer configuração SMTP)
            $smtpServer = "smtp.gmail.com"  # Configurar conforme necessário
            $smtpPort = 587
            
            # Nota: Configurar credenciais SMTP conforme necessário
            Write-Status "Funcionalidade de email requer configuração SMTP adicional"
            Write-Status "Alerta que seria enviado: $Subject - $Message"
        }
        catch {
            Write-Warning "Erro ao enviar email: $($_.Exception.Message)"
        }
    }
}

# Função para enviar webhook (Slack/Discord)
function Send-WebhookAlert {
    param([string]$Message)
    
    if ($WebhookUrl) {
        try {
            $body = @{
                text = "🔒 SSL Monitor - $Message"
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $body -ContentType "application/json"
            Write-Status "Alerta enviado via webhook"
        }
        catch {
            Write-Warning "Erro ao enviar webhook: $($_.Exception.Message)"
        }
    }
}

# Verificar se o domínio está acessível
function Test-DomainAccessibility {
    Write-Status "Verificando acessibilidade do domínio $Domain..."
    
    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -Method Get -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Domínio $Domain está acessível via HTTPS"
            return $true
        }
        else {
            Write-Error "Domínio $Domain retornou status: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Error "Domínio $Domain não está acessível via HTTPS: $($_.Exception.Message)"
        return $false
    }
}

# Verificar certificado SSL
function Test-SSLCertificate {
    Write-Status "Verificando certificado SSL para $Domain..."
    
    try {
        # Usar .NET para obter informações do certificado
        $request = [System.Net.WebRequest]::Create("https://$Domain")
        $request.Timeout = 10000
        
        $response = $request.GetResponse()
        $cert = $request.ServicePoint.Certificate
        
        if ($cert) {
            $cert2 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($cert)
            
            $subject = $cert2.Subject
            $issuer = $cert2.Issuer
            $expiryDate = $cert2.NotAfter
            $currentDate = Get-Date
            $daysUntilExpiry = ($expiryDate - $currentDate).Days
            
            Write-Status "Informações do Certificado:"
            Write-Host "  Subject: $subject" -ForegroundColor $Colors.White
            Write-Host "  Issuer: $issuer" -ForegroundColor $Colors.White
            Write-Host "  Expira em: $expiryDate" -ForegroundColor $Colors.White
            Write-Host "  Dias até expiração: $daysUntilExpiry" -ForegroundColor $Colors.White
            
            # Verificar se está próximo da expiração
            if ($daysUntilExpiry -lt $AlertDays -and $daysUntilExpiry -gt 0) {
                $alertMessage = "⚠️ ALERTA: Certificado SSL para $Domain expira em $daysUntilExpiry dias!"
                Write-Warning $alertMessage
                
                Send-EmailAlert -Subject "SSL Certificate Expiring Soon - $Domain" -Message $alertMessage
                Send-WebhookAlert -Message $alertMessage
                
                return 2
            }
            elseif ($daysUntilExpiry -le 0) {
                $alertMessage = "🚨 CRÍTICO: Certificado SSL para $Domain EXPIROU há $((-$daysUntilExpiry)) dias!"
                Write-Error $alertMessage
                
                Send-EmailAlert -Subject "SSL Certificate EXPIRED - $Domain" -Message $alertMessage
                Send-WebhookAlert -Message $alertMessage
                
                return 3
            }
            else {
                Write-Success "Certificado SSL válido por mais $daysUntilExpiry dias"
                return 0
            }
        }
        else {
            Write-Error "Não foi possível obter informações do certificado SSL"
            return 1
        }
    }
    catch {
        Write-Error "Erro ao verificar certificado SSL: $($_.Exception.Message)"
        return 1
    }
}

# Verificar headers de segurança
function Test-SecurityHeaders {
    Write-Status "Verificando headers de segurança..."
    
    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -Method Head -TimeoutSec 10 -ErrorAction Stop
        
        # Lista de headers de segurança esperados
        $securityHeaders = @(
            "Strict-Transport-Security",
            "X-Frame-Options",
            "X-Content-Type-Options",
            "X-XSS-Protection",
            "Referrer-Policy"
        )
        
        $missingHeaders = @()
        
        foreach ($header in $securityHeaders) {
            if ($response.Headers[$header]) {
                Write-Success "Header $header presente"
            }
            else {
                Write-Warning "Header $header ausente"
                $missingHeaders += $header
            }
        }
        
        if ($missingHeaders.Count -gt 0) {
            $alertMessage = "Headers de segurança ausentes em ${Domain}: $($missingHeaders -join ', ')"
            Write-Warning $alertMessage
            Send-WebhookAlert -Message $alertMessage
            return $false
        }
        else {
            Write-Success "Todos os headers de segurança estão presentes"
            return $true
        }
    }
    catch {
        Write-Error "Não foi possível obter headers HTTP: $($_.Exception.Message)"
        return $false
    }
}

# Verificar redirecionamento HTTP para HTTPS
function Test-HTTPSRedirect {
    Write-Status "Verificando redirecionamento HTTP -> HTTPS..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://$Domain" -Method Head -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction SilentlyContinue
        
        if ($response.Headers.Location -and $response.Headers.Location.StartsWith("https://")) {
            Write-Success "Redirecionamento HTTP -> HTTPS funcionando"
            return $true
        }
        else {
            Write-Warning "Redirecionamento HTTP -> HTTPS não configurado ou não funcionando"
            return $false
        }
    }
    catch {
        # Verificar se é um redirecionamento (código 3xx)
        if ($_.Exception.Response.StatusCode -match "3\d\d") {
            $location = $_.Exception.Response.Headers.Location
            if ($location -and $location.StartsWith("https://")) {
                Write-Success "Redirecionamento HTTP -> HTTPS funcionando"
                return $true
            }
        }
        
        Write-Warning "Redirecionamento HTTP -> HTTPS não configurado: $($_.Exception.Message)"
        return $false
    }
}

# Teste de performance SSL
function Test-SSLPerformance {
    Write-Status "Testando performance SSL..."
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        $response = Invoke-WebRequest -Uri "https://$Domain" -Method Head -TimeoutSec 10 -ErrorAction Stop
        
        $stopwatch.Stop()
        $duration = $stopwatch.ElapsedMilliseconds
        
        Write-Success "Conexão SSL estabelecida em ${duration}ms"
        
        if ($duration -gt 3000) {
            Write-Warning "Conexão SSL lenta (>${duration}ms)"
            return $false
        }
        
        return $true
    }
    catch {
        Write-Error "Falha na conexão SSL: $($_.Exception.Message)"
        return $false
    }
}

# Verificar configuração TLS
function Test-TLSConfiguration {
    Write-Status "Verificando configuração TLS..."
    
    try {
        # Verificar TLS usando .NET
        $request = [System.Net.WebRequest]::Create("https://$Domain")
        $request.Timeout = 10000
        
        # Forçar TLS 1.2 ou superior
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
        
        $response = $request.GetResponse()
        
        if ($response) {
            Write-Success "TLS 1.2+ suportado"
            $response.Close()
            return $true
        }
        else {
            Write-Warning "Problemas na configuração TLS"
            return $false
        }
    }
    catch {
        Write-Warning "Erro na verificação TLS: $($_.Exception.Message)"
        return $false
    }
}

# Gerar relatório
function New-Report {
    $reportFile = "$env:TEMP\ssl-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    
    Write-Status "Gerando relatório em $reportFile..."
    
    $reportContent = @"
=============================================================================
RELATÓRIO DE MONITORAMENTO SSL - $(Get-Date)
=============================================================================

Domínio: $Domain
Data/Hora: $(Get-Date)

1. ACESSIBILIDADE DO DOMÍNIO
$(if (Test-DomainAccessibility) { "✅ PASSOU" } else { "❌ FALHOU" })

2. CERTIFICADO SSL
"@

    $certStatus = Test-SSLCertificate
    $reportContent += switch ($certStatus) {
        0 { "✅ PASSOU" }
        2 { "⚠️ AVISO - EXPIRA EM BREVE" }
        3 { "🚨 CRÍTICO - EXPIRADO" }
        default { "❌ FALHOU" }
    }

    $reportContent += @"

3. HEADERS DE SEGURANÇA
$(if (Test-SecurityHeaders) { "✅ PASSOU" } else { "⚠️ AVISO" })

4. REDIRECIONAMENTO HTTPS
$(if (Test-HTTPSRedirect) { "✅ PASSOU" } else { "⚠️ AVISO" })

5. PERFORMANCE SSL
$(if (Test-SSLPerformance) { "✅ PASSOU" } else { "⚠️ AVISO" })

6. CONFIGURAÇÃO TLS
$(if (Test-TLSConfiguration) { "✅ PASSOU" } else { "⚠️ AVISO" })

=============================================================================
FIM DO RELATÓRIO
=============================================================================
"@

    Set-Content -Path $reportFile -Value $reportContent
    Write-Success "Relatório gerado: $reportFile"
    
    # Enviar relatório por email se configurado
    if ($EmailAlert) {
        Send-EmailAlert -Subject "SSL Monitoring Report - $Domain" -Message $reportContent
    }
    
    return $reportFile
}

# Mostrar ajuda
function Show-Help {
    Write-Host @"
Uso: .\ssl-monitor.ps1 [opções]

Opções:
  -Report         Gerar relatório detalhado
  -Help           Mostrar esta ajuda
  -Domain         Domínio a ser monitorado (padrão: sistemavng.com.br)
  -AlertDays      Dias antes da expiração para alertar (padrão: 30)
  -LogFile        Arquivo de log (padrão: %TEMP%\ssl-monitor.log)
  -EmailAlert     Email para alertas
  -WebhookUrl     URL do webhook para alertas

Exemplos:
  .\ssl-monitor.ps1
  .\ssl-monitor.ps1 -Report
  .\ssl-monitor.ps1 -Domain "exemplo.com" -AlertDays 15
  .\ssl-monitor.ps1 -WebhookUrl "https://hooks.slack.com/..."

Configurações atuais:
  Domínio: $Domain
  Dias de alerta: $AlertDays
  Arquivo de log: $LogFile
  Email de alerta: $EmailAlert
"@ -ForegroundColor $Colors.White
}

# Função principal
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "=============================================================================" -ForegroundColor $Colors.Blue
    Write-Host "                    MONITORAMENTO SSL - SISTEMA VNG V3" -ForegroundColor $Colors.Blue
    Write-Host "=============================================================================" -ForegroundColor $Colors.Blue
    Write-Host ""
    
    # Criar diretório de log se não existir
    $logDir = Split-Path -Parent $LogFile
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    Write-Status "Iniciando monitoramento SSL para $Domain..."
    
    $overallStatus = 0
    
    # Executar verificações
    if (!(Test-DomainAccessibility)) {
        $overallStatus = 1
    }
    
    $certStatus = Test-SSLCertificate
    if ($certStatus -gt $overallStatus) {
        $overallStatus = $certStatus
    }
    
    if (!(Test-SecurityHeaders)) {
        $overallStatus = [Math]::Max($overallStatus, 1)
    }
    
    if (!(Test-HTTPSRedirect)) {
        $overallStatus = [Math]::Max($overallStatus, 1)
    }
    
    if (!(Test-SSLPerformance)) {
        $overallStatus = [Math]::Max($overallStatus, 1)
    }
    
    Test-TLSConfiguration | Out-Null
    
    Write-Host ""
    Write-Host "=============================================================================" -ForegroundColor $Colors.Blue
    
    switch ($overallStatus) {
        0 {
            Write-Success "✅ Todos os testes SSL passaram com sucesso!"
        }
        1 {
            Write-Warning "⚠️ Alguns testes falharam, mas o SSL está funcionando"
        }
        2 {
            Write-Warning "⚠️ Certificado SSL expira em breve - ação necessária"
        }
        3 {
            Write-Error "🚨 Certificado SSL expirado - ação imediata necessária!"
        }
    }
    
    Write-Host "=============================================================================" -ForegroundColor $Colors.Blue
    
    # Gerar relatório se solicitado
    if ($Report) {
        New-Report | Out-Null
    }
    
    exit $overallStatus
}

# Executar função principal
try {
    Main
}
catch {
    Write-Error "Erro durante a execução: $($_.Exception.Message)"
    exit 1
}