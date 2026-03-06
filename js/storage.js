const KEYS = {
  currentTest: 'nfer.currentTest',
  lastResult: 'nfer.lastResult',
  history: 'nfer.history',
  completedTests: 'nfer.completedTests'
};

export function saveCurrentTest(test) {
  localStorage.setItem(KEYS.currentTest, JSON.stringify(test));
}

export function getCurrentTest() {
  const raw = localStorage.getItem(KEYS.currentTest);
  return raw ? JSON.parse(raw) : null;
}

export function getCompletedTests() {
  const raw = localStorage.getItem(KEYS.completedTests);
  return raw ? JSON.parse(raw) : [];
}

export function saveCompletedTest(record) {
  const all = getCompletedTests();
  all.push(record);
  localStorage.setItem(KEYS.completedTests, JSON.stringify(all));
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
  localStorage.removeItem(KEYS.completedTests);
}
