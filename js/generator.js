let libraryCache = null;

export async function loadLibrary() {
  if (libraryCache) return libraryCache;
  const response = await fetch('./data/year4_reading_starter_pack_10_tests.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load starter pack JSON');
  libraryCache = await response.json();
  return libraryCache;
}

export async function generateTest() {
  const library = await loadLibrary();
  const tests = library.tests || [];
  if (!tests.length) throw new Error('No tests available in starter pack');
  return tests[Math.floor(Math.random() * tests.length)];
}
