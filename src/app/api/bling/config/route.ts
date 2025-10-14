import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'
import { BlingConfig } from '@/types/bling'

// Validation schemas
const configSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  client_id: z.string().min(1, 'Client ID é obrigatório'),
  client_secret: z.string().min(1, 'Client Secret é obrigatório'),
  redirect_uri: z.string().url('URI de redirecionamento deve ser uma URL válida'),
  environment: z.enum(['sandbox', 'production'], {
    required_error: 'Ambiente é obrigatório',
    invalid_type_error: 'Ambiente deve ser sandbox ou production'
  }).default('sandbox'),
  webhook_url: z.string().url('URL do webhook deve ser uma URL válida').optional(),
  is_active: z.boolean().default(true)
})

const updateConfigSchema = z.object({
  client_id: z.string().min(1, 'Client ID é obrigatório').optional(),
  client_secret: z.string().min(1, 'Client Secret é obrigatório').optional(),
  redirect_uri: z.string().url('URI de redirecionamento deve ser uma URL válida').optional(),
  environment: z.enum(['sandbox', 'production']).optional(),
  webhook_url: z.string().url('URL do webhook deve ser uma URL válida').optional(),
  is_active: z.boolean().optional()
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

// GET /api/bling/config - Get Bling configuration for a company
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 30, 'CACHE_TOKEN') // 30 requests per minute
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

    // Parse query parameters
    const url = new URL(request.url)
    const company_id = url.searchParams.get('company_id')

    if (!company_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'ID da empresa é obrigatório'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

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

    // Get Bling configuration
    const { data: blingConfig, error: configError } = await supabase
      .from('bling_configs')
      .select('*')
      .eq('company_id', company_id)
      .single()

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Bling config:', configError)
      return NextResponse.json(
        createApiResponse(false, null, 'Erro ao buscar configuração Bling'),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    // If no config found, return empty response
    if (!blingConfig) {
      return NextResponse.json(
        createApiResponse(true, null, 'Nenhuma configuração Bling encontrada')
      )
    }

    // Remove sensitive data from response
    const safeConfig = {
      ...blingConfig,
      client_secret: undefined, // Don't expose client secret
      access_token: undefined,  // Don't expose access token
      refresh_token: undefined  // Don't expose refresh token
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'data_accessed',
      title: 'Configuração Bling acessada',
      description: `Configuração Bling acessada para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: company_id,
      entity_name: `Empresa ${company_id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          config_id: blingConfig.id,
          environment: blingConfig.environment,
          is_active: blingConfig.is_active,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, safeConfig, 'Configuração Bling obtida com sucesso')
    )

  } catch (error: any) {
    console.error('Get Bling config error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao buscar configuração Bling'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// POST /api/bling/config - Create Bling configuration for a company
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
    const validationResult = configSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const configData = validationResult.data

    // Verify user has access to the company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', configData.company_id)
      .single()

    if (companyError || !companyUser) {
      return NextResponse.json(
        createApiResponse(false, null, 'Acesso negado à empresa'),
        { status: HttpStatus.FORBIDDEN }
      )
    }

    // Check if configuration already exists
    const { data: existingConfig, error: existingError } = await supabase
      .from('bling_configs')
      .select('id')
      .eq('company_id', configData.company_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing config:', existingError)
      return NextResponse.json(
        createApiResponse(false, null, 'Erro ao verificar configuração existente'),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    if (existingConfig) {
      return NextResponse.json(
        createApiResponse(false, null, 'Configuração Bling já existe para esta empresa'),
        { status: HttpStatus.CONFLICT }
      )
    }

    // Create new configuration
    const newConfig = {
      id: crypto.randomUUID(),
      ...configData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id
    }

    const { data: createdConfig, error: createError } = await supabase
      .from('bling_configs')
      .insert(newConfig)
      .select()
      .single()

    if (createError) {
      console.error('Error creating Bling config:', createError)
      return NextResponse.json(
        createApiResponse(false, null, 'Erro ao criar configuração Bling'),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    // Remove sensitive data from response
    const safeConfig = {
      ...createdConfig,
      client_secret: undefined
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'config_created',
      title: 'Configuração Bling criada',
      description: `Nova configuração Bling criada para empresa ${configData.company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: configData.company_id,
      entity_name: `Empresa ${configData.company_id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          config_id: createdConfig.id,
          environment: configData.environment,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, safeConfig, 'Configuração Bling criada com sucesso'),
      { status: HttpStatus.CREATED }
    )

  } catch (error: any) {
    console.error('Create Bling config error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao criar configuração Bling'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT /api/bling/config - Update Bling configuration
export async function PUT(request: NextRequest) {
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

    // Parse query parameters
    const url = new URL(request.url)
    const company_id = url.searchParams.get('company_id')

    if (!company_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'ID da empresa é obrigatório'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateConfigSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const updateData = validationResult.data

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

    // Check if configuration exists
    const { data: existingConfig, error: existingError } = await supabase
      .from('bling_configs')
      .select('*')
      .eq('company_id', company_id)
      .single()

    if (existingError || !existingConfig) {
      return NextResponse.json(
        createApiResponse(false, null, 'Configuração Bling não encontrada'),
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Update configuration
    const { data: updatedConfig, error: updateError } = await supabase
      .from('bling_configs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating Bling config:', updateError)
      return NextResponse.json(
        createApiResponse(false, null, 'Erro ao atualizar configuração Bling'),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    // Remove sensitive data from response
    const safeConfig = {
      ...updatedConfig,
      client_secret: undefined,
      access_token: undefined,
      refresh_token: undefined
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'config_updated',
      title: 'Configuração Bling atualizada',
      description: `Configuração Bling atualizada para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: company_id,
      entity_name: `Empresa ${company_id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          config_id: updatedConfig.id,
          changes: updateData,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, safeConfig, 'Configuração Bling atualizada com sucesso')
    )

  } catch (error: any) {
    console.error('Update Bling config error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao atualizar configuração Bling'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// DELETE /api/bling/config - Delete Bling configuration
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 5, 'CACHE_TOKEN') // 5 requests per minute
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

    // Parse query parameters
    const url = new URL(request.url)
    const company_id = url.searchParams.get('company_id')

    if (!company_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'ID da empresa é obrigatório'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

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

    // Check if configuration exists
    const { data: existingConfig, error: existingError } = await supabase
      .from('bling_configs')
      .select('id')
      .eq('company_id', company_id)
      .single()

    if (existingError || !existingConfig) {
      return NextResponse.json(
        createApiResponse(false, null, 'Configuração Bling não encontrada'),
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Delete configuration
    const { error: deleteError } = await supabase
      .from('bling_configs')
      .delete()
      .eq('company_id', company_id)

    if (deleteError) {
      console.error('Error deleting Bling config:', deleteError)
      return NextResponse.json(
        createApiResponse(false, null, 'Erro ao deletar configuração Bling'),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'config_deleted',
      title: 'Configuração Bling deletada',
      description: `Configuração Bling deletada para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: company_id,
      entity_name: `Empresa ${company_id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          config_id: existingConfig.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, null, 'Configuração Bling deletada com sucesso')
    )

  } catch (error: any) {
    console.error('Delete Bling config error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao deletar configuração Bling'),
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}