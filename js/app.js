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

function showToast(message) {
  const t = document.createElement('div');
  t.textContent = message;
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#323232;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:1000;max-width:90%';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
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
  var _dbg = [];
  try {
    var sb = getSupabase();
    if (!sb) { alert('[DEBUG] getSupabase() retornou null'); return; }
    var user = (await sb.auth.getUser()).data.user;
    if (!user) { alert('[DEBUG] getUser() retornou null'); return; }
    AppState.user = user;
    _dbg.push('1.Email: ' + user.email);

    var admin = null;
    try {
      var adminResult = await sb.from('admin_usuarios').select().eq('email', user.email).eq('ativo', true).maybeSingle();
      admin = adminResult.data;
      _dbg.push('2.Admin: ' + JSON.stringify(admin));
    } catch (e) { _dbg.push('2.Admin ERRO: ' + e.message); }
    if (admin) {
      AppState.isAdmin = true;
      AppState.adminUser = admin;
      AppState.cliente = null;
      AppState.mensalidades = [];
      var config = (await sb.from('config_banco').select().eq('ativo', true).limit(1).maybeSingle()).data;
      AppState.configBanco = config;
      alert(_dbg.join('\n'));
      return;
    }

    AppState.isAdmin = false;
    AppState.adminUser = null;

    var clienteResult = await sb.from('clientes').select().eq('email', user.email).maybeSingle();
    if (clienteResult.error) {
      _dbg.push('3.Clientes ERRO: ' + clienteResult.error.message + ' (' + clienteResult.error.code + ')');
      alert(_dbg.join('\n'));
      return;
    }
    var cliente = clienteResult.data;
    _dbg.push('3.Cliente: ' + (cliente ? cliente.nome + ' id=' + cliente.id : 'NÃO ENCONTRADO'));
    alert(_dbg.join('\n'));
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

        var jazigosSet = {};
        (AppState.mensalidades || []).forEach(function(m) {
          if (m.jazigo) jazigosSet[m.jazigo] = true;
        });
        AppState.todosJazigos = Object.keys(jazigosSet).sort();
        AppState.jazigoSelecionado = null;
      } else {
        var { data: mensalidades } = await sb.from('mensalidades').select().eq('cliente_id', cliente.id).order('vecto', { ascending: true });
        AppState.mensalidades = mensalidades || [];
      }

      var config = (await sb.from('config_banco').select().eq('ativo', true).limit(1).maybeSingle()).data;
      AppState.configBanco = config;
    }
  } catch (e) { console.error('Erro carregar dados:', e); alert('[DEBUG] ERRO carregarDadosCliente: ' + e.message); }
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
    lista = lista.filter(function(m) { return m.jazigo === AppState.jazigoSelecionado; });
  }
  return lista;
}

function navigate(hash) {
  window.location.hash = hash;
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

    if (session && !AppState.cliente && !AppState.isAdmin) {
      await carregarDadosCliente();
    }

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
      default: renderLogin();
    }
  } catch (e) {
    console.error('Erro rota:', e);
    renderLogin();
  }
}

window.addEventListener('hashchange', handleRoute);
