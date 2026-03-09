function createQuestionInput(q, answerValue, inputScale = 1) {
  if (q.questionType === 'mcq') {
    const wrap = document.createElement('div');
    wrap.className = 'radio-group';
    wrap.style.fontSize = `${inputScale}rem`;
    (q.options || []).forEach((opt, idx) => {
      const row = document.createElement('label');
      row.className = 'radio-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = q.id;
      radio.value = opt;
      radio.id = `${q.id}_${idx}`;
      radio.checked = answerValue === opt;
      const text = document.createElement('span');
      text.textContent = opt;
      row.appendChild(radio);
      row.appendChild(text);
      wrap.appendChild(row);
    });
    return wrap;
  }

  const ta = document.createElement('textarea');
  ta.name = q.id;
  ta.rows = 4;
  ta.placeholder = 'Type your answer';
  ta.value = answerValue || '';
  ta.style.fontSize = `${inputScale}rem`;
  ta.setAttribute('autocomplete', 'off');
  ta.setAttribute('autocorrect', 'off');
  ta.setAttribute('autocapitalize', 'off');
  ta.setAttribute('spellcheck', 'false');
  return ta;
}

function questionLabelText(q, index, hideMarks = false, gentleMode = false) {
  const word = gentleMode ? 'Challenge' : 'Question';
  return hideMarks
    ? `${word} ${index + 1}. ${q.stem}`
    : `${word} ${index + 1}. ${q.stem} (${q.marks} marks)`;
}

export function renderDashboardMeta(el, library) {
  el.textContent = `Year ${library.yearGroup} · Version ${library.version || 'n/a'} · Total tests available: ${(library.tests || []).length}.`;
}

export function renderTestMeta(test, refs, options = {}) {
  const labelA = options.gentleMode ? 'Practice Session' : 'Test';
  refs.meta.innerHTML = `<h2>${test.title}</h2>
    <p><strong>${labelA} ID:</strong> ${test.id} · <strong>Week:</strong> ${test.week || '—'} · <strong>Sequence:</strong> ${test.sequence || '—'} · <strong>Difficulty:</strong> ${test.difficulty} · <strong>Total marks:</strong> ${test.totalMarks}</p>
    <p><strong>Domains:</strong> ${(test.domainsCovered || []).join(', ') || 'mixed'} · <strong>Topics:</strong> ${(test.topicsCovered || []).join(', ') || 'general reading'} · <strong>Genres:</strong> ${(test.passageGenres || []).join(', ') || 'mixed'}</p>
    <p class="muted">This includes two passages. Questions indicate which passage to refer to.</p>`;
  refs.passage1.textContent = test.passages?.[0]?.text || 'Passage 1 missing';
  refs.passage2.textContent = test.passages?.[1]?.text || 'Passage 2 missing';
}

export function renderQuestion(test, index, answerValue, showScheme, formEl, options = {}) {
  const q = test.questions[index];
  formEl.innerHTML = '';

  const block = document.createElement('section');
  block.className = 'question question-spotlight';

  const label = document.createElement('label');
  label.className = 'question-title';
  label.textContent = questionLabelText(q, index, options.hideMarks, options.gentleMode);
  block.appendChild(label);

  const passageRef = document.createElement('p');
  passageRef.className = 'muted';
  passageRef.textContent = `Refer to Passage ${q.passageId === 'P2' ? '2' : '1'}`;
  block.appendChild(passageRef);

  block.appendChild(createQuestionInput(q, answerValue, options.inputFontScale || 1));

  const scheme = document.createElement('div');
  scheme.className = 'scheme';
  scheme.hidden = !showScheme;
  scheme.innerHTML = `<p><strong>Accepted:</strong> ${(q.acceptedAnswers || []).join(' | ')}</p>
    <p><strong>Model (Gold):</strong> ${q.modelAnswerGold || 'Precise answer with clear text evidence.'}</p>
    <p><strong>Model (Silver):</strong> ${q.modelAnswerSilver || 'Mostly correct answer with some evidence.'}</p>
    <p><strong>Notes:</strong> ${q.markingNotes || 'Award based on evidence and correctness.'}</p>`;
  block.appendChild(scheme);

  formEl.appendChild(block);
}

export function renderAllQuestions(test, answers, showScheme, formEl, options = {}) {
  formEl.innerHTML = '';

  test.questions.forEach((q, index) => {
    const block = document.createElement('section');
    block.className = 'question';

    const label = document.createElement('label');
    label.className = 'question-title';
    label.textContent = questionLabelText(q, index, options.hideMarks, options.gentleMode);
    block.appendChild(label);

    const passageRef = document.createElement('p');
    passageRef.className = 'muted';
    passageRef.textContent = `Refer to Passage ${q.passageId === 'P2' ? '2' : '1'}`;
    block.appendChild(passageRef);

    block.appendChild(createQuestionInput(q, answers[q.id], options.inputFontScale || 1));

    const scheme = document.createElement('div');
    scheme.className = 'scheme';
    scheme.hidden = !showScheme;
    scheme.innerHTML = `<p><strong>Accepted:</strong> ${(q.acceptedAnswers || []).join(' | ')}</p>
      <p><strong>Model (Gold):</strong> ${q.modelAnswerGold || 'Precise answer with clear text evidence.'}</p>
      <p><strong>Model (Silver):</strong> ${q.modelAnswerSilver || 'Mostly correct answer with some evidence.'}</p>
      <p><strong>Notes:</strong> ${q.markingNotes || 'Award based on evidence and correctness.'}</p>`;
    block.appendChild(scheme);

    formEl.appendChild(block);
  });
}

export function readCurrentAnswer(formEl, question) {
  const data = new FormData(formEl);
  return String(data.get(question.id) || '').trim();
}

export function renderReview(test, answers, skippedSet, rootEl, options = {}) {
  rootEl.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'review-list';

  test.questions.forEach((q, idx) => {
    const value = String(answers[q.id] || '').trim();
    const status = value
      ? 'Answered'
      : skippedSet.has(q.id)
        ? 'Skipped'
        : 'Not answered';

    const row = document.createElement('div');
    row.className = `review-row status-${status.toLowerCase().replace(' ', '-')}`;
    row.innerHTML = `<span>${options.gentleMode ? 'Challenge' : 'Q'}${idx + 1}</span><span>${status}</span><button type="button" data-jump="${idx}">Go to question</button>`;
    list.appendChild(row);
  });

  rootEl.appendChild(list);
}

export function renderProgress(currentIndex, totalQuestions, answeredCount, progressFillEl, progressTextEl, options = {}) {
  const value = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  progressFillEl.style.width = `${value}%`;
  const word = options.gentleMode ? 'Challenge' : 'Question';
  progressTextEl.textContent = `${word} ${currentIndex + 1} of ${totalQuestions} · Answered ${answeredCount}/${totalQuestions}`;
}

export function renderTimer(timerEl, totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const mins = String(Math.floor(safe / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  timerEl.textContent = `${mins}:${secs}`;
}

export function toggleSchemes(show, formEl) {
  formEl.querySelectorAll('.scheme').forEach((el) => {
    el.hidden = !show;
  });
}

function normaliseDomainBreakdownForDisplay(breakdown) {
  if (Array.isArray(breakdown)) {
    return breakdown.map((item) => `${item.domain}: ${item.score}/${item.max} (${item.percentage}%)`);
  }

  if (breakdown && typeof breakdown === 'object') {
    return Object.entries(breakdown).map(([domain, value]) => `${domain}: ${value}%`);
  }

  return [];
}

export function renderDiagnostic(root, diagnostic, record) {
  const domainLines = normaliseDomainBreakdownForDisplay(diagnostic.domainBreakdown);
  root.innerHTML = `
    <section class="card">
      <h2>Result</h2>
      <p><strong>Test:</strong> ${record.testId}</p>
      <p><strong>Score:</strong> ${diagnostic.score}/${diagnostic.totalMarks || diagnostic.max}</p>
      <p><strong>Percentage:</strong> ${diagnostic.percentage}%</p>
      <p><strong>Time:</strong> ${diagnostic.timeTakenMinutes || '—'} minutes</p>
      <p><strong>Strengths:</strong> ${(diagnostic.strengths || []).join(', ') || 'None yet'}</p>
      <p><strong>Focus area:</strong> ${diagnostic.focusArea || 'Maintain balanced practice'}</p>
    </section>
    <section class="card">
      <h3>Domain Breakdown</h3>
      <ul>
        ${domainLines.map((line) => `<li>${line}</li>`).join('')}
      </ul>
    </section>
  `;
}

export function renderFeedbackAssist(root, promptText, heading = 'AI Feedback Assist') {
  const safePrompt = String(promptText || '');
  const wrapper = document.createElement('section');
  wrapper.className = 'card';
  wrapper.innerHTML = `
    <h3>${heading}</h3>
    <p class="muted">Use this structured prompt with ChatGPT to generate richer feedback, coaching steps, and follow-up activities.</p>
    <div class="actions">
      <button type="button" id="copyFeedbackPromptBtn">Copy prompt</button>
      <button type="button" id="openFeedbackPromptBtn">Open in ChatGPT</button>
    </div>
    <label for="feedbackPromptBox">Prompt preview</label>
    <textarea id="feedbackPromptBox" rows="10" readonly></textarea>
    <details class="in-app-feedback">
      <summary>Optional in-app OpenAI feedback (experimental)</summary>
      <p class="muted">This module is isolated and can be disabled at any time. If it fails, standard prompt copy/open tools still work.</p>
      <p class="muted"><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">How to create an OpenAI API key</a></p>
      <label class="toggle"><input id="openAIFeedbackToggle" type="checkbox" /> Enable in-app OpenAI feedback</label>
      <div id="inAppFeedbackControls" class="feedback-tools" hidden>
        <input id="openAIApiKeyInput" type="password" placeholder="OpenAI API key (stored in this browser only)" autocomplete="off" />
        <button type="button" id="saveOpenAIApiKeyBtn">Save key</button>
        <button type="button" id="generateInAppFeedbackBtn">Generate in app</button>
      </div>
      <div id="inAppFeedbackOutputWrap" hidden>
        <label for="inAppFeedbackOutput">In-app feedback output</label>
        <pre id="inAppFeedbackOutput"></pre>
      </div>
    </details>
    <p id="feedbackPromptStatus" class="muted"></p>
  `;

  const box = wrapper.querySelector('#feedbackPromptBox');
  if (box) box.value = safePrompt;

  root.appendChild(wrapper);
}

export function renderTracker(bodyEl, trendEl, diffEl, history) {
  bodyEl.innerHTML = '';
  history.forEach((h, idx) => {
    const tr = document.createElement('tr');
    const date = h.completedAt || h.date;
    const maxMarks = h.totalMarks || h.max;
    tr.innerHTML = `<td>${new Date(date).toLocaleDateString('en-GB')}</td><td><a href="./attempt.html?i=${idx}">${h.testId}</a></td><td>${h.score}/${maxMarks}</td><td>${h.percentage}%</td><td>${h.difficulty}</td>`;
    bodyEl.appendChild(tr);
  });

  trendEl.textContent = history.length
    ? `Score trend: ${history.map((h) => `${h.percentage}%`).join(' → ')}`
    : 'No attempts yet.';
  diffEl.textContent = history.length
    ? `Difficulty progression: ${history.map((h) => h.difficulty).join(' → ')}`
    : '';
}

export function renderAttemptReview(root, attempt) {
  const test = attempt.testSnapshot;
  if (!test) {
    root.innerHTML = '<section class="card"><p>Saved test details were not found for this attempt.</p></section>';
    return;
  }

  const answers = attempt.answers || {};
  const questionRows = test.questions.map((q, idx) => {
    const learner = answers[q.id] || '—';
    return `<section class="question">
      <p class="question-title">Q${idx + 1}. ${q.stem}</p>
      <p><strong>Your answer:</strong> ${learner}</p>
      <p><strong>Accepted:</strong> ${(q.acceptedAnswers || []).join(' | ') || '—'}</p>
      <p><strong>Model (Gold):</strong> ${q.modelAnswerGold || '—'}</p>
      <p><strong>Model (Silver):</strong> ${q.modelAnswerSilver || '—'}</p>
      <p><strong>Notes:</strong> ${q.markingNotes || '—'}</p>
    </section>`;
  }).join('');

  root.innerHTML = `
    <section class="card">
      <h2>${test.title}</h2>
      <p><strong>Attempt:</strong> ${new Date(attempt.completedAt || attempt.date).toLocaleString('en-GB')}</p>
      <p><strong>Score:</strong> ${attempt.score}/${attempt.totalMarks || test.totalMarks} (${attempt.percentage}%)</p>
    </section>
    <section class="card"><h3>Passage 1</h3><p>${test.passages?.[0]?.text || '—'}</p></section>
    <section class="card"><h3>Passage 2</h3><p>${test.passages?.[1]?.text || '—'}</p></section>
    <section class="card"><h3>Questions, your answers, and model answers</h3>${questionRows}</section>
  `;
}
