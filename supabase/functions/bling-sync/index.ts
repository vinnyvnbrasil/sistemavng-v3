import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlingProduct {
  id: number
  nome: string
  codigo?: string
  preco: number
  situacao: string
  tipo: string
  descricao?: string
  categoria?: {
    id: number
    descricao: string
  }
  estoque?: {
    minimo: number
    maximo: number
    atual: number
  }
}

interface BlingOrder {
  id: number
  numero: string
  data: string
  situacao: {
    id: number
    valor: string
  }
  cliente: {
    id: number
    nome: string
    email?: string
    telefone?: string
  }
  itens: Array<{
    produto: {
      id: number
      nome: string
      codigo?: string
    }
    quantidade: number
    valor: number
  }>
  totais: {
    produtos: number
    desconto: number
    total: number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get Bling integration settings for the user
    const { data: integration, error: integrationError } = await supabaseClient
      .from('bling_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Bling integration not found or inactive' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { access_token } = integration

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: 'Bling access token not found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update sync status to 'syncing'
    await supabaseClient
      .from('bling_integrations')
      .update({ 
        sync_status: 'syncing',
        error_message: null
      })
      .eq('id', integration.id)

    const blingHeaders = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    }

    // Sync products from Bling
    try {
      const productsResponse = await fetch(
        `https://www.bling.com.br/Api/v3/produtos?limite=100`,
        {
          headers: blingHeaders,
        }
      )

      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        const products: BlingProduct[] = productsData.data || []

        // Process and store products
        for (const product of products) {
          const productData = {
            bling_id: product.id,
            name: product.nome,
            code: product.codigo,
            price: product.preco,
            status: product.situacao,
            type: product.tipo,
            description: product.descricao,
            category: product.categoria?.descricao,
            stock_min: product.estoque?.minimo,
            stock_max: product.estoque?.maximo,
            stock_current: product.estoque?.atual,
            user_id: user.id,
            company_id: integration.company_id,
            synced_at: new Date().toISOString(),
          }

          // Upsert product
          await supabaseClient
            .from('bling_products')
            .upsert(productData, {
              onConflict: 'bling_id,user_id',
            })
        }
      }
    } catch (error) {
      console.error('Error syncing products:', error)
    }

    // Sync orders from Bling
    try {
      const ordersResponse = await fetch(
        `https://www.bling.com.br/Api/v3/pedidos/vendas?limite=100`,
        {
          headers: blingHeaders,
        }
      )

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const orders: BlingOrder[] = ordersData.data || []

        // Process and store orders
        for (const order of orders) {
          const orderData = {
            bling_id: order.id,
            order_number: order.numero,
            order_date: order.data,
            status: order.situacao.valor,
            customer_name: order.cliente.nome,
            customer_email: order.cliente.email,
            customer_phone: order.cliente.telefone,
            items: JSON.stringify(order.itens),
            total_products: order.totais.produtos,
            total_discount: order.totais.desconto,
            total_amount: order.totais.total,
            user_id: user.id,
            company_id: integration.company_id,
            synced_at: new Date().toISOString(),
          }

          // Upsert order
          await supabaseClient
            .from('bling_orders')
            .upsert(orderData, {
              onConflict: 'bling_id,user_id',
            })
        }
      }
    } catch (error) {
      console.error('Error syncing orders:', error)
    }

    // Update sync status to 'idle' and last_sync timestamp
    await supabaseClient
      .from('bling_integrations')
      .update({ 
        sync_status: 'idle',
        last_sync: new Date().toISOString(),
        error_message: null
      })
      .eq('id', integration.id)

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        action: 'bling_sync_completed',
        entity_type: 'bling_integration',
        entity_id: integration.id,
        new_data: {
          sync_timestamp: new Date().toISOString(),
          status: 'success'
        },
        user_id: user.id,
      })

    return new Response(
      JSON.stringify({ 
        message: 'Bling sync completed successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in bling-sync function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})