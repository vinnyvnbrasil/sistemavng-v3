import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, validatePaginationParams, calculatePaginationMeta, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'
import { BlingCustomerFilters, BlingCustomer } from '@/types/bling'

// Validation schemas
const querySchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  nome: z.string().optional(),
  email: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  situacao: z.enum(['A', 'I']).optional(),
  tipo: z.enum(['F', 'J']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
})

const createCustomerSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  customer: z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    codigo: z.string().optional(),
    documento: z.string().optional(),
    ie: z.string().optional(),
    rg: z.string().optional(),
    orgaoEmissor: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
    celular: z.string().optional(),
    fone: z.string().optional(),
    fantasia: z.string().optional(),
    tipo: z.enum(['F', 'J']).default('F'),
    situacao: z.enum(['A', 'I']).default('A'),
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

const updateCustomerSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  customer_id: z.string().min(1, 'ID do cliente é obrigatório'),
  updates: createCustomerSchema.shape.customer.partial()
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

// GET /api/bling/customers - List customers with pagination and filtering
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

    const filters: BlingCustomerFilters = {
      pagina: paginationParams.page,
      limite: paginationParams.limit
    }

    if (validatedQuery.search) {
      filters.nome = validatedQuery.search
    }

    if (validatedQuery.nome) {
      filters.nome = validatedQuery.nome
    }

    if (validatedQuery.email) {
      filters.email = validatedQuery.email
    }

    if (validatedQuery.cpf_cnpj) {
      filters.cpf_cnpj = validatedQuery.cpf_cnpj
    }

    if (validatedQuery.situacao) {
      filters.situacao = validatedQuery.situacao
    }

    if (validatedQuery.tipo) {
      filters.tipo = validatedQuery.tipo
    }

    // Get customers from Bling
    const customersResult = await blingService.getCustomers(filters)

    if (!customersResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, customersResult.message || 'Erro ao buscar clientes'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { data: customers, total } = customersResult.data || { data: [], total: 0 }

    // Calculate pagination metadata
    const meta = calculatePaginationMeta({
      page: paginationParams.page,
      limit: paginationParams.limit,
      total
    })

    // Log activity
    await ActivityService.createActivity({
      type: 'data_accessed',
      title: 'Clientes Bling acessados',
      description: `Lista de clientes Bling acessada para empresa ${company_id}`,
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
      createApiResponse(true, customers, 'Clientes listados com sucesso', meta)
    )

  } catch (error: any) {
    console.error('Get Bling customers error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao buscar clientes'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// POST /api/bling/customers - Create new customer
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
    const validationResult = createCustomerSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, customer } = validationResult.data

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

    // Create customer in Bling
    const createResult = await blingService.createCustomer(customer as BlingCustomer)

    if (!createResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, createResult.message || 'Erro ao criar cliente'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'customer_created',
      title: 'Cliente Bling criado',
      description: `Cliente ${customer.nome} criado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'customer',
      entity_id: createResult.data?.id?.toString() || 'unknown',
      entity_name: `Cliente ${customer.nome}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          company_id,
          bling_customer_id: createResult.data?.id,
          customer_name: customer.nome,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, createResult.data, 'Cliente criado com sucesso'),
      { status: HttpStatus.CREATED }
    )

  } catch (error: any) {
    console.error('Create Bling customer error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao criar cliente'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT /api/bling/customers - Update customer
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
    const validationResult = updateCustomerSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, customer_id, updates } = validationResult.data

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
    const updateResult = await blingService.updateCustomer(customer_id, updates as Partial<BlingCustomer>)

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
      description: `Cliente ${customer_id} atualizado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'customer',
      entity_id: customer_id,
      entity_name: `Cliente ${customer_id}`,
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