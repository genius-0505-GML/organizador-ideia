const CACHE = 'organizador-v1';
const FILES = ['./', 'index.html', 'css/style.css', 'js/db.js', 'js/ui.js', 'js/folders.js', 'js/notes.js', 'js/app.js', 'manifest.json', 'assets/icons/icon.svg'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => { if (e.request.method === 'GET') e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
