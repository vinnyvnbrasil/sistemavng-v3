import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'
import { BlingCustomer } from '@/types/bling'

// Validation schemas
const paramsSchema = z.object({
  id: z.string().min(1, 'ID do cliente é obrigatório')
})

const querySchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido')
})

const updateCustomerSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  updates: z.object({
    nome: z.string().min(1, 'Nome é obrigatório').optional(),
    codigo: z.string().optional(),
    documento: z.string().optional(),
    ie: z.string().optional(),
    rg: z.string().optional(),
    orgaoEmissor: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
    celular: z.string().optional(),
    fone: z.string().optional(),
    fantasia: z.string().optional(),
    tipo: z.enum(['F', 'J']).optional(),
    situacao: z.enum(['A', 'I']).optional(),
    contribuinte: z.enum(['1', '2', '9']).optional(),
    endereco: z.object({
      endereco: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      cep: z.string().optional(),
      municipio: z.string().optional(),
      uf: z.string().optional(),
      pais: z.string().optional()
    }).optional(),
    dadosAdicionais: z.object({
      dataNascimento: z.string().optional(),
      sexo: z.enum(['M', 'F']).optional(),
      clienteDesde: z.string().optional(),
      limiteCredito: z.number().min(0).optional(),
      vendedor: z.object({
        id: z.number().optional()
      }).optional(),
      formaPagamentoPadrao: z.object({
        id: z.number().optional()
      }).optional(),
      priceListId: z.number().optional(),
      condicaoPagamentoPadrao: z.object({
        id: z.number().optional()
      }).optional()
    }).optional(),
    pessoasContato: z.array(z.object({
      nome: z.string(),
      email: z.string().email().optional(),
      telefone: z.string().optional(),
      celular: z.string().optional(),
      cargo: z.string().optional()
    })).optional()
  })
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

// GET /api/bling/customers/[id] - Get specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 100, 'CACHE_TOKEN') // 100 requests per minute
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

    // Validate params
    const validatedParams = paramsSchema.parse(params)
    const { id } = validatedParams

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = querySchema.parse(queryParams)
    const { company_id } = validatedQuery

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
      .eq('is_active', true)
      .single()

    if (configError || !blingConfig) {
      return NextResponse.json(
        createApiResponse(false, null, 'Configuração Bling não encontrada'),
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Initialize Bling API service
    const blingService = new BlingApiService(blingConfig)

    // Get customer from Bling
    const customerResult = await blingService.getCustomer(id)

    if (!customerResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, customerResult.message || 'Erro ao buscar cliente'),
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'data_accessed',
      title: 'Cliente Bling acessado',
      description: `Cliente ${id} acessado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'customer',
      entity_id: id,
      entity_name: `Cliente ${id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          company_id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, customerResult.data, 'Cliente encontrado com sucesso')
    )

  } catch (error: any) {
    console.error('Get Bling customer error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao buscar cliente'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT /api/bling/customers/[id] - Update specific customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate params
    const validatedParams = paramsSchema.parse(params)
    const { id } = validatedParams

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateCustomerSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, updates } = validationResult.data

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
      .eq('is_active', true)
      .single()

    if (configError || !blingConfig) {
      return NextResponse.json(
        createApiResponse(false, null, 'Configuração Bling não encontrada'),
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Initialize Bling API service
    const blingService = new BlingApiService(blingConfig)

    // Update customer in Bling
    const updateResult = await blingService.updateCustomer(id, updates as Partial<BlingCustomer>)

    if (!updateResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, updateResult.message || 'Erro ao atualizar cliente'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'customer_updated',
      title: 'Cliente Bling atualizado',
      description: `Cliente ${id} atualizado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'customer',
      entity_id: id,
      entity_name: `Cliente ${id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          company_id,
          updates,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, updateResult.data, 'Cliente atualizado com sucesso')
    )

  } catch (error: any) {
    console.error('Update Bling customer error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao atualizar cliente'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// DELETE /api/bling/customers/[id] - Delete specific customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate params
    const validatedParams = paramsSchema.parse(params)
    const { id } = validatedParams

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = querySchema.parse(queryParams)
    const { company_id } = validatedQuery

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
      .eq('is_active', true)
      .single()

    if (configError || !blingConfig) {
      return NextResponse.json(
        createApiResponse(false, null, 'Configuração Bling não encontrada'),
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Initialize Bling API service
    const blingService = new BlingApiService(blingConfig)

    // Delete customer from Bling
    const deleteResult = await blingService.deleteCustomer(id)

    if (!deleteResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, deleteResult.message || 'Erro ao excluir cliente'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'customer_deleted',
      title: 'Cliente Bling excluído',
      description: `Cliente ${id} excluído do Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'customer',
      entity_id: id,
      entity_name: `Cliente ${id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          company_id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, null, 'Cliente excluído com sucesso')
    )

  } catch (error: any) {
    console.error('Delete Bling customer error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao excluir cliente'),
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}