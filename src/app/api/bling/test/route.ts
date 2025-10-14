import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@supabase/supabase-js';
import { BlingApiService } from '@/lib/services/bling-api';
import { logActivity } from '@/lib/services/activity-logger';

// Schema de validação para teste
const testSchema = z.object({
  company_id: z.string().uuid('ID da empresa deve ser um UUID válido'),
  test_type: z.enum(['connection', 'auth', 'orders', 'products', 'customers', 'all'], {
    errorMap: () => ({ message: 'Tipo de teste deve ser: connection, auth, orders, products, customers ou all' })
  }),
  config: z.object({
    client_id: z.string().min(1, 'Client ID é obrigatório'),
    client_secret: z.string().min(1, 'Client Secret é obrigatório'),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous';
    const rateLimitResult = await rateLimit(identifier, 10, 60); // 10 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas. Tente novamente em alguns minutos.',
          reset_time: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse do corpo da requisição
    const body = await request.json();
    const validatedData = testSchema.parse(body);

    // Verificar autenticação
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar acesso à empresa
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.company_id !== validatedData.company_id) {
      return NextResponse.json(
        { error: 'Acesso negado à empresa' },
        { status: 403 }
      );
    }

    // Buscar configuração do Bling ou usar a fornecida
    let blingConfig;
    if (validatedData.config) {
      blingConfig = validatedData.config;
    } else {
      const { data: config } = await supabase
        .from('bling_configs')
        .select('*')
        .eq('company_id', validatedData.company_id)
        .single();

      if (!config) {
        return NextResponse.json(
          { error: 'Configuração do Bling não encontrada' },
          { status: 404 }
        );
      }

      blingConfig = config;
    }

    // Inicializar serviço do Bling
    const blingService = new BlingApiService(blingConfig);

    // Executar testes baseado no tipo
    const testResults: any = {
      test_type: validatedData.test_type,
      timestamp: new Date().toISOString(),
      results: {},
    };

    try {
      switch (validatedData.test_type) {
        case 'connection':
          testResults.results.connection = await testConnection(blingService);
          break;

        case 'auth':
          testResults.results.auth = await testAuthentication(blingService);
          break;

        case 'orders':
          testResults.results.orders = await testOrders(blingService);
          break;

        case 'products':
          testResults.results.products = await testProducts(blingService);
          break;

        case 'customers':
          testResults.results.customers = await testCustomers(blingService);
          break;

        case 'all':
          testResults.results.connection = await testConnection(blingService);
          testResults.results.auth = await testAuthentication(blingService);
          testResults.results.orders = await testOrders(blingService);
          testResults.results.products = await testProducts(blingService);
          testResults.results.customers = await testCustomers(blingService);
          break;
      }

      // Calcular status geral
      const allTests = Object.values(testResults.results);
      const successfulTests = allTests.filter((test: any) => test.success).length;
      const totalTests = allTests.length;

      testResults.summary = {
        total_tests: totalTests,
        successful_tests: successfulTests,
        failed_tests: totalTests - successfulTests,
        success_rate: totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0,
        overall_status: successfulTests === totalTests ? 'success' : 'partial_failure',
      };

      // Log da atividade
      await logActivity({
        user_id: user.id,
        company_id: validatedData.company_id,
        action: 'bling_api_test',
        resource_type: 'bling_integration',
        resource_id: validatedData.company_id,
        details: {
          test_type: validatedData.test_type,
          success_rate: testResults.summary.success_rate,
          total_tests: totalTests,
        },
      });

      return NextResponse.json(testResults);

    } catch (testError: any) {
      // Log do erro
      await logActivity({
        user_id: user.id,
        company_id: validatedData.company_id,
        action: 'bling_api_test_error',
        resource_type: 'bling_integration',
        resource_id: validatedData.company_id,
        details: {
          test_type: validatedData.test_type,
          error: testError.message,
        },
      });

      return NextResponse.json(
        {
          error: 'Erro durante os testes',
          details: testError.message,
          test_type: validatedData.test_type,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Erro no endpoint de teste do Bling:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para testar conexão
async function testConnection(blingService: BlingApiService) {
  try {
    const result = await blingService.testConnection();
    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      data: result,
      duration_ms: 0, // TODO: Implementar medição de tempo
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Falha na conexão',
      error: error.message,
      duration_ms: 0,
    };
  }
}

// Função para testar autenticação
async function testAuthentication(blingService: BlingApiService) {
  try {
    // Tentar fazer uma requisição simples que requer autenticação
    await blingService.getOrders({ limit: 1 });
    return {
      success: true,
      message: 'Autenticação válida',
      duration_ms: 0,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Falha na autenticação',
      error: error.message,
      duration_ms: 0,
    };
  }
}

// Função para testar operações de pedidos
async function testOrders(blingService: BlingApiService) {
  try {
    const startTime = Date.now();
    
    // Testar listagem de pedidos
    const orders = await blingService.getOrders({ limit: 5 });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Operações de pedidos funcionando',
      data: {
        total_orders: orders.data?.length || 0,
        sample_order: orders.data?.[0] || null,
      },
      duration_ms: duration,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Falha nas operações de pedidos',
      error: error.message,
      duration_ms: 0,
    };
  }
}

// Função para testar operações de produtos
async function testProducts(blingService: BlingApiService) {
  try {
    const startTime = Date.now();
    
    // Testar listagem de produtos
    const products = await blingService.getProducts({ limit: 5 });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Operações de produtos funcionando',
      data: {
        total_products: products.data?.length || 0,
        sample_product: products.data?.[0] || null,
      },
      duration_ms: duration,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Falha nas operações de produtos',
      error: error.message,
      duration_ms: 0,
    };
  }
}

// Função para testar operações de clientes
async function testCustomers(blingService: BlingApiService) {
  try {
    const startTime = Date.now();
    
    // Testar listagem de clientes
    const customers = await blingService.getCustomers({ limit: 5 });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Operações de clientes funcionando',
      data: {
        total_customers: customers.data?.length || 0,
        sample_customer: customers.data?.[0] || null,
      },
      duration_ms: duration,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Falha nas operações de clientes',
      error: error.message,
      duration_ms: 0,
    };
  }
}

// Suporte para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}