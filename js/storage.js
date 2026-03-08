const KEYS = {
  currentTest: 'y4.currentTest',
  lastDiagnostic: 'y4.lastDiagnostic',
  history: 'y4.history',
  testSession: 'y4.testSession',
  settings: 'y4.settings'
};

const WINDOW_STATE_KEY = '__NFER_LOCAL_FALLBACK__';

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function getWindowState() {
  if (typeof window === 'undefined') return {};
  const state = safeParse(window.name || '', {});
  return state && typeof state === 'object' ? state : {};
}

function setWindowState(nextState) {
  if (typeof window === 'undefined') return;
  try {
    window.name = JSON.stringify(nextState || {});
  } catch (_error) {
    // Ignore window.name fallback errors.
  }
}

function safeGet(key, fallback) {
  try {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal != null) return safeParse(fromLocal, fallback);
  } catch (_error) {
    // continue to fallback
  }

  const fromWindow = getWindowState()[WINDOW_STATE_KEY]?.[key];
  if (fromWindow === undefined) return fallback;
  return fromWindow;
}

function safeSet(key, value) {
  let savedToLocal = false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    savedToLocal = true;
  } catch (_error) {
    // Ignore storage errors to avoid breaking button interactions.
  }

  if (!savedToLocal) {
    const state = getWindowState();
    const bag = state[WINDOW_STATE_KEY] && typeof state[WINDOW_STATE_KEY] === 'object'
      ? state[WINDOW_STATE_KEY]
      : {};
    bag[key] = value;
    state[WINDOW_STATE_KEY] = bag;
    setWindowState(state);
  }
}

export function saveCurrentTest(test) {
  safeSet(KEYS.currentTest, test);
}

export function getCurrentTest() {
  return safeGet(KEYS.currentTest, null);
}

export function loadHistory() {
  const history = safeGet(KEYS.history, []);
  return Array.isArray(history) ? history : [];
}

export function getHistory() {
  return loadHistory();
}

export function saveResult(result) {
  const history = loadHistory();
  history.push(result);
  safeSet(KEYS.history, history);
  safeSet(KEYS.lastDiagnostic, result);
}

export function saveDiagnostic(diagRecord) {
  saveResult(diagRecord);
}

export function getLastDiagnostic() {
  return safeGet(KEYS.lastDiagnostic, null);
}

export function saveTestSession(testId, session) {
  const all = getAllTestSessions();
  all[testId] = session;
  safeSet(KEYS.testSession, all);
}

export function getTestSession(testId) {
  const all = getAllTestSessions();
  return all[testId] || null;
}

export function clearTestSession(testId) {
  const all = getAllTestSessions();
  delete all[testId];
  safeSet(KEYS.testSession, all);
}

function getAllTestSessions() {
  const sessions = safeGet(KEYS.testSession, {});
  return sessions && typeof sessions === 'object' && !Array.isArray(sessions) ? sessions : {};
}

const DEFAULT_SETTINGS = {
  passageFontScale: 1,
  inputFontScale: 1,
  hideMarks: false,
  gentleMode: false
};

export function getSettings() {
  const settings = safeGet(KEYS.settings, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(settings && typeof settings === 'object' ? settings : {}) };
}

export function saveSettings(settings) {
  safeSet(KEYS.settings, { ...DEFAULT_SETTINGS, ...settings });
}
