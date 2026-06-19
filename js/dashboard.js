function renderDashboard() {
  var pendentes = AppState.mensalidades.filter(function(m) { return !m.pago; });
  var totalDebito = pendentes.reduce(function(s, m) { return s + (Number(m.valor) || 0); }, 0);
  var proximo = pendentes.length > 0 ? pendentes[0] : null;

  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar"><span class="title">Ressurreição</span><div class="actions">' +
      '<button class="btn-icon" onclick="recarregarDashboard()" title="Atualizar">&#x21bb;</button>' +
      '<button class="btn-icon" onclick="handleLogout()" title="Sair">&#x23fb;</button>' +
    '</div></div>' +
    '<div class="main-content" id="dashContent"></div>';

  var content = document.getElementById('dashContent');
  if (!AppState.cliente) {
    content.innerHTML = '<div class="spinner" style="display:flex;justify-content:center;padding:40px">' +
      '<div style="width:32px;height:32px;border:3px solid #E0E0E0;border-top-color:#1B5E20;border-radius:50%;animation:spin 0.8s linear infinite"></div></div>' +
      '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    return;
  }

  content.innerHTML =
    '<div class="card"><div style="display:flex;align-items:center;gap:16px">' +
      '<div style="width:60px;height:60px;border-radius:50%;background:#1B5E20;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;flex-shrink:0">&#128100;</div>' +
      '<div><div style="font-size:18px;font-weight:600">' + (AppState.cliente.nome || 'Cliente') + '</div>' +
      '<div style="font-size:14px;color:#757575">Código: ' + (AppState.cliente.codigo_propri || '') + '</div></div>' +
    '</div></div>' +

    '<div class="card" style="text-align:center;padding:24px;background:' + (totalDebito > 0 ? '#FFF3E0' : '#E8F5E9') + '">' +
      '<div style="font-size:14px;color:#757575;margin-bottom:8px">' + (totalDebito > 0 ? 'Total a Pagar' : 'Tudo em Dia!') + '</div>' +
      '<div style="font-size:32px;font-weight:700;color:' + (totalDebito > 0 ? '#F57C00' : '#388E3C') + '">' + formatCurrency(totalDebito) + '</div>' +
      (pendentes.length > 0 ? '<div style="font-size:14px;color:#757575;margin-top:8px">' + pendentes.length + ' mensalidade(s) pendente(s)</div>' : '') +
    '</div>' +

    (proximo ? '<div class="card" style="display:flex;align-items:center;gap:16px">' +
      '<div style="width:52px;height:52px;border-radius:12px;background:#E3F2FD;display:flex;align-items:center;justify-content:center;color:#1565C0;font-size:24px;flex-shrink:0">&#128197;</div>' +
      '<div><div style="font-size:14px;color:#757575">Próximo Vencimento</div>' +
      '<div style="font-size:18px;font-weight:600">' + formatDate(proximo.vecto) + '</div>' +
      '<div style="font-size:14px;color:#757575">' + formatCurrency(proximo.valor) + '</div></div>' +
    '</div>' : '') +

    '<button class="btn btn-primary" onclick="navigate(\'#/mensalidades\')" style="margin-top:16px">VER MENSALIDADES</button>';
}

async function recarregarDashboard() {
  var content = document.getElementById('dashContent');
  if (content) content.innerHTML = '<div style="text-align:center;padding:40px;color:#757575">Atualizando...</div>';
  await carregarDadosCliente();
  renderDashboard();
}

async function handleLogout() {
  try { var sb = getSupabase(); if (sb) await sb.auth.signOut(); } catch(e) {}
  AppState.user = null;
  AppState.cliente = null;
  AppState.mensalidades = [];
  AppState.configBanco = null;
  navigate('#/login');
}
