var AdminState = {
  searchResults: [],
  searchError: '',
  selectedCliente: null,
  selectedMensalidades: [],
};

function formatarCpfCnpj(v) {
  var d = v.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0,3) + '.' + d.slice(3);
  if (d.length <= 9) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6);
  if (d.length <= 11) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9,11);
  if (d.length <= 12) return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5,8) + '/' + d.slice(8,12);
  if (d.length <= 14) return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5,8) + '/' + d.slice(8,12) + '-' + d.slice(12,14);
  return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5,8) + '/' + d.slice(8,12) + '-' + d.slice(12,14);
}

function renderAdminDashboard() {
  AdminState.searchResults = [];
  AdminState.searchError = '';
  AdminState.selectedCliente = null;
  AdminState.selectedMensalidades = [];
  AppState._mensalidadeAtual = null;
  AppState._boletoAtual = null;

  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar"><span class="title">Admin - Ressurreição</span><div class="actions">' +
      '<button class="btn-icon" onclick="recarregarAdmin()" title="Atualizar">&#x21bb;</button>' +
      '<button class="btn-icon" onclick="handleAdminLogout()" title="Sair">&#x23fb;</button>' +
    '</div></div>' +
    '<div class="main-content">' +
      '<div class="card">' +
        '<h2 style="font-size:18px;margin-bottom:16px;color:var(--primary-dark)">🔍 Consulta de Clientes</h2>' +
        '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">Digite o CPF ou CNPJ do cliente para acessar os boletos.</p>' +
        '<div class="admin-search-box">' +
          '<input type="text" id="adminSearchInput" class="form-input" placeholder="000.000.000-00 ou 00.000.000/0000-00" maxlength="18" inputmode="numeric">' +
          '<button id="adminSearchBtn" class="btn btn-primary" style="margin-top:12px" onclick="handleAdminSearch()">BUSCAR</button>' +
        '</div>' +
        '<div id="adminSearchError" class="alert alert-error hidden" style="margin-top:12px"></div>' +
      '</div>' +
      '<div id="adminSearchResults"></div>' +
      '<div id="adminMensalidadesArea"></div>' +
    '</div>';

  document.getElementById('adminSearchInput').addEventListener('input', function() {
    this.value = formatarCpfCnpj(this.value);
  });
  document.getElementById('adminSearchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleAdminSearch();
  });
}

async function handleAdminSearch() {
  var input = document.getElementById('adminSearchInput');
  var errEl = document.getElementById('adminSearchError');
  var resultsEl = document.getElementById('adminSearchResults');
  var btn = document.getElementById('adminSearchBtn');

  AdminState.selectedCliente = null;
  AdminState.selectedMensalidades = [];
  document.getElementById('adminMensalidadesArea').innerHTML = '';

  var documento = input.value.replace(/\D/g, '');
  errEl.classList.add('hidden');

  if (!documento || (documento.length !== 11 && documento.length !== 14)) {
    errEl.textContent = 'Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Buscando...';
  resultsEl.innerHTML = '<div class="spinner"></div>';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conexão.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'BUSCAR'; return; }

    var busca = await sb.from('clientes').select('id, codigo_propri, cpf_cnpj, nome, telefone, email, endereco, bairro, cidade, estado')
      .eq('cpf_cnpj', documento)
      .limit(20);

    if (busca.error) { errEl.textContent = 'Erro na consulta.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'BUSCAR'; resultsEl.innerHTML = ''; return; }

    AdminState.searchResults = busca.data || [];

    if (AdminState.searchResults.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state"><div class="icon">&#128269;</div><p>Nenhum cliente encontrado com esse documento.</p></div>';
      btn.disabled = false;
      btn.textContent = 'BUSCAR';
      return;
    }

    renderAdminSearchResults(resultsEl);
  } catch (err) {
    errEl.textContent = 'Erro ao conectar. Tente novamente.';
    errEl.classList.remove('hidden');
    resultsEl.innerHTML = '';
  }

  btn.disabled = false;
  btn.textContent = 'BUSCAR';
}

function renderAdminSearchResults(container) {
  var html = '<h3 style="font-size:16px;margin:16px 0 8px;color:var(--text)">Clientes encontrados:</h3>';
  AdminState.searchResults.forEach(function(c) {
    html +=
      '<div class="card admin-cliente-card" onclick="handleAdminSelectCliente(\'' + c.id + '\')">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<div class="admin-cliente-avatar">' + (c.nome ? c.nome.charAt(0).toUpperCase() : '?') + '</div>' +
          '<div style="flex:1">' +
            '<div style="font-weight:600;font-size:15px">' + (c.nome || '-') + '</div>' +
            '<div style="font-size:13px;color:var(--text-secondary);margin-top:2px">' +
              'Cód: ' + (c.codigo_propri || '-') +
              (c.cpf_cnpj ? ' | ' + formatarCpfCnpj(c.cpf_cnpj) : '') +
            '</div>' +
            (c.cidade ? '<div style="font-size:13px;color:var(--text-secondary)">' + c.cidade + '/' + (c.estado || '') + '</div>' : '') +
          '</div>' +
          '<span style="color:var(--primary);font-size:24px">&#8250;</span>' +
        '</div>' +
      '</div>';
  });
  container.innerHTML = html;
}

async function handleAdminSelectCliente(clienteId) {
  var mensalidadesArea = document.getElementById('adminMensalidadesArea');
  mensalidadesArea.innerHTML = '<div class="spinner"></div>';

  try {
    var sb = getSupabase();
    if (!sb) return;

    var cliente = AdminState.searchResults.find(function(c) { return c.id === clienteId; });
    if (!cliente) { mensalidadesArea.innerHTML = ''; return; }

    AdminState.selectedCliente = cliente;

    var busca = await sb.from('mensalidades').select()
      .eq('cliente_id', clienteId)
      .order('vecto', { ascending: true });

    if (busca.error) { mensalidadesArea.innerHTML = '<p style="color:var(--danger)">Erro ao carregar mensalidades.</p>'; return; }

    AdminState.selectedMensalidades = busca.data || [];
    renderAdminMensalidades();
  } catch (e) {
    mensalidadesArea.innerHTML = '<p style="color:var(--danger)">Erro ao conectar.</p>';
  }
}

function renderAdminMensalidades() {
  var container = document.getElementById('adminMensalidadesArea');
  var cliente = AdminState.selectedCliente;
  var mensalidades = AdminState.selectedMensalidades;

  var html =
    '<div class="card" style="background:var(--primary);color:#fff;margin-bottom:16px">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700">' +
          (cliente.nome ? cliente.nome.charAt(0).toUpperCase() : '?') +
        '</div>' +
        '<div style="flex:1">' +
          '<div style="font-weight:700;font-size:16px">' + (cliente.nome || '-') + '</div>' +
          '<div style="font-size:13px;opacity:0.9">' +
            'Cód: ' + (cliente.codigo_propri || '-') +
            (cliente.cpf_cnpj ? ' | ' + formatarCpfCnpj(cliente.cpf_cnpj) : '') +
          '</div>' +
        '</div>' +
        '<button class="btn-icon" onclick="renderAdminDashboard()" style="color:#fff;font-size:20px" title="Nova consulta">&#x2716;</button>' +
      '</div>' +
    '</div>';

  if (!mensalidades || mensalidades.length === 0) {
    html += '<div class="empty-state"><div class="icon">&#128237;</div><p>Nenhuma mensalidade encontrada para este cliente.</p></div>';
    container.innerHTML = html;
    return;
  }

  html +=
    '<div style="display:flex;gap:8px;padding:8px 0;overflow-x:auto;margin-bottom:8px" id="adminFilterBar">' +
      '<button class="filter-chip active" data-filter="todas" onclick="filtrarAdminMensalidades(\'todas\', this)" style="padding:6px 16px;border-radius:20px;border:1px solid #E0E0E0;background:#fff;font-size:14px;cursor:pointer;white-space:nowrap">Todas</button>' +
      '<button class="filter-chip" data-filter="em_aberto" onclick="filtrarAdminMensalidades(\'em_aberto\', this)" style="padding:6px 16px;border-radius:20px;border:1px solid #E0E0E0;background:#fff;font-size:14px;cursor:pointer;white-space:nowrap">Em Aberto</button>' +
      '<button class="filter-chip" data-filter="vencido" onclick="filtrarAdminMensalidades(\'vencido\', this)" style="padding:6px 16px;border-radius:20px;border:1px solid #E0E0E0;background:#fff;font-size:14px;cursor:pointer;white-space:nowrap">Vencido</button>' +
      '<button class="filter-chip" data-filter="pagas" onclick="filtrarAdminMensalidades(\'pagas\', this)" style="padding:6px 16px;border-radius:20px;border:1px solid #E0E0E0;background:#fff;font-size:14px;cursor:pointer;white-space:nowrap">Pago</button>' +
    '</div>' +
    '<div id="adminMensalidadesList"></div>';

  container.innerHTML = html;
  renderAdminMensalidadesList('todas');
}

var _adminMensalidadesFilter = 'todas';

function filtrarAdminMensalidades(filter, btn) {
  _adminMensalidadesFilter = filter;
  document.querySelectorAll('#adminFilterBar .filter-chip').forEach(function(c) { c.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderAdminMensalidadesList(filter);
}

function renderAdminMensalidadesList(filter) {
  filter = filter || _adminMensalidadesFilter || 'todas';
  var container = document.getElementById('adminMensalidadesList');
  if (!container) return;

  var filtered = AdminState.selectedMensalidades;
  var hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  if (filter === 'em_aberto') filtered = filtered.filter(function(m) { return !m.pago && parseDateSafe(m.vecto) >= hoje; });
  else if (filter === 'vencido') filtered = filtered.filter(function(m) { return !m.pago && parseDateSafe(m.vecto) < hoje; });
  else if (filter === 'pagas') filtered = filtered.filter(function(m) { return m.pago; });

  if (!filtered || filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">&#128237;</div><p>Nenhuma mensalidade encontrada</p></div>';
    return;
  }

  var html = '';
  filtered.forEach(function(m) {
    var isPago = m.pago === true;
    var vecto = parseDateSafe(m.vecto) || new Date();
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var isVencido = !isPago && vecto < hoje;
    var sClass = isPago ? 'pago' : (isVencido ? 'vencido' : 'em_aberto');
    var sText = isPago ? 'Pago' : (isVencido ? 'Vencido' : 'em Aberto');
    var sColor = isPago ? '#388E3C' : (isVencido ? '#D32F2F' : '#F57C00');
    var sBg = isPago ? '#E8F5E9' : (isVencido ? '#FFEBEE' : '#FFF3E0');

    html +=
      '<div class="card" style="cursor:pointer" onclick="handleAdminSelectBoleto(\'' + m.id + '\')">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-size:16px;font-weight:600">Mensalidade ' + (m.num || m.reg) + '</span>' +
          '<span style="padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;background:' + sBg + ';color:' + sColor + '">' + sText + '</span>' +
        '</div>' +
        '<div style="font-size:14px;color:var(--text-secondary)">Vencimento: ' + formatDate(m.vecto) + '<br><strong style="color:var(--text)">Valor: ' + formatCurrency(m.valor) + '</strong></div>' +
        (isPago && m.pagto ? '<div style="font-size:14px;color:#388E3C;margin-top:4px">Pago em: ' + formatDate(m.pagto) + '</div>' : '') +
      '</div>';
  });
  container.innerHTML = html;
}

function handleAdminSelectBoleto(mensalidadeId) {
  var m = AdminState.selectedMensalidades.find(function(x) { return x.id === mensalidadeId; });
  if (!m) return;

  AppState._mensalidadeAtual = m;
  AppState._boletoAtual = null;

  renderAdminBoleto(m);
}

function renderAdminBoleto(m) {
  var isPago = m.pago === true;
  var config = AppState.configBanco;

  var app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-bar">
      <button class="btn-icon" onclick="renderAdminMensalidades()">&#8592;</button>
      <span class="title">Mensalidade ${m.num || m.reg}</span>
    </div>
    <div class="main-content">
      <div class="card">
        <div class="boleto-info-row">
          <span class="boleto-label">Cliente</span>
          <span class="boleto-value">${AdminState.selectedCliente ? (AdminState.selectedCliente.nome || '-') : '-'}</span>
        </div>
        <div class="boleto-info-row">
          <span class="boleto-label">Mensalidade</span>
          <span class="boleto-value">${m.num || m.reg}</span>
        </div>
        <div class="boleto-info-row">
          <span class="boleto-label">Vencimento</span>
          <span class="boleto-value">${formatDate(m.vecto)}</span>
        </div>
        <div class="boleto-info-row">
          <span class="boleto-label">Valor</span>
          <span class="boleto-value">${formatCurrency(m.valor)}</span>
        </div>
        <div class="boleto-info-row">
          <span class="boleto-label">Jazigo</span>
          <span class="boleto-value">${m.jazigo || '-'}</span>
        </div>
        ${m.nosso_numero ? `<div class="boleto-info-row"><span class="boleto-label">Nosso Número</span><span class="boleto-value">${m.nosso_numero}</span></div>` : ''}
        ${m.bol_pagador_nome ? `<div class="boleto-info-row"><span class="boleto-label">Pagador</span><span class="boleto-value">${m.bol_pagador_nome}</span></div>` : ''}
        ${m.bol_mensagem2 ? `<div class="boleto-info-row"><span class="boleto-label">Mensagem</span><span class="boleto-value" style="font-size:12px">${m.bol_mensagem2}</span></div>` : ''}
        <div class="boleto-info-row">
          <span class="boleto-label">Status</span>
          <span class="boleto-value" style="color:${isPago ? 'var(--success)' : 'var(--warning)'}">${isPago ? 'Pago' : 'Pendente'}</span>
        </div>
        ${isPago && m.pagto ? `<div class="boleto-info-row"><span class="boleto-label">Pago em</span><span class="boleto-value">${formatDate(m.pagto)}</span></div>` : ''}
      </div>

      ${!isPago ? `
        <div class="card">
          <div id="adminBoletoBarcode" style="display:flex;justify-content:center;padding:16px 0">
            <div class="spinner"></div>
          </div>
          <div id="adminBoletoLinha" class="linha-digitavel"></div>
          <button class="btn btn-primary no-print" onclick="copiarLinhaDigitavelAdmin()" style="margin-bottom:12px">
            COPIAR CÓDIGO DE BARRA
          </button>
          <button class="btn btn-outline no-print" onclick="gerarPdfBoletoAdmin()">
            GERAR PDF
          </button>
        </div>
      ` : `
        <div class="card" style="text-align:center;padding:32px">
          <div style="font-size:48px;margin-bottom:16px">&#x2705;</div>
          <p style="font-size:18px;font-weight:600;color:var(--success)">Mensalidade paga</p>
          <p style="color:var(--text-secondary);margin-top:8px">Esta mensalidade já foi quitada.</p>
        </div>
      `}
    </div>
  `;

  if (!isPago) {
    AppState._boletoAtual = getBoletoFromMensalidade(m, config);
    if (AppState._boletoAtual) {
      setTimeout(function() { gerarAdminBarcode(m, config); }, 200);
    }
  }
}

function gerarAdminBarcode(m, config) {
  try {
    var boleto = AppState._boletoAtual;
    if (!boleto) {
      boleto = getBoletoFromMensalidade(m, config);
      AppState._boletoAtual = boleto;
    }

    var container = document.getElementById('adminBoletoBarcode');
    if (container) {
      container.innerHTML = '<svg id="adminBarcodeSvg"></svg>';
      JsBarcode('#adminBarcodeSvg', boleto.codigoBarras, {
        format: 'CODE128',
        width: 2,
        height: 80,
        displayValue: false,
        margin: 10,
      });
    }

    var elLinha = document.getElementById('adminBoletoLinha');
    if (elLinha) elLinha.textContent = boleto.linhaDigitavel;
  } catch (err) {
    console.error('Erro ao gerar barcode:', err);
    var bc = document.getElementById('adminBoletoBarcode');
    if (bc) bc.innerHTML = '<p style="color:var(--danger)">Erro ao gerar código de barras</p>';
  }
}

function copiarLinhaDigitavelAdmin() {
  var codigo = '';
  var boleto = AppState._boletoAtual;
  if (boleto && boleto.linhaDigitavel) {
    codigo = boleto.linhaDigitavel;
  } else {
    var el = document.getElementById('adminBoletoLinha');
    if (el && el.textContent) codigo = el.textContent;
  }
  if (!codigo) {
    showToast('Gere o código de barras primeiro');
    return;
  }
  codigo = codigo.replace(/[.\s]/g, '');

  var ta = document.createElement('textarea');
  ta.value = codigo;
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.width = '1px';
  ta.style.height = '1px';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';
  document.body.appendChild(ta);

  var ok = false;
  try {
    ta.focus();
    ta.select();
    ok = document.execCommand('copy');
  } catch (e) {}

  if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codigo).then(function() {
      ok = true;
      showToast('Código copiado!');
    }).catch(function() {});
  }

  document.body.removeChild(ta);

  if (ok) {
    showToast('Código copiado!');
  } else {
    var area = document.getElementById('adminBoletoLinha');
    if (area) {
      area.style.userSelect = 'text';
      area.style.webkitUserSelect = 'text';
    }
    showToast('Selecione o código manualmente');
  }
}

function gerarPdfBoletoAdmin() {
  const m = AppState._mensalidadeAtual;

  if (!m) {
    showToast('Mensalidade não encontrada');
    return;
  }

  const config = AppState.configBanco;
  let boleto = AppState._boletoAtual;

  if (!boleto && config) {
    boleto = getBoletoFromMensalidade(m, config);
    if (!boleto) {
      showToast('Erro ao gerar dados do boleto');
      return;
    }
  }

  if (!boleto) {
    showToast('Gere o código de barras primeiro');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('P', 'mm', 'A4');

  const df = (d) => {
    if (!d) return '';
    const dt = (d instanceof Date) ? d : parseDateSafe(d);
    if (!dt) return '';
    return String(dt.getDate()).padStart(2,'0') + '/' + String(dt.getMonth()+1).padStart(2,'0') + '/' + dt.getFullYear();
  };
  const cf = (v) => {
    if (v == null) return '';
    return 'R$ ' + Number(v).toFixed(2).replace('.',',');
  };

  const cedente = 'CEMITÉRIO DA RESSURREIÇÃO';
  const cnpjCedente = m.cpf_cnpj || '';
  const agencia = AppState.configBanco?.agencia || '';
  const conta = AppState.configBanco?.conta_corrente || '';
  const nossoNumero = m.nosso_numero || '';
  const vencimento = m.vecto ? parseDateSafe(m.vecto) || new Date() : new Date();
  const valor = m.valor || 0;

  const bolMensagem2 = m.bol_mensagem2 || 'APOS 30 DIAS DO VENCIMENTO O TITULO SERA PROTESTADO AUTOMAT.';
  const bolEspecie = m.bol_especie || '12';
  const bolMultaPerc = m.bol_multa_perc;
  const bolMora = m.bol_mora;
  const bolEmissao = m.bol_emissao;
  const bolPagadorNome = m.bol_pagador_nome || m.cliente_nome || '';
  const bolPagadorCpfCnpj = m.bol_pagador_cpf_cnpj;
  const bolPagadorEndereco = m.bol_pagador_endereco;
  const bolPagadorBairro = m.bol_pagador_bairro;
  const bolPagadorCidade = m.bol_pagador_cidade;
  const bolPagadorUf = m.bol_pagador_uf;
  const bolPagadorCep = m.bol_pagador_cep;

  let enderecoPagador = bolPagadorEndereco || '';
  if (bolPagadorBairro) enderecoPagador += ' - ' + bolPagadorBairro;
  if (bolPagadorCidade) enderecoPagador += ' - ' + bolPagadorCidade;
  if (bolPagadorUf) enderecoPagador += '/' + bolPagadorUf;
  if (bolPagadorCep) enderecoPagador += ' - CEP: ' + bolPagadorCep;

  const especieMap = {'01':'CHEQUE','02':'DM','03':'DMI','04':'NOTA','12':'DM','17':'RC','20':'AP','99':'OU'};

  function drawCell(x, y, w, h, label, value, opts) {
    opts = opts || {};
    doc.setDrawColor(180);
    doc.rect(x, y, w, h);
    doc.setFontSize(5);
    doc.setTextColor(100);
    doc.text(label, x + 1, y + 3);
    doc.setFontSize(opts.fontSize || 8);
    doc.setTextColor(0);
    if (opts.bold !== false) doc.setFont(undefined, 'bold');
    doc.text(String(value || ' '), x + 1, y + (opts.fontSize || 8) + 2);
    doc.setFont(undefined, 'normal');
  }

  function drawRow(y, cells, heights) {
    let x = 15;
    const rowH = heights || 12;
    cells.forEach(c => {
      const w = c.w || 40;
      const label = c.label || '';
      const value = c.value !== undefined ? c.value : '';
      drawCell(x, y, w, rowH, label, String(value), c.opts || {});
      x += w;
    });
    return y + rowH;
  }

  function drawFullCell(y, h, label, value, opts) {
    drawCell(15, y, 180, h, label, value, opts);
    return y + h;
  }

  let y = 15;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  var _logo1 = document.getElementById('logoBradesco');
  if (_logo1 && _logo1.complete && _logo1.naturalWidth > 0) {
    doc.addImage(_logo1, 'PNG', 15, y - 6, 34, 9);
  } else {
    doc.text('BANCO BRADESCO', 15, y);
  }
  doc.setFontSize(14);
  doc.setTextColor(255, 152, 0);
  doc.text('237-2', 180, y, { align: 'right' });
  y += 8;

  const barcodeContainerH = 32;
  doc.setDrawColor(255, 152, 0);
  doc.setLineWidth(1.5);
  doc.rect(15, y, 180, barcodeContainerH);

  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, boleto.codigoBarras, {
      format: 'CODE128',
      width: 1.2,
      height: 30,
      displayValue: false,
      margin: 5,
    });
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 30, y + 2, 150, 16);
  } catch (e) {}

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  doc.text(boleto.linhaDigitavel, 105, y + barcodeContainerH - 4, { align: 'center' });
  y += barcodeContainerH + 2;

  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(100);
  doc.text('RECIBO DO PAGADOR', 15, y);
  y += 5;

  y = drawRow(y, [
    { label: 'Beneficiário', value: cedente, w: 120 },
    { label: 'CNPJ/CPF', value: cnpjCedente, w: 60 },
  ]);

  y = drawRow(y, [
    { label: 'Agência/Código', value: agencia + ' / ' + conta, w: 72 },
    { label: 'Vencimento', value: df(vencimento), w: 54 },
    { label: 'Valor', value: cf(valor), w: 54, opts: { bold: true } },
  ]);

  const row3cells = [
    { label: 'Nosso Número', value: nossoNumero, w: 72 },
    { label: 'Espécie', value: especieMap[bolEspecie] || bolEspecie, w: 27 },
  ];
  if (bolMultaPerc && Number(bolMultaPerc) > 0) {
    row3cells.push({ label: 'Multa', value: bolMultaPerc + '%', w: 27 });
  }
  if (bolMora && Number(bolMora) > 0) {
    row3cells.push({ label: 'Mora', value: cf(bolMora), w: 27 });
  }
  const usedW = row3cells.reduce((s, c) => s + c.w, 0);
  if (usedW < 180) {
    row3cells.push({ label: '', value: '', w: 180 - usedW });
  }
  y = drawRow(y, row3cells);

  y = drawRow(y, [
    { label: 'Pagador', value: bolPagadorNome, w: 120 },
    { label: 'CPF/CNPJ', value: bolPagadorCpfCnpj || '', w: 60 },
  ]);

  if (enderecoPagador) {
    y = drawFullCell(y, 12, 'Endereço', enderecoPagador);
  }

  y = drawFullCell(y, 10, 'Mensagem', bolMensagem2, { fontSize: 6, bold: false });

  y += 8;
  doc.setFontSize(7);
  doc.setTextColor(150);
  const corteW = 60;
  doc.text('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', 15, y);
  doc.text('CORTE AQUI', 105, y, { align: 'center' });
  doc.text('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', 195, y, { align: 'right' });
  y += 10;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  var _logo2 = document.getElementById('logoBradesco');
  if (_logo2 && _logo2.complete && _logo2.naturalWidth > 0) {
    doc.addImage(_logo2, 'PNG', 15, y - 6, 34, 9);
  } else {
    doc.text('BANCO BRADESCO', 15, y);
  }
  doc.setFontSize(12);
  doc.text('237-2', 55, y);
  doc.setFontSize(10);
  doc.text(boleto.linhaDigitavel, 180, y, { align: 'right' });
  y += 8;

  y = drawRow(y, [
    { label: 'Local de Pagamento', value: 'PAGÁVEL PREFERENCIALMENTE NA REDE BRADESCO', w: 126 },
    { label: 'Vencimento', value: df(vencimento), w: 54 },
  ]);

  y = drawRow(y, [
    { label: 'Beneficiário', value: cedente + ' - CNPJ: ' + cnpjCedente, w: 126 },
    { label: 'Ag/Código Beneficiário', value: agencia + ' / ' + conta, w: 54 },
  ]);

  y = drawRow(y, [
    { label: 'Data Emissão', value: bolEmissao ? df(bolEmissao) : df(new Date()), w: 36 },
    { label: 'Nosso Número', value: nossoNumero, w: 54 },
    { label: 'Espécie', value: especieMap[bolEspecie] || bolEspecie, w: 27 },
    { label: 'Quantidade', value: '', w: 27 },
    { label: 'Valor', value: cf(valor), w: 36, opts: { bold: true } },
  ]);

  const rowDesconto = [
    { label: '(-) Desconto / Abatimento', value: '', w: 72 },
  ];
  if (bolMultaPerc && Number(bolMultaPerc) > 0) {
    rowDesconto.push({ label: '(+) Multa', value: bolMultaPerc + '%', w: 36 });
  }
  if (bolMora && Number(bolMora) > 0) {
    rowDesconto.push({ label: '(+) Mora/Dia', value: cf(bolMora), w: 36 });
  }
  rowDesconto.push({ label: '(=) Valor Total', value: cf(valor), w: 36, opts: { bold: true, fontSize: 7 } });
  y = drawRow(y, rowDesconto);

  y = drawRow(y, [
    { label: 'Pagador', value: bolPagadorNome, w: 120 },
    { label: 'CPF/CNPJ', value: bolPagadorCpfCnpj || '', w: 60 },
  ]);

  if (enderecoPagador) {
    y = drawFullCell(y, 12, 'Endereço', enderecoPagador);
  }

  y = drawFullCell(y, 10, 'Mensagem', bolMensagem2, { fontSize: 6, bold: false });

  y += 6;
  try {
    const canvas2 = document.createElement('canvas');
    JsBarcode(canvas2, boleto.codigoBarras, {
      format: 'CODE128',
      width: 1.5,
      height: 40,
      displayValue: false,
      margin: 5,
    });
    const imgData2 = canvas2.toDataURL('image/png');
    doc.addImage(imgData2, 'PNG', 30, y, 150, 22);
  } catch (e) {}

  doc.save('boleto_' + (m.num || m.reg || 'mensalidade') + '.pdf');
  showToast('PDF gerado com sucesso!');
}

async function recarregarAdmin() {
  if (AdminState.selectedCliente) {
    await handleAdminSelectCliente(AdminState.selectedCliente.id);
  } else {
    renderAdminDashboard();
  }
}

async function handleAdminLogout() {
  AdminState.searchResults = [];
  AdminState.selectedCliente = null;
  AdminState.selectedMensalidades = [];
  AppState._mensalidadeAtual = null;
  AppState._boletoAtual = null;
  try { var sb = getSupabase(); if (sb) await sb.auth.signOut(); } catch(e) {}
  AppState.user = null;
  AppState.cliente = null;
  AppState.mensalidades = [];
  AppState.falecidos = [];
  AppState.configBanco = null;
  AppState.isAdmin = false;
  navigate('#/login');
}
