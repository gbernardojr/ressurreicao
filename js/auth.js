function formatarCpf(v) {
  var d = v.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0,3) + '.' + d.slice(3);
  if (d.length <= 9) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6);
  return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9,11);
}

function renderLogin() {
  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="login-container">' +
      '<div class="login-header">' +
        '<img src="images/logo.jpg" alt="Ressurreição" class="logo" onerror="this.style.display=\'none\'">' +
        '<h1>Ressurreição</h1><p>Consulta de Mensalidades</p>' +
      '</div>' +
      '<div class="login-card">' +
        '<form id="loginForm">' +
          '<div class="form-group"><div class="input-icon">' +
            '<span class="icon">&#128100;</span>' +
            '<input type="text" id="cpfInput" class="form-input" placeholder="000.000.000-00" maxlength="14" inputmode="numeric" autocomplete="username">' +
          '</div></div>' +
          '<div class="form-group"><div class="input-icon">' +
            '<span class="icon">&#128274;</span>' +
            '<input type="password" id="senhaInput" class="form-input" placeholder="Sua senha de acesso" autocomplete="current-password">' +
          '</div></div>' +
          '<div id="loginError" class="hidden" style="color:#D32F2F;background:#FFEBEE;padding:12px;border-radius:8px;margin-bottom:16px;font-size:14px"></div>' +
          '<button type="submit" id="loginBtn" class="btn btn-primary">ENTRAR</button>' +
        '</form>' +
        '<button class="link" onclick="navigate(\'#/cadastro\')">Primeiro acesso? Cadastre sua senha</button>' +
      '</div>' +
    '</div>';

  document.getElementById('cpfInput').addEventListener('input', function() {
    this.value = formatarCpf(this.value);
  });
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  var cpf = document.getElementById('cpfInput').value.replace(/\D/g, '');
  var senha = document.getElementById('senhaInput').value;
  var errEl = document.getElementById('loginError');
  var btn = document.getElementById('loginBtn');

  errEl.classList.add('hidden');
  if (!cpf || !senha) { errEl.textContent = 'Preencha todos os campos'; errEl.classList.remove('hidden'); return; }
  if (cpf.length !== 11) { errEl.textContent = 'CPF inválido'; errEl.classList.remove('hidden'); return; }

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conexão. Tente novamente.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENTRAR'; return; }

    var busca = await sb.from('clientes').select('id, email, nome').eq('cpf_cnpj', cpf).maybeSingle();
    var cliente = busca.data;

    if (!cliente) { errEl.textContent = 'CPF não encontrado'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENTRAR'; return; }
    if (!cliente.email) { errEl.textContent = 'Cliente sem email cadastrado. Entre em contato.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENTRAR'; return; }

    var auth = await sb.auth.signInWithPassword({ email: cliente.email, password: senha });
    if (auth.error) { errEl.textContent = 'Senha incorreta'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENTRAR'; return; }

    await carregarDadosCliente();
    navigate('#/dashboard');
  } catch (err) {
    errEl.textContent = 'Erro ao conectar. Tente novamente.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'ENTRAR';
  }
}

function renderCadastro() {
  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar"><button class="btn-icon" onclick="navigate(\'#/login\')">&#8592;</button><span class="title">Primeiro Acesso</span></div>' +
    '<div class="main-content">' +
      '<h2 style="margin-bottom:8px">Cadastre sua senha</h2>' +
      '<p style="color:#757575;margin-bottom:24px">Informe seu CPF e email para criar sua conta</p>' +
      '<form id="cadastroForm">' +
        '<div class="form-group"><label style="display:block;font-size:14px;color:#757575;margin-bottom:4px">CPF</label><input type="text" id="cadCpfInput" class="form-input" placeholder="000.000.000-00" maxlength="14" inputmode="numeric"></div>' +
        '<div class="form-group"><label style="display:block;font-size:14px;color:#757575;margin-bottom:4px">Email</label><input type="email" id="cadEmailInput" class="form-input" placeholder="seu@email.com"></div>' +
        '<div class="form-group"><label style="display:block;font-size:14px;color:#757575;margin-bottom:4px">Nova Senha</label><input type="password" id="cadSenhaInput" class="form-input" placeholder="Mínimo 6 caracteres"></div>' +
        '<div class="form-group"><label style="display:block;font-size:14px;color:#757575;margin-bottom:4px">Confirmar Senha</label><input type="password" id="cadConfirmaInput" class="form-input" placeholder="Repita a senha"></div>' +
        '<div id="cadError" class="hidden" style="color:#D32F2F;background:#FFEBEE;padding:12px;border-radius:8px;margin-bottom:16px;font-size:14px"></div>' +
        '<div id="cadSuccess" class="hidden" style="color:#388E3C;background:#E8F5E9;padding:12px;border-radius:8px;margin-bottom:16px;font-size:14px"></div>' +
        '<button type="submit" id="cadBtn" class="btn btn-primary">CADASTRAR</button>' +
      '</form>' +
      '<button class="link" onclick="navigate(\'#/login\')">Já tem conta? Faça login</button>' +
    '</div>';

  document.getElementById('cadCpfInput').addEventListener('input', function() { this.value = formatarCpf(this.value); });
  document.getElementById('cadastroForm').addEventListener('submit', handleCadastro);
}

async function handleCadastro(e) {
  e.preventDefault();
  var cpf = document.getElementById('cadCpfInput').value.replace(/\D/g, '');
  var email = document.getElementById('cadEmailInput').value.trim().toLowerCase();
  var senha = document.getElementById('cadSenhaInput').value;
  var confirma = document.getElementById('cadConfirmaInput').value;
  var errEl = document.getElementById('cadError');
  var okEl = document.getElementById('cadSuccess');
  var btn = document.getElementById('cadBtn');

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (!cpf || !email || !senha || !confirma) { errEl.textContent = 'Preencha todos os campos'; errEl.classList.remove('hidden'); return; }
  if (cpf.length !== 11) { errEl.textContent = 'CPF inválido'; errEl.classList.remove('hidden'); return; }
  if (senha.length < 6) { errEl.textContent = 'Senha deve ter pelo menos 6 caracteres'; errEl.classList.remove('hidden'); return; }
  if (senha !== confirma) { errEl.textContent = 'As senhas não conferem'; errEl.classList.remove('hidden'); return; }

  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conexão.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'CADASTRAR'; return; }

    var busca = await sb.from('clientes').select('id, email, cpf_cnpj').eq('cpf_cnpj', cpf).maybeSingle();
    var cliente = busca.data;
    if (!cliente) { errEl.textContent = 'CPF não encontrado. Procure a recepção.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'CADASTRAR'; return; }
    if (cliente.email) { errEl.textContent = 'Este CPF já possui cadastro.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'CADASTRAR'; return; }

    var auth = await sb.auth.signUp({ email: email, password: senha });
    if (auth.error || !auth.data.user) { errEl.textContent = 'Erro ao criar conta.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'CADASTRAR'; return; }

    await sb.from('clientes').update({ email: email }).eq('id', cliente.id);

    okEl.textContent = 'Conta criada com sucesso! Agora você pode fazer login.';
    okEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'CADASTRAR';
  } catch(err) {
    errEl.textContent = 'Erro ao conectar. Tente novamente.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'CADASTRAR';
  }
}
