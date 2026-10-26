const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabase = createClient(
  config.supabase.url,
  config.supabase.key
);

const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao conectar no Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Supabase conectado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar no Supabase:', error.message);
    return false;
  }
};

const getLastSync = async () => {
  const { data, error } = await supabase
    .from('sincronizacao_log')
    .select('data_fim')
    .order('data_fim', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.data_fim;
};

const logSync = async (tipo, registrosIncluidos, registrosAtualizados, erros, dataInicio, dataFim) => {
  return await supabase
    .from('sincronizacao_log')
    .insert([{
      tipo,
      registros_incluidos: registrosIncluidos,
      registros_atualizados: registrosAtualizados,
      erros,
      data_inicio: dataInicio,
      data_fim: dataFim
    }]);
};

const upsertClientes = async (clientes) => {
  const uniqueClientes = [];
  const seen = new Set();
  
  for (const cliente of clientes) {
    const key = cliente.codigo_propri;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueClientes.push({
        ...cliente,
        data_ultima_sincronizacao: new Date().toISOString()
      });
    }
  }
  
  return await supabase
    .from('clientes')
    .upsert(uniqueClientes, { 
      onConflict: 'codigo_propri',
      ignoreDuplicates: false 
    })
    .select();
};

const upsertMensalidades = async (mensalidades) => {
  const dataSync = new Date().toISOString();
  
  const formatted = mensalidades.map(m => ({
    ...m,
    data_ultima_sincronizacao: dataSync
  }));
  
  return await supabase
    .from('mensalidades')
    .upsert(formatted, { 
      onConflict: 'cliente_id,reg',
      ignoreDuplicates: false 
    })
    .select();
};

const upsertConfigBanco = async (config) => {
  return await supabase
    .from('config_banco')
    .insert([config])
    .select();
};

const getClientesCount = async () => {
  const { count } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true });
  return count || 0;
};

const getMensalidadesCount = async () => {
  const { count } = await supabase
    .from('mensalidades')
    .select('*', { count: 'exact', head: true });
  return count || 0;
};

const getClientesByCodigo = async (codigos) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, codigo_propri')
    .in('codigo_propri', codigos);
  
  if (error) {
    throw error;
  }
  
  return data;
};

const upsertFalecidos = async (falecidos) => {
  const dataSync = new Date().toISOString();

  const formatted = falecidos.map(f => {
    const { id_firebird, ...rest } = f;
    return {
      ...rest,
      data_ultima_sincronizacao: dataSync
    };
  });

  return await supabase
    .from('falecidos')
    .upsert(formatted, { ignoreDuplicates: false })
    .select();
};

const upsertFalecidoLocais = async (locais) => {
  const dataSync = new Date().toISOString();

  const formatted = locais.map(l => ({
    ...l,
    data_ultima_sincronizacao: dataSync
  }));

  return await supabase
    .from('falecido_locais')
    .insert(formatted)
    .select();
};

const getFalecidosCount = async () => {
  const { count } = await supabase
    .from('falecidos')
    .select('*', { count: 'exact', head: true });
  return count || 0;
};

module.exports = {
  supabase,
  testConnection,
  getLastSync,
  logSync,
  upsertClientes,
  upsertMensalidades,
  upsertConfigBanco,
  upsertFalecidos,
  upsertFalecidoLocais,
  getClientesCount,
  getMensalidadesCount,
  getFalecidosCount,
  getClientesByCodigo
};
