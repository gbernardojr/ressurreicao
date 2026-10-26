const cron = require('node-cron');
const fb = require('./database/firebird');
const supabase = require('./database/supabase');
const sync = require('./modules/sync');
const queries = require('./modules/queries');
const server = require('./server');
const config = require('./config');

let isRunning = false;

const runSync = async () => {
  if (isRunning) {
    console.log('⏳ Sincronização já em andamento, aguardando...');
    return;
  }
  
  isRunning = true;
  
  try {
    await sync.runFullSync();
  } finally {
    isRunning = false;
  }
};

const startScheduledSync = async () => {
  let jobs = [];

  try {
    const schedule = await queries.getSyncSchedule();

    if (schedule && schedule.length > 0) {
      console.log(`\n📅 Agendando ${schedule.length} horários do Firebird:`);
      schedule.forEach(item => {
        const [hour, minute] = item.hora.split(':');
        const expression = `${minute} ${hour} * * ${item.dia_semana}`;
        const diaNome = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][item.dia_semana];
        console.log(`   ${diaNome} às ${item.hora} (cron: ${expression})`);
        const job = cron.schedule(expression, async () => {
          console.log(`\n⏰ Sincronização agendada (${diaNome} ${item.hora})`);
          await runSync();
        });
        jobs.push(job);
      });
    } else {
      throw new Error('Nenhum horário encontrado');
    }
  } catch (e) {
    const interval = config.sync.intervalMinutes;
    console.log(`\n📅 Nenhum agendamento no Firebird, usando intervalo de ${interval} minutos (fallback)`);
    const job = cron.schedule(`*/${interval} * * * *`, async () => {
      console.log('\n⏰ Sincronização por intervalo');
      await runSync();
    });
    jobs.push(job);
  }

  console.log(`✅ ${jobs.length} job(s) de sincronização ativo(s)`);
};

const start = async () => {
  console.log('========================================');
  console.log('🔄 SERVIÇO DE SINCRONIZAÇÃO');
  console.log('   Firebird → Supabase');
  console.log('========================================\n');
  
  // Testar conexões
  console.log('🔌 Testando conexões...\n');
  
  const fbConnected = await fb.testConnection();
  const sbConnected = await supabase.testConnection();
  
  if (!fbConnected || !sbConnected) {
    console.error('\n❌ Conexões falharam. Verifique as configurações.');
    process.exit(1);
  }
  
  // Primeira sincronização
  console.log('\n🚀 Executando primeira sincronização...\n');
  await runSync();
  
  // Agendar sincronizações periódicas
  await startScheduledSync();
  
  // Iniciar interface web
  server.start(config.api.port);

  console.log('\n✅ Serviço iniciado com sucesso!');
  console.log(`   Interface: http://localhost:${config.api.port}`);
  console.log('   Pressione Ctrl+C para encerrar\n');
};

// Tratamento de encerramento
process.on('SIGINT', () => {
  console.log('\n\n⏹️ Encerrando serviço...');
  fb.closePool();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️ Encerrando serviço...');
  fb.closePool();
  process.exit(0);
});

// Exportar para testes
module.exports = { runSync, start };

// Iniciar se executado diretamente
if (require.main === module) {
  start();
}