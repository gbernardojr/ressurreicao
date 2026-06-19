const AppState = {
  user: null,
  cliente: null,
  mensalidades: [],
  configBanco: null,
};

function showToast(message) {
  const t = document.createElement('div');
  t.textContent = message;
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#323232;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:1000;max-width:90%';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function formatDate(s) {
  if (!s) return '-';
  try { const d = new Date(s); return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR'); } catch(e) { return '-'; }
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

    var cliente = (await sb.from('clientes').select().eq('email', user.email).maybeSingle()).data;
    AppState.cliente = cliente;

    if (cliente) {
      var mensalidades = (await sb.from('mensalidades').select().eq('cliente_id', cliente.id).order('vecto', { ascending: true })).data;
      AppState.mensalidades = mensalidades || [];
      var config = (await sb.from('config_banco').select().eq('ativo', true).maybeSingle()).data;
      AppState.configBanco = config;
    }
  } catch (e) { console.error('Erro carregar dados:', e); }
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

    if (!session && hash !== '#/login' && hash !== '#/cadastro') {
      navigate('#/login');
      return;
    }

    if (session && !AppState.cliente) {
      await carregarDadosCliente();
    }

    var parts = hash.replace('#', '').split('?');
    var route = parts[0].replace(/\/$/, '');

    switch (route) {
      case '/login': renderLogin(); break;
      case '/cadastro': renderCadastro(); break;
      case '/dashboard': renderDashboard(); break;
      case '/mensalidades': renderMensalidades(); break;
      case '/boleto': renderBoleto(parts[1] ? parts[1].replace('id=', '') : null); break;
      default: renderLogin();
    }
  } catch (e) {
    console.error('Erro rota:', e);
    renderLogin();
  }
}

window.addEventListener('hashchange', handleRoute);
