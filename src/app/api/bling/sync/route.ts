import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'
import { BlingSyncOptions } from '@/types/bling'

// Validation schemas
const syncSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  type: z.enum(['orders', 'products', 'customers', 'all'], {
    required_error: 'Tipo de sincronização é obrigatório',
    invalid_type_error: 'Tipo deve ser orders, products, customers ou all'
  }),
  options: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    forceUpdate: z.boolean().default(false),
    batchSize: z.number().min(1).max(100).default(50),
    includeInactive: z.boolean().default(false)
  }).optional()
})

const syncStatusSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  sync_id: z.string().uuid('ID da sincronização deve ser um UUID válido')
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

// POST /api/bling/sync - Start synchronization
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 5, 'CACHE_TOKEN') // 5 requests per minute for sync operations
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
    const validationResult = syncSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, type, options = {} } = validationResult.data

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

    // Check if there's already a sync in progress for this company
    const { data: activeSyncs, error: syncCheckError } = await supabase
      .from('bling_sync_logs')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'in_progress')
      .limit(1)

    if (syncCheckError) {
      console.error('Error checking active syncs:', syncCheckError)
    }

    if (activeSyncs && activeSyncs.length > 0) {
      return NextResponse.json(
        createApiResponse(false, null, 'Já existe uma sincronização em andamento para esta empresa'),
        { status: HttpStatus.CONFLICT }
      )
    }

    // Initialize Bling API service
    const blingService = new BlingApiService(blingConfig)

    // Create sync log entry
    const syncId = crypto.randomUUID()
    const { error: logError } = await supabase
      .from('bling_sync_logs')
      .insert({
        id: syncId,
        company_id,
        sync_type: type,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        started_by: user.id,
        options: options
      })

    if (logError) {
      console.error('Error creating sync log:', logError)
      return NextResponse.json(
        createApiResponse(false, null, 'Erro ao iniciar sincronização'),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    // Prepare sync options
    const syncOptions: BlingSyncOptions = {
      startDate: options.startDate,
      endDate: options.endDate,
      forceUpdate: options.forceUpdate || false,
      batchSize: options.batchSize || 50,
      includeInactive: options.includeInactive || false
    }

    // Start synchronization based on type
    let syncResult
    try {
      switch (type) {
        case 'orders':
          syncResult = await blingService.syncOrders(syncOptions)
          break
        case 'products':
          syncResult = await blingService.syncProducts(syncOptions)
          break
        case 'customers':
          // Note: syncCustomers method would need to be implemented in BlingApiService
          syncResult = { success: false, message: 'Sincronização de clientes não implementada ainda' }
          break
        case 'all':
          // Sync all entities sequentially
          const ordersResult = await blingService.syncOrders(syncOptions)
          const productsResult = await blingService.syncProducts(syncOptions)
          
          syncResult = {
            success: ordersResult.success && productsResult.success,
            data: {
              orders: ordersResult.data,
              products: productsResult.data
            },
            message: ordersResult.success && productsResult.success 
              ? 'Sincronização completa realizada com sucesso'
              : 'Sincronização completa com alguns erros'
          }
          break
        default:
          syncResult = { success: false, message: 'Tipo de sincronização inválido' }
      }
    } catch (error: any) {
      console.error('Sync error:', error)
      syncResult = { success: false, message: error.message || 'Erro durante a sincronização' }
    }

    // Update sync log with results
    const { error: updateLogError } = await supabase
      .from('bling_sync_logs')
      .update({
        status: syncResult.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        result: syncResult.data || null,
        error_message: syncResult.success ? null : syncResult.message
      })
      .eq('id', syncId)

    if (updateLogError) {
      console.error('Error updating sync log:', updateLogError)
    }

    // Log activity
    await ActivityService.createActivity({
      type: syncResult.success ? 'sync_completed' : 'sync_failed',
      title: `Sincronização Bling ${syncResult.success ? 'concluída' : 'falhou'}`,
      description: `Sincronização ${type} ${syncResult.success ? 'concluída com sucesso' : 'falhou'} para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: company_id,
      entity_name: `Empresa ${company_id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          sync_id: syncId,
          sync_type: type,
          options: syncOptions,
          result: syncResult.data,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(
        syncResult.success, 
        { 
          sync_id: syncId, 
          result: syncResult.data 
        }, 
        syncResult.message || (syncResult.success ? 'Sincronização iniciada com sucesso' : 'Erro na sincronização')
      ),
      { status: syncResult.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST }
    )

  } catch (error: any) {
    console.error('Sync endpoint error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao processar sincronização'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// GET /api/bling/sync - Get sync status or history
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
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    const company_id = queryParams.company_id
    const sync_id = queryParams.sync_id
    const limit = parseInt(queryParams.limit || '10')
    const offset = parseInt(queryParams.offset || '0')

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

    let query = supabase
      .from('bling_sync_logs')
      .select('*')
      .eq('company_id', company_id)

    // If specific sync_id is requested
    if (sync_id) {
      query = query.eq('id', sync_id)
      
      const { data: syncLog, error: syncError } = await query.single()
      
      if (syncError || !syncLog) {
        return NextResponse.json(
          createApiResponse(false, null, 'Sincronização não encontrada'),
          { status: HttpStatus.NOT_FOUND }
        )
      }

      return NextResponse.json(
        createApiResponse(true, syncLog, 'Status da sincronização obtido com sucesso')
      )
    }

    // Get sync history with pagination
    const { data: syncLogs, error: logsError } = await query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (logsError) {
      console.error('Error fetching sync logs:', logsError)
      return NextResponse.json(
        createApiResponse(false, null, 'Erro ao buscar histórico de sincronizações'),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('bling_sync_logs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id)

    if (countError) {
      console.error('Error counting sync logs:', countError)
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'data_accessed',
      title: 'Histórico de sincronização Bling acessado',
      description: `Histórico de sincronizações Bling acessado para empresa ${company_id}`,
      user_id: user.id,
      entity_type: 'company',
      entity_id: company_id,
      entity_name: `Empresa ${company_id}`,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          sync_id,
          limit,
          offset,
          total_results: count || 0,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(
        true, 
        syncLogs, 
        'Histórico de sincronizações obtido com sucesso',
        {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      )
    )

  } catch (error: any) {
    console.error('Get sync status error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao buscar status da sincronização'),
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}