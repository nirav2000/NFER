import { loadLibrary, setLibraryPath, getStoredLibraryPath, generateTestRandom, selectNextTest, getWeakDomains } from './generator.js';
import { markTest, buildDiagnostic } from './diagnostics.js';
import { saveCurrentTest, getCurrentTest, saveResult, getLastDiagnostic, loadHistory, getHistory } from './storage.js';
import {
  renderDashboardMeta,
  renderTestMeta,
  renderQuestion,
  renderAllQuestions,
  readCurrentAnswer,
  renderReview,
  renderProgress,
  renderTimer,
  toggleSchemes,
  renderDiagnostic,
  renderTracker
} from './renderer.js';

const TEST_DURATION_SECONDS = 35 * 60;
const APP_VERSION = 'v3.2.0';
const THEME_KEY = 'y4.theme';
const THEME_PATHS = {
  default: '',
  ocean: './css/theme-ocean.css',
  paper: './css/theme-paper.css'
};

function currentPage() {
  return document.body.dataset.page;
}

function applyTheme(themeName) {
  const theme = THEME_PATHS[themeName] != null ? themeName : 'default';
  localStorage.setItem(THEME_KEY, theme);

  const themeLink = document.getElementById('themeStylesheet');
  if (themeLink) {
    themeLink.setAttribute('href', THEME_PATHS[theme]);
  }

  const selector = document.getElementById('themeSelect');
  if (selector && selector.value !== theme) selector.value = theme;
}

function initGlobalUI() {
  const versionInfo = document.getElementById('versionInfo');
  if (versionInfo) versionInfo.textContent = `NFER Reading Builder ${APP_VERSION}`;

  const selectedTheme = localStorage.getItem(THEME_KEY) || 'default';
  applyTheme(selectedTheme);

  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
  }
}

function renderDashboardInsights(library, history, recommendedTest) {
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

async function startTestWithSelection(selectionFn, errorEl) {
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
}

async function refreshDashboard() {
  const library = await loadLibrary();
  const history = loadHistory();
  const recommended = selectNextTest(library, history);
  renderDashboardInsights(library, history, recommended);
}

async function initDashboard() {
  const errorEl = document.getElementById('dashboardError');
  const generateBtn = document.getElementById('generateBtn');
  const randomBtn = document.getElementById('randomBtn');
  const applyLibraryBtn = document.getElementById('applyLibraryBtn');
  const libraryFileSelect = document.getElementById('libraryFile');
  const libraryPathInput = document.getElementById('libraryPathInput');

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
    await startTestWithSelection((library, history) => selectNextTest(library, history), errorEl);
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

function initTest() {
  const test = getCurrentTest();
  if (!test) {
    document.getElementById('testMeta').innerHTML = '<h2>No test generated</h2><p>Go back to Dashboard and click Start Recommended Test.</p>';
    return;
  }

  const refs = {
    meta: document.getElementById('testMeta'),
    passage1: document.getElementById('passage1'),
    passage2: document.getElementById('passage2'),
    form: document.getElementById('answersForm'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    timerText: document.getElementById('timerText'),
    questionCard: document.getElementById('questionCard'),
    reviewCard: document.getElementById('reviewCard'),
    reviewList: document.getElementById('reviewList'),
    schemeToggle: document.getElementById('schemeToggle'),
    toggleTimerProgressBtn: document.getElementById('toggleTimerProgressBtn'),
    toggleAllQuestionsBtn: document.getElementById('toggleAllQuestionsBtn'),
    timerCard: document.querySelector('.timer-card'),
    submitNowBtn: document.getElementById('submitNowBtn'),
    prevBtn: document.getElementById('prevBtn'),
    skipBtn: document.getElementById('skipBtn'),
    nextBtn: document.getElementById('nextBtn'),
    reviewBtn: document.getElementById('reviewBtn')
  };

  renderTestMeta(test, refs);

  const state = {
    currentIndex: 0,
    answers: {},
    skipped: new Set(),
    showScheme: false,
    showAllQuestions: false,
    showTimerProgress: true,
    startedAt: Date.now(),
    deadline: Date.now() + (TEST_DURATION_SECONDS * 1000)
  };

  const persistCurrentAnswer = () => {
    const q = test.questions[state.currentIndex];
    const value = readCurrentAnswer(refs.form, q);
    state.answers[q.id] = value;
    if (value) state.skipped.delete(q.id);
  };

  const answeredCount = () => test.questions.filter((q) => String(state.answers[q.id] || '').trim()).length;

  const collectAllAnswersFromForm = () => {
    const data = new FormData(refs.form);
    const collected = {};
    test.questions.forEach((q) => {
      collected[q.id] = String(data.get(q.id) || '').trim();
    });
    return collected;
  };

  const refreshQuestionView = () => {
    refs.timerCard.hidden = !state.showTimerProgress;
    if (refs.toggleTimerProgressBtn) refs.toggleTimerProgressBtn.setAttribute('aria-pressed', String(state.showTimerProgress));
    if (refs.toggleAllQuestionsBtn) refs.toggleAllQuestionsBtn.setAttribute('aria-pressed', String(state.showAllQuestions));

    if (state.showAllQuestions) {
      renderAllQuestions(test, state.answers, state.showScheme, refs.form);
      renderProgress(0, test.questions.length, answeredCount(), refs.progressFill, refs.progressText);
      refs.prevBtn.hidden = true;
      refs.skipBtn.hidden = true;
      refs.nextBtn.hidden = true;
      refs.reviewBtn.hidden = true;
      refs.submitNowBtn.hidden = false;
      return;
    }

    const q = test.questions[state.currentIndex];
    renderQuestion(test, state.currentIndex, state.answers[q.id], state.showScheme, refs.form);
    renderProgress(state.currentIndex, test.questions.length, answeredCount(), refs.progressFill, refs.progressText);
    refs.prevBtn.hidden = false;
    refs.skipBtn.hidden = false;
    refs.nextBtn.hidden = false;
    refs.reviewBtn.hidden = false;
    refs.submitNowBtn.hidden = true;
    refs.prevBtn.disabled = state.currentIndex === 0;
    refs.nextBtn.disabled = state.currentIndex === test.questions.length - 1;
  };

  const openReview = () => {
    persistCurrentAnswer();
    renderReview(test, state.answers, state.skipped, refs.reviewList);
    refs.questionCard.hidden = true;
    refs.reviewCard.hidden = false;

    refs.reviewList.querySelectorAll('[data-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentIndex = Number(btn.dataset.jump);
        refs.reviewCard.hidden = true;
        refs.questionCard.hidden = false;
        refreshQuestionView();
      });
    });
  };

  const submitTest = () => {
    if (state.showAllQuestions) {
      state.answers = collectAllAnswersFromForm();
    } else {
      persistCurrentAnswer();
    }

    const marked = markTest(test, state.answers);
    const diagnostic = buildDiagnostic(marked);
    const domainBreakdown = Object.fromEntries(
      diagnostic.domainBreakdown.map((item) => [item.domain, item.percentage])
    );

    const result = {
      testId: test.id,
      percentage: diagnostic.percentage,
      difficulty: test.difficulty || 3,
      topicsCovered: test.topicsCovered || [],
      domainBreakdown,
      completedAt: new Date().toISOString(),
      score: diagnostic.score,
      totalMarks: diagnostic.max,
      timeTakenMinutes: Math.max(1, Math.round((Date.now() - state.startedAt) / 60000)),
      strengths: diagnostic.strengths,
      focusArea: diagnostic.focusArea,
      questionCount: test.questionCount || (test.questions || []).length,
      week: test.week,
      sequence: test.sequence
    };

    saveResult(result);
    window.location.href = './diagnostic.html';
  };

  refs.prevBtn.addEventListener('click', () => {
    persistCurrentAnswer();
    state.currentIndex = Math.max(0, state.currentIndex - 1);
    refreshQuestionView();
  });

  refs.nextBtn.addEventListener('click', () => {
    persistCurrentAnswer();
    state.currentIndex = Math.min(test.questions.length - 1, state.currentIndex + 1);
    refreshQuestionView();
  });

  refs.skipBtn.addEventListener('click', () => {
    persistCurrentAnswer();
    const q = test.questions[state.currentIndex];
    if (!state.answers[q.id]) state.skipped.add(q.id);

    if (state.currentIndex < test.questions.length - 1) {
      state.currentIndex += 1;
      refreshQuestionView();
    } else {
      openReview();
    }
  });

  refs.reviewBtn.addEventListener('click', openReview);
  refs.submitNowBtn.addEventListener('click', submitTest);
  document.getElementById('backToQuestionsBtn').addEventListener('click', () => {
    refs.reviewCard.hidden = true;
    refs.questionCard.hidden = false;
    refreshQuestionView();
  });
  document.getElementById('submitTestBtn').addEventListener('click', submitTest);

  refs.schemeToggle.addEventListener('change', (e) => {
    if (state.showAllQuestions) state.answers = collectAllAnswersFromForm();
    state.showScheme = e.target.checked;
    toggleSchemes(state.showScheme, refs.form);
    if (state.showAllQuestions) refreshQuestionView();
  });

  refs.toggleTimerProgressBtn.addEventListener('click', () => {
    state.showTimerProgress = !state.showTimerProgress;
    refs.timerCard.hidden = !state.showTimerProgress;
    refs.toggleTimerProgressBtn.setAttribute('aria-pressed', String(state.showTimerProgress));
  });

  refs.toggleAllQuestionsBtn.addEventListener('click', () => {
    if (!state.showAllQuestions) {
      persistCurrentAnswer();
    } else {
      state.answers = collectAllAnswersFromForm();
    }

    state.showAllQuestions = !state.showAllQuestions;
    refs.toggleAllQuestionsBtn.setAttribute('aria-pressed', String(state.showAllQuestions));
    refs.reviewCard.hidden = true;
    refs.questionCard.hidden = false;
    refreshQuestionView();
  });

  const timer = setInterval(() => {
    const remaining = Math.max(0, Math.round((state.deadline - Date.now()) / 1000));
    renderTimer(refs.timerText, remaining);

    if (remaining <= 0) {
      clearInterval(timer);
      if (state.showAllQuestions) submitTest();
      else openReview();
    }
  }, 1000);

  renderTimer(refs.timerText, TEST_DURATION_SECONDS);
  refreshQuestionView();
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
  initGlobalUI();
  const page = currentPage();
  if (page === 'dashboard') await initDashboard();
  if (page === 'test') initTest();
  if (page === 'diagnostic') initDiagnostic();
  if (page === 'tracker') initTracker();
})();
