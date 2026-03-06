let libraryCache = null;

async function fetchLibrary(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}

export async function loadLibrary() {
  if (libraryCache) return libraryCache;

  // GitHub Pages can be served at root or /<repo>/; try both absolute and relative paths.
  const candidates = [
    '/data/year4_reading_starter_pack_10_tests.json',
    './data/year4_reading_starter_pack_10_tests.json'
  ];

  let lastError = null;
  for (const url of candidates) {
    try {
      libraryCache = await fetchLibrary(url);
      return libraryCache;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to load starter pack JSON');
}

export async function generateTest() {
  const library = await loadLibrary();
  const tests = library.tests || [];
  if (!tests.length) throw new Error('No tests available in starter pack');
  return tests[Math.floor(Math.random() * tests.length)];
}
