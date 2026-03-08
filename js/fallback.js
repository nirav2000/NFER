import { buildTestUrl, resolveTestById } from './testResolver.js?v=3.4.14';
const VERSION = '3.4.14';
const THEME_KEY = 'y4.theme';
const LIB_KEY = 'y4.libraryPath';
const CURRENT_TEST_KEY = 'y4.currentTest';
const DEFAULT_LIB = './data/year4_combined_50_test_library_v3.json';
const FALLBACK_NS = '__NFER_FALLBACK_STATE__';

const stepLogs = [];
function logStep(step, detail = '') {
  const line = `[${new Date().toISOString()}] ${step}${detail ? ` :: ${detail}` : ''}`;
  stepLogs.push(line);
  if (stepLogs.length > 60) stepLogs.shift();
  const pre = document.getElementById('fallbackStatusOutput');
  if (pre) pre.textContent = stepLogs.join('\n');
}

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
  } catch (_error) {}
}

function safeGet(key, fallback = '') {
  try {
    const value = localStorage.getItem(key);
    if (value != null) return value;
  } catch (_error) {}
  const state = readWindowState();
  const bag = state[FALLBACK_NS] || {};
  return bag[key] ?? fallback;
}

function safeSet(key, val) {
  let savedLocal = false;
  try {
    localStorage.setItem(key, val);
    savedLocal = true;
  } catch (_error) {}

  if (!savedLocal) {
    const state = readWindowState();
    const bag = state[FALLBACK_NS] && typeof state[FALLBACK_NS] === 'object' ? state[FALLBACK_NS] : {};
    bag[key] = val;
    state[FALLBACK_NS] = bag;
    writeWindowState(state);
  }
}

function getCurrentTestRecordRaw() {
  const raw = safeGet(CURRENT_TEST_KEY, '');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_error) { return null; }
}

function saveCurrentTestRecord(test) {
  const payload = test && typeof test.id === 'string' ? { id: test.id } : test;
  safeSet(CURRENT_TEST_KEY, JSON.stringify(payload));
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
  document.body.setAttribute('data-theme', chosen);
  logStep('theme-applied', chosen);
}

async function loadLibrary(path = '') {
  const selected = path || safeGet(LIB_KEY, DEFAULT_LIB) || DEFAULT_LIB;
  safeSet(LIB_KEY, selected);
  const candidates = [selected, './data/year4_combined_50_test_library_v3.json', '/data/year4_combined_50_test_library_v3.json'];
  logStep('library-load-start', selected);
  let lastErr;
  for (const candidate of [...new Set(candidates)]) {
    try {
      const res = await fetch(candidate, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json();
      logStep('library-load-ok', candidate);
      return parsed;
    } catch (err) {
      lastErr = err;
      logStep('library-load-fail', `${candidate} :: ${err.message}`);
    }
  }
  throw lastErr || new Error('Unable to load library');
}

async function resolveCurrentTestRecord() {
  const saved = getCurrentTestRecordRaw();
  if (!saved) return null;
  if (Array.isArray(saved.questions) && Array.isArray(saved.passages)) return saved;
  if (typeof saved.id === 'string') {
    const library = await loadLibrary();
    return resolveTestById(library, saved.id);
  }
  return null;
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
  logStep('fallback-diag', message);
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

  const status = document.createElement('div');
  status.id = 'fallbackStatusText';
  const output = document.createElement('pre');
  output.id = 'fallbackStatusOutput';
  output.style.cssText = 'white-space:pre-wrap;margin:.45rem 0 0 0;max-height:180px;overflow:auto';
  panel.appendChild(status);
  panel.appendChild(output);

  const refresh = () => {
    const appReady = Boolean(window.__NFER_APP_READY);
    status.textContent = appReady
      ? `Primary app module ready. Fallback listeners standby. (fallback v${VERSION})`
      : `Primary app module not ready yet. Fallback listeners active. (fallback v${VERSION})`;
    output.textContent = stepLogs.join('\n') || 'No fallback events yet.';
  };

  badge.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    refresh();
  });

  window.addEventListener('nfer:app-ready', () => {
    logStep('app-ready-event');
    refresh();
  });

  const interval = setInterval(() => {
    refresh();
    if (window.__NFER_APP_READY) clearInterval(interval);
  }, 1000);
  setTimeout(() => clearInterval(interval), 15000);

  document.body.appendChild(badge);
  document.body.appendChild(panel);
  refresh();
}

async function ensureTestPageFallback() {
  if (document.body.dataset.page !== 'test') return;
  const passage1 = document.getElementById('passage1');
  const passage2 = document.getElementById('passage2');
  const form = document.getElementById('answersForm');
  if (!passage1 || !passage2 || !form) return;
  if (passage1.textContent.trim() || form.children.length) return;

  try {
    const test = await resolveCurrentTestRecord();
    if (!test) throw new Error('No resolvable test record');

    const meta = document.getElementById('testMeta');
    if (meta && !meta.textContent.trim()) {
      meta.innerHTML = `<h2>${test.title || 'Generated Test'}</h2><p><strong>Test ID:</strong> ${test.id || 'N/A'}</p>`;
    }

    passage1.textContent = test.passages?.[0]?.text || 'Passage 1 unavailable.';
    passage2.textContent = test.passages?.[1]?.text || 'Passage 2 unavailable.';

    form.innerHTML = '';
    (test.questions || []).forEach((q, idx) => {
      const wrap = document.createElement('section');
      wrap.className = 'question';
      wrap.innerHTML = `<label class="question-title">Question ${idx + 1}. ${q.stem || ''}</label>`;
      if (q.questionType === 'mcq' && Array.isArray(q.options)) {
        const rg = document.createElement('div');
        rg.className = 'radio-group';
        q.options.forEach((opt, i) => {
          const row = document.createElement('label');
          row.className = 'radio-option';
          row.innerHTML = `<input type="radio" name="${q.id}" value="${opt}" id="${q.id}_${i}"><span>${opt}</span>`;
          rg.appendChild(row);
        });
        wrap.appendChild(rg);
      } else {
        const ta = document.createElement('textarea');
        ta.name = q.id;
        ta.rows = 3;
        ta.placeholder = 'Type your answer';
        wrap.appendChild(ta);
      }
      form.appendChild(wrap);
    });

    showDiag('Fallback rendered test page content successfully.');
    logStep('test-fallback-rendered', test.id || 'unknown-id');
  } catch (error) {
    showDiag(`Fallback test render failed: ${error.message}`);
  }
}

function bindCoreFallbacks() {
  applyTheme(safeGet(THEME_KEY, 'default'));

  document.addEventListener('change', (event) => {
    if (event.target.id === 'themeSelect') applyTheme(event.target.value);
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
        saveCurrentTestRecord(tests[0]);
        logStep('fallback-start-test', tests[0].id || 'unknown-id');
        window.location.href = buildTestUrl(tests[0].id);
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
        saveCurrentTestRecord(test);
        logStep('fallback-random-test', test.id || 'unknown-id');
        window.location.href = buildTestUrl(test.id);
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

installFallbackStatus();

let fallbackActivated = false;
function activateFallback(reason) {
  if (fallbackActivated) return;
  fallbackActivated = true;
  logStep('fallback-activate', reason);
  bindCoreFallbacks();
  ensureTestPageFallback();
}

window.addEventListener('nfer:app-ready', () => {
  logStep('fallback-standby', 'primary app ready');
});

window.addEventListener('nfer:app-failed', (event) => {
  activateFallback(`app-failed:${event.detail || 'unknown'}`);
});

setTimeout(() => {
  if (!window.__NFER_APP_READY && !window.__NFER_APP_BOOTSTRAPPED) activateFallback('app-bootstrap-timeout');
}, 5000);
