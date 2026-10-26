const express = require('express');
const fb = require('./database/firebird');

const DIA_NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const parseFirebirdTime = (timeValue) => {
  if (!timeValue) return null;
  if (typeof timeValue === 'object') {
    const h = String(timeValue.Hours != null ? timeValue.Hours : 0).padStart(2, '0');
    const m = String(timeValue.Minutes != null ? timeValue.Minutes : 0).padStart(2, '0');
    return `${h}:${m}`;
  }
  if (typeof timeValue === 'string') {
    if (timeValue.startsWith('/Date(')) {
      const match = timeValue.match(/\/Date\((-?\d+)\)\//);
      if (match) {
        const d = new Date(parseInt(match[1]));
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    const match = timeValue.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      return `${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')}`;
    }
  }
  return String(timeValue);
};

const esc = (s) => String(s).replace(/'/g, "''");

const router = express.Router();

router.get('/', (req, res) => {
  res.send(html);
});

router.get('/api/schedule', async (req, res) => {
  try {
    const rows = await fb.query(`
      SELECT ID, DIA_SEMANA, HORA, ATIVO
      FROM CONFIG_SINCRONIZACAO
      ORDER BY DIA_SEMANA, HORA
    `);
    res.json(rows.map(r => ({
      id: r.ID,
      dia_semana: r.DIA_SEMANA,
      dia_nome: DIA_NOMES[r.DIA_SEMANA] || 'Desconhecido',
      hora: parseFirebirdTime(r.HORA),
      ativo: r.ATIVO === 'S'
    })));
  } catch (e) {
    if (e.message && e.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Tabela CONFIG_SINCRONIZACAO não existe no Firebird. Execute criar_tabela_schedule.sql primeiro.' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.post('/api/schedule', async (req, res) => {
  try {
    const { dia_semana, hora, ativo } = req.body;
    if (dia_semana == null || !hora) {
      return res.status(400).json({ error: 'dia_semana e hora são obrigatórios' });
    }
    const d = parseInt(dia_semana);
    if (d < 0 || d > 6) {
      return res.status(400).json({ error: 'dia_semana deve ser 0-6' });
    }
    if (!/^\d{1,2}:\d{2}$/.test(hora)) {
      return res.status(400).json({ error: 'hora deve estar no formato HH:MM' });
    }
    const sql = `INSERT INTO CONFIG_SINCRONIZACAO (DIA_SEMANA, HORA, ATIVO) VALUES (${d}, '${esc(hora)}:00', '${ativo !== false ? 'S' : 'N'}')`;
    await fb.executeNonQuery(sql);
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/api/schedule/:id', async (req, res) => {
  try {
    const { dia_semana, hora, ativo } = req.body;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    if (dia_semana == null || !hora) {
      return res.status(400).json({ error: 'dia_semana e hora são obrigatórios' });
    }
    const d = parseInt(dia_semana);
    if (d < 0 || d > 6) return res.status(400).json({ error: 'dia_semana deve ser 0-6' });
    if (!/^\d{1,2}:\d{2}$/.test(hora)) return res.status(400).json({ error: 'hora deve estar no formato HH:MM' });
    const sql = `UPDATE CONFIG_SINCRONIZACAO SET DIA_SEMANA=${d}, HORA='${esc(hora)}:00', ATIVO='${ativo !== false ? 'S' : 'N'}' WHERE ID=${id}`;
    await fb.executeNonQuery(sql);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/api/schedule/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    await fb.executeNonQuery(`DELETE FROM CONFIG_SINCRONIZACAO WHERE ID=${id}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const start = (port) => {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  app.listen(port, () => {
    console.log(`🌐 Interface de agendamento: http://localhost:${port}`);
  });
};

module.exports = { start };

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agendamento - Sincronização</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
.container { max-width: 800px; margin: 0 auto; }
h1 { font-size: 1.5rem; margin-bottom: 8px; color: #1a1a2e; }
.subtitle { color: #666; margin-bottom: 24px; font-size: 0.9rem; }
.card { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1); padding: 20px; margin-bottom: 20px; }
.card h2 { font-size: 1.1rem; margin-bottom: 16px; color: #1a1a2e; }
.form-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: .8rem; color: #666; font-weight: 600; }
.form-group select, .form-group input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; }
.form-group select:focus, .form-group input:focus { outline: none; border-color: #4a6cf7; }
.btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: .9rem; cursor: pointer; font-weight: 600; }
.btn-primary { background: #4a6cf7; color: #fff; }
.btn-primary:hover { background: #3b5de7; }
.btn-danger { background: #e74c3c; color: #fff; }
.btn-danger:hover { background: #c0392b; }
.btn-sm { padding: 4px 10px; font-size: .8rem; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 8px; font-size: .8rem; color: #666; border-bottom: 2px solid #eee; font-weight: 600; }
td { padding: 10px 8px; border-bottom: 1px solid #f0f0f0; font-size: .9rem; }
td.actions { white-space: nowrap; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: .75rem; font-weight: 600; }
.badge-active { background: #e8f5e9; color: #2e7d32; }
.badge-inactive { background: #fbe9e7; color: #c62828; }
.empty { text-align: center; padding: 40px 20px; color: #999; }
.error-msg { background: #fbe9e7; color: #c62828; padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; font-size: .9rem; }
.success-msg { background: #e8f5e9; color: #2e7d32; padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; font-size: .9rem; }
.inline-edit { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.inline-edit select, .inline-edit input[type=time] { padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: .85rem; }
.inline-edit .btn { padding: 4px 10px; font-size: .8rem; }
@media (max-width: 600px) {
  .form-row { flex-direction: column; }
  table { font-size: .85rem; }
  th:nth-child(2), td:nth-child(2) { display: none; }
}
</style>
</head>
<body>
<div class="container">
  <h1>Agendamento da Sincronização</h1>
  <p class="subtitle">Configure os dias e horários para sincronização Firebird &rarr; Supabase</p>

  <div id="messages"></div>

  <div class="card">
    <h2>Novo Horário</h2>
    <div class="form-row">
      <div class="form-group">
        <label for="newDay">Dia da Semana</label>
        <select id="newDay">
          <option value="0">Domingo</option>
          <option value="1" selected>Segunda</option>
          <option value="2">Terça</option>
          <option value="3">Quarta</option>
          <option value="4">Quinta</option>
          <option value="5">Sexta</option>
          <option value="6">Sábado</option>
        </select>
      </div>
      <div class="form-group">
        <label for="newTime">Horário</label>
        <input type="time" id="newTime" value="08:00">
      </div>
      <div class="form-group">
        <label for="newActive">Ativo</label>
        <select id="newActive" style="width:80px">
          <option value="1">Sim</option>
          <option value="0">Não</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="addSchedule()">Adicionar</button>
    </div>
  </div>

  <div class="card">
    <h2>Horários Cadastrados</h2>
    <table>
      <thead>
        <tr>
          <th>Dia</th>
          <th>Horário</th>
          <th>Ativo</th>
          <th style="width:120px">Ações</th>
        </tr>
      </thead>
      <tbody id="scheduleBody">
      </tbody>
    </table>
    <div id="emptyState" class="empty" style="display:none">
      Nenhum horário cadastrado.
    </div>
  </div>
</div>

<script>
const DIA_NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
let editingId = null;

const msg = (text, type) => {
  const el = document.getElementById('messages');
  el.innerHTML = '<div class="' + type + '-msg">' + text + '</div>';
  setTimeout(() => el.innerHTML = '', 5000);
};

const load = async () => {
  try {
    const r = await fetch('/api/schedule');
    if (r.status === 404) {
      document.getElementById('scheduleBody').innerHTML = '';
      document.getElementById('emptyState').style.display = '';
      document.getElementById('emptyState').textContent = 'Tabela CONFIG_SINCRONIZACAO não existe. Execute criar_tabela_schedule.sql primeiro.';
      return;
    }
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    const tbody = document.getElementById('scheduleBody');
    const empty = document.getElementById('emptyState');
    if (!data.length) {
      tbody.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = data.map(item => {
      if (editingId === item.id) {
        return '<tr><td colspan="4"><div class="inline-edit">' +
          '<select id="editDay">' + DIA_NOMES.map((n, i) => '<option value="' + i + '"' + (i === item.dia_semana ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
          '<input type="time" id="editTime" value="' + item.hora + '">' +
          '<select id="editActive"><option value="1"' + (item.ativo ? ' selected' : '') + '>Sim</option><option value="0"' + (!item.ativo ? ' selected' : '') + '>Não</option></select>' +
          '<button class="btn btn-primary btn-sm" onclick="saveEdit(' + item.id + ')">Salvar</button>' +
          '<button class="btn btn-sm" onclick="cancelEdit()">Cancelar</button>' +
          '</div></td></tr>';
      }
      return '<tr>' +
        '<td>' + item.dia_nome + '</td>' +
        '<td>' + item.hora + '</td>' +
        '<td><span class="badge ' + (item.ativo ? 'badge-active' : 'badge-inactive') + '">' + (item.ativo ? 'Ativo' : 'Inativo') + '</span></td>' +
        '<td class="actions">' +
        '<button class="btn btn-primary btn-sm" onclick="editSchedule(' + item.id + ')">Editar</button> ' +
        '<button class="btn btn-danger btn-sm" onclick="deleteSchedule(' + item.id + ')">Excluir</button>' +
        '</td></tr>';
    }).join('');
  } catch (e) {
    msg('Erro ao carregar: ' + e.message, 'error');
  }
};

const addSchedule = async () => {
  const dia_semana = parseInt(document.getElementById('newDay').value);
  const hora = document.getElementById('newTime').value;
  const ativo = document.getElementById('newActive').value === '1';
  try {
    const r = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dia_semana, hora, ativo })
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error || 'Erro ao adicionar');
    }
    msg('Horário adicionado com sucesso!', 'success');
    load();
  } catch (e) {
    msg('Erro: ' + e.message, 'error');
  }
};

const editSchedule = (id) => {
  editingId = id;
  load();
};

const cancelEdit = () => {
  editingId = null;
  load();
};

const saveEdit = async (id) => {
  const dia_semana = parseInt(document.getElementById('editDay').value);
  const hora = document.getElementById('editTime').value;
  const ativo = document.getElementById('editActive').value === '1';
  try {
    const r = await fetch('/api/schedule/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dia_semana, hora, ativo })
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error || 'Erro ao editar');
    }
    editingId = null;
    msg('Horário atualizado!', 'success');
    load();
  } catch (e) {
    msg('Erro: ' + e.message, 'error');
  }
};

const deleteSchedule = async (id) => {
  if (!confirm('Excluir este horário?')) return;
  try {
    const r = await fetch('/api/schedule/' + id, { method: 'DELETE' });
    if (!r.ok) throw new Error('Erro ao excluir');
    msg('Horário excluído!', 'success');
    load();
  } catch (e) {
    msg('Erro: ' + e.message, 'error');
  }
};

load();
</script>
</body>
</html>`;
