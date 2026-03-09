import { normaliseLibrarySchema, inspectLibraryCompatibility } from './schemaAdapter.js?v=3.4.16';
const DEFAULT_LIBRARY_PATH = '/data/year4_combined_50_test_library_v3.json';
const LIBRARY_PATH_KEY = 'y4.libraryPath';

let libraryCache = null;
let libraryPathCache = null;

function normalisePath(path) {
  if (!path) return DEFAULT_LIBRARY_PATH;
  if (path.startsWith('./') || path.startsWith('/')) return path;
  return `/data/${path}`;
}

function getLibraryPath() {
  if (libraryPathCache) return libraryPathCache;
  const stored = localStorage.getItem(LIBRARY_PATH_KEY);
  libraryPathCache = normalisePath(stored || DEFAULT_LIBRARY_PATH);
  return libraryPathCache;
}

export function setLibraryPath(path) {
  const normalised = normalisePath(path);
  localStorage.setItem(LIBRARY_PATH_KEY, normalised);
  libraryPathCache = normalised;
  libraryCache = null;
}

export function getStoredLibraryPath() {
  return getLibraryPath();
}

function toCandidateUrls(path) {
  return [normalisePath(path)];
}

async function fetchLibrary(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}

export async function loadLibrary() {
  if (libraryCache) return libraryCache;

  const candidates = toCandidateUrls(getLibraryPath());
  let lastError = null;

  for (const url of candidates) {
    try {
      const rawLibrary = await fetchLibrary(url);
      const compatibility = inspectLibraryCompatibility(rawLibrary);
      if (!compatibility.supported) {
        throw new Error(`${url}: ${compatibility.reason} Detected format=${compatibility.format}, version=${compatibility.version}.`);
      }
      libraryCache = normaliseLibrarySchema(rawLibrary);
      return libraryCache;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to load reading library JSON');
}

export function getWeakDomains(history = []) {
  if (!history.length) return [];

  const totals = {};
  const counts = {};

  for (const item of history.slice(-4)) {
    const breakdown = item.domainBreakdown || {};
    for (const [domain, value] of Object.entries(breakdown)) {
      const pct = typeof value === 'number'
        ? value
        : value && value.percentage != null
          ? value.percentage
          : null;

      if (pct == null) continue;
      totals[domain] = (totals[domain] || 0) + pct;
      counts[domain] = (counts[domain] || 0) + 1;
    }
  }

  return Object.keys(totals)
    .map((domain) => ({ domain, avg: totals[domain] / counts[domain] }))
    .filter((item) => item.avg < 60)
    .map((item) => item.domain);
}

export function selectNextTest(library, history = []) {
  const tests = library.tests || [];
  if (!tests.length) return null;

  const lastResult = history.length ? history[history.length - 1] : null;

  let targetDifficulty = 3;
  if (lastResult) {
    if (lastResult.percentage >= 85) targetDifficulty = Math.min((lastResult.difficulty || 3) + 1, 5);
    else if (lastResult.percentage >= 70) targetDifficulty = lastResult.difficulty || 3;
    else if (lastResult.percentage >= 50) targetDifficulty = lastResult.difficulty || 3;
    else targetDifficulty = Math.max((lastResult.difficulty || 3) - 1, 1);
  }

  const recentTestIds = new Set(history.slice(-6).map((record) => record.testId));
  const recentTopics = new Set(history.slice(-4).flatMap((record) => record.topicsCovered || []));
  const weakDomains = getWeakDomains(history);

  const scored = tests
    .filter((test) => !recentTestIds.has(test.id))
    .map((test) => {
      let score = 0;

      score -= Math.abs((test.difficulty || 3) - targetDifficulty) * 20;

      const topicOverlap = (test.topicsCovered || []).filter((topic) => recentTopics.has(topic)).length;
      score -= topicOverlap * 8;

      const weakDomainMatches = (test.domainsCovered || []).filter((domain) => weakDomains.includes(domain)).length;
      score += weakDomainMatches * 10;

      if ((test.passageGenres || []).includes('fiction')) score += 2;
      if ((test.passageGenres || []).includes('nonfiction')) score += 2;

      score += Math.random() * 3;

      return { test, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.length ? scored[0].test : tests[0];
}

export async function generateTestRandom() {
  const library = await loadLibrary();
  const tests = library.tests || [];
  if (!tests.length) throw new Error('No tests available in the selected library');
  return tests[Math.floor(Math.random() * tests.length)];
}
