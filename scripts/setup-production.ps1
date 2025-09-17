# =============================================================================
# SCRIPT DE CONFIGURAÇÃO PARA PRODUÇÃO - SISTEMA VNG V3 (PowerShell)
# =============================================================================

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

# Verificar se o Vercel CLI está instalado
function Test-VercelCLI {
    Write-Status "Verificando Vercel CLI..."
    
    try {
        $null = Get-Command vercel -ErrorAction Stop
        Write-Success "Vercel CLI encontrado"
        return $true
    }
    catch {
        Write-Error "Vercel CLI não encontrado. Instalando..."
        npm install -g vercel
        return $true
    }
}

# Fazer login no Vercel
function Connect-Vercel {
    Write-Status "Fazendo login no Vercel..."
    vercel login
}

# Configurar variáveis de ambiente no Vercel
function Set-EnvironmentVariables {
    Write-Status "Configurando variáveis de ambiente no Vercel..."
    
    # Variáveis básicas
    Write-Status "Configurando variáveis básicas..."
    
    # NEXTAUTH_URL
    $NextAuthUrl = Read-Host "Digite a URL de produção (ex: https://sistemavng.com.br)"
    echo $NextAuthUrl | vercel env add NEXTAUTH_URL production
    
    # NEXTAUTH_SECRET
    Write-Status "Gerando NEXTAUTH_SECRET..."
    $NextAuthSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
    echo $NextAuthSecret | vercel env add NEXTAUTH_SECRET production
    Write-Success "NEXTAUTH_SECRET gerado e configurado"
    
    # Supabase
    Write-Status "Configurando Supabase..."
    $SupabaseUrl = Read-Host "Digite a URL do Supabase"
    $SupabaseAnonKey = Read-Host "Digite a chave pública (anon key) do Supabase"
    $SupabaseServiceKey = Read-Host "Digite a chave de serviço do Supabase"
    
    echo $SupabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL production
    echo $SupabaseAnonKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
    echo $SupabaseServiceKey | vercel env add SUPABASE_SERVICE_ROLE_KEY production
    
    # Bling API
    Write-Status "Configurando Bling API..."
    $BlingClientId = Read-Host "Digite o CLIENT_ID do Bling"
    $BlingClientSecret = Read-Host "Digite o CLIENT_SECRET do Bling"
    
    echo $BlingClientId | vercel env add BLING_CLIENT_ID production
    echo $BlingClientSecret | vercel env add BLING_CLIENT_SECRET production
    echo "$NextAuthUrl/api/auth/bling/callback" | vercel env add BLING_REDIRECT_URI production
    echo "https://www.bling.com.br/Api/v3" | vercel env add BLING_API_URL production
    
    # Configurações de segurança
    Write-Status "Configurando segurança..."
    echo $NextAuthUrl | vercel env add ALLOWED_ORIGINS production
    echo $NextAuthUrl | vercel env add CORS_ORIGIN production
    
    Write-Success "Variáveis de ambiente configuradas com sucesso!"
}

# Configurar domínio personalizado
function Set-CustomDomain {
    Write-Status "Configurando domínio personalizado..."
    $Domain = Read-Host "Digite o domínio (ex: sistemavng.com.br)"
    
    Write-Status "Adicionando domínio ao projeto..."
    vercel domains add $Domain
    
    Write-Warning "Certifique-se de configurar os registros DNS:"
    Write-Host "  - Tipo: CNAME" -ForegroundColor $Colors.White
    Write-Host "  - Nome: @ (ou www)" -ForegroundColor $Colors.White
    Write-Host "  - Valor: cname.vercel-dns.com" -ForegroundColor $Colors.White
    
    Read-Host "Pressione Enter após configurar o DNS..."
    
    Write-Success "Domínio configurado!"
}

# Deploy para produção
function Deploy-ToProduction {
    Write-Status "Fazendo deploy para produção..."
    
    # Build do projeto
    Write-Status "Fazendo build do projeto..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro no build. Verifique os erros acima."
        return
    }
    
    # Deploy
    Write-Status "Fazendo deploy..."
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deploy realizado com sucesso!"
    } else {
        Write-Error "Erro no deploy. Verifique os logs."
    }
}

# Verificar saúde da aplicação
function Test-ApplicationHealth {
    Write-Status "Verificando saúde da aplicação..."
    
    $AppUrl = Read-Host "Digite a URL da aplicação para verificar"
    
    try {
        $response = Invoke-WebRequest -Uri $AppUrl -Method Get -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Success "Aplicação está respondendo corretamente!"
        } else {
            Write-Warning "Aplicação respondeu com status: $($response.StatusCode)"
        }
    }
    catch {
        Write-Error "Aplicação não está respondendo. Erro: $($_.Exception.Message)"
    }
}

# Configurar monitoramento (opcional)
function Set-Monitoring {
    Write-Status "Configurando monitoramento..."
    
    $SetupSentry = Read-Host "Deseja configurar Sentry para monitoramento? (y/n)"
    
    if ($SetupSentry -eq "y" -or $SetupSentry -eq "Y") {
        $SentryDsn = Read-Host "Digite o DSN do Sentry"
        echo $SentryDsn | vercel env add SENTRY_DSN production
        Write-Success "Sentry configurado!"
    }
    
    # Configurar nível de log
    echo "info" | vercel env add LOG_LEVEL production
    Write-Success "Monitoramento configurado!"
}

# Menu principal
function Show-MainMenu {
    Clear-Host
    Write-Host "=============================================================================" -ForegroundColor $Colors.Blue
    Write-Host "                    CONFIGURAÇÃO DE PRODUÇÃO - SISTEMA VNG V3" -ForegroundColor $Colors.Blue
    Write-Host "=============================================================================" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "Escolha uma opção:" -ForegroundColor $Colors.White
    Write-Host "1. Configuração completa (recomendado para primeira vez)" -ForegroundColor $Colors.White
    Write-Host "2. Apenas variáveis de ambiente" -ForegroundColor $Colors.White
    Write-Host "3. Apenas domínio personalizado" -ForegroundColor $Colors.White
    Write-Host "4. Apenas deploy" -ForegroundColor $Colors.White
    Write-Host "5. Verificação de saúde" -ForegroundColor $Colors.White
    Write-Host "6. Configurar monitoramento" -ForegroundColor $Colors.White
    Write-Host "7. Sair" -ForegroundColor $Colors.White
    Write-Host ""
    
    $choice = Read-Host "Digite sua escolha (1-7)"
    
    switch ($choice) {
        "1" {
            Test-VercelCLI
            Connect-Vercel
            Set-EnvironmentVariables
            Set-CustomDomain
            Deploy-ToProduction
            Set-Monitoring
            Test-ApplicationHealth
            Write-Success "Configuração completa finalizada!"
        }
        "2" {
            Test-VercelCLI
            Connect-Vercel
            Set-EnvironmentVariables
        }
        "3" {
            Test-VercelCLI
            Connect-Vercel
            Set-CustomDomain
        }
        "4" {
            Test-VercelCLI
            Deploy-ToProduction
        }
        "5" {
            Test-ApplicationHealth
        }
        "6" {
            Test-VercelCLI
            Connect-Vercel
            Set-Monitoring
        }
        "7" {
            Write-Success "Saindo..."
            exit 0
        }
        default {
            Write-Error "Opção inválida. Tente novamente."
            Start-Sleep -Seconds 2
            Show-MainMenu
        }
    }
}

# Verificar pré-requisitos
function Test-Prerequisites {
    Write-Status "Verificando pré-requisitos..."
    
    # Verificar Node.js
    try {
        $null = Get-Command node -ErrorAction Stop
        $nodeVersion = node --version
        Write-Success "Node.js encontrado: $nodeVersion"
    }
    catch {
        Write-Error "Node.js não encontrado. Instale Node.js 18+ antes de continuar."
        exit 1
    }
    
    # Verificar npm
    try {
        $null = Get-Command npm -ErrorAction Stop
        $npmVersion = npm --version
        Write-Success "npm encontrado: $npmVersion"
    }
    catch {
        Write-Error "npm não encontrado. Instale npm antes de continuar."
        exit 1
    }
    
    # Verificar se está no diretório correto
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json não encontrado. Execute este script no diretório raiz do projeto."
        exit 1
    }
    
    Write-Success "Pré-requisitos verificados!"
}

# Função principal
function Main {
    try {
        Test-Prerequisites
        Show-MainMenu
    }
    catch {
        Write-Error "Erro durante a execução: $($_.Exception.Message)"
        Read-Host "Pressione Enter para sair..."
    }
}

# Executar função principal
Main