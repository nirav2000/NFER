import { loadLibrary, setLibraryPath, getStoredLibraryPath, generateTestRandom, selectNextTest, getWeakDomains } from './generator.js?v=3.4.2';
import { markTest, buildDiagnostic } from './diagnostics.js?v=3.4.2';
import {
  saveCurrentTest,
  getCurrentTest,
  saveResult,
  getLastDiagnostic,
  loadHistory,
  getHistory,
  saveTestSession,
  getTestSession,
  clearTestSession,
  getSettings,
  saveSettings
} from './storage.js?v=3.4.2';
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
  renderTracker,
  renderAttemptReview,
  renderFeedbackAssist
} from './renderer.js?v=3.4.2';
import { createInteractionRecorder, getStoredReplay, replayInteractions } from './replay.js?v=3.4.2';
import { createFeedbackPrompt, openPromptInChatGPT, copyPrompt } from './feedback.js?v=3.4.2';

const TEST_DURATION_SECONDS = 35 * 60;
const APP_VERSION = 'v3.4.2';
const THEME_KEY = 'y4.theme';
const THEME_PATHS = {
  default: '',
  ocean: './css/theme-ocean.css?v=3.4.2',
  paper: './css/theme-paper.css?v=3.4.2',
  split: './css/theme-split.css?v=3.4.2',
  arcade: './css/theme-arcade.css?v=3.4.2',
  zen210: './css/theme-zen210.css?v=3.4.2'
};


const RUNTIME_LOG_LIMIT = 80;
const runtimeLogs = [];

function reportRuntime(level, message, detail = '') {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    detail: detail ? String(detail) : ''
  };
  runtimeLogs.push(entry);
  if (runtimeLogs.length > RUNTIME_LOG_LIMIT) runtimeLogs.shift();

  const output = document.getElementById('runtimeDiagnosticsOutput');
  if (output) {
    output.textContent = runtimeLogs.map((item) => `[${item.time}] ${item.level.toUpperCase()} ${item.message}${item.detail ? ` :: ${item.detail}` : ''}`).join('
');
  }
}

function installRuntimeDiagnosticsFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer || document.getElementById('runtimeDiagnosticsToggleBtn')) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'runtimeDiagnosticsToggleBtn';
  toggle.className = 'footer-diagnostics-btn';
  toggle.textContent = 'Diagnostics';

  const panel = document.createElement('section');
  panel.id = 'runtimeDiagnosticsPanel';
  panel.className = 'runtime-diagnostics-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="runtime-diagnostics-head">
      <strong>Runtime diagnostics</strong>
      <button type="button" id="runtimeDiagnosticsCloseBtn" class="icon-btn" aria-label="Close diagnostics">✕</button>
    </div>
    <p class="muted">Recent client-side errors and warnings.</p>
    <pre id="runtimeDiagnosticsOutput">No runtime errors captured.</pre>
  `;

  const closeBtn = panel.querySelector('#runtimeDiagnosticsCloseBtn');
  const setOpen = (open) => { panel.hidden = !open; };

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  if (closeBtn) closeBtn.addEventListener('click', () => setOpen(false));

  footer.insertBefore(toggle, footer.querySelector('#versionInfo')?.nextSibling || footer.firstChild);
  footer.parentElement.appendChild(panel);
}


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

function getLabel(word, settings) {
  if (!settings?.gentleMode) return word;
  const map = {
    Assessment: 'Practice Plan',
    Test: 'Practice',
    Question: 'Challenge',
    Submit: 'Finish',
    Diagnostic: 'Learning Summary',
    Progress: 'Journey'
  };
  return map[word] || word;
}

function applySettingsToPage(settings) {
  document.documentElement.style.setProperty('--passage-font-scale', String(settings.passageFontScale || 1));
  document.documentElement.style.setProperty('--input-font-scale', String(settings.inputFontScale || 1));
  document.body.classList.toggle('hide-marks', Boolean(settings.hideMarks));
  document.body.classList.toggle('gentle-mode', Boolean(settings.gentleMode));
}

function initGlobalUI() {
  const versionInfo = document.getElementById('versionInfo');
  if (versionInfo) versionInfo.textContent = `NFER Reading Builder ${APP_VERSION}`;
  installRuntimeDiagnosticsFooter();

  const selectedTheme = localStorage.getItem(THEME_KEY) || 'default';
  applyTheme(selectedTheme);

  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
  }

  let settings = getSettings();
  applySettingsToPage(settings);

  const settingsToggleBtn = document.getElementById('settingsToggleBtn');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const settingsPanel = document.getElementById('settingsPanel');

  const openCloseSettings = (nextHidden) => {
    if (settingsPanel) settingsPanel.hidden = nextHidden;
  };

  if (settingsToggleBtn && settingsPanel) {
    settingsToggleBtn.addEventListener('click', () => {
      openCloseSettings(!settingsPanel.hidden);
    });
  }

  if (settingsCloseBtn && settingsPanel) {
    settingsCloseBtn.addEventListener('click', () => openCloseSettings(true));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && settingsPanel && !settingsPanel.hidden) {
      openCloseSettings(true);
    }
  });

  const passageFontRange = document.getElementById('passageFontRange');
  const inputFontRange = document.getElementById('inputFontRange');
  const hideMarksToggle = document.getElementById('hideMarksToggle');
  const gentleModeToggle = document.getElementById('gentleModeToggle');

  if (passageFontRange) passageFontRange.value = String(settings.passageFontScale || 1);
  if (inputFontRange) inputFontRange.value = String(settings.inputFontScale || 1);
  if (hideMarksToggle) hideMarksToggle.checked = Boolean(settings.hideMarks);
  if (gentleModeToggle) gentleModeToggle.checked = Boolean(settings.gentleMode);

  const syncSettings = () => {
    settings = {
      passageFontScale: Number(passageFontRange?.value || 1),
      inputFontScale: Number(inputFontRange?.value || 1),
      hideMarks: Boolean(hideMarksToggle?.checked),
      gentleMode: Boolean(gentleModeToggle?.checked)
    };
    saveSettings(settings);
    applySettingsToPage(settings);
    document.dispatchEvent(new CustomEvent('settings:changed', { detail: settings }));
  };

  [passageFontRange, inputFontRange].forEach((el) => el && el.addEventListener('input', syncSettings));
  [hideMarksToggle, gentleModeToggle].forEach((el) => el && el.addEventListener('change', syncSettings));

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => syncSettings());
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

  let settings = getSettings();
  const recorder = createInteractionRecorder();

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
    reviewBtn: document.getElementById('reviewBtn'),
    recordingStatus: document.getElementById('recordingStatus')
  };

  const savedSession = getTestSession(test.id);

  const state = {
    currentIndex: savedSession?.currentIndex || 0,
    answers: savedSession?.answers || {},
    skipped: new Set(savedSession?.skipped || []),
    showScheme: savedSession?.showScheme || false,
    showAllQuestions: savedSession?.showAllQuestions || false,
    showTimerProgress: savedSession?.showTimerProgress ?? true,
    startedAt: savedSession?.startedAt || Date.now(),
    deadline: savedSession?.deadline || Date.now() + (TEST_DURATION_SECONDS * 1000),
    replayMode: false
  };

  refs.schemeToggle.checked = state.showScheme;

  function persistSession() {
    saveTestSession(test.id, {
      currentIndex: state.currentIndex,
      answers: state.answers,
      skipped: Array.from(state.skipped),
      showScheme: state.showScheme,
      showAllQuestions: state.showAllQuestions,
      showTimerProgress: state.showTimerProgress,
      startedAt: state.startedAt,
      deadline: state.deadline
    });
  }

  const options = () => ({
    hideMarks: settings.hideMarks,
    gentleMode: settings.gentleMode,
    inputFontScale: settings.inputFontScale
  });

  renderTestMeta(test, refs, { gentleMode: settings.gentleMode });

  refs.passage1.style.fontSize = `${settings.passageFontScale}rem`;
  refs.passage2.style.fontSize = `${settings.passageFontScale}rem`;

  document.addEventListener('settings:changed', (event) => {
    settings = event.detail;
    refs.passage1.style.fontSize = `${settings.passageFontScale}rem`;
    refs.passage2.style.fontSize = `${settings.passageFontScale}rem`;
    renderTestMeta(test, refs, { gentleMode: settings.gentleMode });
    refreshQuestionView();
  });

  const persistCurrentAnswer = () => {
    const q = test.questions[state.currentIndex];
    const value = readCurrentAnswer(refs.form, q);
    state.answers[q.id] = value;
    if (value) state.skipped.delete(q.id);
    persistSession();
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
    refs.toggleTimerProgressBtn?.setAttribute('aria-pressed', String(state.showTimerProgress));
    refs.toggleAllQuestionsBtn?.setAttribute('aria-pressed', String(state.showAllQuestions));

    if (state.showAllQuestions) {
      renderAllQuestions(test, state.answers, state.showScheme, refs.form, options());
      renderProgress(0, test.questions.length, answeredCount(), refs.progressFill, refs.progressText, options());
      refs.prevBtn.hidden = true;
      refs.skipBtn.hidden = true;
      refs.nextBtn.hidden = true;
      refs.reviewBtn.hidden = true;
      refs.submitNowBtn.hidden = false;
      return;
    }

    const q = test.questions[state.currentIndex];
    renderQuestion(test, state.currentIndex, state.answers[q.id], state.showScheme, refs.form, options());
    renderProgress(state.currentIndex, test.questions.length, answeredCount(), refs.progressFill, refs.progressText, options());
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
    renderReview(test, state.answers, state.skipped, refs.reviewList, options());
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
      sequence: test.sequence,
      answers: state.answers,
      testSnapshot: test
    };

    if (recorder.isRecording()) {
      recorder.stop();
      refs.recordingStatus.textContent = 'Recording auto-saved on submit.';
    }
    clearTestSession(test.id);
    saveResult(result);
    window.location.href = './diagnostic.html';
  };

  const recordAction = (type, payload = {}) => recorder.log(type, { ...payload, scrollY: window.scrollY });

  refs.prevBtn.addEventListener('click', () => {
    persistCurrentAnswer();
    state.currentIndex = Math.max(0, state.currentIndex - 1);
    recordAction('prev');
    refreshQuestionView();
  });

  refs.nextBtn.addEventListener('click', () => {
    persistCurrentAnswer();
    state.currentIndex = Math.min(test.questions.length - 1, state.currentIndex + 1);
    recordAction('next');
    refreshQuestionView();
  });

  refs.skipBtn.addEventListener('click', () => {
    persistCurrentAnswer();
    const q = test.questions[state.currentIndex];
    if (!state.answers[q.id]) state.skipped.add(q.id);
    recordAction('skip');

    if (state.currentIndex < test.questions.length - 1) {
      state.currentIndex += 1;
      refreshQuestionView();
    } else {
      openReview();
    }
    persistSession();
  });

  refs.reviewBtn.addEventListener('click', () => {
    recordAction('review');
    openReview();
  });
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
    recordAction('scheme', { value: state.showScheme });
    if (state.showAllQuestions) refreshQuestionView();
    persistSession();
  });

  refs.toggleTimerProgressBtn.addEventListener('click', () => {
    state.showTimerProgress = !state.showTimerProgress;
    refs.timerCard.hidden = !state.showTimerProgress;
    refs.toggleTimerProgressBtn.setAttribute('aria-pressed', String(state.showTimerProgress));
    recordAction('timerToggle', { value: state.showTimerProgress });
    persistSession();
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
    recordAction('allQuestionsToggle', { value: state.showAllQuestions });
    refreshQuestionView();
    persistSession();
  });

  refs.form.addEventListener('input', () => {
    if (state.showAllQuestions) {
      state.answers = collectAllAnswersFromForm();
    } else {
      const q = test.questions[state.currentIndex];
      state.answers[q.id] = readCurrentAnswer(refs.form, q);
    }
    recordAction('input', { currentIndex: state.currentIndex, answers: state.answers });
    persistSession();
  });


  window.addEventListener('scroll', () => {
    if (recorder.isRecording()) {
      recordAction('scroll', { y: window.scrollY });
    }
  }, { passive: true });

  const recordingToggleBtn = document.getElementById('recordingToggleBtn');
  const replayBtn = document.getElementById('replayBtn');
  const replaySpeed = document.getElementById('replaySpeed');

  let frameCaptureTimer = null;
  const startFrameCapture = () => {
    if (frameCaptureTimer) clearInterval(frameCaptureTimer);
    frameCaptureTimer = setInterval(() => {
      if (!recorder.isRecording()) return;
      const remaining = Math.max(0, Math.round((state.deadline - Date.now()) / 1000));
      recordAction('frame', {
        currentIndex: state.currentIndex,
        showAllQuestions: state.showAllQuestions,
        showTimerProgress: state.showTimerProgress,
        showScheme: state.showScheme,
        answers: state.answers,
        remaining,
        scrollY: window.scrollY
      });
    }, 1000);
  };

  if (recordingToggleBtn) {
    recordingToggleBtn.addEventListener('click', () => {
      if (recorder.isRecording()) {
        recorder.stop();
        if (frameCaptureTimer) clearInterval(frameCaptureTimer);
        refs.recordingStatus.textContent = 'Recording saved.';
        recordingToggleBtn.textContent = 'Start Interaction Recording';
      } else {
        recorder.start();
        recordAction('recordingStart', { startedAt: Date.now(), deadline: state.deadline });
        startFrameCapture();
        refs.recordingStatus.textContent = 'Recording in progress...';
        recordingToggleBtn.textContent = 'Stop Interaction Recording';
      }
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', async () => {
      const recording = getStoredReplay();
      if (!recording) {
        refs.recordingStatus.textContent = 'No recording found to replay.';
        return;
      }

      state.replayMode = true;
      refs.recordingStatus.textContent = 'Replay in progress...';

      await replayInteractions(recording, {
        frame: (p) => {
          state.currentIndex = Number.isFinite(p.currentIndex) ? p.currentIndex : state.currentIndex;
          state.showAllQuestions = Boolean(p.showAllQuestions);
          state.showTimerProgress = Boolean(p.showTimerProgress);
          state.showScheme = Boolean(p.showScheme);
          state.answers = p.answers || state.answers;
          if (typeof p.scrollY === 'number') window.scrollTo(0, p.scrollY);
          if (typeof p.remaining === 'number') {
            state.deadline = Date.now() + (p.remaining * 1000);
            renderTimer(refs.timerText, p.remaining);
          }
          refs.schemeToggle.checked = state.showScheme;
          refreshQuestionView();
        },
        scroll: (p) => {
          if (typeof p.y === 'number') window.scrollTo(0, p.y);
        },
        input: (p) => {
          if (p.answers) state.answers = p.answers;
          if (Number.isFinite(p.currentIndex)) state.currentIndex = p.currentIndex;
          refreshQuestionView();
        },
        prev: () => refs.prevBtn.click(),
        next: () => refs.nextBtn.click(),
        skip: () => refs.skipBtn.click(),
        review: () => refs.reviewBtn.click(),
        scheme: (p) => {
          refs.schemeToggle.checked = Boolean(p.value);
          refs.schemeToggle.dispatchEvent(new Event('change'));
        },
        timerToggle: () => refs.toggleTimerProgressBtn.click(),
        allQuestionsToggle: () => refs.toggleAllQuestionsBtn.click()
      }, Number(replaySpeed?.value || 1));

      state.replayMode = false;
      refs.recordingStatus.textContent = 'Replay complete.';
    });
  }

  const timer = setInterval(() => {
    if (state.replayMode) return;
    const remaining = Math.max(0, Math.round((state.deadline - Date.now()) / 1000));
    renderTimer(refs.timerText, remaining);

    if (remaining <= 0) {
      clearInterval(timer);
      if (state.showAllQuestions) submitTest();
      else openReview();
    }
  }, 1000);

  renderTimer(refs.timerText, Math.max(0, Math.round((state.deadline - Date.now()) / 1000)));
  refreshQuestionView();
}


function bindFeedbackAssist(promptText) {
  const copyBtn = document.getElementById('copyFeedbackPromptBtn');
  const openBtn = document.getElementById('openFeedbackPromptBtn');
  const statusEl = document.getElementById('feedbackPromptStatus');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await copyPrompt(promptText);
        if (statusEl) statusEl.textContent = 'Prompt copied. Paste it into ChatGPT.';
      } catch (_error) {
        if (statusEl) statusEl.textContent = 'Could not copy automatically. Select and copy the prompt manually.';
      }
    });
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openPromptInChatGPT(promptText);
      if (statusEl) statusEl.textContent = 'Opened ChatGPT in a new tab with the prompt.';
    });
  }
}

function initDiagnostic() {
  const last = getLastDiagnostic();
  const root = document.getElementById('diagnosticRoot');
  if (!last) {
    root.innerHTML = '<section class="card"><p>No diagnostic available yet.</p></section>';
    return;
  }
  renderDiagnostic(root, last, last);
  const prompt = createFeedbackPrompt({
    test: last.testSnapshot,
    result: last,
    answers: last.answers
  });
  renderFeedbackAssist(root, prompt, 'AI Feedback Assist (Diagnostic)');
  bindFeedbackAssist(prompt);
}

function initTracker() {
  renderTracker(
    document.getElementById('historyBody'),
    document.getElementById('trend'),
    document.getElementById('difficultyTrend'),
    getHistory()
  );
}

function initAttempt() {
  const history = getHistory();
  const params = new URLSearchParams(window.location.search);
  const idx = Number(params.get('i'));
  const attempt = Number.isInteger(idx) ? history[idx] : null;
  const root = document.getElementById('attemptRoot');

  if (!attempt) {
    root.innerHTML = '<section class="card"><p>Attempt not found.</p></section>';
    return;
  }

  renderAttemptReview(root, attempt);
  const prompt = createFeedbackPrompt({
    test: attempt.testSnapshot,
    result: attempt,
    answers: attempt.answers
  });
  renderFeedbackAssist(root, prompt, 'AI Feedback Assist (Completed Attempt)');
  bindFeedbackAssist(prompt);
}

(async function bootstrap() {
  window.addEventListener('error', (event) => {
    reportRuntime('error', event.message || 'Unhandled error', event.error?.stack || '');
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportRuntime('error', 'Unhandled promise rejection', event.reason?.message || String(event.reason || 'Unknown rejection'));
  });

  try {
    initGlobalUI();
    const page = currentPage();
    reportRuntime('info', `Bootstrap start on ${page} page`);
    if (page === 'dashboard') await initDashboard();
    if (page === 'test') initTest();
    if (page === 'diagnostic') initDiagnostic();
    if (page === 'tracker') initTracker();
    if (page === 'attempt') initAttempt();
    reportRuntime('info', 'Bootstrap complete');
  } catch (error) {
    reportRuntime('error', 'App bootstrap failed', error?.message || error);
    const container = document.querySelector('.container');
    if (container) {
      container.insertAdjacentHTML('afterbegin', `<section class="card"><p class="error">App error: ${error?.message || error}</p></section>`);
    }
  }
})();
