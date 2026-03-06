function createQuestionInput(q, answerValue) {
  if (q.questionType === 'mcq') {
    const wrap = document.createElement('div');
    wrap.className = 'radio-group';
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
  return ta;
}

export function renderDashboardMeta(el, library) {
  el.textContent = `Year ${library.yearGroup} library loaded. Tests available: ${library.tests.length}.`;
}

export function renderTestMeta(test, refs) {
  refs.meta.innerHTML = `<h2>${test.title}</h2><p><strong>Test ID:</strong> ${test.id} · <strong>Difficulty:</strong> ${test.difficulty} · <strong>Total marks:</strong> ${test.totalMarks}</p><p class="muted">This assessment includes two passages. Questions indicate which passage to refer to.</p>`;
  refs.passage1.textContent = test.passages?.[0]?.text || 'Passage 1 missing';
  refs.passage2.textContent = test.passages?.[1]?.text || 'Passage 2 missing';
}

export function renderQuestion(test, index, answerValue, showScheme, formEl) {
  const q = test.questions[index];
  formEl.innerHTML = '';

  const block = document.createElement('section');
  block.className = 'question';

  const label = document.createElement('label');
  label.textContent = `${index + 1}. ${q.stem} (${q.marks} marks)`;
  block.appendChild(label);

  const passageRef = document.createElement('p');
  passageRef.className = 'muted';
  passageRef.textContent = `Refer to Passage ${q.passageId === 'P2' ? '2' : '1'}`;
  block.appendChild(passageRef);

  block.appendChild(createQuestionInput(q, answerValue));

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

export function readCurrentAnswer(formEl, question) {
  const data = new FormData(formEl);
  return String(data.get(question.id) || '').trim();
}

export function renderReview(test, answers, skippedSet, rootEl) {
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
    row.innerHTML = `<span>Q${idx + 1}</span><span>${status}</span><button type="button" data-jump="${idx}">Go to question</button>`;
    list.appendChild(row);
  });

  rootEl.appendChild(list);
}

export function renderProgress(currentIndex, totalQuestions, answeredCount, progressFillEl, progressTextEl) {
  const value = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  progressFillEl.style.width = `${value}%`;
  progressTextEl.textContent = `Question ${currentIndex + 1} of ${totalQuestions} · Answered ${answeredCount}/${totalQuestions}`;
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

export function renderDiagnostic(root, diagnostic, record) {
  root.innerHTML = `
    <section class="card">
      <h2>Result</h2>
      <p><strong>Test:</strong> ${record.testId}</p>
      <p><strong>Score:</strong> ${diagnostic.score}/${diagnostic.max}</p>
      <p><strong>Percentage:</strong> ${diagnostic.percentage}%</p>
      <p><strong>Strengths:</strong> ${diagnostic.strengths.join(', ') || 'None yet'}</p>
      <p><strong>Focus area:</strong> ${diagnostic.focusArea}</p>
    </section>
    <section class="card">
      <h3>Domain Breakdown</h3>
      <ul>
        ${diagnostic.domainBreakdown.map((d) => `<li>${d.domain}: ${d.score}/${d.max} (${d.percentage}%)</li>`).join('')}
      </ul>
    </section>
  `;
}

export function renderTracker(bodyEl, trendEl, diffEl, history) {
  bodyEl.innerHTML = '';
  history.forEach((h) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${new Date(h.date).toLocaleDateString('en-GB')}</td><td>${h.testId}</td><td>${h.score}/${h.max}</td><td>${h.percentage}%</td><td>${h.difficulty}</td>`;
    bodyEl.appendChild(tr);
  });

  trendEl.textContent = history.length
    ? `Score trend: ${history.map((h) => h.percentage + '%').join(' → ')}`
    : 'No attempts yet.';
  diffEl.textContent = history.length
    ? `Difficulty progression: ${history.map((h) => h.difficulty).join(' → ')}`
    : '';
}
