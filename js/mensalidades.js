var _mensalidadesFilter = 'todas';

function renderMensalidades() {
  _mensalidadesFilter = 'todas';

  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar"><button class="btn-icon" onclick="navigate(\'#/dashboard\')">&#8592;</button><span class="title">Mensalidades</span></div>' +
    '<div class="main-content">' +
      '<div style="display:flex;gap:8px;padding:8px 0;overflow-x:auto;margin-bottom:8px" id="filterBar">' +
        '<button class="filter-chip active" data-filter="todas" onclick="filtrarMensalidades(\'todas\', this)" style="padding:6px 16px;border-radius:20px;border:1px solid #E0E0E0;background:#fff;font-size:14px;cursor:pointer;white-space:nowrap">Todas</button>' +
        '<button class="filter-chip" data-filter="pendentes" onclick="filtrarMensalidades(\'pendentes\', this)" style="padding:6px 16px;border-radius:20px;border:1px solid #E0E0E0;background:#fff;font-size:14px;cursor:pointer;white-space:nowrap">Pendentes</button>' +
        '<button class="filter-chip" data-filter="pagas" onclick="filtrarMensalidades(\'pagas\', this)" style="padding:6px 16px;border-radius:20px;border:1px solid #E0E0E0;background:#fff;font-size:14px;cursor:pointer;white-space:nowrap">Pagas</button>' +
      '</div>' +
      '<div id="mensalidadesList"></div>' +
    '</div>';

  renderMensalidadesList();
  document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
  var first = document.querySelector('.filter-chip');
  if (first) first.classList.add('active');
}

function filtrarMensalidades(filter, btn) {
  _mensalidadesFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderMensalidadesList();
}

function renderMensalidadesList() {
  var container = document.getElementById('mensalidadesList');
  var filtered = AppState.mensalidades;

  if (_mensalidadesFilter === 'pendentes') filtered = filtered.filter(function(m) { return !m.pago; });
  else if (_mensalidadesFilter === 'pagas') filtered = filtered.filter(function(m) { return m.pago; });

  if (!filtered || filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:48px 16px;color:#757575"><div style="font-size:48px;margin-bottom:16px;opacity:0.5">&#128237;</div><p>Nenhuma mensalidade encontrada</p></div>';
    return;
  }

  var html = '';
  filtered.forEach(function(m) {
    var isPago = m.pago === true;
    var vecto = parseDateSafe(m.vecto) || new Date();
    var isVencida = !isPago && vecto < new Date();
    var sClass = isPago ? 'pago' : (isVencida ? 'vencida' : 'pendente');
    var sText = isPago ? 'Pago' : (isVencida ? 'Vencida' : 'Pendente');
    var sColor = isPago ? '#388E3C' : (isVencida ? '#D32F2F' : '#F57C00');
    var sBg = isPago ? '#E8F5E9' : (isVencida ? '#FFEBEE' : '#FFF3E0');

    var id = m.id || m.reg;
    html +=
      '<div class="card" style="cursor:pointer;transition:transform 0.1s" onclick="navigate(\'#/boleto?id=' + id + '\')">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-size:16px;font-weight:600">Mensalidade ' + (m.num || m.reg) + '</span>' +
          '<span style="padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;background:' + sBg + ';color:' + sColor + '">' + sText + '</span>' +
        '</div>' +
        '<div style="font-size:14px;color:#757575">Vencimento: ' + formatDate(m.vecto) + '<br><strong style="color:#212121">Valor: ' + formatCurrency(m.valor) + '</strong></div>' +
        (isPago && m.pagto ? '<div style="font-size:14px;color:#388E3C;margin-top:4px">Pago em: ' + formatDate(m.pagto) + '</div>' : '') +
      '</div>';
  });
  container.innerHTML = html;
}

