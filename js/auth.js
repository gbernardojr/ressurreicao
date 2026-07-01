function formatarCpf(v) {
  var d = v.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0,3) + '.' + d.slice(3);
  if (d.length <= 9) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6);
  return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9,11);
}

var deferredPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  mostrarLinkInstalar();
});

window.addEventListener('appinstalled', function() {
  deferredPrompt = null;
  ocultarLinkInstalar();
});

function estaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

function mostrarLinkInstalar() {
  var el = document.getElementById('installLink');
  if (el) el.classList.remove('hidden');
}

function ocultarLinkInstalar() {
  var el = document.getElementById('installLink');
  if (el) el.classList.add('hidden');
}

function handleInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choice) {
      if (choice.outcome === 'accepted') {
        console.log('App instalado');
      }
      deferredPrompt = null;
    });
  } else {
    showInstallInstructions();
  }
}

function showInstallInstructions() {
  var app = document.getElementById('app');
  var overlay = document.createElement('div');
  overlay.id = 'installOverlay';
  overlay.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:24px';
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;padding:32px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3)">' +
      '<div style="font-size:48px;margin-bottom:16px">&#128241;</div>' +
      '<h3 style="margin:0 0 8px;font-size:18px;color:#333">Instalar no dispositivo</h3>' +
      '<p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.5">' +
        (navigator.userAgent.match(/iphone|ipad|ipod/i)
          ? 'No Safari, toque no ícone <b>Compartilhar</b> <span style="font-size:20px">&#8599;</span> e depois em <b>"Adicionar à Tela de Início"</b>.'
          : 'Use o menu do navegador e selecione <b>"Adicionar à tela inicial"</b> ou <b>"Instalar aplicativo"</b>.') +
      '</p>' +
      '<button onclick="this.closest(\'#installOverlay\').remove()" style="background:#4A90D9;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:16px;cursor:pointer">Entendi</button>' +
    '</div>';
  document.body.appendChild(overlay);
}

var _isAdminLogin = false;

function toggleAdminLogin() {
  _isAdminLogin = !_isAdminLogin;
  renderLogin();
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
          (_isAdminLogin ? (
            '<div class="form-group"><div class="input-icon">' +
              '<span class="icon">&#9993;</span>' +
              '<input type="email" id="adminEmailInput" class="form-input" placeholder="Email do administrador" autocomplete="email">' +
            '</div></div>' +
            '<div class="form-group"><div class="input-icon">' +
              '<span class="icon">&#128274;</span>' +
              '<input type="password" id="senhaInput" class="form-input" placeholder="Sua senha de acesso" autocomplete="current-password">' +
            '</div></div>'
          ) : (
            '<div class="form-group"><div class="input-icon">' +
              '<span class="icon">&#128100;</span>' +
              '<input type="text" id="cpfInput" class="form-input" placeholder="000.000.000-00" maxlength="14" inputmode="numeric" autocomplete="username">' +
            '</div></div>' +
            '<div class="form-group"><div class="input-icon">' +
              '<span class="icon">&#128274;</span>' +
              '<input type="password" id="senhaInput" class="form-input" placeholder="Sua senha de acesso" autocomplete="current-password">' +
            '</div></div>'
          )) +
          '<div id="loginError" class="hidden" style="color:#D32F2F;background:#FFEBEE;padding:12px;border-radius:8px;margin-bottom:16px;font-size:14px"></div>' +
          '<button type="submit" id="loginBtn" class="btn btn-primary">' + (_isAdminLogin ? 'ENTRAR COMO ADMIN' : 'ENTRAR') + '</button>' +
        '</form>' +
        (!_isAdminLogin ? (
          '<button class="link" onclick="navigate(\'#/esqueci-senha\')" style="margin-top:4px">Esqueci minha senha</button>' +
          '<button class="link" onclick="navigate(\'#/cadastro\')">Primeiro acesso? Cadastre sua senha</button>'
        ) : '') +
        '<div style="margin-top:' + (_isAdminLogin ? '16' : '4') + 'px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.08)">' +
          '<button class="link" onclick="toggleAdminLogin()" style="font-size:13px">' +
            (_isAdminLogin ? '&#8592; Acesso do Cliente' : '&#128272; Acesso Administrativo') +
          '</button>' +
        '</div>' +
        '<div id="installArea" class="install-area' + (estaInstalado() && !deferredPrompt ? ' hidden' : '') + '">' +
          '<button class="link" id="installLink" onclick="handleInstallClick()">Instalar o sistema no dispositivo local</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  if (!_isAdminLogin) {
    document.getElementById('cpfInput').addEventListener('input', function() {
      this.value = formatarCpf(this.value);
    });
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
  } else {
    document.getElementById('loginForm').addEventListener('submit', handleAdminLogin);
  }
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

async function handleAdminLogin(e) {
  e.preventDefault();
  var email = document.getElementById('adminEmailInput').value.trim().toLowerCase();
  var senha = document.getElementById('senhaInput').value;
  var errEl = document.getElementById('loginError');
  var btn = document.getElementById('loginBtn');

  errEl.classList.add('hidden');
  if (!email || !senha) { errEl.textContent = 'Preencha todos os campos'; errEl.classList.remove('hidden'); return; }
  if (!email.includes('@')) { errEl.textContent = 'Email inválido'; errEl.classList.remove('hidden'); return; }

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conexão. Tente novamente.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENTRAR COMO ADMIN'; return; }

    var auth = await sb.auth.signInWithPassword({ email: email, password: senha });
    if (auth.error) { errEl.textContent = 'Email ou senha incorretos'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENTRAR COMO ADMIN'; return; }

    await carregarDadosCliente();

    if (AppState.isAdmin) {
      navigate('#/admin');
    } else {
      await sb.auth.signOut();
      AppState.user = null;
      AppState.isAdmin = false;
      errEl.textContent = 'Este usuário não possui acesso administrativo.';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'ENTRAR COMO ADMIN';
    }
  } catch (err) {
    errEl.textContent = 'Erro ao conectar. Tente novamente.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'ENTRAR COMO ADMIN';
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

function renderEsqueciSenha() {
  var app = document.getElementById('app');
  app.innerHTML =
    '<div class="app-bar"><button class="btn-icon" onclick="navigate(\'#/login\')">&#8592;</button><span class="title">Recuperar Senha</span></div>' +
    '<div class="main-content">' +
      '<div class="card">' +
        '<h2 style="margin-bottom:8px">Recuperar senha</h2>' +
        '<p style="color:#757575;margin-bottom:24px">Informe seu CPF para receber um link de redefinição de senha no e-mail cadastrado.</p>' +
        '<form id="esqueciSenhaForm">' +
          '<div class="form-group"><label class="form-label">CPF</label><input type="text" id="esqueciCpfInput" class="form-input" placeholder="000.000.000-00" maxlength="14" inputmode="numeric"></div>' +
          '<div id="esqueciError" class="alert alert-error hidden"></div>' +
          '<div id="esqueciSuccess" class="alert alert-success hidden"></div>' +
          '<button type="submit" id="esqueciBtn" class="btn btn-primary">ENVIAR LINK</button>' +
        '</form>' +
        '<button class="link" onclick="navigate(\'#/login\')" style="margin-top:12px">Voltar ao login</button>' +
      '</div>' +
    '</div>';

  document.getElementById('esqueciCpfInput').addEventListener('input', function() {
    this.value = formatarCpf(this.value);
  });
  document.getElementById('esqueciSenhaForm').addEventListener('submit', handleEsqueciSenha);
}

async function handleEsqueciSenha(e) {
  e.preventDefault();
  var cpf = document.getElementById('esqueciCpfInput').value.replace(/\D/g, '');
  var errEl = document.getElementById('esqueciError');
  var okEl = document.getElementById('esqueciSuccess');
  var btn = document.getElementById('esqueciBtn');

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (!cpf || cpf.length !== 11) { errEl.textContent = 'CPF inválido'; errEl.classList.remove('hidden'); return; }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    var sb = getSupabase();
    if (!sb) { errEl.textContent = 'Erro de conexão.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENVIAR LINK'; return; }

    var busca = await sb.from('clientes').select('id, email, nome').eq('cpf_cnpj', cpf).maybeSingle();
    var cliente = busca.data;

    if (!cliente) { errEl.textContent = 'CPF não encontrado'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENVIAR LINK'; return; }
    if (!cliente.email) { errEl.textContent = 'Cliente sem e-mail cadastrado. Procure a recepção.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENVIAR LINK'; return; }

    var auth = await sb.auth.resetPasswordForEmail(cliente.email, {
      redirectTo: window.location.origin + '/#/login',
    });

    if (auth.error) { errEl.textContent = 'Erro ao enviar e-mail. Tente novamente.'; errEl.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'ENVIAR LINK'; return; }

    okEl.textContent = 'Link de redefinição enviado para ' + cliente.email;
    okEl.classList.remove('hidden');
    btn.disabled = true;
    btn.textContent = 'ENVIADO';
  } catch (err) {
    errEl.textContent = 'Erro ao conectar. Tente novamente.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'ENVIAR LINK';
  }
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
