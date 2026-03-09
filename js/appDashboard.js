export function renderDashboardInsights(library, history, recommendedTest, deps) {
  const { getWeakDomains, renderDashboardMeta } = deps;
  const recommendedEl = document.getElementById('recommendedMeta');
  const recentEl = document.getElementById('recentScores');
  const weakEl = document.getElementById('weakDomains');

  if (recommendedTest) {
    recommendedEl.textContent = `${recommendedTest.id} · Week ${recommendedTest.week || '—'} · Difficulty ${recommendedTest.difficulty || 3} · Topics: ${(recommendedTest.topicsCovered || []).join(', ') || 'general reading'} · Domains: ${(recommendedTest.domainsCovered || []).join(', ') || 'mixed'}`;
  } else {
    recommendedEl.textContent = 'No recommendation available.';
  }

  if (history.length) {
    recentEl.textContent = history.slice(-5).map((item) => `${item.testId}: ${item.percentage}%`).join(' · ');
  } else {
    recentEl.textContent = 'No attempts yet.';
  }

  const weakDomains = getWeakDomains(history);
  weakEl.textContent = weakDomains.length ? weakDomains.join(', ') : 'No weak domains identified yet.';
  renderDashboardMeta(document.getElementById('libraryMeta'), library);
}

async function loadCatalogPaths() {
  const fallback = [
    '/data/year4_combined_50_test_library_v3.json',
    '/data/year4_reading_starter_pack_10_tests.json',
    '/data/year4_unit_001_gold_standard.json',
    '/data/year4_unit_001_v7.json',
    '/data/year4_single_passage_schema_v6.json',
    '/data/year4_single_passage_schema_v7.json'
  ];

  try {
    const response = await fetch('/data/library_catalog.json', { cache: 'no-store' });
    if (!response.ok) return fallback;
    const payload = await response.json();
    return Array.isArray(payload.files) ? payload.files : fallback;
  } catch {
    return fallback;
  }
}

export async function initDashboardPage(deps) {
  const {
    loadLibrary,
    setLibraryPath,
    getStoredLibraryPath,
    generateTestRandom,
    selectNextTest,
    loadHistory,
    saveCurrentTest,
    getWeakDomains,
    renderDashboardMeta,
    inspectLibraryCompatibility
  } = deps;

  const errorEl = document.getElementById('dashboardError');
  const generateBtn = document.getElementById('generateBtn');
  const randomBtn = document.getElementById('randomBtn');
  const applyLibraryBtn = document.getElementById('applyLibraryBtn');
  const libraryFileSelect = document.getElementById('libraryFile');
  const libraryPathInput = document.getElementById('libraryPathInput');
  const autoScanBtn = document.getElementById('autoScanBtn');
  const schemaScanStatus = document.getElementById('schemaScanStatus');

  const refreshDashboard = async () => {
    const library = await loadLibrary();
    const history = loadHistory();
    const recommended = selectNextTest(library, history);
    renderDashboardInsights(library, history, recommended, { getWeakDomains, renderDashboardMeta });
  };

  const startTestWithSelection = async (selectionFn) => {
    try {
      const library = await loadLibrary();
      const history = loadHistory();
      const test = selectionFn(library, history);
      if (!test) throw new Error('No test available in selected library');
      saveCurrentTest(test);
      window.location.href = './test.html';
    } catch (error) {
      errorEl.textContent = `Could not generate a test: ${error.message}`;
    }
  };

  const autoScanFiles = async () => {
    if (!schemaScanStatus) return;
    schemaScanStatus.textContent = 'Scanning data files…';

    const paths = await loadCatalogPaths();
    const supported = [];
    const unsupported = [];

    for (const path of paths) {
      try {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) {
          unsupported.push(`${path} (fetch ${response.status})`);
          continue;
        }
        const raw = await response.json();
        const compatibility = inspectLibraryCompatibility(raw);
        if (compatibility.supported) {
          supported.push({ path, compatibility });
        } else {
          unsupported.push(`${path} (${compatibility.reason})`);
        }
      } catch (error) {
        unsupported.push(`${path} (${error.message})`);
      }
    }

    const existing = new Set(Array.from(libraryFileSelect.options).map((opt) => opt.value));
    supported.forEach(({ path, compatibility }) => {
      if (existing.has(path)) return;
      const option = document.createElement('option');
      option.value = path;
      option.textContent = `Auto: ${path.split('/').pop()} (${compatibility.format} v${compatibility.version})`;
      libraryFileSelect.appendChild(option);
      existing.add(path);
    });

    if (unsupported.length) {
      schemaScanStatus.textContent = `Supported ${supported.length} files. Unsupported ${unsupported.length}: ${unsupported.join(' | ')}. If required, extend js/schemaAdapter.js.`;
      schemaScanStatus.classList.add('error');
    } else {
      schemaScanStatus.textContent = `Supported ${supported.length} files. All scanned files are adapter-compatible.`;
      schemaScanStatus.classList.remove('error');
    }
  };

  libraryFileSelect.value = getStoredLibraryPath();
  libraryPathInput.value = getStoredLibraryPath();

  try {
    await refreshDashboard();
    errorEl.textContent = '';
  } catch (error) {
    document.getElementById('libraryMeta').textContent = 'Unable to load the reading test library.';
    errorEl.textContent = `Error: ${error.message}`;
    generateBtn.disabled = true;
    randomBtn.disabled = true;
  }

  if (autoScanBtn) autoScanBtn.addEventListener('click', autoScanFiles);

  applyLibraryBtn.addEventListener('click', async () => {
    const selectedPath = libraryPathInput.value.trim() || libraryFileSelect.value;
    setLibraryPath(selectedPath);
    try {
      await refreshDashboard();
      errorEl.textContent = '';
      generateBtn.disabled = false;
      randomBtn.disabled = false;
    } catch (error) {
      errorEl.textContent = `Error: ${error.message}`;
      generateBtn.disabled = true;
      randomBtn.disabled = true;
    }
  });

  generateBtn.addEventListener('click', async () => {
    await startTestWithSelection((library, history) => selectNextTest(library, history));
  });

  randomBtn.addEventListener('click', async () => {
    try {
      const test = await generateTestRandom();
      saveCurrentTest(test);
      window.location.href = './test.html';
    } catch (error) {
      errorEl.textContent = `Could not generate a random test: ${error.message}`;
    }
  });
}
