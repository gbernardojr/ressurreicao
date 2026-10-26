const { format } = require('date-fns');
const fbQueries = require('./queries');
const { 
  supabase,
  upsertClientes, 
  upsertMensalidades, 
  upsertConfigBanco, 
  upsertFalecidos,
  upsertFalecidoLocais,
  getClientesCount, 
  getMensalidadesCount,
  getFalecidosCount,
  getLastSync,
  logSync,
  getClientesByCodigo
} = require('../database/supabase');

const FULL_SYNC_INTERVAL_HOURS = 24;

const shouldRunFullSync = async () => {
  const lastSync = await getLastSync();
  
  if (!lastSync) {
    console.log('   📋 Primeira sincronização - modo completo');
    return true;
  }
  
  const lastSyncDate = new Date(lastSync);
  const now = new Date();
  const hoursSinceLastSync = (now - lastSyncDate) / (1000 * 60 * 60);
  
  if (hoursSinceLastSync >= FULL_SYNC_INTERVAL_HOURS) {
    console.log(`   ⏰ Última sync há ${hoursSinceLastSync.toFixed(1)}h - modo completo`);
    return true;
  }
  
  console.log(`   🔄 Última sync há ${hoursSinceLastSync.toFixed(1)}h - modo incremental`);
  return false;
};

const syncClientes = async (isFullSync = true) => {
  console.log('\n📥 Sincronizando Clientes...');
  const startTime = Date.now();
  const dataInicio = new Date().toISOString();
  
  try {
    const clientes = await fbQueries.getClientes();
    
    console.log(`   Encontrados ${clientes.length} clientes no Firebird`);
    
    if (clientes.length === 0) {
      console.log('   ⚠️ Nenhum cliente para sincronizar');
      
      await logSync('clientes', 0, 0, null, dataInicio, new Date().toISOString());
      return { success: true, count: 0, isFullSync };
    }

    const { data, error } = await upsertClientes(clientes);
    
    if (error) {
      console.error('   ❌ Erro ao sincronizar clientes:', error.message);
      
      await logSync('clientes', 0, 0, error.message, dataInicio, new Date().toISOString());
      return { success: false, error: error.message };
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ✅ ${data?.length || 0} clientes sincronizados em ${duration}s`);
    
    await logSync('clientes', data?.length || 0, 0, null, dataInicio, new Date().toISOString());
    
    return { success: true, count: data?.length || 0, isFullSync };
  } catch (error) {
    console.error('   ❌ Erro na sincronização de clientes:', error.message);
    
    await logSync('clientes', 0, 0, error.message, dataInicio, new Date().toISOString());
    return { success: false, error: error.message };
  }
};

const syncMensalidades = async (isFullSync = true) => {
  console.log('\n📥 Sincronizando Mensalidades...');
  const startTime = Date.now();
  const dataInicio = new Date().toISOString();
  
  try {
    const mensalidadesRaw = await fbQueries.getMensalidades();
    
    console.log(`   Encontradas ${mensalidadesRaw.length} mensalidades no Firebird`);
    
    if (mensalidadesRaw.length === 0) {
      console.log('   ⚠️ Nenhuma mensalidade para sincronizar');
      
      await logSync('mensalidades', 0, 0, null, dataInicio, new Date().toISOString());
      return { success: true, count: 0, isFullSync };
    }

    const codigosPropris = [...new Set(mensalidadesRaw.map(m => m.codigo_propri).filter(Boolean))];
    
    const clientesData = await getClientesByCodigo(codigosPropris);
    
    const clienteMap = {};
    clientesData.forEach(c => {
      clienteMap[c.codigo_propri] = c.id;
    });

    const mensalidades = mensalidadesRaw
      .filter(m => clienteMap[m.codigo_propri])
      .map(m => {
        return {
        cliente_id: clienteMap[m.codigo_propri],
        reg: m.reg,
        num: m.num,
        jazigo: m.jazigo,
        vecto: m.vecto,
        valor: m.valor,
        pago: m.pago,
        pagto: m.pagto,
        nosso_numero: m.nosso_numero,
        status: m.status,
        desc_status: m.desc_status,
        cancelado: m.cancelado,
        bol_emissao: m.bol_emissao,
        bol_especie: m.bol_especie,
        bol_num_documento: m.bol_num_documento,
        bol_multa_perc: m.bol_multa_perc,
        bol_multa_flag: m.bol_multa_flag,
        bol_mora: m.bol_mora,
        bol_abatimento: m.bol_abatimento,
        bol_data_desconto: m.bol_data_desconto,
        bol_dias_protesto: m.bol_dias_protesto,
        bol_mensagem1: m.bol_mensagem1,
        bol_mensagem2: m.bol_mensagem2,
        bol_linha_digitavel: m.bol_linha_digitavel,
        bol_seq_remessa: m.bol_seq_remessa,
        bol_arquivo_remessa: m.bol_arquivo_remessa,
        bol_pagador_nome: m.bol_pagador_nome,
        bol_pagador_cpf_cnpj: m.bol_pagador_cpf_cnpj,
        bol_pagador_endereco: m.bol_pagador_endereco,
        bol_pagador_bairro: m.bol_pagador_bairro,
        bol_pagador_cidade: m.bol_pagador_cidade,
        bol_pagador_uf: m.bol_pagador_uf,
        bol_pagador_cep: m.bol_pagador_cep,
        data_ultima_sincronizacao: new Date().toISOString()
      };
      });

    console.log(`   ${mensalidades.length} mensalidades com cliente válido`);

    const batchSize = 100;
    let totalIncluidos = 0;
    let totalErros = 0;
    
    for (let i = 0; i < mensalidades.length; i += batchSize) {
      const batch = mensalidades.slice(i, i + batchSize);
      const { data, error } = await upsertMensalidades(batch);
      
      if (error) {
        console.error(`   ⚠️ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
        totalErros += batch.length;
        continue;
      }
      
      totalIncluidos += data?.length || 0;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ✅ ${totalIncluidos} mensalidades sincronizadas em ${duration}s`);
    
    await logSync('mensalidades', totalIncluidos, 0, totalErros > 0 ? `${totalErros} erros` : null, dataInicio, new Date().toISOString());
    
    return { success: true, count: totalIncluidos, isFullSync };
  } catch (error) {
    console.error('   ❌ Erro na sincronização de mensalidades:', error.message);
    
    await logSync('mensalidades', 0, 0, error.message, dataInicio, new Date().toISOString());
    return { success: false, error: error.message };
  }
};

const syncConfigBanco = async () => {
  console.log('\n📥 Sincronizando Configurações do Banco...');
  const dataInicio = new Date().toISOString();
  
  try {
    const config = await fbQueries.getConfigBanco();
    
    if (!config) {
      console.log('   ⚠️ Nenhuma configuração de banco encontrada');
      return { success: false };
    }

    // Remove registros antigos para evitar duplicatas
    const { error: delError } = await supabase
      .from('config_banco')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) {
      console.error('   ⚠️ Erro ao limpar config_banco antigo:', delError.message);
    }

    const { data, error } = await upsertConfigBanco(config);
    
    if (error) {
      console.error('   ❌ Erro ao sincronizar config do banco:', error.message);
      
      await logSync('config_banco', 0, 0, error.message, dataInicio, new Date().toISOString());
      return { success: false, error: error.message };
    }

    console.log('   ✅ Configuração do banco sincronizada');
    
    await logSync('config_banco', 1, 0, null, dataInicio, new Date().toISOString());
    return { success: true };
  } catch (error) {
    console.error('   ❌ Erro na sincronização de config banco:', error.message);
    
    await logSync('config_banco', 0, 0, error.message, dataInicio, new Date().toISOString());
    return { success: false, error: error.message };
  }
};

const runFullSync = async () => {
  console.log('\n========================================');
  console.log('🚀 INICIANDO SINCRONIZAÇÃO COMPLETA');
  console.log('========================================');
  
  const startTime = Date.now();

  const results = {
    clientes: null,
    mensalidades: null,
    configBanco: null,
    falecidos: null
  };

  try {
    const isFullSync = await shouldRunFullSync();
    
    results.clientes = await syncClientes(isFullSync);
    results.mensalidades = await syncMensalidades(isFullSync);
    results.configBanco = await syncConfigBanco();
    results.falecidos = await syncFalecidos(isFullSync);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n========================================');
    console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA em ${duration}s`);
    console.log('========================================');
    
    const clientesCount = await getClientesCount();
    const mensalidadesCount = await getMensalidadesCount();
    const falecidosCount = await getFalecidosCount();
    
    console.log(`📊 Total no Supabase:`);
    console.log(`   Clientes: ${clientesCount}`);
    console.log(`   Mensalidades: ${mensalidadesCount}`);
    console.log(`   Falecidos: ${falecidosCount}`);
    
    return results;
  } catch (error) {
    console.error('\n❌ ERRO NA SINCRONIZAÇÃO:', error.message);
    return results;
  }
};

const runIncrementalSync = async () => {
  console.log('\n========================================');
  console.log('🔄 SINCRONIZAÇÃO INCREMENTAL');
  console.log('========================================');
  
  const startTime = Date.now();

  const results = {
    clientes: null,
    mensalidades: null
  };

  try {
    results.clientes = await syncClientes(false);
    results.mensalidades = await syncMensalidades(false);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n========================================');
    console.log(`✅ SINCRONIZAÇÃO INCREMENTAL CONCLUÍDA em ${duration}s`);
    console.log('========================================');
    
    return results;
  } catch (error) {
    console.error('\n❌ ERRO NA SINCRONIZAÇÃO:', error.message);
    return results;
  }
};

const syncFalecidos = async (isFullSync = true) => {
  console.log('\n📥 Sincronizando Falecidos...');
  const startTime = Date.now();
  const dataInicio = new Date().toISOString();

  try {
    const falecidosRaw = await fbQueries.getFalecidos();

    console.log(`   Encontrados ${falecidosRaw.length} falecidos no Firebird`);

    if (falecidosRaw.length === 0) {
      console.log('   ⚠️ Nenhum falecido para sincronizar');

      await logSync('falecidos', 0, 0, null, dataInicio, new Date().toISOString());
      return { success: true, count: 0, isFullSync };
    }

    const codigosPropris = [...new Set(falecidosRaw.map(f => f.codigo_propri).filter(Boolean))];

    const clientesData = await getClientesByCodigo(codigosPropris);

    const clienteMap = {};
    clientesData.forEach(c => {
      clienteMap[c.codigo_propri] = c.id;
    });

    const falecidos = falecidosRaw
      .filter(f => clienteMap[f.codigo_propri])
      .map(f => ({
        id_firebird: f.id_firebird,
        cliente_id: clienteMap[f.codigo_propri],
        nome: f.nome,
        data_nascimento: f.data_nascimento,
        data_falecimento: f.data_falecimento,
        data_sepultamento: f.data_sepultamento,
        data_exumacao: f.data_exumacao,
        jazigo: f.jazigo,
        data_ultima_sincronizacao: new Date().toISOString()
      }));

    console.log(`   ${falecidos.length} falecidos com cliente válido`);

    // Excluir registros existentes em lote único
    const clienteIds = [...new Set(falecidos.map(f => f.cliente_id))];
    
    if (clienteIds.length > 0) {
      // Deletar em lotes de 100 para evitar URL muito longa
      const batchSize = 100;
      for (let i = 0; i < clienteIds.length; i += batchSize) {
        const batch = clienteIds.slice(i, i + batchSize);
        const { error: delError } = await supabase
          .from('falecidos')
          .delete()
          .in('cliente_id', batch);
        
        if (delError) {
          console.error(`   ⚠️ Erro ao limpar falecidos (lote ${Math.floor(i/batchSize) + 1}):`, delError.message);
        }
      }
    }

    const batchSize = 100;
    let totalIncluidos = 0;
    let totalErros = 0;
    const firebirdToSupabase = {};

    for (let i = 0; i < falecidos.length; i += batchSize) {
      const batch = falecidos.slice(i, i + batchSize);
      const { data, error } = await upsertFalecidos(batch);

      if (error) {
        console.error(`   ⚠️ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
        totalErros += batch.length;
        continue;
      }

      if (data) {
        data.forEach((record, idx) => {
          const originalIdx = i + idx;
          const firebirdId = falecidos[originalIdx].id_firebird;
          if (firebirdId) {
            firebirdToSupabase[firebirdId] = record.id;
          }
        });
      }

      totalIncluidos += data?.length || 0;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ✅ ${totalIncluidos} falecidos sincronizados em ${duration}s`);

    await logSync('falecidos', totalIncluidos, 0, totalErros > 0 ? `${totalErros} erros` : null, dataInicio, new Date().toISOString());

    // Sincronizar locais dos falecidos
    if (Object.keys(firebirdToSupabase).length > 0) {
      await syncFalecidoLocais(firebirdToSupabase);
    }

    return { success: true, count: totalIncluidos, isFullSync };
  } catch (error) {
    console.error('   ❌ Erro na sincronização de falecidos:', error.message);

    await logSync('falecidos', 0, 0, error.message, dataInicio, new Date().toISOString());
    return { success: false, error: error.message };
  }
};

const syncFalecidoLocais = async (firebirdToSupabase) => {
  console.log('   📥 Sincronizando Locais dos Falecidos...');
  const dataInicio = new Date().toISOString();

  try {
    console.log(`   🔍 Mapeamento tem ${Object.keys(firebirdToSupabase).length} falecidos`);
    const locaisRaw = await fbQueries.getFalecidoLocais();

    if (locaisRaw.length === 0) {
      console.log('   ⚠️ Nenhum local para sincronizar');
      return;
    }

    const locais = locaisRaw
      .filter(l => l.fl_fkfalecido && firebirdToSupabase[l.fl_fkfalecido])
      .map(l => ({
        falecido_id: firebirdToSupabase[l.fl_fkfalecido],
        local_tipo: l.jazigo ? 'jazigo' : 'ossario',
        quadra: l.quadra,
        carneira: l.carneira,
        data_inicio: l.data_inicio,
        data_fim: l.data_fim,
        data_ultima_sincronizacao: new Date().toISOString()
      }));

    console.log(`   🔍 ${locaisRaw.length} locais no Firebird, ${locais.length} mapeados`);

    if (locais.length === 0) {
      console.log(`   ⚠️ Nenhum local pôde ser vinculado`);
      await logSync('falecido_locais', 0, 0, null, dataInicio, new Date().toISOString());
      return;
    }

    const batchSize = 100;
    let totalIncluidos = 0;

    for (let i = 0; i < locais.length; i += batchSize) {
      const batch = locais.slice(i, i + batchSize);
      const { error } = await upsertFalecidoLocais(batch);

      if (error) {
        console.error(`   ⚠️ Erro no lote ${Math.floor(i/batchSize) + 1} de locais:`, error.message);
        continue;
      }

      totalIncluidos += batch.length;
    }

    console.log(`   ✅ ${totalIncluidos} locais sincronizados`);

    await logSync('falecido_locais', totalIncluidos, 0, null, dataInicio, new Date().toISOString());
  } catch (error) {
    console.error('   ❌ Erro na sincronização de locais:', error.message);
  }
};

module.exports = {
  syncClientes,
  syncMensalidades,
  syncConfigBanco,
  syncFalecidos,
  runFullSync,
  runIncrementalSync
};
