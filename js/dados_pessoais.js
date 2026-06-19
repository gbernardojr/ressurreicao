function renderDadosPessoais() {
  var app = document.getElementById('app');
  var c = AppState.cliente;

  app.innerHTML =
    '<div class="app-bar"><button class="btn-icon" onclick="navigate(\'#/dashboard\')">&#8592;</button><span class="title">Dados Pessoais</span></div>' +
    '<div class="main-content">' +
      (!c ? '<div class="spinner"></div>' :
      '<div class="card" style="text-align:center;padding:24px">' +
        '<div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:36px;margin:0 auto 16px">&#128100;</div>' +
        '<h2 style="font-size:20px;margin-bottom:4px">' + (c.nome || '-') + '</h2>' +
        '<p style="color:var(--text-secondary);font-size:14px">C\u00f3digo: ' + (c.codigo_propri || '-') + '</p>' +
      '</div>' +
      '<div class="card">' +
        '<div class="detail-row"><span class="detail-label">Nome</span><span class="detail-value">' + (c.nome || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">CPF/CNPJ</span><span class="detail-value">' + (c.cpf_cnpj || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Telefone</span><span class="detail-value">' + (c.telefone || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">E-mail</span><span class="detail-value">' + (c.email || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Endere\u00e7o</span><span class="detail-value">' + (c.endereco || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Cidade</span><span class="detail-value">' + (c.cidade || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Estado</span><span class="detail-value">' + (c.estado || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">CEP</span><span class="detail-value">' + (c.cep || '-') + '</span></div>' +
      '</div>') +
    '</div>';
}
