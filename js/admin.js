var AdminState = {
  searchResults: [],
  searchError: '',
  selectedCliente: null,
  selectedMensalidades: [],
  selectedFalecidos: [],
  falecidosLocaisMap: {},
};

function formatarCpfCnpj(v) {
  var str = String(v == null ? '' : v).trim();
  if (/[A-Za-z]/.test(str)) {
    return str.toUpperCase().replace(/[^0-9A-Z\-]/g, '').slice(0, 18);
  }
  var d = str.replace(/\D/g, '');
  if (d.length <= 6) return str.replace(/[^0-9\-]/g, '').slice(0, 18);
  if (d.length <= 11) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9,11);
  return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5,8) + '/' + d.slice(8,12) + '-' + d.slice(12,14);
}

function variantesCodigo(valor) {
  var base = String(valor == null ? '' : valor).trim().toUpperCase().replace(/[^0-9A-Z\-]/g, '');
  var variantes = [];
  function adicionar(v) {
    if (v && variantes.indexOf(v) === -1) variantes.push(v);
  }
  adicionar(base);
  var semHifen = base.replace(/-/g, '');
  adicionar(semHifen);
  var comHifen = semHifen.match(/^(\d{1,4})([A-Z])$/);
  if (comHifen) {
    adicionar(comHifen[1].padStart(4, '0') + '-' + comHifen[2]);
    adicionar(comHifen[1].padStart(4, '0') + comHifen[2]);
  }
  if (/^\d{1,4}$/.test(base)) {
    adicionar(base.padStart(4, '0'));
  }
  return variantes;
}

function renderAdminDashboard() {
  AdminState.searchResults = [];
  AdminState.searchError = '';
  AdminState.selectedCliente = null;
  AdminState.selectedMensalidades = [];
  AdminState.selectedFalecidos = [];
  AdminState.falecidosLocaisMap = {};
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
        '<h2 style="font-size:18px;margin-bottom:16px;color:var(--primary-dark)">🔍 Consulta de Clientes / Jazigos</h2>' +
        '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">Digite o CPF, CNPJ ou Número do Jazigo (Código) do cliente para acessar os boletos.</p>' +
        '<div class="admin-search-box">' +
          '<input type="text" id="adminSearchInput" class="form-input" placeholder="CPF, CNPJ ou Jazigo (ex: 0252 ou 0123-A)" maxlength="18">' +
          '<button id="adminSearchBtn" class="btn btn-primary" style="margin-top:12px" onclick="handleAdminSearch()">BUSCAR</button>' +
        '</div>' +
        '<div id="adminSearchError" class="alert alert-error hidden" style="margin-top:12px"></div>' +
      '</div>' +
      '<div id="adminSearchResults"></div>' +
      '<div id="adminMensalidadesArea"></div>' +
      '<div class="card" style="margin-top:16px;display:flex;flex-direction:column;gap:10px">' +
        '<button class="btn btn-outline" onclick="renderAdminAlterarSenha()" style="width:100%">🔑 Alterar Minha Senha</button>' +
        '<button class="btn btn-outline" onclick="renderAdminGerenciar()" style="width:100%">⚙️ Gerenciar Administradores</button>' +
      '</div>' +
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

  var rawVal = input.value.trim();
  var digits = rawVal.replace(/\D/g, '');
  errEl.classList.add('hidden');

  if (!rawVal) {
    errEl.textContent = 'Digite o CPF, CNPJ ou Número do Jazigo/Código';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Buscando...';
  resultsEl.innerHTML = '<div class="spinner"></div>';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conexão.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'BUSCAR'; return; }

    var conditions = [];
    var variantes = variantesCodigo(rawVal);

    if ((digits.length === 11 || digits.length === 14) && !/[A-Za-z]/.test(rawVal)) {
      conditions.push('cpf_cnpj.eq.' + digits);
    }

    variantes.forEach(function(v) {
      conditions.push('codigo_propri.eq.' + v);
    });

    var busca = await sb.from('clientes')
      .select('id, codigo_propri, cpf_cnpj, nome, telefone, email, endereco, bairro, cidade, estado')
      .or(conditions.join(','))
      .limit(20);

    if (busca.error) {
      errEl.textContent = 'Erro na consulta.';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'BUSCAR';
      resultsEl.innerHTML = '';
      return;
    }

    AdminState.searchResults = busca.data || [];

    if (AdminState.searchResults.length === 0 && rawVal) {
      var jazigoConds = variantes.map(function(v) { return 'jazigo.eq.' + v; });

      var buscaJazigo = await sb.from('mensalidades')
        .select('cliente_id')
        .or(jazigoConds.join(','))
        .limit(20);

      if (buscaJazigo.data && buscaJazigo.data.length > 0) {
        var clientIds = [...new Set(buscaJazigo.data.map(function(m) { return m.cliente_id; }).filter(Boolean))];
        if (clientIds.length > 0) {
          var buscaClientesJazigo = await sb.from('clientes')
            .select('id, codigo_propri, cpf_cnpj, nome, telefone, email, endereco, bairro, cidade, estado')
            .in('id', clientIds);
          if (buscaClientesJazigo.data) {
            AdminState.searchResults = buscaClientesJazigo.data;
          }
        }
      }
    }

    if (AdminState.searchResults.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state"><div class="icon">&#128269;</div><p>Nenhum cliente ou jazigo encontrado com essa informação.</p></div>';
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
  var html = '<h3 style="font-size:16px;margin:16px 0 8px;color:var(--text)">Clientes / Jazigos encontrados:</h3>';
  AdminState.searchResults.forEach(function(c) {
    html +=
      '<div class="card admin-cliente-card" onclick="handleAdminSelectCliente(\'' + c.id + '\')">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<div class="admin-cliente-avatar">' + (c.nome ? c.nome.charAt(0).toUpperCase() : '?') + '</div>' +
          '<div style="flex:1">' +
            '<div style="font-weight:600;font-size:15px">' + (c.nome || '-') + '</div>' +
            '<div style="font-size:13px;color:var(--text-secondary);margin-top:2px">' +
              'Jazigo / Cód: <strong>' + (c.codigo_propri || '-') + '</strong>' +
              (c.cpf_cnpj ? ' | CPF/CNPJ: ' + formatarCpfCnpj(c.cpf_cnpj) : '') +
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

    // Buscar mensalidades
    var busca = await sb.from('mensalidades').select()
      .eq('cliente_id', clienteId)
      .order('vecto', { ascending: true });

    AdminState.selectedMensalidades = busca.data || [];

    // Buscar entes queridos falecidos do cliente
    AdminState.selectedFalecidos = [];
    AdminState.falecidosLocaisMap = {};

    var buscaFalecidos = await sb.from('falecidos').select()
      .eq('cliente_id', clienteId)
      .order('nome', { ascending: true });

    if (buscaFalecidos.data && buscaFalecidos.data.length > 0) {
      AdminState.selectedFalecidos = buscaFalecidos.data;
      var falecidoIds = AdminState.selectedFalecidos.map(function(f) { return f.id; });

      var buscaLocais = await sb.from('falecido_locais').select()
        .in('falecido_id', falecidoIds)
        .order('data_inicio', { ascending: false });

      if (buscaLocais.data) {
        buscaLocais.data.forEach(function(loc) {
          if (!AdminState.falecidosLocaisMap[loc.falecido_id]) {
            AdminState.falecidosLocaisMap[loc.falecido_id] = [];
          }
          AdminState.falecidosLocaisMap[loc.falecido_id].push(loc);
        });
      }
    }

    renderAdminMensalidades();
  } catch (e) {
    console.error('Erro ao selecionar cliente admin:', e);
    mensalidadesArea.innerHTML = '<p style="color:var(--danger)">Erro ao carregar dados do cliente.</p>';
  }
}

function renderAdminMensalidades() {
  var container = document.getElementById('adminMensalidadesArea');
  var cliente = AdminState.selectedCliente;
  var mensalidades = AdminState.selectedMensalidades;
  var falecidos = AdminState.selectedFalecidos || [];
  var locaisMap = AdminState.falecidosLocaisMap || {};

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
      (cliente.email ?
        '<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.2)">' +
          '<button class="btn" onclick="adminCriarContaAuth()" style="background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.4);padding:8px 16px;border-radius:8px;font-size:13px;cursor:pointer;width:100%">&#128273; Criar conta de acesso para este cliente</button>' +
          '<div id="adminContaAuthResult" style="margin-top:8px;font-size:13px"></div>' +
        '</div>' : '') +
    '</div>';

  // Seção de Entes Queridos Falecidos
  html += '<div class="card" style="margin-bottom:16px">' +
    '<h3 style="font-size:16px;font-weight:600;margin-bottom:12px;color:var(--primary-dark);display:flex;align-items:center;gap:8px">' +
      '<span>&#x271D;</span> Entes Queridos Falecidos (' + falecidos.length + ')' +
    '</h3>';

  if (falecidos.length === 0) {
    html += '<p style="font-size:14px;color:var(--text-secondary)">Nenhum ente querido falecido cadastrado para este cliente.</p>';
  } else {
    falecidos.forEach(function(f) {
      var fLocais = locaisMap[f.id] || [];
      html +=
        '<div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;margin-bottom:12px;background:#fafafa">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
            '<div style="font-weight:700;font-size:15px;color:var(--text)">' + (f.nome || '-') + '</div>' +
            (f.jazigo ? '<span style="font-size:12px;background:#e3f2fd;color:#1565c0;padding:2px 8px;border-radius:12px;font-weight:600">Jazigo: ' + f.jazigo + '</span>' : '') +
          '</div>' +
          '<div class="detail-row" style="font-size:13px"><span class="detail-label">Data Nascimento</span><span class="detail-value">' + formatDateBr(f.data_nascimento) + '</span></div>' +
          '<div class="detail-row" style="font-size:13px"><span class="detail-label">Data Falecimento</span><span class="detail-value">' + formatDateBr(f.data_falecimento) + '</span></div>' +
          '<div class="detail-row" style="font-size:13px"><span class="detail-label">Data Sepultamento</span><span class="detail-value">' + formatDateBr(f.data_sepultamento) + '</span></div>' +
          '<div class="detail-row" style="font-size:13px"><span class="detail-label">Data Exumação</span><span class="detail-value">' + formatDateBr(f.data_exumacao) + '</span></div>';

      html += '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #ddd">' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">&#128205; Locais de Sepultamento:</div>';

      if (fLocais.length === 0) {
        html += '<p style="font-size:12px;color:var(--text-secondary)">' + (f.jazigo ? 'Jazigo: ' + f.jazigo : 'Nenhum local específico cadastrado') + '</p>';
      } else {
        fLocais.forEach(function(l) {
          html +=
            '<div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:8px 12px;margin-bottom:6px;font-size:13px">' +
              '<div style="font-weight:600;color:var(--primary-dark)">' + (l.jazigo || f.jazigo || l.local_tipo || 'Jazigo') + '</div>' +
              '<div style="display:flex;gap:16px;margin-top:4px;color:var(--text-secondary);font-size:12px">' +
                '<span>Quadra: <strong>' + (l.quadra || '-') + '</strong></span>' +
                '<span>Carneira: <strong>' + (l.carneira || '-') + '</strong></span>' +
                (l.data_inicio ? '<span>Início: <strong>' + formatDateBr(l.data_inicio) + '</strong></span>' : '') +
              '</div>' +
            '</div>';
        });
      }
      html += '</div></div>';
    });
  }
  html += '</div>';

  // Seção de Mensalidades / Boletos
  html += '<div style="font-size:16px;font-weight:600;margin:16px 0 8px;color:var(--text);display:flex;align-items:center;gap:8px"><span>&#128179;</span> Mensalidades / Boletos</div>';

  if (!mensalidades || mensalidades.length === 0) {
    html += htmlAvisoBoleto() + '<div class="empty-state"><div class="icon">&#128237;</div><p>Nenhuma mensalidade encontrada para este cliente.</p></div>';
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

  var aviso = htmlAvisoBoleto();

  if (!filtered || filtered.length === 0) {
    container.innerHTML = aviso + '<div class="empty-state"><div class="icon">&#128237;</div><p>Nenhuma mensalidade encontrada</p></div>';
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
  container.innerHTML = aviso + html;
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

async function adminCriarContaAuth() {
  var cliente = AdminState.selectedCliente;
  var resultEl = document.getElementById('adminContaAuthResult');
  if (!cliente || !resultEl) return;

  if (!cliente.email) {
    resultEl.innerHTML = '<span style="color:#FFCDD2">Cliente sem email cadastrado.</span>';
    return;
  }

  resultEl.innerHTML = '<span style="color:#FFF9C4">Criando conta...</span>';

  try {
    var sb = getSupabase();
    if (!sb) { resultEl.innerHTML = '<span style="color:#FFCDD2">Erro de conexão.</span>'; return; }

    var tempSenha = 'Ress@' + new Date().getFullYear();

    var auth = await sb.auth.signUp({ email: cliente.email, password: tempSenha });

    if (auth.error) {
      var msg = auth.error.message || '';
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        resultEl.innerHTML = '<span style="color:#FFF9C4">Conta já existe para este email.<br>O cliente pode usar <b>"Esqueci minha senha"</b> para redefinir.</span>';
      } else {
        resultEl.innerHTML = '<span style="color:#FFCDD2">Erro: ' + msg + '</span>';
      }
      return;
    }

    resultEl.innerHTML =
      '<div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:8px;margin-top:4px">' +
        '<div style="font-weight:700;margin-bottom:8px">&#9989; Conta criada com sucesso!</div>' +
        '<div><b>Email:</b> ' + cliente.email + '</div>' +
        '<div><b>Senha temporária:</b> ' + tempSenha + '</div>' +
        '<div style="margin-top:8px;font-size:12px;opacity:0.8">Informe estos dados ao cliente. Ele pode trocar a senha depois em "Esqueci minha senha".</div>' +
      '</div>';
  } catch (err) {
    resultEl.innerHTML = '<span style="color:#FFCDD2">Erro ao conectar.</span>';
  }
}

async function renderAdminGerenciar() {
  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar"><button class="btn-icon" onclick="renderAdminDashboard()">&#8592;</button><span class="title">Gerenciar Admins</span></div>' +
    '<div class="main-content">' +
      '<div id="adminListaArea"><div class="spinner"></div></div>' +
      '<div class="card" style="margin-top:16px">' +
        '<h3 style="font-size:16px;margin-bottom:12px">Novo Administrador</h3>' +
        '<p style="font-size:13px;color:#757575;margin-bottom:12px">Cadastre os dados do novo administrador abaixo. O cadastro de administradores é independente do cadastro de clientes.</p>' +
        '<div class="form-group"><label style="display:block;font-size:14px;color:#757575;margin-bottom:4px">Nome do Administrador</label><input type="text" id="adminNovoNome" class="form-input" placeholder="Nome completo"></div>' +
        '<div class="form-group"><label style="display:block;font-size:14px;color:#757575;margin-bottom:4px">CPF do Administrador</label><input type="text" id="adminNovoCpf" class="form-input" placeholder="000.000.000-00" maxlength="14" inputmode="numeric"></div>' +
        '<div class="form-group"><label style="display:block;font-size:14px;color:#757575;margin-bottom:4px">Email do Administrador</label><input type="email" id="adminNovoEmail" class="form-input" placeholder="email@exemplo.com"></div>' +
        '<div class="form-group"><label style="display:block;font-size:14px;color:#757575;margin-bottom:4px">Senha temporária</label><div class="password-wrapper"><input type="password" id="adminNovoSenha" class="form-input" placeholder="Mínimo 6 caracteres"><button type="button" class="btn-toggle-senha" onclick="toggleSenha(\'adminNovoSenha\', this)" title="Mostrar senha">👁️</button></div></div>' +
        '<div id="adminNovoError" class="hidden" style="color:#D32F2F;background:#FFEBEE;padding:12px;border-radius:8px;margin-bottom:12px;font-size:14px"></div>' +
        '<div id="adminNovoSuccess" class="hidden" style="color:#388E3C;background:#E8F5E9;padding:12px;border-radius:8px;margin-bottom:12px;font-size:14px"></div>' +
        '<button class="btn btn-primary" onclick="handleAdminCadastrarNovo()" id="adminNovoBtn">CADASTRAR ADMIN</button>' +
      '</div>' +
    '</div>';

  document.getElementById('adminNovoCpf').addEventListener('input', function() { this.value = formatarCpf(this.value); });

  await carregarListaAdmins();
}

async function carregarListaAdmins() {
  var area = document.getElementById('adminListaArea');
  try {
    var sb = getSupabase();
    if (!sb) { area.innerHTML = '<p style="color:#D32F2F">Erro de conexão.</p>'; return; }
    var { data, error } = await sb.from('admin_usuarios').select('*').order('nome');
    if (error) { area.innerHTML = '<p style="color:#D32F2F">Erro: ' + error.message + '</p>'; return; }
    var lista = data || [];
    if (lista.length === 0) {
      area.innerHTML = '<div class="card"><p style="color:#757575;text-align:center">Nenhum administrador cadastrado.</p></div>';
      return;
    }
    var html = '<div class="card"><h3 style="font-size:16px;margin-bottom:12px">Administradores (' + lista.length + ')</h3>';
    lista.forEach(function(a) {
      var statusCor = a.ativo ? '#388E3C' : '#D32F2F';
      var statusTxt = a.ativo ? 'Ativo' : 'Inativo';
      html +=
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f0f0f0">' +
          '<div style="flex:1">' +
            '<div style="font-weight:600">' + (a.nome || '-') + '</div>' +
            '<div style="font-size:13px;color:#757575">' + (a.email || '-') + '</div>' +
            '<div style="font-size:13px;color:#757575">' + (a.cpf ? formatarCpf(a.cpf) : 'Sem CPF') + '</div>' +
            '<div style="font-size:12px;color:' + statusCor + ';font-weight:600">' + statusTxt + '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">' +
            (a.ativo
              ? '<button class="btn btn-outline" onclick="handleAdminDesativar(\'' + a.id + '\', \'' + (a.nome || '') + '\')" style="font-size:12px;padding:6px 12px;color:#D32F2F;border-color:#D32F2F">Desativar</button>'
              : '<button class="btn btn-outline" onclick="handleAdminAtivar(\'' + a.id + '\')" style="font-size:12px;padding:6px 12px;color:#388E3C;border-color:#388E3C">Ativar</button>') +
            '<button class="btn btn-outline" onclick="handleAdminExcluir(\'' + a.id + '\', \'' + (a.nome || '').replace(/\'/g, '') + '\', \'' + (a.email || '') + '\')" style="font-size:12px;padding:6px 12px;color:#B71C1C;border-color:#B71C1C;background:#FFEBEE">🗑️ Excluir</button>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    area.innerHTML = html;
  } catch (e) {
    area.innerHTML = '<p style="color:#D32F2F">Erro ao carregar lista.</p>';
  }
}

async function handleAdminCadastrarNovo() {
  var nome = document.getElementById('adminNovoNome').value.trim();
  var cpf = document.getElementById('adminNovoCpf').value.replace(/\D/g, '');
  var email = document.getElementById('adminNovoEmail').value.trim().toLowerCase();
  var senha = document.getElementById('adminNovoSenha').value;
  var errEl = document.getElementById('adminNovoError');
  var okEl = document.getElementById('adminNovoSuccess');
  var btn = document.getElementById('adminNovoBtn');

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (!nome) { errEl.textContent = 'Informe o nome do administrador'; errEl.classList.remove('hidden'); return; }
  if (!cpf || cpf.length !== 11) { errEl.textContent = 'CPF inválido'; errEl.classList.remove('hidden'); return; }
  if (!email || !email.includes('@')) { errEl.textContent = 'Email inválido'; errEl.classList.remove('hidden'); return; }
  if (!senha || senha.length < 6) { errEl.textContent = 'Senha deve ter pelo menos 6 caracteres'; errEl.classList.remove('hidden'); return; }

  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conexão.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'CADASTRAR ADMIN'; return; }

    var { data: existente } = await sb.from('admin_usuarios').select('id').or('cpf.eq.' + cpf + ',email.eq.' + email).maybeSingle();
    if (existente) { errEl.textContent = 'Este CPF ou E-mail já é administrador.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'CADASTRAR ADMIN'; return; }

    var { error: authErr } = await sb.auth.signUp({ email: email, password: senha });
    if (authErr) {
      var msg = authErr.message || '';
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        okEl.textContent = 'Conta Auth já existe para este email. Inserindo como admin...';
        okEl.classList.remove('hidden');
      } else {
        errEl.textContent = 'Erro ao criar conta Auth: ' + msg;
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'CADASTRAR ADMIN';
        return;
      }
    }

    var { error: insertErr } = await sb.from('admin_usuarios').insert({
      nome: nome,
      email: email,
      cpf: cpf,
      ativo: true
    });

    if (insertErr) {
      var errMsg = insertErr.message || '';
      if (errMsg.includes('row-level security') || errMsg.includes('RLS') || errMsg.includes('violates')) {
        errEl.innerHTML = '<b>Erro de Permissão (RLS no Supabase):</b><br>A tabela <code>admin_usuarios</code> bloqueou a inserção.<br>Execute o SQL abaixo no <b>SQL Editor</b> do Supabase para liberar:<br><br><code style="background:#fff;padding:6px;border-radius:4px;display:block;margin-top:4px;font-size:12px">DROP POLICY IF EXISTS "admin_usuarios_all" ON admin_usuarios;<br>CREATE POLICY "admin_usuarios_all" ON admin_usuarios FOR ALL TO public USING (true) WITH CHECK (true);</code>';
      } else {
        errEl.textContent = 'Erro ao cadastrar admin: ' + errMsg;
      }
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'CADASTRAR ADMIN';
      return;
    }

    okEl.innerHTML = '<b>' + nome + '</b> cadastrado como administrador com sucesso!';
    okEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'CADASTRAR ADMIN';

    document.getElementById('adminNovoCpf').value = '';
    document.getElementById('adminNovoNome').value = '';
    document.getElementById('adminNovoEmail').value = '';

    await carregarListaAdmins();
  } catch (err) {
    errEl.textContent = 'Erro ao conectar. Tente novamente.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'CADASTRAR ADMIN';
  }
}

async function handleAdminDesativar(id, nome) {
  if (!confirm('Desativar o administrador "' + nome + '"? Ele não poderá mais acessar como admin.')) return;
  try {
    var sb = getSupabase();
    if (!sb) return;
    var { error } = await sb.from('admin_usuarios').update({ ativo: false }).eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    await carregarListaAdmins();
  } catch (e) { alert('Erro ao desativar.'); }
}

async function handleAdminAtivar(id) {
  try {
    var sb = getSupabase();
    if (!sb) return;
    var { error } = await sb.from('admin_usuarios').update({ ativo: true }).eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    await carregarListaAdmins();
  } catch (e) { alert('Erro ao ativar.'); }
}

async function handleAdminExcluir(id, nome, email) {
  if (!confirm('⚠️ ATENÇÃO: Excluir permanentemente o administrador "' + nome + '"?\n\nEsta ação não pode ser desfeita. O usuário será removido da lista de administradores e do sistema de autenticação.')) return;
  try {
    var sb = getSupabase();
    if (!sb) { alert('Erro de conexão.'); return; }

    // 1. Excluir da tabela admin_usuarios
    var { error: delErr } = await sb.from('admin_usuarios').delete().eq('id', id);
    if (delErr) { alert('Erro ao excluir administrador: ' + delErr.message); return; }

    // 2. Tentar excluir do Supabase Auth via função RPC (SECURITY DEFINER)
    var authMsg = '';
    var { error: rpcErr } = await sb.rpc('excluir_admin_auth', { p_email: email });
    if (rpcErr) {
      if (rpcErr.message && (rpcErr.message.includes('Could not find') || rpcErr.message.includes('PGRST202'))) {
        authMsg = '\n\n⚠️ A conta de autenticação NÃO foi removida automaticamente porque a função RPC ainda não foi criada no Supabase.\n\nPara remover também do Authentication, execute este SQL no Supabase (SQL Editor como role "postgres"):\n\nCREATE OR REPLACE FUNCTION public.excluir_admin_auth(p_email text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public AS $$ DECLARE v_id uuid; BEGIN SELECT id INTO v_id FROM auth.users WHERE email = p_email; IF v_id IS NOT NULL THEN DELETE FROM auth.users WHERE id = v_id; END IF; END; $$; GRANT EXECUTE ON FUNCTION public.excluir_admin_auth(text) TO anon, authenticated;';
      } else {
        authMsg = '\n\n⚠️ Administrador removido da lista, mas houve erro ao remover do Authentication: ' + rpcErr.message;
      }
    }

    alert('✅ Administrador "' + nome + '" excluído com sucesso!' + authMsg);
    await carregarListaAdmins();
  } catch (e) {
    alert('Erro ao excluir administrador: ' + (e.message || e));
  }
}

function renderAdminAlterarSenha() {
  var adminEmail = (AppState.user && AppState.user.email) || (AppState.adminUser && AppState.adminUser.email) || '';
  var adminNome = (AppState.adminUser && AppState.adminUser.nome) || 'Administrador';

  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar">' +
      '<button class="btn-icon" onclick="renderAdminDashboard()">&#8592;</button>' +
      '<span class="title">Alterar Senha do Admin</span>' +
    '</div>' +
    '<div class="main-content">' +
      '<div class="card">' +
        '<h2 style="font-size:18px;margin-bottom:8px;color:var(--primary-dark)">🔑 Alterar Minha Senha</h2>' +
        '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">Usuário atual: <strong>' + adminNome + '</strong> (' + (adminEmail || '-') + ')</p>' +
        '<form id="adminAlterarSenhaForm">' +
          '<div class="form-group"><label class="form-label">Senha Atual</label><div class="password-wrapper"><input type="password" id="adminAltSenhaAtual" class="form-input" placeholder="Sua senha atual"><button type="button" class="btn-toggle-senha" onclick="toggleSenha(\'adminAltSenhaAtual\', this)" title="Mostrar senha">👁️</button></div></div>' +
          '<div class="form-group"><label class="form-label">Nova Senha</label><div class="password-wrapper"><input type="password" id="adminAltSenhaNova" class="form-input" placeholder="Mínimo 6 caracteres"><button type="button" class="btn-toggle-senha" onclick="toggleSenha(\'adminAltSenhaNova\', this)" title="Mostrar senha">👁️</button></div></div>' +
          '<div class="form-group"><label class="form-label">Confirmar Nova Senha</label><div class="password-wrapper"><input type="password" id="adminAltSenhaConfirma" class="form-input" placeholder="Repita a nova senha"><button type="button" class="btn-toggle-senha" onclick="toggleSenha(\'adminAltSenhaConfirma\', this)" title="Mostrar senha">👁️</button></div></div>' +
          '<div id="adminAltSenhaError" class="alert alert-error hidden" style="margin-bottom:12px"></div>' +
          '<div id="adminAltSenhaSuccess" class="alert alert-success hidden" style="margin-bottom:12px"></div>' +
          '<button type="submit" id="adminAltSenhaBtn" class="btn btn-primary" style="width:100%;margin-top:12px">ALTERAR SENHA</button>' +
        '</form>' +
      '</div>' +
    '</div>';

  document.getElementById('adminAlterarSenhaForm').addEventListener('submit', handleAdminAlterarSenha);
}

async function handleAdminAlterarSenha(e) {
  e.preventDefault();
  var atual = document.getElementById('adminAltSenhaAtual').value;
  var nova = document.getElementById('adminAltSenhaNova').value;
  var confirma = document.getElementById('adminAltSenhaConfirma').value;
  var errEl = document.getElementById('adminAltSenhaError');
  var okEl = document.getElementById('adminAltSenhaSuccess');
  var btn = document.getElementById('adminAltSenhaBtn');

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (!atual || !nova || !confirma) { errEl.textContent = 'Preencha todos os campos'; errEl.classList.remove('hidden'); return; }
  if (nova.length < 6) { errEl.textContent = 'Nova senha deve ter pelo menos 6 caracteres'; errEl.classList.remove('hidden'); return; }
  if (nova !== confirma) { errEl.textContent = 'As senhas não conferem'; errEl.classList.remove('hidden'); return; }

  btn.disabled = true;
  btn.textContent = 'Alterando...';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conexão.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ALTERAR SENHA'; return; }

    var email = (AppState.user && AppState.user.email) || (AppState.adminUser && AppState.adminUser.email);
    if (!email) { errEl.textContent = 'Usuário não autenticado'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ALTERAR SENHA'; return; }

    var reauth = await sb.auth.signInWithPassword({ email: email, password: atual });
    if (reauth.error) { errEl.textContent = 'Senha atual incorreta.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ALTERAR SENHA'; return; }

    var update = await sb.auth.updateUser({ password: nova });
    if (update.error) { errEl.textContent = 'Erro ao alterar senha: ' + update.error.message; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ALTERAR SENHA'; return; }

    okEl.textContent = 'Senha do administrador alterada com sucesso!';
    okEl.classList.remove('hidden');
    document.getElementById('adminAltSenhaAtual').value = '';
    document.getElementById('adminAltSenhaNova').value = '';
    document.getElementById('adminAltSenhaConfirma').value = '';
    btn.disabled = false;
    btn.textContent = 'ALTERAR SENHA';
  } catch (err) {
    errEl.textContent = 'Erro ao conectar. Tente novamente.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'ALTERAR SENHA';
  }
}

