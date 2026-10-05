/* Notas: card, formulário, página de leitura e exclusão. */
const Notes = (() => {
  const { esc, $ } = UI;
  const card = (n, folderName) => `<article class="card note" data-act="open-note" data-id="${n.id}">
    <h3>${esc(n.title)}</h3><p class="pv">${esc(n.content.slice(0, 160))}</p>
    <p><small class="muted">📁 ${esc(folderName || '—')}</small></p>
    <p>${UI.pl(n.priority)}</p><small class="muted">${UI.d(n.createdAt)}</small></article>`;

  async function form(note, folderId) {
    const folders = await DB.getFolders();
    if (!folders.length) { UI.toast('Crie uma pasta primeiro'); return Folders.form(); }
    return new Promise(res => {
      const edit = !!note; note = note || {};
      const sel = note.folderId || folderId || folders[0].id;
      const m = UI.modal(`<h2>${edit ? 'Editar ideia' : 'Nova ideia'}</h2><form id="nf">
        <label>Título<input name="title" required maxlength="120" value="${esc(note.title)}"></label>
        <label>Pasta<select name="folderId">${folders.map(f => `<option value="${f.id}"${f.id === sel ? ' selected' : ''}>${f.icon} ${esc(f.name)}</option>`).join('')}</select></label>
        <label>Prioridade<select name="priority">${UI.popts(note.priority || 'medium')}</select></label>
        <label>Conteúdo<textarea name="content" rows="8">${esc(note.content)}</textarea></label>
        <div class="actions"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
      m.el.addEventListener('click', e => { if (e.target === m.el || e.target.closest('[data-close]')) res(false); });
      $('#nf', m.el).onsubmit = async e => {
        e.preventDefault();
        const v = Object.fromEntries(new FormData(e.target)); v.title = v.title.trim();
        if (!v.title) return;
        edit ? await DB.updateNote(note.id, v) : await DB.createNote(v);
        m.close(); UI.toast(edit ? 'Ideia salva' : 'Ideia criada'); res(true);
      };
      $('[name=title]', m.el).focus();
    });
  }

  async function remove(id) {
    const ok = await UI.confirm({ title: 'Excluir esta ideia?', text: 'Esta ação não poderá ser desfeita.', ok: 'Excluir' });
    if (ok) { await DB.deleteNote(id); UI.toast('Ideia excluída'); }
    return ok;
  }

  async function page(id) {
    const n = await DB.getNote(id); if (!n) return null;
    const f = await DB.getFolder(n.folderId);
    return `<a class="back" href="#/folder/${n.folderId}">← Voltar</a><h1>${esc(n.title)}</h1>
      <p>📁 ${esc(f ? f.name : '—')} &nbsp; ${UI.pl(n.priority)}</p>
      <p class="muted"><small>Criada em: ${UI.dt(n.createdAt)}<br>Atualizada em: ${UI.dt(n.updatedAt)}</small></p>
      <h2>Conteúdo</h2><div class="content">${esc(n.content) || '<span class="muted">Sem conteúdo.</span>'}</div>
      <div class="row"><button class="btn primary" data-act="edit-note" data-id="${id}">Editar</button>
      <button class="btn" data-act="del-note" data-id="${id}" data-folder="${n.folderId}">Excluir</button></div>`;
  }
  return { card, form, remove, page };
})();
