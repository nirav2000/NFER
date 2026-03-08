const VERSION = '3.4.8';
const THEME_KEY = 'y4.theme';
const LIB_KEY = 'y4.libraryPath';
const DEFAULT_LIB = '/data/year4_combined_50_test_library_v3.json';

function safeGet(key, fallback = '') {
  try { const v = localStorage.getItem(key); return v == null ? fallback : v; } catch { return fallback; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}

function applyTheme(theme) {
  const map = {
    default: '',
    ocean: './css/theme-ocean.css',
    paper: './css/theme-paper.css',
    split: './css/theme-split.css',
    arcade: './css/theme-arcade.css',
    zen210: './css/theme-zen210.css'
  };
  const chosen = map[theme] != null ? theme : 'default';
  const link = document.getElementById('themeStylesheet');
  if (link) link.setAttribute('href', map[chosen]);
  const sel = document.getElementById('themeSelect');
  if (sel) sel.value = chosen;
  safeSet(THEME_KEY, chosen);
}

async function loadLibrary(path = '') {
  const p = path || safeGet(LIB_KEY, DEFAULT_LIB) || DEFAULT_LIB;
  safeSet(LIB_KEY, p);
  const candidates = [p, './data/year4_combined_50_test_library_v3.json', '/data/year4_combined_50_test_library_v3.json'];
  let err;
  for (const c of [...new Set(candidates)]) {
    try {
      const res = await fetch(c, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { err = e; }
  }
  throw err || new Error('Unable to load library');
}

function showDiag(message) {
  let el = document.getElementById('fallbackDiag');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fallbackDiag';
    el.style.cssText = 'position:fixed;left:1rem;bottom:4.2rem;z-index:30;background:#111;color:#fff;padding:.5rem .7rem;border-radius:8px;max-width:80vw;font-size:.85rem';
    document.body.appendChild(el);
  }
  el.textContent = message;
}

function bindCoreFallbacks() {
  applyTheme(safeGet(THEME_KEY, 'default'));

  document.addEventListener('change', (e) => {
    if (e.target.id === 'themeSelect') applyTheme(e.target.value);
  });

  document.addEventListener('click', async (e) => {
    const t = e.target.closest('#settingsToggleBtn');
    if (t) {
      const p = document.getElementById('settingsPanel');
      if (p) p.hidden = !p.hidden;
      return;
    }
    const c = e.target.closest('#settingsCloseBtn');
    if (c) {
      const p = document.getElementById('settingsPanel');
      if (p) p.hidden = true;
      return;
    }

    const gen = e.target.closest('#generateBtn');
    if (gen) {
      e.preventDefault();
      try {
        const lib = await loadLibrary();
        const tests = lib.tests || [];
        if (!tests.length) throw new Error('No tests in library');
        const test = tests[0];
        safeSet('y4.currentTest', JSON.stringify(test));
        window.location.href = './test.html';
      } catch (err) {
        const errorEl = document.getElementById('dashboardError');
        if (errorEl) errorEl.textContent = `Fallback start failed: ${err.message}`;
        showDiag(`Fallback start failed: ${err.message}`);
      }
      return;
    }

    const rand = e.target.closest('#randomBtn');
    if (rand) {
      e.preventDefault();
      try {
        const lib = await loadLibrary();
        const tests = lib.tests || [];
        if (!tests.length) throw new Error('No tests in library');
        const test = tests[Math.floor(Math.random() * tests.length)];
        safeSet('y4.currentTest', JSON.stringify(test));
        window.location.href = './test.html';
      } catch (err) {
        const errorEl = document.getElementById('dashboardError');
        if (errorEl) errorEl.textContent = `Fallback random failed: ${err.message}`;
        showDiag(`Fallback random failed: ${err.message}`);
      }
    }
  });

  const v = document.getElementById('versionInfo');
  if (v) v.textContent = `NFER Reading Builder v${VERSION}`;
}

bindCoreFallbacks();
