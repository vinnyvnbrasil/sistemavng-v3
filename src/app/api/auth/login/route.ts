import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { rateLimit } from '@/lib/utils/rate-limit'
import { createApiResponse, ApiErrorCode, HttpStatus } from '@/types/api'
import { AuthService } from '@/lib/services/auth'
import { ActivityService } from '@/lib/services/activities'
import { DeviceType } from '@/types/auth'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  remember: z.boolean().optional().default(false)
})

// Rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per interval
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 5, 'CACHE_TOKEN') // 5 requests per minute
    } catch {
      return NextResponse.json(
        createApiResponse(false, null, 'Muitas tentativas de login. Tente novamente em alguns minutos.'),
        { status: HttpStatus.TOO_MANY_REQUESTS }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.flatten().fieldErrors
      }, { status: HttpStatus.BAD_REQUEST })
    }

    const { email, password, remember } = validationResult.data

    // Initialize services
    const authService = new AuthService()
    const activityService = new ActivityService()

    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'
    
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    try {
      // Attempt login
      const loginResult = await authService.login(
        { email, password, remember_me: remember },
        { 
          device_type: DeviceType.DESKTOP,
          browser: 'unknown',
          browser_version: 'unknown',
          os: 'unknown',
          os_version: 'unknown',
          device_name: 'unknown',
          is_mobile: false,
          is_trusted: false
        }
      )

      // Log successful login activity
      await ActivityService.createActivity({
        type: 'login',
        title: 'Login realizado com sucesso',
        description: `Login realizado com sucesso para ${email}`,
        user_id: loginResult.data?.user.id || 'unknown',
        entity_type: 'user',
        entity_id: loginResult.data?.user.id || 'unknown',
        entity_name: email,
        metadata: {
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          additional_info: {
            device_type: 'desktop',
            timestamp: new Date().toISOString()
          }
        }
      })

      // Set authentication cookies if remember is true
      const response = NextResponse.json(
        createApiResponse(true, loginResult, 'Login realizado com sucesso')
      )

      if (remember) {
        response.cookies.set('auth-token', loginResult.data?.access_token || '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
        
        response.cookies.set('refresh-token', loginResult.data?.refresh_token || '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
      }

      return response

    } catch (error: any) {
      // Log failed login activity
      await ActivityService.createActivity({
        type: 'login',
        title: 'Tentativa de login falhada',
        description: `Tentativa de login falhada para ${email}`,
        user_id: 'anonymous',
        entity_type: 'user',
        entity_id: 'anonymous',
        entity_name: email,
        metadata: {
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          additional_info: {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }
      })

      // Check if it's a 2FA requirement
      if (error.message.includes('2FA')) {
        return NextResponse.json(
          createApiResponse(false, { requires_2fa: true }, 'Autenticação de dois fatores necessária'),
          { status: HttpStatus.UNAUTHORIZED }
        )
      }

      return NextResponse.json(
        createApiResponse(false, null, 'Credenciais inválidas'),
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

  } catch (error: any) {
    console.error('Login error:', error)
    
    return NextResponse.json(
      createApiResponse(false, null, 'Erro interno do servidor'),
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}