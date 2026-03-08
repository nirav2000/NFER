const KEYS = {
  currentTest: 'y4.currentTest',
  lastDiagnostic: 'y4.lastDiagnostic',
  history: 'y4.history',
  testSession: 'y4.testSession',
  settings: 'y4.settings'
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function safeGet(key, fallback) {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch (_error) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    // Ignore storage errors to avoid breaking button interactions.
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
