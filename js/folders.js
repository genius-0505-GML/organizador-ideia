/* Pastas: card, formulário, exclusão e página da pasta. */
const Folders = (() => {
  const { esc, $ } = UI;
  const ICONS = ['💡', '📚', '💻', '🎯', '🎨', '🏠', '💼', '🎵', '✈️', '🧪', '📝', '⭐'];
  const COLORS = ['#3d5a80', '#2a9d8f', '#e9a23b', '#d1495b', '#9b5de5', '#06a0c4', '#6a994e', '#64748b'];

  const card = (f, n) => `<article class="card folder" data-act="open-folder" data-id="${f.id}" style="--c:${f.color}">
    <div class="ficon">${f.icon}</div><h3>${esc(f.name)}</h3>
    <p class="muted">${n} ${n === 1 ? 'ideia' : 'ideias'}</p><p>${UI.pl(f.priority)}</p>
    <small class="muted">Criada em ${UI.d(f.createdAt)}</small></article>`;

  function form(f) {
    return new Promise(res => {
      const edit = !!f; f = f || {};
      const ic = f.icon || ICONS[0], co = f.color || COLORS[0];
      const m = UI.modal(`<h2>${edit ? 'Editar pasta' : 'Nova pasta'}</h2><form id="ff">
        <label>Nome<input name="name" required maxlength="60" value="${esc(f.name)}"></label>
        <label>Descrição<textarea name="description" rows="2">${esc(f.description)}</textarea></label>
        <label>Ícone<div class="picks" id="ic">${ICONS.map(i => `<button type="button" class="pick${i === ic ? ' on' : ''}" data-v="${i}">${i}</button>`).join('')}</div></label>
        <label>Cor<div class="picks" id="co">${COLORS.map(c => `<button type="button" class="pick sw${c === co ? ' on' : ''}" data-v="${c}" style="background:${c}"></button>`).join('')}</div></label>
        <label>Prioridade<select name="priority">${UI.popts(f.priority || 'medium')}</select></label>
        <div class="actions"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">${edit ? 'Salvar' : 'Criar pasta'}</button></div></form>`);
      m.el.addEventListener('click', e => {
        const p = e.target.closest('.pick');
        if (p) { p.parentElement.querySelectorAll('.pick').forEach(x => x.classList.remove('on')); p.classList.add('on'); }
        if (e.target === m.el || e.target.closest('[data-close]')) res(false);
      });
      $('#ff', m.el).onsubmit = async e => {
        e.preventDefault();
        const v = Object.fromEntries(new FormData(e.target));
        v.name = v.name.trim(); if (!v.name) return;
        v.icon = $('#ic .on', m.el).dataset.v; v.color = $('#co .on', m.el).dataset.v;
        edit ? await DB.updateFolder(f.id, v) : await DB.createFolder(v);
        m.close(); UI.toast(edit ? 'Pasta salva' : 'Pasta criada'); res(true);
      };
      $('[name=name]', m.el).focus();
    });
  }

  async function remove(id) {
    const n = (await DB.getNotes()).filter(x => x.folderId === id).length;
    const ok = await UI.confirm(n
      ? { title: 'Excluir pasta?', text: `Esta pasta possui ${n} ${n === 1 ? 'ideia' : 'ideias'}.<br>O que deseja fazer?`, ok: 'Excluir pasta e todas as ideias' }
      : { title: 'Excluir pasta?', text: 'Esta ação não poderá ser desfeita.', ok: 'Excluir' });
    if (ok) { await DB.deleteFolder(id); UI.toast('Pasta excluída'); }
    return ok;
  }

  async function page(id) {
    const f = await DB.getFolder(id); if (!f) return null;
    const ns = (await DB.getNotes()).filter(n => n.folderId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return `<a class="back" href="#/folders">← Voltar</a>
      <header class="fhead" style="--c:${f.color}"><div class="ficon">${f.icon}</div><div><h1>${esc(f.name)}</h1>
      <p class="muted">${esc(f.description)}</p><p>${UI.pl(f.priority)}</p></div></header>
      <div class="row"><button class="btn primary" data-act="new-note" data-id="${id}">+ Nova ideia</button>
      <button class="btn" data-act="edit-folder" data-id="${id}">Editar pasta</button>
      <button class="btn" data-act="del-folder" data-id="${id}">Excluir pasta</button></div>
      <h2>Ideias</h2><div class="grid">${ns.map(n => Notes.card(n, f.name)).join('') || '<div class="empty">Nenhuma ideia nesta pasta. Crie a primeira com “+ Nova ideia”.</div>'}</div>`;
  }
  return { card, form, remove, page };
})();
