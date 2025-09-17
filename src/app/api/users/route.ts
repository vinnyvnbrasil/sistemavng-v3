import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createApiResponse, validatePaginationParams, calculatePaginationMeta, HttpStatus } from '@/types/api'
import { ActivityService } from '@/lib/services/activities'
import { AuthService } from '@/lib/services/auth'
import { rateLimit } from '@/lib/utils/rate-limit'

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['admin', 'user', 'moderator']).default('user'),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional()
})

const updateUserSchema = createUserSchema.partial().omit({ password: true })

const querySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
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

// GET /api/users - List users with pagination and filtering
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

    // Verify authentication using Supabase
    const token = authHeader.substring(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
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
    
    const paginationParams = validatePaginationParams({
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sort: validatedQuery.sort,
      order: validatedQuery.order
    })

    // Build query
    let query = supabase
      .from('users')
      .select('id, name, email, role, status, avatar_url, phone, department, position, created_at, updated_at', { count: 'exact' })

    // Apply filters
    if (validatedQuery.search) {
      query = query.or(`name.ilike.%${validatedQuery.search}%,email.ilike.%${validatedQuery.search}%`)
    }
    
    if (validatedQuery.role) {
      query = query.eq('role', validatedQuery.role)
    }
    
    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status)
    }

    // Apply sorting
    if (paginationParams.sort) {
      query = query.order(paginationParams.sort, { ascending: paginationParams.order === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = ((paginationParams.page || 1) - 1) * (paginationParams.limit || 20)
    const to = from + (paginationParams.limit || 20) - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Calculate pagination meta
    const meta = calculatePaginationMeta(
      count || 0,
      paginationParams.page || 1,
      paginationParams.limit || 20
    )

    // Log activity
    await ActivityService.createActivity({
      type: 'profile_updated',
      title: 'Lista de usuários acessada',
      description: 'Lista de usuários acessada',
      user_id: user.id,
      entity_type: 'user',
      entity_id: user.id,
      entity_name: user.email || 'unknown',
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          filters: validatedQuery,
          total_results: count,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, data, 'Usuários listados com sucesso', meta)
    )

  } catch (error: any) {
    console.error('Get users error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao buscar usuários'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// POST /api/users - Create new user
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

    // Verify authentication and admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token de acesso necessário'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify token using Supabase
    const { data: { user: authUser }, error: authError1 } = await supabase.auth.getUser(token)
    
    if (authError1 || !authUser) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token inválido'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    // Get user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        createApiResponse(false, null, 'Acesso negado'),
        { status: HttpStatus.FORBIDDEN }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createUserSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados inválidos'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const userData = validationResult.data

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        createApiResponse(false, null, 'Email já está em uso'),
        { status: HttpStatus.CONFLICT }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role
      }
    })

    if (authError) {
      throw authError
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar_url: userData.avatar_url,
        phone: userData.phone,
        department: userData.department,
        position: userData.position,
        status: 'active'
      })
      .select()
      .single()

    if (profileError) {
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'profile_updated',
      title: 'Usuário criado',
      description: `Usuário ${userData.name} criado`,
      user_id: user.id,
      entity_type: 'user',
      entity_id: profileData.id,
      entity_name: userData.email,
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          created_user_id: profileData.id,
          created_user_email: userData.email,
          created_user_role: userData.role,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, profileData, 'Usuário criado com sucesso'),
      { status: HttpStatus.CREATED }
    )

  } catch (error: any) {
    console.error('Create user error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao criar usuário'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT /api/users - Bulk update users (admin only)
export async function PUT(request: NextRequest) {
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

    // Verify authentication and admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token de acesso necessário'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify token using Supabase
    const { data: { user: authUser }, error: authError2 } = await supabase.auth.getUser(token)
    
    if (authError2 || !authUser) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token inválido'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    // Get user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        createApiResponse(false, null, 'Acesso negado'),
        { status: HttpStatus.FORBIDDEN }
      )
    }

    // Parse request body
    const body = await request.json()
    const { user_ids, updates } = body

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        createApiResponse(false, null, 'IDs de usuários são obrigatórios'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Validate updates
    const validationResult = updateUserSchema.safeParse(updates)
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Dados de atualização inválidos'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Update users
    const { data, error } = await supabase
      .from('users')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString()
      })
      .in('id', user_ids)
      .select()

    if (error) {
      throw error
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'profile_updated',
      title: 'Usuários atualizados em lote',
      description: `${user_ids.length} usuários atualizados em lote`,
      user_id: user.id,
      entity_type: 'user',
      entity_id: user.id,
      entity_name: user.email || 'unknown',
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          user_ids,
          updates: validationResult.data,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, data, `${data?.length || 0} usuários atualizados com sucesso`)
    )

  } catch (error: any) {
    console.error('Bulk update users error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao atualizar usuários'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// DELETE /api/users - Bulk delete users (admin only)
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

    // Verify authentication and admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiResponse(false, null, 'Token de acesso necessário'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify token using Supabase
     const { data: { user: authUser }, error: authError3 } = await supabase.auth.getUser(token)
     
     if (authError3 || !authUser) {
       return NextResponse.json(
         createApiResponse(false, null, 'Token inválido'),
         { status: HttpStatus.UNAUTHORIZED }
       )
     }

    // Get user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        createApiResponse(false, null, 'Acesso negado'),
        { status: HttpStatus.FORBIDDEN }
      )
    }

    // Parse request body
    const body = await request.json()
    const { user_ids } = body

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        createApiResponse(false, null, 'IDs de usuários são obrigatórios'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Prevent self-deletion
    if (user_ids.includes(user.id)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Não é possível excluir sua própria conta'),
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Get users to be deleted for logging
    const { data: usersToDelete } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', user_ids)

    // Delete users from auth
    for (const userId of user_ids) {
      await supabase.auth.admin.deleteUser(userId)
    }

    // Delete users from profiles (cascade should handle this, but being explicit)
    const { error } = await supabase
      .from('users')
      .delete()
      .in('id', user_ids)

    if (error) {
      throw error
    }

    // Log activity
    await ActivityService.createActivity({
      type: 'profile_updated',
      title: 'Usuários excluídos',
      description: `${user_ids.length} usuários excluídos`,
      user_id: user.id,
      entity_type: 'user',
      entity_id: user.id,
      entity_name: user.email || 'unknown',
      metadata: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        additional_info: {
          deleted_users: usersToDelete,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      createApiResponse(true, null, `${user_ids.length} usuários excluídos com sucesso`)
    )

  } catch (error: any) {
    console.error('Bulk delete users error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro ao excluir usuários'),
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