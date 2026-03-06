import { loadLibrary, generateTest } from './generator.js';
import { markTest, buildDiagnostic } from './diagnostics.js';
import { saveCurrentTest, getCurrentTest, saveDiagnostic, getLastDiagnostic, getHistory } from './storage.js';
import {
  renderDashboardMeta,
  renderTestPage,
  collectAnswers,
  toggleSchemes,
  renderDiagnostic,
  renderTracker
} from './renderer.js';

function currentPage() {
  return document.body.dataset.page;
}

async function initDashboard() {
  const metaEl = document.getElementById('libraryMeta');
  const errorEl = document.getElementById('dashboardError');
  const generateBtn = document.getElementById('generateBtn');

  try {
    const library = await loadLibrary();
    renderDashboardMeta(metaEl, library);
    errorEl.textContent = '';
  } catch (error) {
    metaEl.textContent = 'Unable to load the reading test library.';
    errorEl.textContent = `Error: ${error.message}`;
    generateBtn.disabled = true;
    return;
  }

  generateBtn.addEventListener('click', async () => {
    try {
      const test = await generateTest();
      saveCurrentTest(test);
      window.location.href = './test.html';
    } catch (error) {
      errorEl.textContent = `Could not generate a test: ${error.message}`;
    }
  });
}

function initTest() {
  const test = getCurrentTest();
  if (!test) {
    document.getElementById('testMeta').innerHTML = '<h2>No test generated</h2><p>Go back to Dashboard and click Generate Test.</p>';
    return;
  }

  const refs = {
    meta: document.getElementById('testMeta'),
    passage1: document.getElementById('passage1'),
    passage2: document.getElementById('passage2'),
    form: document.getElementById('answersForm')
  };

  renderTestPage(test, refs);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Submit & Mark';
  refs.form.appendChild(submit);

  document.getElementById('schemeToggle').addEventListener('change', (e) => {
    toggleSchemes(e.target.checked, refs.form);
  });

  refs.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const answers = collectAnswers(refs.form, test);
    const marked = markTest(test, answers);
    const diagnostic = buildDiagnostic(marked);

    saveDiagnostic({
      date: new Date().toISOString(),
      testId: test.id,
      score: diagnostic.score,
      max: diagnostic.max,
      percentage: diagnostic.percentage,
      difficulty: test.difficulty,
      domainBreakdown: diagnostic.domainBreakdown,
      strengths: diagnostic.strengths,
      focusArea: diagnostic.focusArea,
      answers
    });

    window.location.href = './diagnostic.html';
  });
}

function initDiagnostic() {
  const last = getLastDiagnostic();
  if (!last) {
    document.getElementById('diagnosticRoot').innerHTML = '<section class="card"><p>No diagnostic available yet.</p></section>';
    return;
  }
  renderDiagnostic(document.getElementById('diagnosticRoot'), last, last);
}

function initTracker() {
  renderTracker(
    document.getElementById('historyBody'),
    document.getElementById('trend'),
    document.getElementById('difficultyTrend'),
    getHistory()
  );
}

(async function bootstrap() {
  const page = currentPage();
  if (page === 'dashboard') await initDashboard();
  if (page === 'test') initTest();
  if (page === 'diagnostic') initDiagnostic();
  if (page === 'tracker') initTracker();
})();
