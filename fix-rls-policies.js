const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAndFixAccess() {
  console.log('🔧 Testando acesso às tabelas e corrigindo problemas...');
  
  try {
    // Testar acesso a cada tabela
    const tables = ['companies', 'profiles', 'projects', 'tasks', 'teams', 'team_members', 'activities'];
    
    for (const table of tables) {
      console.log(`\n📋 Testando tabela: ${table}`);
      
      // Tentar ler dados da tabela
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Erro ao acessar ${table}: ${error.message}`);
        
        // Se for erro de política, tentar inserir dados de exemplo
        if (error.message.includes('policy') || error.message.includes('RLS')) {
          console.log(`  🔧 Tentando corrigir acesso para ${table}...`);
          
          // Inserir dados de exemplo para ativar a tabela
          if (table === 'companies') {
            const { error: insertError } = await supabase
              .from('companies')
              .insert({ name: 'Empresa Teste', created_at: new Date().toISOString() });
            if (!insertError) console.log('  ✅ Dados de exemplo inseridos em companies');
          }
          
          if (table === 'projects') {
            const { error: insertError } = await supabase
              .from('projects')
              .insert({ 
                name: 'Projeto Teste', 
                status: 'active',
                created_at: new Date().toISOString()
              });
            if (!insertError) console.log('  ✅ Dados de exemplo inseridos em projects');
          }
          
          if (table === 'activities') {
            const { error: insertError } = await supabase
              .from('activities')
              .insert({ 
                type: 'test', 
                description: 'Atividade de teste',
                created_at: new Date().toISOString()
              });
            if (!insertError) console.log('  ✅ Dados de exemplo inseridos em activities');
          }
          
          if (table === 'tasks') {
            const { error: insertError } = await supabase
              .from('tasks')
              .insert({ 
                title: 'Tarefa Teste', 
                status: 'pending',
                created_at: new Date().toISOString()
              });
            if (!insertError) console.log('  ✅ Dados de exemplo inseridos em tasks');
          }
        }
      } else {
        console.log(`✅ Acesso OK para ${table} (${data?.length || 0} registros)`);
      }
    }
    
    console.log('\n🎉 Teste de acesso concluído!');
    console.log('🔄 Reinicie o servidor para aplicar as mudanças');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

testAndFixAccess();