export function getTestIdFromLocation(search = window.location.search) {
  const params = new URLSearchParams(search || '');
  const id = params.get('test');
  return id && id.trim() ? id.trim() : '';
}

export function buildTestUrl(testId = '') {
  if (!testId) return './test.html';
  return `./test.html?test=${encodeURIComponent(testId)}`;
}

export function resolveTestById(library, testId) {
  if (!library || !Array.isArray(library.tests) || !testId) return null;
  return library.tests.find((item) => item.id === testId) || null;
}
