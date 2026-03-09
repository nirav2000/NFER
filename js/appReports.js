export function bindFeedbackAssist(promptText, deps) {
  const { copyPrompt, openPromptInChatGPT, bindInAppFeedbackFn } = deps;
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

  if (typeof bindInAppFeedbackFn === 'function') {
    bindInAppFeedbackFn(promptText, statusEl);
  }
}

export function initDiagnosticPage(deps) {
  const {
    getLastDiagnostic,
    renderDiagnostic,
    createFeedbackPrompt,
    renderFeedbackAssist,
    bindFeedbackAssistFn
  } = deps;

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
  bindFeedbackAssistFn(prompt);
}

export function initTrackerPage(deps) {
  const { renderTracker, getHistory } = deps;
  renderTracker(
    document.getElementById('historyBody'),
    document.getElementById('trend'),
    document.getElementById('difficultyTrend'),
    getHistory()
  );
}

export function initAttemptPage(deps) {
  const {
    getHistory,
    renderAttemptReview,
    createFeedbackPrompt,
    renderFeedbackAssist,
    bindFeedbackAssistFn
  } = deps;

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
  bindFeedbackAssistFn(prompt);
}
