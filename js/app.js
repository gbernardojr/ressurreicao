const AppState = {
  user: null,
  cliente: null,
  mensalidades: [],
  todosJazigos: [],
  jazigoSelecionado: null,
  configBanco: null,
  falecidos: [],
  isAdmin: false,
  adminUser: null,
};

var AVISO_BOLETO_COMPENSACAO = 'Pagamento por boleto pode levar até 3 dias úteis para serem compensados. Assim, uma pendência financeira pode continuar aparecendo durante este período.';

function htmlAvisoBoleto() {
  return '<div style="background:#E3F2FD;color:#1565C0;border-left:4px solid #1565C0;border-radius:8px;padding:12px;margin-bottom:12px;font-size:13px;line-height:1.4">' + AVISO_BOLETO_COMPENSACAO + '</div>';
}

function normalizarJazigo(valor) {
  return String(valor == null ? '' : valor).trim().toUpperCase().replace(/[\s-]+/g, '');
}

function extrairJazigos(mensalidades) {
  var mapa = {};
  (mensalidades || []).forEach(function(m) {
    var original = m.jazigo == null ? '' : String(m.jazigo).trim();
    if (!original) return;
    var chave = normalizarJazigo(original);
    if (!mapa[chave]) mapa[chave] = original;
  });
  return Object.keys(mapa).sort().map(function(k) { return mapa[k]; });
}

function showToast(message) {
  const t = document.createElement('div');
  t.textContent = message;
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#323232;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:1000;max-width:90%';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Toggle visibilidade de senha (olhinho)
function toggleSenha(id, btn) {
  var input = document.getElementById(id);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.title = 'Ocultar senha';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
    btn.title = 'Mostrar senha';
  }
}

// Helper para gerar HTML de campo de senha com botão de visualização
function inputSenhaHtml(id, placeholder, autocomplete) {
  autocomplete = autocomplete || 'current-password';
  return '<div class="password-wrapper">' +
    '<input type="password" id="' + id + '" class="form-input" placeholder="' + placeholder + '" autocomplete="' + autocomplete + '">' +
    '<button type="button" class="btn-toggle-senha" onclick="toggleSenha(\'' + id + '\', this)" title="Mostrar senha">👁️</button>' +
    '</div>';
}

function parseDateSafe(s) {
  if (!s) return null;
  var parts = s.split('-');
  if (parts.length === 3) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(s) {
  if (!s) return '-';
  try { var d = parseDateSafe(s); if (!d) return '-'; return d.toLocaleDateString('pt-BR'); } catch(e) { return '-'; }
}

function formatDateBr(s) {
  if (!s) return '-';
  try {
    var d = parseDateSafe(s);
    if (!d) return '-';
    var dia = String(d.getDate()).padStart(2, '0');
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var ano = d.getFullYear();
    return dia + '/' + mes + '/' + ano;
  } catch(e) { return '-'; }
}

function formatCurrency(v) {
  const n = Number(v);
  return isNaN(n) ? 'R$ 0,00' : 'R$ ' + n.toFixed(2).replace('.', ',');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
  var el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

async function carregarDadosCliente() {
  try {
    var sb = getSupabase();
    if (!sb) return;
    var user = (await sb.auth.getUser()).data.user;
    if (!user) return;
    AppState.user = user;

    var admin = null;
    try {
      if (user.email) {
        var adminByEmail = await sb.from('admin_usuarios').select().eq('email', user.email).eq('ativo', true).maybeSingle();
        if (adminByEmail && adminByEmail.data) admin = adminByEmail.data;
      }

      if (!admin) {
        var cpfCnpj = null;
        try {
          var authCliente = await sb.from('clientes').select('cpf_cnpj').eq('email', user.email).maybeSingle();
          cpfCnpj = authCliente.data ? authCliente.data.cpf_cnpj : null;
        } catch (e) {}

        // Se não encontrar por email e o email for um email alternativo, extrair CPF do email
        if (!cpfCnpj && user.email && user.email.endsWith('@sememail.com.br')) {
          cpfCnpj = user.email.replace('@sememail.com.br', '');
        }

        if (cpfCnpj) {
          var adminResult = await sb.from('admin_usuarios').select().eq('cpf', cpfCnpj).eq('ativo', true).maybeSingle();
          if (adminResult && adminResult.data) admin = adminResult.data;
        }
      }
    } catch (e) { console.error('Erro query admin:', e); }

    if (admin) {
      AppState.isAdmin = true;
      AppState.adminUser = admin;
    } else {
      AppState.isAdmin = false;
      AppState.adminUser = null;
    }

    try {
      var configResult = await sb.from('config_banco').select().eq('ativo', true).limit(1).maybeSingle();
      AppState.configBanco = configResult ? configResult.data : null;
    } catch (e) {}

    // Tentar buscar cliente por email, ou por CPF se o email for um email alternativo
    var clienteResult = await sb.from('clientes').select().eq('email', user.email).maybeSingle();
    var cliente = clienteResult ? clienteResult.data : null;
    
    // Se não encontrar por email e o email for um email alternativo (cpf@sememail.com.br),
    // tentar buscar pelo CPF
    if (!cliente && user.email && user.email.endsWith('@sememail.com.br')) {
      var cpf = user.email.replace('@sememail.com.br', '');
      var clienteByCpf = await sb.from('clientes').select().eq('cpf_cnpj', cpf).maybeSingle();
      cliente = clienteByCpf ? clienteByCpf.data : null;
    }
    
    AppState.cliente = cliente;

    if (cliente) {
      var cpfCnpj = cliente.cpf_cnpj;
      AppState.todosJazigos = [];
      AppState.jazigoSelecionado = null;

      if (cpfCnpj) {
        var { data: todos } = await sb.from('clientes').select('id, codigo_propri').eq('cpf_cnpj', cpfCnpj);
        var todosIds = (todos || []).map(function(c) { return c.id; });
        if (todosIds.length <= 1) todosIds = [cliente.id];
        var { data: mensalidades } = await sb.from('mensalidades')
          .select()
          .in('cliente_id', todosIds)
          .order('vecto', { ascending: true });
        AppState.mensalidades = mensalidades || [];
        AppState.todosJazigos = extrairJazigos(AppState.mensalidades);
        AppState.jazigoSelecionado = null;
      } else {
        var { data: mensalidades } = await sb.from('mensalidades').select().eq('cliente_id', cliente.id).order('vecto', { ascending: true });
        AppState.mensalidades = mensalidades || [];
      }
    } else {
      // Se não encontrou cliente por email, tentar encontrar por CPF (caso de email alternativo)
      if (user.email && user.email.endsWith('@sememail.com.br')) {
        var cpf = user.email.replace('@sememail.com.br', '');
        var { data: todos } = await sb.from('clientes').select('id, codigo_propri').eq('cpf_cnpj', cpf);
        var todosIds = (todos || []).map(function(c) { return c.id; });
        if (todosIds.length > 0) {
          var { data: mensalidades } = await sb.from('mensalidades')
            .select()
            .in('cliente_id', todosIds)
            .order('vecto', { ascending: true });
          AppState.mensalidades = mensalidades || [];
          AppState.todosJazigos = extrairJazigos(AppState.mensalidades);
          AppState.jazigoSelecionado = null;
        }
      } else {
        AppState.mensalidades = [];
        AppState.todosJazigos = [];
        AppState.jazigoSelecionado = null;
      }
    }
  } catch (e) { console.error('Erro carregar dados:', e); }
}

async function carregarFalecidos() {
  try {
    var sb = getSupabase();
    if (!sb || !AppState.cliente) return;
    var falecidos = (await sb.from('falecidos').select().eq('cliente_id', AppState.cliente.id).order('nome', { ascending: true })).data;
    AppState.falecidos = falecidos || [];
  } catch (e) { console.error('Erro carregar falecidos:', e); }
}

function selecionarJazigo(jazigo) {
  AppState.jazigoSelecionado = jazigo || null;
  var hash = window.location.hash.replace('#', '') || '/dashboard';
  if (hash === '/dashboard') renderDashboard();
  else if (hash === '/mensalidades') renderMensalidades();
}

function getMensalidadesFiltradas() {
  var lista = AppState.mensalidades;
  if (AppState.jazigoSelecionado) {
    var alvo = normalizarJazigo(AppState.jazigoSelecionado);
    lista = lista.filter(function(m) { return normalizarJazigo(m.jazigo) === alvo; });
  }
  return lista;
}

function navigate(hash) {
  if (window.location.hash === hash) {
    // Mesmo hash não dispara hashchange; renderiza direto para o caso
    // de a tela estar dessincronizada com a URL (ex.: voltar não respondia)
    handleRoute();
  } else {
    window.location.hash = hash;
  }
}

async function handleRoute() {
  try {
    var hash = window.location.hash || '#/login';
    var sb = getSupabase();
    var session = null;
    if (sb) {
      var r = await sb.auth.getSession();
      session = r.data ? r.data.session : null;
    }

    if (!session && hash !== '#/login' && hash !== '#/cadastro' && hash !== '#/esqueci-senha' && hash !== '#/admin-login' && !hash.startsWith('#/redefinir-senha')) {
      navigate('#/login');
      return;
    }

    if (session && (!AppState.user || (!AppState.cliente && !AppState.isAdmin))) {
      await carregarDadosCliente();
    }

    // Se a URL mudou durante os awaits (sessão/carregamento de dados),
    // o handleRoute mais recente é quem deve renderizar; descarta este.
    var hashAtual = window.location.hash || '#/login';
    if (hashAtual !== hash) return;

    var parts = hash.replace('#', '').split('?');
    var route = parts[0].replace(/\/$/, '');

    switch (route) {
      case '/login': renderLogin(); break;
      case '/cadastro': renderCadastro(); break;
      case '/esqueci-senha': renderEsqueciSenha(); break;
      case '/redefinir-senha': renderRedefinirSenha(); break;
      case '/admin-login': renderAdminLogin(); break;
      case '/dashboard': renderDashboard(); break;
      case '/dados_pessoais': renderDadosPessoais(); break;
      case '/falecidos': renderFalecidos(); break;
      case '/falecido': renderFalecidoDetalhe(parts[1] ? parts[1].replace('id=', '') : null); break;
      case '/mensalidades': renderMensalidades(); break;
      case '/boleto': renderBoleto(parts[1] ? parts[1].replace('id=', '') : null); break;
      case '/admin': if (AppState.isAdmin) renderAdminDashboard(); else navigate('#/login'); break;
      case '/admin-alterar-senha': if (AppState.isAdmin) renderAdminAlterarSenha(); else navigate('#/login'); break;
      default: renderLogin();
    }
  } catch (e) {
    console.error('Erro rota:', e);
    renderLogin();
  }
}

window.addEventListener('hashchange', handleRoute);
