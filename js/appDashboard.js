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
    renderDashboardMeta
  } = deps;

  const errorEl = document.getElementById('dashboardError');
  const generateBtn = document.getElementById('generateBtn');
  const randomBtn = document.getElementById('randomBtn');
  const applyLibraryBtn = document.getElementById('applyLibraryBtn');
  const libraryFileSelect = document.getElementById('libraryFile');
  const libraryPathInput = document.getElementById('libraryPathInput');

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
    return;
  }

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
