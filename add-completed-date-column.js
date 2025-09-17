const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCompletedDateColumn() {
  console.log('🔧 Adicionando coluna completed_date à tabela tasks...');
  
  try {
    // Primeiro, vamos tentar uma abordagem mais simples
    // Vamos modificar o código para não usar completed_date por enquanto
    console.log('🔄 Modificando código para não usar completed_date temporariamente...');
    
    // Verificar se podemos acessar a tabela tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, status, updated_at')
      .limit(1);
    
    if (tasksError) {
      console.error('❌ Erro ao acessar tabela tasks:', tasksError.message);
      return;
    }
    
    console.log('✅ Tabela tasks acessível!');
    
    // Como não podemos adicionar a coluna via código, vamos modificar o código
    // para usar updated_at quando status for 'completed'
    console.log('💡 Solução: O código será modificado para usar updated_at como completed_date');
    console.log('📝 Isso será feito no próximo passo...');
    
  } catch (error) {
    console.error('❌ Erro durante a operação:', error.message);
  }
}

addCompletedDateColumn();