import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, HttpStatus } from '@/types/api'
import { BlingApiService } from '@/lib/services/bling-api'
import { ActivityService } from '@/lib/services/activities'
import { rateLimit } from '@/lib/utils/rate-limit'

// Validation schemas
const statsQuerySchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  include_products: z.boolean().default(false),
  include_customers: z.boolean().default(false)
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

// GET /api/bling/stats - Get Bling statistics and analytics
export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Convert string booleans to actual booleans
    if (queryParams.include_products) {
      queryParams.include_products = queryParams.include_products === 'true'
    }
    if (queryParams.include_customers) {
      queryParams.include_customers = queryParams.include_customers === 'true'
    }

    const validationResult = statsQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Parâmetros inválidos', null, validationResult.error.flatten().fieldErrors),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { company_id, start_date, end_date, include_products, include_customers } = validationResult.data

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

    try {
      // Test connection first
      const connectionTest = await blingService.testConnection()
      if (!connectionTest.success) {
        return NextResponse.json(
          createApiResponse(false, null, `Erro de conexão com Bling: ${connectionTest.message}`),
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // Get statistics from Bling API
      const stats = await blingService.getStats({
        startDate: start_date,
        endDate: end_date,
        includeProducts: include_products,
        includeCustomers: include_customers
      })

      // Get sync history for additional context
      const { data: syncHistory, error: syncError } = await supabase
        .from('bling_sync_logs')
        .select('*')
        .eq('company_id', company_id)
        .order('started_at', { ascending: false })
        .limit(5)

      if (syncError) {
        console.error('Error fetching sync history:', syncError)
      }

      // Get last successful sync dates
      const { data: lastSyncs, error: lastSyncError } = await supabase
        .from('bling_sync_logs')
        .select('sync_type, completed_at')
        .eq('company_id', company_id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (lastSyncError) {
        console.error('Error fetching last syncs:', lastSyncError)
      }

      // Process last sync data
      const lastSyncData = lastSyncs?.reduce((acc, sync) => {
        if (!acc[sync.sync_type]) {
          acc[sync.sync_type] = sync.completed_at
        }
        return acc
      }, {} as Record<string, string>)

      // Prepare comprehensive response
      const responseData = {
        ...stats,
        sync_info: {
          last_syncs: lastSyncData || {},
          recent_sync_history: syncHistory || [],
          config_status: {
            is_active: blingConfig.is_active,
            environment: blingConfig.environment,
            has_valid_tokens: !!(blingConfig.access_token && blingConfig.refresh_token),
            token_expires_at: blingConfig.expires_at,
            is_token_expired: blingConfig.expires_at ? new Date(blingConfig.expires_at) < new Date() : true
          }
        },
        generated_at: new Date().toISOString()
      }

      // Log activity
      await ActivityService.createActivity({
        type: 'data_accessed',
        title: 'Estatísticas Bling acessadas',
        description: `Estatísticas Bling acessadas para empresa ${company_id}`,
        user_id: user.id,
        entity_type: 'company',
        entity_id: company_id,
        entity_name: `Empresa ${company_id}`,
        metadata: {
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          additional_info: {
            start_date,
            end_date,
            include_products,
            include_customers,
            total_orders: stats.totalOrders,
            total_revenue: stats.totalRevenue,
            timestamp: new Date().toISOString()
          }
        }
      })

      return NextResponse.json(
        createApiResponse(true, responseData, 'Estatísticas Bling obtidas com sucesso')
      )

    } catch (error: any) {
      console.error('Bling stats error:', error)
      
      // Log error activity
      await ActivityService.createActivity({
        type: 'error_occurred',
        title: 'Erro ao obter estatísticas Bling',
        description: `Erro ao obter estatísticas Bling para empresa ${company_id}: ${error.message}`,
        user_id: user.id,
        entity_type: 'company',
        entity_id: company_id,
        entity_name: `Empresa ${company_id}`,
        metadata: {
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          additional_info: {
            error_message: error.message,
            error_stack: error.stack,
            timestamp: new Date().toISOString()
          }
        }
      })

      return NextResponse.json(
        createApiResponse(false, null, `Erro ao obter estatísticas: ${error.message}`),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

  } catch (error: any) {
    console.error('Stats endpoint error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao processar solicitação de estatísticas'),
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}