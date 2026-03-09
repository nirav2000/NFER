import { markTest, buildDiagnostic } from './diagnostics.js?v=3.4.6';
import {
  getCurrentTest,
  saveResult,
  saveTestSession,
  getTestSession,
  clearTestSession,
  getSettings
} from './storage.js?v=3.4.6';
import {
  renderTestMeta,
  renderQuestion,
  renderAllQuestions,
  readCurrentAnswer,
  renderReview,
  renderProgress,
  renderTimer,
  toggleSchemes
} from './renderer.js?v=3.4.6';
import { createInteractionRecorder, getStoredReplay, replayInteractions } from './replay.js?v=3.4.6';

const TEST_DURATION_SECONDS = 35 * 60;

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

export function initTestRuntime() {
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
