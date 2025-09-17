import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

export default function SupabaseTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'success' | 'error' | 'pending', message: string) => {
    setResults(prev => [...prev, { test, status, message }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Teste 1: Conexão básica
    addResult('Conexão', 'pending', 'Testando conexão com Supabase...');
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        addResult('Conexão', 'error', `Erro na conexão: ${error.message}`);
      } else {
        addResult('Conexão', 'success', 'Conexão estabelecida com sucesso');
      }
    } catch (error) {
      addResult('Conexão', 'error', `Erro na conexão: ${error}`);
    }

    // Teste 2: Autenticação
    addResult('Autenticação', 'pending', 'Testando sistema de autenticação...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      addResult('Autenticação', 'success', `Status: ${user ? 'Logado' : 'Não logado'}`);
    } catch (error) {
      addResult('Autenticação', 'error', `Erro na autenticação: ${error}`);
    }

    // Teste 3: Verificar tabelas
    addResult('Tabelas', 'pending', 'Verificando estrutura das tabelas...');
    try {
      // Tentar acessar a tabela profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        addResult('Tabelas', 'error', `Tabela profiles: ${profilesError.message}`);
      } else {
        addResult('Tabelas', 'success', `Tabela profiles: OK (${profiles?.length || 0} registros encontrados)`);
      }

      // Tentar acessar a tabela companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
      
      if (companiesError) {
        addResult('Tabelas', 'error', `Tabela companies: ${companiesError.message}`);
      } else {
        addResult('Tabelas', 'success', `Tabela companies: OK (${companies?.length || 0} registros encontrados)`);
      }
    } catch (error) {
      addResult('Tabelas', 'error', `Erro ao verificar tabelas: ${error}`);
    }

    setIsRunning(false);
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text">
            Teste de Conectividade Supabase
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Verificar status da conexão e estrutura do banco de dados
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testando...
            </>
          ) : (
            'Executar Testes'
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
                result.status === 'success' 
                  ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50 text-green-800 dark:text-green-300'
                  : result.status === 'error'
                  ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50 text-red-800 dark:text-red-300'
                  : 'bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-300'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3 text-lg">{getStatusIcon(result.status)}</span>
                <div className="flex-1">
                  <span className="font-semibold">{result.test}:</span>
                  <span className="ml-2 text-sm opacity-90">{result.message}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !isRunning && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">🔗</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Clique em "Executar Testes" para verificar a conectividade com o Supabase
          </p>
        </div>
      )}
    </div>
  );
}