/* Inicialização, rotas (hash), Home, Prioridades, Configurações e eventos globais. */
const { esc, $ } = UI;
const view = $('#view');
const F = { q: '', folder: 'all', prio: 'all', sort: 'recent' };
let cache = { fs: [], ns: [] };
const rec = (a, b) => b.createdAt.localeCompare(a.createdAt);
const SORTS = {
  recent: ['Mais recentes', rec],
  old: ['Mais antigas', (a, b) => a.createdAt.localeCompare(b.createdAt)],
  upd: ['Última atualização', (a, b) => b.updatedAt.localeCompare(a.updatedAt)],
  prio: ['Prioridade', (a, b) => UI.P[b.priority][2] - UI.P[a.priority][2] || rec(a, b)],
  az: ['Título A-Z', (a, b) => a.title.localeCompare(b.title, 'pt-BR')],
  za: ['Título Z-A', (a, b) => b.title.localeCompare(a.title, 'pt-BR')]
};
const fname = id => (cache.fs.find(f => f.id === id) || {}).name || '';
const prioList = ns => ns.filter(n => UI.P[n.priority][2] >= 2).sort(SORTS.prio[1]);

function listHtml() {
  const q = F.q.trim().toLowerCase();
  const r = cache.ns.filter(n =>
    (F.folder === 'all' || n.folderId === F.folder) && (F.prio === 'all' || n.priority === F.prio) &&
    (!q || (n.title + ' ' + n.content + ' ' + fname(n.folderId)).toLowerCase().includes(q))
  ).sort(SORTS[F.sort][1]);
  return r.map(n => Notes.card(n, fname(n.folderId))).join('') ||
    `<div class="empty">${cache.ns.length ? 'Nenhuma ideia encontrada com esses filtros.' : 'Ainda não há ideias. Crie uma pasta e anote a primeira.'}</div>`;
}

function activity() {
  const ev = [];
  cache.fs.forEach(f => { ev.push([f.createdAt, `Criou pasta "${f.name}"`]); if (f.updatedAt !== f.createdAt) ev.push([f.updatedAt, `Atualizou pasta "${f.name}"`]); });
  cache.ns.forEach(n => { ev.push([n.createdAt, `Criou "${n.title}"`]); if (n.updatedAt !== n.createdAt) ev.push([n.updatedAt, `Atualizou "${n.title}"`]); });
  const today = new Date().toDateString();
  return ev.sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8).map(([d, t]) =>
    `<div class="act">${new Date(d).toDateString() === today ? UI.t(d) : UI.d(d)} — ${esc(t)}</div>`).join('') || '<p class="muted">Sem atividade ainda.</p>';
}

async function load() { const [fs, ns] = await Promise.all([DB.getFolders(), DB.getNotes()]); cache = { fs, ns }; }

async function home() {
  await load();
  const today = new Date().toDateString();
  const st = [[cache.ns.length, 'Ideias'], [cache.fs.length, 'Pastas'], [prioList(cache.ns).length, 'Prioridades'], [cache.ns.filter(n => new Date(n.createdAt).toDateString() === today).length, 'Criadas hoje']];
  const pr = prioList(cache.ns).slice(0, 4);
  return `<h1>Minhas ideias</h1>
    <div class="row"><input id="q" class="search" type="search" placeholder="🔎 Pesquisar ideias..." value="${esc(F.q)}">
    <button class="btn primary" data-act="new-note">+ Nova ideia</button><button class="btn" data-act="new-folder">+ Nova pasta</button></div>
    <div class="stats">${st.map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
    <h2>⭐ Prioridades</h2><div class="grid">${pr.map(n => Notes.card(n, fname(n.folderId))).join('') || '<div class="empty">Ideias com prioridade Alta ou Urgente aparecem aqui.</div>'}</div>
    <h2>Ideias</h2><div class="row">
      ${['all', 'low', 'medium', 'high', 'urgent'].map(k => `<button class="btn chip${F.prio === k ? ' on' : ''}" data-act="prio" data-v="${k}">${k === 'all' ? 'Todas' : UI.pl(k)}</button>`).join('')}
    </div><div class="row">
      <select id="fsel"><option value="all">Todas as pastas</option>${cache.fs.map(f => `<option value="${f.id}"${F.folder === f.id ? ' selected' : ''}>${f.icon} ${esc(f.name)}</option>`).join('')}</select>
      <label class="muted">Ordenar por:</label><select id="sort">${Object.entries(SORTS).map(([k, v]) => `<option value="${k}"${F.sort === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select>
    </div><div class="grid" id="list">${listHtml()}</div>
    <h2>Atividade recente</h2><div>${activity()}</div>`;
}

async function foldersPage() {
  await load();
  return `<h1>Pastas</h1><div class="row"><button class="btn primary" data-act="new-folder">+ Nova pasta</button></div>
    <div class="grid">${cache.fs.sort(rec).map(f => Folders.card(f, cache.ns.filter(n => n.folderId === f.id).length)).join('') || '<div class="empty">Nenhuma pasta ainda. Crie a primeira com “+ Nova pasta”.</div>'}</div>`;
}

async function priorities() {
  await load();
  return `<h1>⭐ Prioridades</h1><p class="muted">Ideias urgentes e de prioridade alta, das mais críticas às mais recentes.</p>
    <div class="grid">${prioList(cache.ns).map(n => Notes.card(n, fname(n.folderId))).join('') || '<div class="empty">Nenhuma ideia prioritária.</div>'}</div>`;
}

function settings() {
  const t = UI.theme();
  return `<h1>Configurações</h1><h2>Tema</h2><div class="row">
    ${[['light', 'Claro'], ['dark', 'Escuro'], ['system', 'Sistema']].map(([v, l]) => `<label><input type="radio" name="theme" value="${v}"${t === v ? ' checked' : ''} style="width:auto"> ${l}</label>`).join(' &nbsp; ')}</div>
    <h2>Dados</h2><div class="row"><button class="btn" data-act="export">Exportar dados</button>
    <button class="btn" data-act="import">Importar dados</button><input type="file" id="file" accept=".json,application/json" hidden></div>
    <div class="row"><button class="btn danger" data-act="clear">Limpar todos os dados</button></div>`;
}

async function render() {
  const [r, id] = (location.hash.slice(2) || 'home').split('/');
  const routes = { home, folders: foldersPage, priorities, settings, folder: () => Folders.page(id), note: () => Notes.page(id) };
  const html = routes[r] ? await routes[r]() : null;
  if (html == null) { location.hash = '#/home'; return; }
  view.innerHTML = html; view.classList.remove('fade'); void view.offsetWidth; view.classList.add('fade');
  const sec = r === 'folder' || r === 'note' ? 'folders' : r;
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === sec));
  window.scrollTo(0, 0);
}
const refreshList = () => { $('#list').innerHTML = listHtml(); };

async function doImport(file) {
  try {
    const j = JSON.parse(await file.text());
    if (!Array.isArray(j.folders) || !Array.isArray(j.notes)) throw 0;
    const ok = await UI.confirm({ title: 'Importar dados', text: `O arquivo contém ${j.folders.length} pastas e ${j.notes.length} ideias. Os dados serão mesclados aos existentes.`, ok: 'Importar', danger: false });
    if (ok) { await DB.importAll(j); UI.toast('Dados importados'); render(); }
  } catch { UI.toast('Arquivo inválido: use um backup exportado por este app'); }
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const { act, id } = b.dataset;
  switch (act) {
    case 'new-folder': if (await Folders.form()) render(); break;
    case 'edit-folder': if (await Folders.form(await DB.getFolder(id))) render(); break;
    case 'del-folder': if (await Folders.remove(id)) location.hash = '#/folders'; break;
    case 'open-folder': location.hash = '#/folder/' + id; break;
    case 'new-note': if (await Notes.form(null, id)) render(); break;
    case 'edit-note': if (await Notes.form(await DB.getNote(id))) render(); break;
    case 'del-note': if (await Notes.remove(id)) location.hash = '#/folder/' + b.dataset.folder; break;
    case 'open-note': location.hash = '#/note/' + id; break;
    case 'prio': F.prio = b.dataset.v; document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b)); refreshList(); break;
    case 'export': {
      const data = await DB.exportAll();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `organizador-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href); break;
    }
    case 'import': $('#file').click(); break;
    case 'clear':
      if (await UI.confirm({ title: 'ATENÇÃO', text: 'Isso apagará todas as pastas e ideias.<br>Esta ação não poderá ser desfeita.', ok: 'Apagar tudo' })) { await DB.clearAll(); UI.toast('Todos os dados foram apagados'); render(); }
  }
});
document.addEventListener('input', e => { if (e.target.id === 'q') { F.q = e.target.value; refreshList(); } });
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fsel') { F.folder = t.value; refreshList(); }
  else if (t.id === 'sort') { F.sort = t.value; refreshList(); }
  else if (t.name === 'theme') UI.theme(t.value);
  else if (t.id === 'file' && t.files[0]) { doImport(t.files[0]); t.value = ''; }
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => UI.theme());
window.addEventListener('hashchange', render);
UI.theme(); render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('service-worker.js');
