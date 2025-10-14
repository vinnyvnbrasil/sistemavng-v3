import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, validatePaginationParams, calculatePaginationMeta, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'
import { BlingOrderFilters, BlingOrder } from '@/types/bling'

// Validation schemas
const querySchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
})

const createOrderSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  order: z.object({
    numero: z.string().optional(),
    numeroLoja: z.string().optional(),
    data: z.string(),
    dataSaida: z.string().optional(),
    dataPrevista: z.string().optional(),
    totalProdutos: z.number(),
    total: z.number(),
    contato: z.object({
      id: z.number().optional(),
      nome: z.string(),
      tipoPessoa: z.enum(['F', 'J']),
      contribuinte: z.enum(['1', '2', '9']).optional(),
      cpf_cnpj: z.string().optional(),
      ie_rg: z.string().optional(),
      endereco: z.object({
        endereco: z.string(),
        numero: z.string(),
        complemento: z.string().optional(),
        bairro: z.string(),
        cep: z.string(),
        cidade: z.string(),
        uf: z.string(),
        pais: z.string().optional()
      }).optional(),
      fone: z.string().optional(),
      celular: z.string().optional(),
      email: z.string().email().optional()
    }),
    itens: z.array(z.object({
      produto: z.object({
        id: z.number().optional(),
        codigo: z.string(),
        descricao: z.string(),
        tipo: z.enum(['P', 'S']).optional(),
        situacao: z.enum(['A', 'I']).optional(),
        unidade: z.string().optional(),
        preco: z.number(),
        pesoBruto: z.number().optional(),
        pesoLiquido: z.number().optional(),
        gtin: z.string().optional(),
        gtinEmbalagem: z.string().optional(),
        tipoProducao: z.enum(['P', 'T']).optional(),
        condicao: z.enum(['0', '1', '2', '3', '4', '5']).optional(),
        freteGratis: z.boolean().optional(),
        marca: z.string().optional(),
        descricaoCurta: z.string().optional(),
        imagemURL: z.string().optional()
      }),
      quantidade: z.number(),
      valor: z.number(),
      desconto: z.number().optional(),
      aliquotaIPI: z.number().optional()
    })),
    transporte: z.object({
      transportadora: z.object({
        nome: z.string().optional(),
        cpf_cnpj: z.string().optional()
      }).optional(),
      tipoFrete: z.enum(['0', '1', '2', '3', '4', '9']).optional(),
      valorFrete: z.number().optional(),
      prazoEntrega: z.number().optional(),
      contato: z.object({
        tipoPessoa: z.enum(['F', 'J']).optional(),
        nome: z.string().optional(),
        cpf_cnpj: z.string().optional(),
        ie_rg: z.string().optional(),
        endereco: z.object({
          endereco: z.string(),
          numero: z.string(),
          complemento: z.string().optional(),
          bairro: z.string(),
          cep: z.string(),
          cidade: z.string(),
          uf: z.string(),
          pais: z.string().optional()
        }).optional(),
        fone: z.string().optional(),
        email: z.string().email().optional()
      }).optional(),
      volumes: z.array(z.object({
        servico: z.string().optional(),
        codigoRastreamento: z.string().optional()
      })).optional()
    }).optional(),
    observacoes: z.string().optional(),
    observacoesInternas: z.string().optional()
  })
})

const updateOrderSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  order_id: z.string().min(1, 'ID do pedido é obrigatório'),
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

// GET /api/bling/orders - List orders with pagination and filtering
export async function GET(request: NextRequest) {
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

    // Prepare filters
    const paginationParams = validatePaginationParams({
      page: validatedQuery.page,
      limit: validatedQuery.limit
    })

    const filters: BlingOrderFilters = {
      pagina: paginationParams.page,
      limite: paginationParams.limit
    }

    if (validatedQuery.search) {
      filters.numero = validatedQuery.search
    }

    if (validatedQuery.status) {
      filters.situacao = validatedQuery.status
    }

    if (validatedQuery.date_from) {
      filters.dataInicial = validatedQuery.date_from
    }

    if (validatedQuery.date_to) {
      filters.dataFinal = validatedQuery.date_to
    }

    // Get orders from Bling
    const ordersResult = await blingService.getOrders(filters)

    if (!ordersResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, ordersResult.message || 'Erro ao buscar pedidos'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { data: orders, total } = ordersResult.data || { data: [], total: 0 }

    // Calculate pagination metadata
    const meta = calculatePaginationMeta({
      page: paginationParams.page,
      limit: paginationParams.limit,
      total
    })

    // Log activity
    await ActivityService.createActivity({
      type: 'data_accessed',
      title: 'Pedidos Bling acessados',
      description: `Lista de pedidos Bling acessada para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: company_id,
      entity_name: `Empresa ${company_id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          filters: validatedQuery,
          total_results: total,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, orders, 'Pedidos listados com sucesso', meta)
    )

  } catch (error: any) {
    console.error('Get Bling orders error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao buscar pedidos'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// POST /api/bling/orders - Create new order
export async function POST(request: NextRequest) {
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
    const validationResult = createOrderSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, order } = validationResult.data

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

    // Create order in Bling
    const createResult = await blingService.createOrder(order as BlingOrder)

    if (!createResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, createResult.message || 'Erro ao criar pedido'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'order_created',
      title: 'Pedido Bling criado',
      description: `Pedido criado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'order',
      entity_id: createResult.data?.id?.toString() || 'unknown',
      entity_name: `Pedido ${createResult.data?.numero || 'N/A'}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          company_id,
          bling_order_id: createResult.data?.id,
          order_number: createResult.data?.numero,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, createResult.data, 'Pedido criado com sucesso'),
      { status: HttpStatus.CREATED }
    )

  } catch (error: any) {
    console.error('Create Bling order error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao criar pedido'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT /api/bling/orders - Update order
export async function PUT(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateOrderSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, order_id, updates } = validationResult.data

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
    const updateResult = await blingService.updateOrder(order_id, updates as Partial<BlingOrder>)

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
      description: `Pedido ${order_id} atualizado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'order',
      entity_id: order_id,
      entity_name: `Pedido ${order_id}`,
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

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}