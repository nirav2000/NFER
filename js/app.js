import { loadLibrary, generateTest } from './generator.js';
import { markTest, buildDiagnostic } from './diagnostics.js';
import { saveCurrentTest, getCurrentTest, saveDiagnostic, getLastDiagnostic, getHistory } from './storage.js';
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
    form: document.getElementById('answersForm'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    timerText: document.getElementById('timerText'),
    questionCard: document.getElementById('questionCard'),
    reviewCard: document.getElementById('reviewCard'),
    reviewList: document.getElementById('reviewList'),
    schemeToggle: document.getElementById('schemeToggle'),
    showTimerProgressToggle: document.getElementById('showTimerProgressToggle'),
    showAllQuestionsToggle: document.getElementById('showAllQuestionsToggle'),
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
    const timeTakenSeconds = Math.max(0, Math.round((TEST_DURATION_SECONDS * 1000 - Math.max(0, state.deadline - Date.now())) / 1000));

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
      answers: state.answers,
      timeTakenSeconds
    });

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
    if (state.showAllQuestions) {
      state.answers = collectAllAnswersFromForm();
    }
    state.showScheme = e.target.checked;
    toggleSchemes(state.showScheme, refs.form);
    if (state.showAllQuestions) refreshQuestionView();
  });

  refs.showTimerProgressToggle.addEventListener('change', (e) => {
    state.showTimerProgress = e.target.checked;
    refs.timerCard.hidden = !state.showTimerProgress;
  });

  refs.showAllQuestionsToggle.addEventListener('change', (e) => {
    if (!state.showAllQuestions) {
      persistCurrentAnswer();
    } else {
      state.answers = collectAllAnswersFromForm();
    }

    state.showAllQuestions = e.target.checked;
    refs.reviewCard.hidden = true;
    refs.questionCard.hidden = false;
    refreshQuestionView();
  });

  const timer = setInterval(() => {
    const remaining = Math.max(0, Math.round((state.deadline - Date.now()) / 1000));
    renderTimer(refs.timerText, remaining);

    if (remaining <= 0) {
      clearInterval(timer);
      if (state.showAllQuestions) {
        submitTest();
      } else {
        openReview();
      }
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
  const page = currentPage();
  if (page === 'dashboard') await initDashboard();
  if (page === 'test') initTest();
  if (page === 'diagnostic') initDiagnostic();
  if (page === 'tracker') initTracker();
})();
