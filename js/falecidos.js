function renderFalecidos() {
  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar"><button class="btn-icon" onclick="navigate(\'#/dashboard\')">&#8592;</button><span class="title">Entes Queridos Falecidos</span></div>' +
    '<div class="main-content" id="falecidosContent"></div>';

  renderFalecidosList();
}

function renderFalecidosList() {
  var container = document.getElementById('falecidosContent');
  var lista = AppState.falecidos;

  if (!lista || lista.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">&#x2764;</div><p>Nenhum familiar cadastrado</p></div>';
    return;
  }

  var html = '';
  lista.forEach(function(f) {
    html +=
      '<div class="card falecido-item" onclick="navigate(\'#/falecido?id=' + f.id + '\')">' +
        '<div class="falecido-avatar">&#x271D;</div>' +
        '<div class="falecido-info" style="flex:1">' +
          '<h3>' + (f.nome || '-') + '</h3>' +
          '<p>' + (f.jazigo ? 'Jazigo: ' + f.jazigo : '') + '</p>' +
        '</div>' +
        '<span style="color:var(--text-secondary);font-size:20px">&#8250;</span>' +
      '</div>';
  });
  container.innerHTML = html;
}

async function renderFalecidoDetalhe(id) {
  var f = AppState.falecidos.find(function(x) { return x.id === id; });

  if (!f) {
    navigate('#/falecidos');
    return;
  }

  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar"><button class="btn-icon" onclick="navigate(\'#/falecidos\')">&#8592;</button><span class="title">Detalhes do Falecido</span></div>' +
    '<div class="main-content">' +
      '<div class="card" style="text-align:center;padding:24px">' +
        '<div style="width:72px;height:72px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;color:var(--primary-dark);font-size:32px;margin:0 auto 12px">&#x271D;</div>' +
        '<h2 style="font-size:20px">' + (f.nome || '-') + '</h2>' +
      '</div>' +
      '<div class="card" id="falecidoLocais">' +
        '<div class="detail-row"><span class="detail-label">Nome</span><span class="detail-value">' + (f.nome || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Data Nascimento</span><span class="detail-value">' + formatDateBr(f.data_nascimento) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Data Falecimento</span><span class="detail-value">' + formatDateBr(f.data_falecimento) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Data Sepultamento</span><span class="detail-value">' + formatDateBr(f.data_sepultamento) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Data Exuma\u00e7\u00e3o</span><span class="detail-value">' + formatDateBr(f.data_exumacao) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Jazigo</span><span class="detail-value">' + (f.jazigo || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Carneira</span><span class="detail-value">' + (f.carneira || '-') + '</span></div>' +
      '</div>' +
      '<div class="card"><h3 style="font-size:16px;font-weight:600;margin-bottom:12px">Locais de Sepultamento</h3><div id="locaisList"><div class="spinner"></div></div></div>' +
    '</div>';

  carregarLocaisFalecido(f.id);
}

async function carregarLocaisFalecido(falecidoId) {
  var container = document.getElementById('locaisList');
  try {
    var sb = getSupabase();
    if (!sb) { container.innerHTML = '<p style="color:var(--text-secondary)">Erro ao carregar</p>'; return; }
    var locais = (await sb.from('falecido_locais').select().eq('falecido_id', falecidoId).order('data_inicio', { ascending: false })).data;

    if (!locais || locais.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:16px">Nenhum local cadastrado</p>';
      return;
    }

    var html = '';
    locais.forEach(function(l) {
      html +=
        '<div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px">' +
            '<span style="font-weight:600;color:var(--primary-dark);text-transform:capitalize">' + (l.local_tipo || 'Jazigo') + '</span>' +
            (l.data_inicio ? '<span style="font-size:13px;color:var(--text-secondary)">' + formatDateBr(l.data_inicio) + (l.data_fim ? ' at\u00e9 ' + formatDateBr(l.data_fim) : '') + '</span>' : '') +
          '</div>' +
          '<div class="detail-row"><span class="detail-label">Jazigo</span><span class="detail-value">' + (l.jazigo || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Quadra</span><span class="detail-value">' + (l.quadra || '-') + '</span></div>' +
          '<div class="detail-row" style="border-bottom:none"><span class="detail-label">Carneira</span><span class="detail-value">' + (l.carneira || '-') + '</span></div>' +
        '</div>';
    });
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<p style="color:var(--danger)">Erro ao carregar locais</p>';
    console.error('Erro locais:', e);
  }
}
