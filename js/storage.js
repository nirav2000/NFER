const KEYS = {
  currentTest: 'y4.currentTest',
  lastDiagnostic: 'y4.lastDiagnostic',
  history: 'y4.history',
  testSession: 'y4.testSession',
  settings: 'y4.settings'
};

export function saveCurrentTest(test) {
  localStorage.setItem(KEYS.currentTest, JSON.stringify(test));
}

export function getCurrentTest() {
  const raw = localStorage.getItem(KEYS.currentTest);
  return raw ? JSON.parse(raw) : null;
}

export function loadHistory() {
  const raw = localStorage.getItem(KEYS.history);
  return raw ? JSON.parse(raw) : [];
}

export function getHistory() {
  return loadHistory();
}

export function saveResult(result) {
  const history = loadHistory();
  history.push(result);
  localStorage.setItem(KEYS.history, JSON.stringify(history));
  localStorage.setItem(KEYS.lastDiagnostic, JSON.stringify(result));
}

export function saveDiagnostic(diagRecord) {
  saveResult(diagRecord);
}

export function getLastDiagnostic() {
  const raw = localStorage.getItem(KEYS.lastDiagnostic);
  return raw ? JSON.parse(raw) : null;
}

export function saveTestSession(testId, session) {
  const all = getAllTestSessions();
  all[testId] = session;
  localStorage.setItem(KEYS.testSession, JSON.stringify(all));
}

export function getTestSession(testId) {
  const all = getAllTestSessions();
  return all[testId] || null;
}

export function clearTestSession(testId) {
  const all = getAllTestSessions();
  delete all[testId];
  localStorage.setItem(KEYS.testSession, JSON.stringify(all));
}

function getAllTestSessions() {
  const raw = localStorage.getItem(KEYS.testSession);
  return raw ? JSON.parse(raw) : {};
}

const DEFAULT_SETTINGS = {
  passageFontScale: 1,
  inputFontScale: 1,
  hideMarks: false,
  gentleMode: false
};

export function getSettings() {
  const raw = localStorage.getItem(KEYS.settings);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
}
