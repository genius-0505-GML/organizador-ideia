/* Camada de acesso ao IndexedDB. Nenhum outro arquivo acessa o banco diretamente. */
const DB = (() => {
  let db;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const now = () => new Date().toISOString();
  const open = () => new Promise((res, rej) => {
    if (db) return res(db);
    const r = indexedDB.open('organizador_ideias', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('folders', { keyPath: 'id' });
      r.result.createObjectStore('notes', { keyPath: 'id' }).createIndex('folderId', 'folderId');
    };
    r.onsuccess = () => { db = r.result; res(db); };
    r.onerror = () => rej(r.error);
  });
  const tx = async (stores, mode, fn) => {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(stores, mode);
      const q = fn(t);
      t.oncomplete = () => res(q && q.result);
      t.onerror = () => rej(t.error);
    });
  };
  const all = s => tx(s, 'readonly', t => t.objectStore(s).getAll());
  const get = (s, id) => tx(s, 'readonly', t => t.objectStore(s).get(id));
  const put = (s, o) => tx(s, 'readwrite', t => t.objectStore(s).put(o));
  const del = (s, id) => tx(s, 'readwrite', t => t.objectStore(s).delete(id));
  const upd = async (s, id, data) => { const o = await get(s, id); if (!o) return null; const u = { ...o, ...data, id, updatedAt: now() }; await put(s, u); return u; };

  return {
    createFolder: async d => { const f = { name: '', description: '', icon: '💡', color: '#3d5a80', priority: 'medium', ...d, id: uid(), createdAt: now(), updatedAt: now() }; await put('folders', f); return f; },
    getFolders: () => all('folders'),
    getFolder: id => get('folders', id),
    updateFolder: (id, d) => upd('folders', id, d),
    deleteFolder: async id => {
      const ns = (await all('notes')).filter(n => n.folderId === id);
      for (const n of ns) await del('notes', n.id);
      await del('folders', id);
    },
    createNote: async d => { const n = { title: '', content: '', priority: 'medium', ...d, id: uid(), createdAt: now(), updatedAt: now() }; await put('notes', n); return n; },
    getNotes: () => all('notes'),
    getNote: id => get('notes', id),
    updateNote: (id, d) => upd('notes', id, d),
    deleteNote: id => del('notes', id),
    exportAll: async () => ({ folders: await all('folders'), notes: await all('notes'), exportedAt: now() }),
    importAll: async j => {
      for (const f of j.folders) if (f && f.id) await put('folders', f);
      for (const n of j.notes) if (n && n.id) await put('notes', n);
    },
    clearAll: () => tx(['folders', 'notes'], 'readwrite', t => { t.objectStore('folders').clear(); t.objectStore('notes').clear(); })
  };
})();
