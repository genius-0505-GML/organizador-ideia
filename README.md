# Organizador de Ideias

App pessoal feito só com HTML, CSS e JavaScript puro. Dados salvos no IndexedDB do navegador (banco `organizador_ideias`).

## Como usar
- Abra `index.html` direto no navegador (o app funciona; instalação PWA e modo offline não funcionam em `file://`).
- Para instalar como app/offline, sirva por HTTP (opcional):
  ```bash
  python3 -m http.server 8000
  ```
  e acesse `http://localhost:8000`. O projeto não depende de Python.

## Estrutura
- `js/db.js` – único acesso ao IndexedDB (CRUD de pastas e notas, exportar/importar)
- `js/folders.js`, `js/notes.js` – telas e formulários
- `js/ui.js` – modais, toast, tema
- `js/app.js` – rotas (`#/home`, `#/folders`, `#/folder/ID`, `#/note/ID`, `#/priorities`, `#/settings`), Home e eventos

## Backup
Configurações → Exportar dados gera `organizador-backup-AAAA-MM-DD.json`. Importar mescla com os dados existentes.
