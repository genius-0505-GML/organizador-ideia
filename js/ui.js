/* Componentes visuais: modais, toast, tema e helpers de formatação. */
const UI = (() => {
  const P = { low: ['🟢', 'Baixa', 0], medium: ['🟡', 'Média', 1], high: ['🟠', 'Alta', 2], urgent: ['🔴', 'Urgente', 3] };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const d = i => new Date(i).toLocaleDateString('pt-BR');
  const t = i => new Date(i).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dt = i => `${d(i)} às ${t(i)}`;
  const pl = p => `${P[p][0]} ${P[p][1]}`;
  const popts = sel => Object.entries(P).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${v[0]} ${v[1]}</option>`).join('');

  function modal(html) {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.append(o);
    requestAnimationFrame(() => o.classList.add('show'));
    const close = () => { o.classList.remove('show'); setTimeout(() => o.remove(), 150); };
    o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-close]')) close(); });
    return { el: o, close };
  }
  function confirm({ title, text, ok, danger = true }) {
    return new Promise(res => {
      const m = modal(`<h2>${title}</h2><p>${text}</p><div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" id="ok">${ok}</button></div>`);
      m.el.addEventListener('click', e => { if (e.target === m.el || e.target.closest('[data-close]')) res(false); });
      $('#ok', m.el).onclick = () => { m.close(); res(true); };
    });
  }
  let tm;
  function toast(msg) {
    const e = $('#toast'); e.textContent = msg; e.classList.add('show');
    clearTimeout(tm); tm = setTimeout(() => e.classList.remove('show'), 2200);
  }
  function theme(v) {
    if (v) localStorage.setItem('theme', v);
    v = localStorage.getItem('theme') || 'system';
    const dark = v === 'dark' || (v === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    return v;
  }
  return { P, esc, $, d, t, dt, pl, popts, modal, confirm, toast, theme };
})();
