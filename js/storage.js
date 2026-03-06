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

export function saveDiagnostic(diagRecord) {
  localStorage.setItem(KEYS.lastDiagnostic, JSON.stringify(diagRecord));
  const history = getHistory();
  history.push(diagRecord);
  localStorage.setItem(KEYS.history, JSON.stringify(history));
}

export function getLastDiagnostic() {
  const raw = localStorage.getItem(KEYS.lastDiagnostic);
  return raw ? JSON.parse(raw) : null;
}

export function getHistory() {
  const raw = localStorage.getItem(KEYS.history);
  return raw ? JSON.parse(raw) : [];
}
