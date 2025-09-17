# =============================================================================
# SCRIPT DE DEPLOY PARA PRODUÇÃO - SISTEMA VNG V3 (PowerShell)
# =============================================================================

param(
    [switch]$SkipTests,
    [switch]$Force,
    [switch]$Help
)

# Configurações
$ProjectName = "sistemavng-v3"
$Domain = "sistemavng.com.br"
$VercelProjectId = ""
$VercelOrgId = ""

# Cores para output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Funções para imprimir mensagens coloridas
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Write-Header {
    Write-Host "=============================================================================" -ForegroundColor $Colors.Blue
    Write-Host "                    DEPLOY PARA PRODUÇÃO - SISTEMA VNG V3" -ForegroundColor $Colors.Blue
    Write-Host "=============================================================================" -ForegroundColor $Colors.Blue
    Write-Host ""
}

# Verificar pré-requisitos
function Test-Prerequisites {
    Write-Status "Verificando pré-requisitos..."
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($versionNumber -lt 18) {
            Write-Error "Node.js versão 18 ou superior é necessária (atual: $nodeVersion)"
            exit 1
        }
    }
    catch {
        Write-Error "Node.js não está instalado"
        exit 1
    }
    
    # Verificar npm
    try {
        npm --version | Out-Null
    }
    catch {
        Write-Error "npm não está instalado"
        exit 1
    }
    
    # Verificar git
    try {
        git --version | Out-Null
    }
    catch {
        Write-Error "git não está instalado"
        exit 1
    }
    
    # Verificar se está no diretório correto
    if (!(Test-Path "package.json")) {
        Write-Error "package.json não encontrado. Execute este script na raiz do projeto."
        exit 1
    }
    
    # Verificar Vercel CLI
    try {
        vercel --version | Out-Null
    }
    catch {
        Write-Warning "Vercel CLI não está instalado. Instalando..."
        npm install -g vercel@latest
    }
    
    Write-Success "Pré-requisitos verificados"
}

# Verificar status do git
function Test-GitStatus {
    Write-Status "Verificando status do git..."
    
    # Verificar se há mudanças não commitadas
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Error "Há mudanças não commitadas. Commit ou stash suas mudanças antes do deploy."
        git status
        exit 1
    }
    
    # Verificar se está na branch main/master
    $currentBranch = git branch --show-current
    if ($currentBranch -notin @("main", "master")) {
        Write-Warning "Você não está na branch main/master (atual: $currentBranch)"
        $response = Read-Host "Deseja continuar mesmo assim? (y/N)"
        if ($response -notmatch '^[Yy]$') {
            Write-Status "Deploy cancelado"
            exit 0
        }
    }
    
    # Verificar se está atualizado com o remote
    git fetch origin
    $localCommit = git rev-parse HEAD
    $remoteCommit = git rev-parse "origin/$currentBranch"
    
    if ($localCommit -ne $remoteCommit) {
        Write-Warning "Sua branch local não está atualizada com o remote"
        $response = Read-Host "Deseja fazer pull das últimas mudanças? (Y/n)"
        if ($response -notmatch '^[Nn]$') {
            git pull origin $currentBranch
        }
    }
    
    Write-Success "Status do git verificado"
}

# Executar testes
function Invoke-Tests {
    Write-Status "Executando testes..."
    
    # Instalar dependências se necessário
    if (!(Test-Path "node_modules")) {
        Write-Status "Instalando dependências..."
        npm ci
    }
    
    # Executar linting
    Write-Status "Executando linting..."
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Linting falhou"
        exit 1
    }
    
    # Executar type checking
    Write-Status "Executando type checking..."
    npm run type-check
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Type checking falhou"
        exit 1
    }
    
    # Executar testes unitários
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            Write-Status "Executando testes unitários..."
            npm run test -- --watchAll=false
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Testes unitários falharam"
                exit 1
            }
        }
        else {
            Write-Warning "Script de teste não encontrado, pulando testes unitários"
        }
    }
    catch {
        Write-Warning "Erro ao verificar scripts de teste"
    }
    
    Write-Success "Testes executados com sucesso"
}

# Build da aplicação
function Build-Application {
    Write-Status "Fazendo build da aplicação..."
    
    # Limpar build anterior
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
    }
    
    # Build
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build falhou"
        exit 1
    }
    
    Write-Success "Build concluído com sucesso"
}

# Configurar Vercel
function Set-VercelConfig {
    Write-Status "Configurando Vercel..."
    
    # Verificar se está logado
    try {
        vercel whoami | Out-Null
    }
    catch {
        Write-Status "Fazendo login no Vercel..."
        vercel login
    }
    
    # Link do projeto se necessário
    if (!(Test-Path ".vercel/project.json")) {
        Write-Status "Fazendo link do projeto..."
        vercel link
    }
    
    Write-Success "Vercel configurado"
}

# Deploy para produção
function Deploy-ToProduction {
    Write-Status "Iniciando deploy para produção..."
    
    try {
        # Pull das configurações de produção
        vercel pull --yes --environment=production
        
        # Build para produção
        vercel build --prod
        
        # Deploy
        $deployUrl = vercel deploy --prebuilt --prod
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Deploy realizado com sucesso!"
            Write-Success "URL: $deployUrl"
            
            # Salvar URL do deploy
            $deployUrl | Out-File -FilePath ".last-deploy-url" -Encoding UTF8
            
            return $deployUrl
        }
        else {
            Write-Error "Falha no deploy"
            return $null
        }
    }
    catch {
        Write-Error "Erro durante o deploy: $($_.Exception.Message)"
        return $null
    }
}

# Health checks pós-deploy
function Test-HealthChecks {
    Write-Status "Executando health checks..."
    
    # Aguardar propagação
    Write-Status "Aguardando propagação do deploy (30s)..."
    Start-Sleep -Seconds 30
    
    $allPassed = $true
    
    # Verificar se o site está respondendo
    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -Method Head -TimeoutSec 10 -ErrorAction Stop
        Write-Success "Site está respondendo"
    }
    catch {
        Write-Error "Site não está respondendo"
        $allPassed = $false
    }
    
    # Verificar SSL
    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -Method Head -TimeoutSec 10 -ErrorAction Stop
        if ($response.Headers["Strict-Transport-Security"]) {
            Write-Success "SSL configurado corretamente"
        }
        else {
            Write-Warning "Header HSTS não encontrado"
        }
    }
    catch {
        Write-Warning "Erro ao verificar SSL"
    }
    
    # Verificar redirecionamento HTTP -> HTTPS
    try {
        $response = Invoke-WebRequest -Uri "http://$Domain" -Method Head -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction SilentlyContinue
        if ($response.Headers.Location -and $response.Headers.Location.StartsWith("https://")) {
            Write-Success "Redirecionamento HTTPS funcionando"
        }
        else {
            Write-Warning "Redirecionamento HTTPS não configurado"
        }
    }
    catch {
        # Verificar se é um redirecionamento (código 3xx)
        if ($_.Exception.Response.StatusCode -match "3\d\d") {
            $location = $_.Exception.Response.Headers.Location
            if ($location -and $location.StartsWith("https://")) {
                Write-Success "Redirecionamento HTTPS funcionando"
            }
        }
        else {
            Write-Warning "Redirecionamento HTTPS não configurado"
        }
    }
    
    # Verificar API health (se existir)
    try {
        Invoke-WebRequest -Uri "https://$Domain/api/health" -Method Get -TimeoutSec 10 -ErrorAction Stop | Out-Null
        Write-Success "API health check passou"
    }
    catch {
        Write-Warning "API health check falhou ou não existe"
    }
    
    # Verificar performance básica
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        Invoke-WebRequest -Uri "https://$Domain" -Method Head -TimeoutSec 10 -ErrorAction Stop | Out-Null
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds / 1000
        
        if ($responseTime -lt 3.0) {
            Write-Success "Tempo de resposta OK: ${responseTime}s"
        }
        else {
            Write-Warning "Tempo de resposta lento: ${responseTime}s"
        }
    }
    catch {
        Write-Warning "Erro ao verificar performance"
    }
    
    Write-Success "Health checks concluídos"
    return $allPassed
}

# Rollback em caso de falha
function Invoke-Rollback {
    Write-Error "Executando rollback..."
    
    # Listar deployments recentes
    Write-Status "Deployments recentes:"
    vercel ls --scope=$VercelOrgId | Select-Object -First 10
    
    $rollbackUrl = Read-Host "Digite o URL do deployment para rollback (ou pressione Enter para cancelar)"
    
    if ($rollbackUrl) {
        vercel alias set $rollbackUrl $Domain
        Write-Success "Rollback executado para: $rollbackUrl"
    }
    else {
        Write-Status "Rollback cancelado"
    }
}

# Notificar sucesso
function Send-SuccessNotification {
    # Webhook Slack/Discord
    if ($env:WEBHOOK_URL) {
        try {
            $body = @{
                text = "🚀 Deploy realizado com sucesso para $Domain"
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri $env:WEBHOOK_URL -Method Post -Body $body -ContentType "application/json"
        }
        catch {
            Write-Warning "Erro ao enviar notificação webhook"
        }
    }
    
    # Log local
    "$(Get-Date): Deploy realizado com sucesso" | Add-Content -Path "deploy.log"
}

# Mostrar ajuda
function Show-Help {
    Write-Host @"
Uso: .\deploy-production.ps1 [opções]

Opções:
  -SkipTests      Pular execução de testes
  -Force          Não pedir confirmação
  -Help           Mostrar esta ajuda

Exemplos:
  .\deploy-production.ps1                    # Deploy normal com confirmação
  .\deploy-production.ps1 -Force             # Deploy sem confirmação
  .\deploy-production.ps1 -SkipTests         # Deploy pulando testes
  .\deploy-production.ps1 -Force -SkipTests  # Deploy rápido
"@ -ForegroundColor $Colors.White
}

# Função principal
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Header
    
    # Confirmação se não for force
    if (!$Force) {
        Write-Host "Você está prestes a fazer deploy para PRODUÇÃO." -ForegroundColor $Colors.Yellow
        Write-Host "Domínio: $Domain" -ForegroundColor $Colors.White
        Write-Host "Branch atual: $(git branch --show-current)" -ForegroundColor $Colors.White
        Write-Host "Último commit: $(git log -1 --oneline)" -ForegroundColor $Colors.White
        Write-Host ""
        
        $response = Read-Host "Tem certeza que deseja continuar? (y/N)"
        if ($response -notmatch '^[Yy]$') {
            Write-Status "Deploy cancelado"
            return
        }
    }
    
    try {
        # Executar etapas do deploy
        Test-Prerequisites
        Test-GitStatus
        
        if (!$SkipTests) {
            Invoke-Tests
        }
        else {
            Write-Warning "Pulando testes (-SkipTests)"
        }
        
        Build-Application
        Set-VercelConfig
        
        $deployUrl = Deploy-ToProduction
        
        if ($deployUrl) {
            if (Test-HealthChecks) {
                Write-Success "✅ Deploy para produção concluído com sucesso!"
                Write-Success "🌐 Site: https://$Domain"
                
                # Notificar sucesso
                Send-SuccessNotification
            }
            else {
                Write-Error "❌ Health checks falharam"
                $response = Read-Host "Deseja fazer rollback? (y/N)"
                if ($response -match '^[Yy]$') {
                    Invoke-Rollback
                }
                exit 1
            }
        }
        else {
            Write-Error "❌ Falha no deploy"
            exit 1
        }
    }
    catch {
        Write-Error "Erro durante a execução: $($_.Exception.Message)"
        exit 1
    }
}

# Executar função principal
Main