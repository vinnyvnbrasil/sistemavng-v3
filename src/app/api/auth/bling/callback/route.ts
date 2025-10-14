import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// OAuth callback handler for Bling
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const company_id = url.searchParams.get('state')

  // Helper to render a small HTML page that notifies the opener and closes
  const renderResult = (success: boolean, message: string) => {
    const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Bling OAuth</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;color:#111}
    .card{max-width:560px;margin:80px auto;border:1px solid #e5e7eb;border-radius:12px;padding:24px;box-shadow:0 2px 10px rgba(0,0,0,0.06)}
    .title{font-weight:700;font-size:18px;margin-bottom:8px}
    .msg{color:#4b5563;margin-bottom:16px}
    .ok{color:#16a34a}
    .err{color:#dc2626}
  </style>
</head>
<body>
  <div class="card">
    <div class="title">${success ? 'Autorização concluída' : 'Falha na autorização'}</div>
    <div class="msg ${success ? 'ok' : 'err'}">${safeMessage}</div>
    <div class="msg">Você pode fechar esta janela.</div>
  </div>
  <script>
    try {
      const data = { type: 'bling_auth', success: ${success ? 'true' : 'false'}, companyId: '${company_id || ''}', message: '${safeMessage}' };
      if (window.opener) {
        window.opener.postMessage(data, '*');
      }
      setTimeout(() => window.close(), 1200);
    } catch(e) {}
  </script>
</body>
</html>`

    return new NextResponse(html, {
      status: success ? 200 : 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  if (!code || !company_id) {
    return renderResult(false, 'Código de autorização ou empresa ausentes no callback.')
  }

  try {
    // Get current user from cookies
    const supabaseAuth = createRouteHandlerClient(request)
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return renderResult(false, 'Sessão inválida. Faça login novamente e repita a autorização.')
    }

    // Service role client for DB operations (bypasses RLS with manual checks)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user has access to the company
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single()

    if (!companyUser) {
      return renderResult(false, 'Acesso negado à empresa.')
    }

    // Get existing Bling config to retrieve client credentials
    const { data: existingConfig } = await supabase
      .from('bling_configs')
      .select('*')
      .eq('company_id', company_id)
      .single()

    if (!existingConfig?.client_id || !existingConfig?.client_secret) {
      return renderResult(false, 'Credenciais do Bling não encontradas. Salve a configuração antes de autorizar.')
    }

    // Initialize Bling API service
    const blingService = new BlingApiService({
      client_id: existingConfig.client_id,
      client_secret: existingConfig.client_secret,
      access_token: '',
      refresh_token: '',
      expires_at: new Date()
    })

    // Exchange code for tokens
    const authResult = await blingService.authenticate(code)
    if (!authResult.success || !authResult.data) {
      return renderResult(false, authResult.message || 'Erro na autenticação com o Bling.')
    }

    // Update configuration with tokens
    const { data: updatedConfig, error: updateError } = await supabase
      .from('bling_configs')
      .update({
        access_token: authResult.data.access_token,
        refresh_token: authResult.data.refresh_token,
        expires_at: authResult.data.expires_at,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', company_id)
      .select()
      .single()

    if (updateError || !updatedConfig) {
      return renderResult(false, 'Erro ao salvar tokens no banco.')
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'integration_configured',
      title: 'Bling autorizado',
      description: `Integração Bling autorizada para a empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: company_id,
      entity_name: `Empresa ${company_id}`,
      metadata: {
        additional_info: {
          bling_config_id: updatedConfig.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return renderResult(true, 'Autorização concluída com sucesso!')
  } catch (error: any) {
    console.error('Bling OAuth callback error:', error)
    return renderResult(false, error?.message || 'Erro inesperado no callback do Bling.')
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}