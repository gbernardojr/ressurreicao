function renderDashboard() {
  var app = document.getElementById('app');
  var nome = AppState.cliente ? AppState.cliente.nome || '' : '';

  app.innerHTML =
    '<div class="app-bar"><span class="title">Ressurreição</span><div class="actions">' +
      '<button class="btn-icon" onclick="recarregarDashboard()" title="Atualizar">&#x21bb;</button>' +
      '<button class="btn-icon" onclick="handleLogout()" title="Sair">&#x23fb;</button>' +
    '</div></div>' +
    '<div class="main-content" id="dashContent"></div>';

  var content = document.getElementById('dashContent');
  if (!AppState.cliente) {
    content.innerHTML = '<div class="spinner"></div>';
    return;
  }

  content.innerHTML =
    '<div class="home-container">' +
      '<img src="images/logo.jpg" alt="Ressurreição" class="home-logo" onerror="this.style.display=\'none\'">' +
      '<div class="home-welcome">Ol\u00e1, ' + nome.split(' ')[0] + '</div>' +
      '<div class="home-subtitle">' + (AppState.cliente.codigo_propri ? 'C\u00f3digo: ' + AppState.cliente.codigo_propri : '') + '</div>' +
      '<div class="home-menu">' +
        '<button class="home-menu-btn" onclick="navigate(\'#/dados_pessoais\')">' +
          '<div class="icon-box" style="background:#E3F2FD;color:#2B6CB0">&#128100;</div>' +
          '<div class="menu-text"><span class="title">Dados Pessoais</span><span class="desc">Meus dados cadastrais</span></div>' +
          '<span class="arrow">&#8250;</span>' +
        '</button>' +
        '<button class="home-menu-btn" onclick="carregarFalecidosEAbrir()">' +
          '<div class="icon-box" style="background:#F0E6FF;color:#7B2D8E">&#x2764;</div>' +
          '<div class="menu-text"><span class="title">Entes Queridos Falecidos</span><span class="desc">Familiares sepultados</span></div>' +
          '<span class="arrow">&#8250;</span>' +
        '</button>' +
        '<button class="home-menu-btn" onclick="navigate(\'#/mensalidades\')">' +
          '<div class="icon-box" style="background:#FFF3E0;color:#E67E22">&#128196;</div>' +
          '<div class="menu-text"><span class="title">Boletos de Mensalidades</span><span class="desc">Boletos e pagamentos</span></div>' +
          '<span class="arrow">&#8250;</span>' +
        '</button>' +
      '</div>' +
      '<div class="home-footer">desenvolvido por Gilberto Ap Bernardo Junior Tecnologia da Informa\u00e7\u00e3o</div>' +
    '</div>';
}

async function carregarFalecidosEAbrir() {
  await carregarFalecidos();
  navigate('#/falecidos');
}

async function recarregarDashboard() {
  AppState.cliente = null;
  AppState.mensalidades = [];
  AppState.falecidos = [];
  await carregarDadosCliente();
  renderDashboard();
}

async function handleLogout() {
  try { var sb = getSupabase(); if (sb) await sb.auth.signOut(); } catch(e) {}
  AppState.user = null;
  AppState.cliente = null;
  AppState.mensalidades = [];
  AppState.falecidos = [];
  AppState.configBanco = null;
  navigate('#/login');
}
