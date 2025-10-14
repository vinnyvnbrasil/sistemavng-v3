import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, validatePaginationParams, calculatePaginationMeta, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'
import { BlingProductFilters, BlingProduct } from '@/types/bling'

// Validation schemas
const querySchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  codigo: z.string().optional(),
  tipo: z.enum(['P', 'S']).optional(),
  situacao: z.enum(['A', 'I']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
})

const createProductSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  product: z.object({
    codigo: z.string().min(1, 'Código é obrigatório'),
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    tipo: z.enum(['P', 'S']).default('P'),
    situacao: z.enum(['A', 'I']).default('A'),
    unidade: z.string().optional(),
    preco: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
    precoCusto: z.number().min(0, 'Preço de custo deve ser maior ou igual a zero').optional(),
    pesoBruto: z.number().min(0, 'Peso bruto deve ser maior ou igual a zero').optional(),
    pesoLiquido: z.number().min(0, 'Peso líquido deve ser maior ou igual a zero').optional(),
    volumes: z.number().min(1, 'Volumes deve ser maior que zero').optional(),
    itensPorCaixa: z.number().min(1, 'Itens por caixa deve ser maior que zero').optional(),
    gtin: z.string().optional(),
    gtinEmbalagem: z.string().optional(),
    tipoProducao: z.enum(['P', 'T']).optional(),
    condicao: z.enum(['0', '1', '2', '3', '4', '5']).optional(),
    freteGratis: z.boolean().optional(),
    marca: z.string().optional(),
    descricaoCurta: z.string().optional(),
    imagemURL: z.string().url().optional(),
    observacoes: z.string().optional(),
    categoria: z.object({
      id: z.number().optional()
    }).optional(),
    estoque: z.object({
      minimo: z.number().min(0).optional(),
      maximo: z.number().min(0).optional(),
      crossdocking: z.number().min(0).optional(),
      localizacao: z.string().optional()
    }).optional(),
    actionEstoque: z.enum(['A', 'S', 'T']).optional(),
    dimensoes: z.object({
      largura: z.number().min(0).optional(),
      altura: z.number().min(0).optional(),
      profundidade: z.number().min(0).optional(),
      unidadeMedida: z.enum(['1', '2', '3', '4', '5', '6', '7', '8']).optional()
    }).optional(),
    tributacao: z.object({
      origem: z.enum(['0', '1', '2', '3', '4', '5', '6', '7', '8']).optional(),
      nFCI: z.string().optional(),
      ncm: z.string().optional(),
      cest: z.string().optional(),
      codigoListaServicos: z.string().optional(),
      spedTipoItem: z.enum(['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10']).optional(),
      codigoItem: z.string().optional(),
      percentualTributos: z.number().min(0).max(100).optional(),
      valorBaseStRetencao: z.number().min(0).optional(),
      valorStRetencao: z.number().min(0).optional(),
      valorICMSSubstituto: z.number().min(0).optional(),
      codigoBeneficioFiscalUF: z.string().optional(),
      tipoAto: z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99']).optional(),
      numeroAto: z.string().optional(),
      anoAto: z.string().optional()
    }).optional(),
    midia: z.object({
      video: z.object({
        url: z.string().url().optional()
      }).optional(),
      imagens: z.object({
        externas: z.array(z.object({
          link: z.string().url()
        })).optional()
      }).optional()
    }).optional(),
    linhaProduto: z.object({
      id: z.number().optional()
    }).optional(),
    estrutura: z.object({
      tipoEstoque: z.enum(['F', 'M']).optional(),
      lancamentoEstoque: z.enum(['A', 'M']).optional(),
      componentes: z.array(z.object({
        produto: z.object({
          id: z.number()
        }),
        quantidade: z.number().min(0)
      })).optional()
    }).optional(),
    camposCustomizados: z.array(z.object({
      idCampoCustomizado: z.number(),
      idVinculo: z.number().optional(),
      valor: z.string().optional(),
      item: z.string().optional()
    })).optional(),
    variacoes: z.array(z.object({
      nome: z.string(),
      codigo: z.string(),
      gtin: z.string().optional(),
      preco: z.number().min(0),
      precoCusto: z.number().min(0).optional(),
      peso: z.number().min(0).optional(),
      estoque: z.object({
        saldo: z.number().min(0).optional()
      }).optional(),
      variacao: z.object({
        nome: z.string(),
        ordem: z.number().min(1).optional(),
        produtoVariacaoPai: z.object({
          cloneInfo: z.boolean().optional()
        }).optional()
      })
    })).optional()
  })
})

const updateProductSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  product_id: z.string().min(1, 'ID do produto é obrigatório'),
  updates: createProductSchema.shape.product.partial()
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

// GET /api/bling/products - List products with pagination and filtering
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

    const filters: BlingProductFilters = {
      pagina: paginationParams.page,
      limite: paginationParams.limit
    }

    if (validatedQuery.search) {
      filters.descricao = validatedQuery.search
    }

    if (validatedQuery.codigo) {
      filters.codigo = validatedQuery.codigo
    }

    if (validatedQuery.tipo) {
      filters.tipo = validatedQuery.tipo
    }

    if (validatedQuery.situacao) {
      filters.situacao = validatedQuery.situacao
    }

    // Get products from Bling
    const productsResult = await blingService.getProducts(filters)

    if (!productsResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, productsResult.message || 'Erro ao buscar produtos'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { data: products, total } = productsResult.data || { data: [], total: 0 }

    // Calculate pagination metadata
    const meta = calculatePaginationMeta({
      page: paginationParams.page,
      limit: paginationParams.limit,
      total
    })

    // Log activity
    await ActivityService.createActivity({
      type: 'data_accessed',
      title: 'Produtos Bling acessados',
      description: `Lista de produtos Bling acessada para empresa ${company_id}`,
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
      createApiResponse(true, products, 'Produtos listados com sucesso', meta)
    )

  } catch (error: any) {
    console.error('Get Bling products error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao buscar produtos'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// POST /api/bling/products - Create new product
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
    const validationResult = createProductSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, product } = validationResult.data

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

    // Create product in Bling
    const createResult = await blingService.createProduct(product as BlingProduct)

    if (!createResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, createResult.message || 'Erro ao criar produto'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'product_created',
      title: 'Produto Bling criado',
      description: `Produto ${product.codigo} criado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'product',
      entity_id: createResult.data?.id?.toString() || 'unknown',
      entity_name: `Produto ${product.codigo}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          company_id,
          bling_product_id: createResult.data?.id,
          product_code: product.codigo,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, createResult.data, 'Produto criado com sucesso'),
      { status: HttpStatus.CREATED }
    )

  } catch (error: any) {
    console.error('Create Bling product error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao criar produto'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT /api/bling/products - Update product
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
    const validationResult = updateProductSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, product_id, updates } = validationResult.data

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

    // Update product in Bling
    const updateResult = await blingService.updateProduct(product_id, updates as Partial<BlingProduct>)

    if (!updateResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, updateResult.message || 'Erro ao atualizar produto'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'product_updated',
      title: 'Produto Bling atualizado',
      description: `Produto ${product_id} atualizado no Bling para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'product',
      entity_id: product_id,
      entity_name: `Produto ${product_id}`,
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
      createApiResponse(true, updateResult.data, 'Produto atualizado com sucesso')
    )

  } catch (error: any) {
    console.error('Update Bling product error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao atualizar produto'),
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