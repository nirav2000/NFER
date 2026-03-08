const KEYS = {
  currentTest: 'y4.currentTest',
  lastDiagnostic: 'y4.lastDiagnostic',
  history: 'y4.history',
  testSession: 'y4.testSession',
  settings: 'y4.settings'
};


function safeGetRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function safeSetRaw(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (_error) {
    return false;
  }
}

export function saveCurrentTest(test) {
  safeSetRaw(KEYS.currentTest, JSON.stringify(test));
}

export function getCurrentTest() {
  const raw = safeGetRaw(KEYS.currentTest);
  return raw ? JSON.parse(raw) : null;
}

export function loadHistory() {
  const raw = safeGetRaw(KEYS.history);
  return raw ? JSON.parse(raw) : [];
}

export function getHistory() {
  return loadHistory();
}

export function saveResult(result) {
  const history = loadHistory();
  history.push(result);
  safeSetRaw(KEYS.history, JSON.stringify(history));
  safeSetRaw(KEYS.lastDiagnostic, JSON.stringify(result));
}

export function saveDiagnostic(diagRecord) {
  saveResult(diagRecord);
}

export function getLastDiagnostic() {
  const raw = safeGetRaw(KEYS.lastDiagnostic);
  return raw ? JSON.parse(raw) : null;
}

export function saveTestSession(testId, session) {
  const all = getAllTestSessions();
  all[testId] = session;
  safeSetRaw(KEYS.testSession, JSON.stringify(all));
}

export function getTestSession(testId) {
  const all = getAllTestSessions();
  return all[testId] || null;
}

export function clearTestSession(testId) {
  const all = getAllTestSessions();
  delete all[testId];
  safeSetRaw(KEYS.testSession, JSON.stringify(all));
}

function getAllTestSessions() {
  const raw = safeGetRaw(KEYS.testSession);
  return raw ? JSON.parse(raw) : {};
}

const DEFAULT_SETTINGS = {
  passageFontScale: 1,
  inputFontScale: 1,
  hideMarks: false,
  gentleMode: false
};

export function getSettings() {
  const raw = safeGetRaw(KEYS.settings);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  safeSetRaw(KEYS.settings, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
}
