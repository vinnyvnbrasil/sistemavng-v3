import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'

// Validation schemas
const authSchema = z.object({
  client_id: z.string().min(1, 'Client ID é obrigatório'),
  client_secret: z.string().min(1, 'Client Secret é obrigatório'),
  code: z.string().min(1, 'Código de autorização é obrigatório'),
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido')
})

const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token é obrigatório'),
  client_id: z.string().min(1, 'Client ID é obrigatório'),
  client_secret: z.string().min(1, 'Client Secret é obrigatório'),
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido')
})

// Rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/bling/auth - Exchange authorization code for access token
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 10, 'CACHE_TOKEN') // 10 requests per minute
    } catch {
      return NextResponse.json(
        createApiResponse(false, null, 'Rate limit exceeded'),
        { status: HttpStatus.TOO_MANY_REQUESTS }
      )
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token de acesso necessário'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token inválido'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = authSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { client_id, client_secret, code, company_id } = validationResult.data

    // Verify user has access to the company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single()

    if (companyError || !companyUser) {
      return NextResponse.json(
        createApiResponse(false, null, 'Acesso negado à empresa'),
        { status: HttpStatus.FORBIDDEN }
      )
    }

    // Initialize Bling API service
    const blingService = new BlingApiService({
      client_id,
      client_secret,
      access_token: '',
      refresh_token: '',
      expires_at: new Date()
    })

    // Exchange code for tokens
    const authResult = await blingService.authenticate(code)

    if (!authResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, authResult.message || 'Erro na autenticação'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Save or update Bling configuration
    const { data: existingConfig } = await supabase
      .from('bling_configs')
      .select('*')
      .eq('company_id', company_id)
      .single()

    const configData = {
      company_id,
      client_id,
      client_secret,
      access_token: authResult.data?.access_token,
      refresh_token: authResult.data?.refresh_token,
      expires_at: authResult.data?.expires_at,
      is_active: true,
      updated_at: new Date().toISOString()
    }

    let savedConfig
    if (existingConfig) {
      const { data, error } = await supabase
        .from('bling_configs')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single()

      if (error) throw error
      savedConfig = data
    } else {
      const { data, error } = await supabase
        .from('bling_configs')
        .insert({
          ...configData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      savedConfig = data
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'integration_configured',
      title: 'Bling configurado',
      description: `Integração Bling configurada para a empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: company_id,
      entity_name: `Empresa ${company_id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          bling_config_id: savedConfig.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, { config: savedConfig }, 'Bling configurado com sucesso'),
      { status: HttpStatus.CREATED }
    )

  } catch (error: any) {
    console.error('Bling auth error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao configurar Bling'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT /api/bling/auth - Refresh access token
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 20, 'CACHE_TOKEN') // 20 requests per minute
    } catch {
      return NextResponse.json(
        createApiResponse(false, null, 'Rate limit exceeded'),
        { status: HttpStatus.TOO_MANY_REQUESTS }
      )
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token de acesso necessário'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token inválido'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = refreshTokenSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { refresh_token, client_id, client_secret, company_id } = validationResult.data

    // Verify user has access to the company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single()

    if (companyError || !companyUser) {
      return NextResponse.json(
        createApiResponse(false, null, 'Acesso negado à empresa'),
        { status: HttpStatus.FORBIDDEN }
      )
    }

    // Initialize Bling API service
    const blingService = new BlingApiService({
      client_id,
      client_secret,
      access_token: '',
      refresh_token,
      expires_at: new Date()
    })

    // Refresh token
    const refreshResult = await blingService.refreshToken()

    if (!refreshResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, refreshResult.message || 'Erro ao renovar token'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Update Bling configuration
    const { data: updatedConfig, error: updateError } = await supabase
      .from('bling_configs')
      .update({
        access_token: refreshResult.data?.access_token,
        refresh_token: refreshResult.data?.refresh_token,
        expires_at: refreshResult.data?.expires_at,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', company_id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(
      createApiResponse(true, { config: updatedConfig }, 'Token renovado com sucesso')
    )

  } catch (error: any) {
    console.error('Bling refresh token error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao renovar token'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}