const fb = require('./database/firebird');
const supabase = require('./database/supabase');
const sync = require('./modules/sync');

const testFirebird = async () => {
  console.log('\n🧪 Testando conexão Firebird...');
  return await fb.testConnection();
};

const testSupabase = async () => {
  console.log('\n🧪 Testando conexão Supabase...');
  return await supabase.testConnection();
};

const testQueries = async () => {
  console.log('\n🧪 Testando queries do Firebird...');
  
  try {
    const clientes = await require('./modules/queries').getClientes();
    console.log(`   Clientes encontrados: ${clientes.length}`);
    
    const mensalidades = await require('./modules/queries').getMensalidades();
    console.log(`   Mensalidades encontradas: ${mensalidades.length}`);
    
    const config = await require('./modules/queries').getConfigBanco();
    console.log(`   Config banco: ${config ? 'Encontrada' : 'Não encontrada'}`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
    return false;
  }
};

const testSync = async () => {
  console.log('\n🧪 Testando sincronização completa...');
  return await sync.runFullSync();
};

const run = async () => {
  console.log('========================================');
  console.log('🧪 TESTE DE SINCRONIZAÇÃO');
  console.log('========================================\n');
  
  const results = {
    firebird: await testFirebird(),
    supabase: await testSupabase(),
    queries: false,
    sync: null
  };
  
  if (results.firebird && results.supabase) {
    results.queries = await testQueries();
    
    if (results.queries) {
      console.log('\n⚠️ Deseja executar sincronização? (s/n)');
      // Para teste, vamos executar
      results.sync = await sync.runFullSync();
    }
  }
  
  console.log('\n========================================');
  console.log('📊 RESULTADOS DOS TESTES');
  console.log('========================================');
  console.log(`Firebird: ${results.firebird ? '✅' : '❌'}`);
  console.log(`Supabase: ${results.supabase ? '✅' : '❌'}`);
  console.log(`Queries:  ${results.queries ? '✅' : '❌'}`);
  
  fb.closePool();
};

run().catch(console.error);