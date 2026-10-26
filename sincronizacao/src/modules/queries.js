const fb = require('../database/firebird');

const parseFirebirdDate = (dateValue) => {
  if (!dateValue) return null;
  if (typeof dateValue === 'string' && dateValue.startsWith('/Date(')) {
    const match = dateValue.match(/\/Date\((-?\d+)\)\//);
    if (match) {
      const ts = parseInt(match[1]);
      if (isNaN(ts)) return null;
      return new Date(ts).toISOString().split('T')[0];
    }
  }
  return dateValue;
};

const getClientes = async (since = null) => {
  let sql = `
    SELECT 
      ID,
      CODIGO,
      TRIM(RESPONS) as RESPONS,
      TRIM(CIC) as CIC,
      TRIM(FONE) as FONE,
      TRIM(ENDERECO) as ENDERECO,
      TRIM(CIDADE) as CIDADE,
      TRIM(ESTADO) as ESTADO,
      TRIM(CEP) as CEP,
      COALESCE(VLR_MENS, 0) as VLR_MENS,
      DIA,
      FK_JAZIGO,
      CANCELADO
    FROM PROPRI
    WHERE CIC IS NOT NULL AND TRIM(CIC) > ''
  `;
  
  sql += ` ORDER BY CODIGO`;
  
  const results = await fb.query(sql);
  
  return results.map(row => ({
    codigo_propri: row.CODIGO,
    nome: row.RESPONS,
    telefone: row.FONE || null,
    endereco: row.ENDERECO || null,
    cidade: row.CIDADE || null,
    estado: row.ESTADO || null,
    cep: row.CEP || null,
    cpf_cnpj: row.CIC || null,
    ativo: row.CANCELADO !== 'S'
  }));
};

const getMensalidades = async (since = null) => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  let sql = `
    SELECT 
      R.REG,
      R.NUM,
      R.JAZIGO,
      R.VECTO,
      R.VALOR,
      R.PAGO,
      R.PAGTO,
      R.NUMERORECIBO,
      R.STATUS,
      R.DESCSTATUS,
      R.CANCELADO,
      P.CODIGO as CODIGO_PROPRI,
      P.CIC as CPF_PROPRI,
      P.ID as ID_PROPRI,
      P.FK_JAZIGO as JAZIGO_PROPRI
    FROM RECEBER R
    LEFT JOIN PROPRI P ON R.JAZIGO = P.FK_JAZIGO
    WHERE R.JAZIGO IS NOT NULL
      AND (
        COALESCE(R.PAGO, 'N') <> 'S' 
        OR (R.PAGO = 'S' AND EXTRACT(YEAR FROM R.VECTO) >= ${previousYear})
      )
  `;
  
  sql += ` ORDER BY R.VECTO DESC`;
  
  const results = await fb.query(sql);
  
  return results.map(row => ({
    reg: row.REG,
    num: row.NUM,
    jazigo: row.JAZIGO,
    vecto: parseFirebirdDate(row.VECTO),
    valor: row.VALOR || 0,
    pago: row.PAGO === 'S',
    pagto: parseFirebirdDate(row.PAGTO),
    nosso_numero: row.NUMERORECIBO != null ? String(row.NUMERORECIBO) : null,
    status: row.STATUS || null,
    desc_status: row.DESCSTATUS || null,
    cancelado: row.CANCELADO === 'S',
    bol_emissao: null,
    bol_especie: null,
    bol_num_documento: null,
    bol_multa_perc: null,
    bol_multa_flag: null,
    bol_mora: null,
    bol_abatimento: null,
    bol_data_desconto: null,
    bol_dias_protesto: null,
    bol_mensagem1: null,
    bol_mensagem2: null,
    bol_linha_digitavel: null,
    bol_seq_remessa: null,
    bol_arquivo_remessa: null,
    bol_pagador_nome: null,
    bol_pagador_cpf_cnpj: null,
    bol_pagador_endereco: null,
    bol_pagador_bairro: null,
    bol_pagador_cidade: null,
    bol_pagador_uf: null,
    bol_pagador_cep: null,
    codigo_propri: row.CODIGO_PROPRI || null,
    cpf_cnpj: row.CPF_PROPRI || null,
    id_propri: row.ID_PROPRI || null
  }));
};


const getConfigBanco = async () => {
  const sql = `
    SELECT 
      CC_BANCONUMERO,
      CC_AGENCIA,
      CC_CONTACORRENTE,
      CC_CONTADIGITO,
      CC_CARTEIRA,
      CC_CONVENIO,
      CC_CEDENTE,
      CC_EMISSAOBOLETO
    FROM CONTASBANCARIAS
    WHERE CC_BANCONUMERO IS NOT NULL
    ROWS 1 TO 1
  `;
  
  const results = await fb.query(sql);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    banco_numero: row.CC_BANCONUMERO,
    agencia: row.CC_AGENCIA,
    conta_corrente: row.CC_CONTACORRENTE,
    conta_digito: row.CC_CONTADIGITO || null,
    carteira: row.CC_CARTEIRA || null,
    convennio: row.CC_CONVENIO || null,
    cedente: row.CC_CEDENTE || null,
    ativo: row.CC_EMISSAOBOLETO === 'S'
  };
};

const getFalecidos = async () => {
  let sql = `
    SELECT 
      F.ID,
      TRIM(F.NOME) as NOME,
      F.DTA_NASC,
      F.DTA_FALEC,
      F.DTA_SEPUL,
      F.DTA_EXUM,
      F.JAZIGO,
      F.QUADRA,
      F.CARNEIRA,
      P.CODIGO as CODIGO_PROPRI
    FROM FALECIDO F
    LEFT JOIN PROPRI P ON F.JAZIGO = P.CODIGO
    WHERE F.JAZIGO IS NOT NULL
    ORDER BY F.NOME
  `;

  const results = await fb.query(sql);

  return results.map(row => ({
    id_firebird: row.ID,
    nome: row.NOME || 'Nao informado',
    data_nascimento: parseFirebirdDate(row.DTA_NASC),
    data_falecimento: parseFirebirdDate(row.DTA_FALEC),
    data_sepultamento: parseFirebirdDate(row.DTA_SEPUL),
    data_exumacao: parseFirebirdDate(row.DTA_EXUM),
    jazigo: row.JAZIGO || null,
    quadra: row.QUADRA ? String(row.QUADRA) : null,
    carneira: row.CARNEIRA != null ? String(row.CARNEIRA) : null,
    codigo_propri: row.CODIGO_PROPRI || null
  }));
};

const getFalecidoLocais = async () => {
  let sql = `
    SELECT 
      FL_ID,
      FL_FKFALECIDO,
      TRIM(FL_JAZIGO) as JAZIGO,
      TRIM(FL_QUADRA) as QUADRA,
      FL_CARNEIRA as CARNEIRA,
      FL_DATA,
      FL_DATAEXUMACAO
    FROM FALECIDO_LOCAL
    ORDER BY FL_FKFALECIDO, FL_DATA
  `;

  const results = await fb.query(sql);

  return results.map(row => ({
    fl_fkfalecido: row.FL_FKFALECIDO,
    jazigo: row.JAZIGO || null,
    quadra: row.QUADRA || null,
    carneira: row.CARNEIRA != null ? String(row.CARNEIRA) : null,
    data_inicio: parseFirebirdDate(row.FL_DATA),
    data_fim: parseFirebirdDate(row.FL_DATAEXUMACAO)
  }));
};

const parseFirebirdTime = (timeValue) => {
  if (!timeValue) return null;

  if (typeof timeValue === 'object') {
    const h = String(timeValue.Hours != null ? timeValue.Hours : 0).padStart(2, '0');
    const m = String(timeValue.Minutes != null ? timeValue.Minutes : 0).padStart(2, '0');
    return `${h}:${m}`;
  }

  if (typeof timeValue === 'string') {
    if (timeValue.startsWith('/Date(')) {
      const match = timeValue.match(/\/Date\((-?\d+)\)\//);
      if (match) {
        const d = new Date(parseInt(match[1]));
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }

    const match = timeValue.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      return `${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')}`;
    }
  }

  return String(timeValue);
};

const getSyncSchedule = async () => {
  const sql = `
    SELECT ID, DIA_SEMANA, HORA, ATIVO
    FROM CONFIG_SINCRONIZACAO
    WHERE ATIVO = 'S'
    ORDER BY DIA_SEMANA, HORA
  `;

  const results = await fb.query(sql);

  return results.map(row => ({
    id: row.ID,
    dia_semana: row.DIA_SEMANA,
    hora: parseFirebirdTime(row.HORA),
    ativo: row.ATIVO === 'S'
  }));
};

module.exports = {
  getClientes,
  getMensalidades,
  getConfigBanco,
  getFalecidos,
  getFalecidoLocais,
  getSyncSchedule
};
