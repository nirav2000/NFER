const KEYS = {
  currentTest: 'y4.currentTest',
  lastDiagnostic: 'y4.lastDiagnostic',
  history: 'y4.history'
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
  // Backward-compatible alias.
  saveResult(diagRecord);
}

export function getLastDiagnostic() {
  const raw = localStorage.getItem(KEYS.lastDiagnostic);
  return raw ? JSON.parse(raw) : null;
}
