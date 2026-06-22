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
      '</div>' +
      '<div class="card">' +
        '<h3 style="margin-bottom:12px">Alterar Senha</h3>' +
        '<form id="alterarSenhaForm">' +
          '<div class="form-group"><label class="form-label">Senha Atual</label><input type="password" id="altSenhaAtual" class="form-input" placeholder="Senha atual"></div>' +
          '<div class="form-group"><label class="form-label">Nova Senha</label><input type="password" id="altSenhaNova" class="form-input" placeholder="M\u00ednimo 6 caracteres"></div>' +
          '<div class="form-group"><label class="form-label">Confirmar Nova Senha</label><input type="password" id="altSenhaConfirma" class="form-input" placeholder="Repita a nova senha"></div>' +
          '<div id="altSenhaError" class="alert alert-error hidden"></div>' +
          '<div id="altSenhaSuccess" class="alert alert-success hidden"></div>' +
          '<button type="submit" id="altSenhaBtn" class="btn btn-primary">ALTERAR SENHA</button>' +
        '</form>' +
      '</div>') +
    '</div>';

  document.getElementById('alterarSenhaForm').addEventListener('submit', handleAlterarSenha);
}

async function handleAlterarSenha(e) {
  e.preventDefault();
  var atual = document.getElementById('altSenhaAtual').value;
  var nova = document.getElementById('altSenhaNova').value;
  var confirma = document.getElementById('altSenhaConfirma').value;
  var errEl = document.getElementById('altSenhaError');
  var okEl = document.getElementById('altSenhaSuccess');
  var btn = document.getElementById('altSenhaBtn');

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (!atual || !nova || !confirma) { errEl.textContent = 'Preencha todos os campos'; errEl.classList.remove('hidden'); return; }
  if (nova.length < 6) { errEl.textContent = 'Nova senha deve ter pelo menos 6 caracteres'; errEl.classList.remove('hidden'); return; }
  if (nova !== confirma) { errEl.textContent = 'As senhas n\u00e3o conferem'; errEl.classList.remove('hidden'); return; }

  btn.disabled = true;
  btn.textContent = 'Alterando...';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conex\u00e3o.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ALTERAR SENHA'; return; }

    var user = AppState.user;
    if (!user || !user.email) { errEl.textContent = 'Usu\u00e1rio n\u00e3o autenticado'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ALTERAR SENHA'; return; }

    var reauth = await sb.auth.signInWithPassword({ email: user.email, password: atual });
    if (reauth.error) { errEl.textContent = 'Senha atual incorreta'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ALTERAR SENHA'; return; }

    var update = await sb.auth.updateUser({ password: nova });
    if (update.error) { errEl.textContent = 'Erro ao alterar senha: ' + update.error.message; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ALTERAR SENHA'; return; }

    okEl.textContent = 'Senha alterada com sucesso!';
    okEl.classList.remove('hidden');
    document.getElementById('altSenhaAtual').value = '';
    document.getElementById('altSenhaNova').value = '';
    document.getElementById('altSenhaConfirma').value = '';
    btn.disabled = false;
    btn.textContent = 'ALTERAR SENHA';
  } catch (err) {
    errEl.textContent = 'Erro ao conectar. Tente novamente.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'ALTERAR SENHA';
  }
}
