import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'
import { BlingOrder } from '@/types/bling'

// Validation schemas
const paramsSchema = z.object({
  id: z.string().min(1, 'ID do pedido é obrigatório')
})

const querySchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido')
})

const updateOrderSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  updates: z.object({
    observacoes: z.string().optional(),
    observacoesInternas: z.string().optional(),
    situacao: z.object({
      valor: z.enum(['6', '9', '12', '15', '24', '84', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '123', '124', '125', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144', '145', '146', '147', '148', '149', '150'])
    }).optional()
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

// GET /api/bling/orders/[id] - Get specific order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 200, 'CACHE_TOKEN') // 200 requests per minute
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
    const paramsValidation = paramsSchema.safeParse(params)
    if (!paramsValidation.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'ID do pedido inválido'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = querySchema.parse(queryParams)
    
    const { company_id } = validatedQuery
    const { id: orderId } = paramsValidation.data

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

    // Get order from Bling
    const orderResult = await blingService.getOrder(orderId)

    if (!orderResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, orderResult.message || 'Erro ao buscar pedido'),
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'data_accessed',
      title: 'Pedido Bling acessado',
      description: `Pedido ${orderId} acessado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'order',
      entity_id: orderId,
      entity_name: `Pedido ${orderId}`,
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
      createApiResponse(true, orderResult.data, 'Pedido encontrado com sucesso')
    )

  } catch (error: any) {
    console.error('Get Bling order error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao buscar pedido'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT /api/bling/orders/[id] - Update specific order
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
    const paramsValidation = paramsSchema.safeParse(params)
    if (!paramsValidation.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'ID do pedido inválido'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateOrderSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, updates } = validationResult.data
    const { id: orderId } = paramsValidation.data

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

    // Update order in Bling
    const updateResult = await blingService.updateOrder(orderId, updates as Partial<BlingOrder>)

    if (!updateResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, updateResult.message || 'Erro ao atualizar pedido'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'order_updated',
      title: 'Pedido Bling atualizado',
      description: `Pedido ${orderId} atualizado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'order',
      entity_id: orderId,
      entity_name: `Pedido ${orderId}`,
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
      createApiResponse(true, updateResult.data, 'Pedido atualizado com sucesso')
    )

  } catch (error: any) {
    console.error('Update Bling order error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao atualizar pedido'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// DELETE /api/bling/orders/[id] - Delete specific order
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
    const paramsValidation = paramsSchema.safeParse(params)
    if (!paramsValidation.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'ID do pedido inválido'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = querySchema.parse(queryParams)
    
    const { company_id } = validatedQuery
    const { id: orderId } = paramsValidation.data

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

    // Delete order from Bling
    const deleteResult = await blingService.deleteOrder(orderId)

    if (!deleteResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, deleteResult.message || 'Erro ao excluir pedido'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'order_deleted',
      title: 'Pedido Bling excluído',
      description: `Pedido ${orderId} excluído do Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'order',
      entity_id: orderId,
      entity_name: `Pedido ${orderId}`,
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
      createApiResponse(true, null, 'Pedido excluído com sucesso')
    )

  } catch (error: any) {
    console.error('Delete Bling order error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao excluir pedido'),
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