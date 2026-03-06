const KEYS = {
  currentTest: 'nfer.currentTest',
  lastResult: 'nfer.lastResult',
  history: 'nfer.history'
};

export function saveCurrentTest(test) {
  localStorage.setItem(KEYS.currentTest, JSON.stringify(test));
}

export function getCurrentTest() {
  const raw = localStorage.getItem(KEYS.currentTest);
  return raw ? JSON.parse(raw) : null;
}

export function saveResult(result) {
  localStorage.setItem(KEYS.lastResult, JSON.stringify(result));
  const history = getHistory();
  history.push(result);
  localStorage.setItem(KEYS.history, JSON.stringify(history));
}

export function getLastResult() {
  const raw = localStorage.getItem(KEYS.lastResult);
  return raw ? JSON.parse(raw) : null;
}

export function getHistory() {
  const raw = localStorage.getItem(KEYS.history);
  return raw ? JSON.parse(raw) : [];
}

export function clearHistory() {
  localStorage.removeItem(KEYS.history);
  localStorage.removeItem(KEYS.lastResult);
}
