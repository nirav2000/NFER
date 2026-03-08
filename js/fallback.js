const VERSION = '3.4.9';
const THEME_KEY = 'y4.theme';
const LIB_KEY = 'y4.libraryPath';
const CURRENT_TEST_KEY = 'y4.currentTest';
const DEFAULT_LIB = '/data/year4_combined_50_test_library_v3.json';

const FALLBACK_NS = '__NFER_FALLBACK_STATE__';

function readWindowState() {
  try {
    const parsed = JSON.parse(window.name || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function writeWindowState(next) {
  try {
    window.name = JSON.stringify(next || {});
  } catch (_error) {
    // Ignore window.name write errors.
  }
}

function safeGet(key, fallback = '') {
  try {
    const value = localStorage.getItem(key);
    if (value != null) return value;
  } catch (_error) {
    // continue to fallback storage
  }

  const state = readWindowState();
  const bag = state[FALLBACK_NS] || {};
  return bag[key] ?? fallback;
}

function safeSet(key, val) {
  let savedToLocal = false;
  try {
    localStorage.setItem(key, val);
    savedToLocal = true;
  } catch (_error) {
    // ignore
  }

  if (!savedToLocal) {
    const state = readWindowState();
    const bag = state[FALLBACK_NS] && typeof state[FALLBACK_NS] === 'object' ? state[FALLBACK_NS] : {};
    bag[key] = val;
    state[FALLBACK_NS] = bag;
    writeWindowState(state);
  }
}

function saveCurrentTest(test) {
  safeSet(CURRENT_TEST_KEY, JSON.stringify(test));
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
  const selected = path || safeGet(LIB_KEY, DEFAULT_LIB) || DEFAULT_LIB;
  safeSet(LIB_KEY, selected);
  const candidates = [selected, './data/year4_combined_50_test_library_v3.json', '/data/year4_combined_50_test_library_v3.json'];

  let lastErr;
  for (const candidate of [...new Set(candidates)]) {
    try {
      const res = await fetch(candidate, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Unable to load library');
}

function showDiag(message) {
  let box = document.getElementById('fallbackDiag');
  if (!box) {
    box = document.createElement('div');
    box.id = 'fallbackDiag';
    box.style.cssText = 'position:fixed;left:1rem;bottom:4.2rem;z-index:31;background:#111;color:#fff;padding:.5rem .7rem;border-radius:8px;max-width:80vw;font-size:.85rem';
    document.body.appendChild(box);
  }
  box.textContent = message;
}

function installFallbackStatus() {
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.id = 'fallbackStatusToggle';
  badge.textContent = 'Fallback status';
  badge.style.cssText = 'position:fixed;left:1rem;bottom:1rem;z-index:30;padding:.4rem .65rem;font-size:.8rem;border-radius:8px;background:#1f2937;color:#fff;border:0';

  const panel = document.createElement('div');
  panel.id = 'fallbackStatusPanel';
  panel.hidden = true;
  panel.style.cssText = 'position:fixed;left:1rem;bottom:3.1rem;z-index:30;background:#0b1220;color:#dbeafe;padding:.6rem .7rem;border-radius:8px;max-width:90vw;font-size:.8rem;line-height:1.35';

  const appReady = Boolean(window.__NFER_APP_READY);
  panel.textContent = appReady
    ? `Primary app module ready (v${VERSION}). Fallback listeners are on standby.`
    : `Primary app module not confirmed ready yet. Fallback listeners are active.`;

  badge.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });

  document.body.appendChild(badge);
  document.body.appendChild(panel);
}

function bindCoreFallbacks() {
  applyTheme(safeGet(THEME_KEY, 'default'));

  document.addEventListener('change', (event) => {
    if (event.target.id === 'themeSelect') {
      applyTheme(event.target.value);
    }
  });

  document.addEventListener('click', async (event) => {
    const settingsBtn = event.target.closest('#settingsToggleBtn');
    if (settingsBtn) {
      const panel = document.getElementById('settingsPanel');
      if (panel) panel.hidden = !panel.hidden;
      return;
    }

    const settingsCloseBtn = event.target.closest('#settingsCloseBtn');
    if (settingsCloseBtn) {
      const panel = document.getElementById('settingsPanel');
      if (panel) panel.hidden = true;
      return;
    }

    const generateBtn = event.target.closest('#generateBtn');
    if (generateBtn) {
      if (generateBtn.dataset.bound === '1') return;
      event.preventDefault();
      try {
        const library = await loadLibrary();
        const tests = library.tests || [];
        if (!tests.length) throw new Error('No tests in library');
        saveCurrentTest(tests[0]);
        window.location.href = './test.html';
      } catch (error) {
        const errorEl = document.getElementById('dashboardError');
        if (errorEl) errorEl.textContent = `Fallback start failed: ${error.message}`;
        showDiag(`Fallback start failed: ${error.message}`);
      }
      return;
    }

    const randomBtn = event.target.closest('#randomBtn');
    if (randomBtn) {
      if (randomBtn.dataset.bound === '1') return;
      event.preventDefault();
      try {
        const library = await loadLibrary();
        const tests = library.tests || [];
        if (!tests.length) throw new Error('No tests in library');
        const test = tests[Math.floor(Math.random() * tests.length)];
        saveCurrentTest(test);
        window.location.href = './test.html';
      } catch (error) {
        const errorEl = document.getElementById('dashboardError');
        if (errorEl) errorEl.textContent = `Fallback random failed: ${error.message}`;
        showDiag(`Fallback random failed: ${error.message}`);
      }
    }
  });

  const versionInfo = document.getElementById('versionInfo');
  if (versionInfo) versionInfo.textContent = `NFER Reading Builder v${VERSION}`;
}

bindCoreFallbacks();
installFallbackStatus();
