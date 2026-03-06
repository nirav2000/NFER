function createQuestionInput(q) {
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
  ta.rows = 3;
  ta.placeholder = 'Type your answer';
  return ta;
}

export function renderDashboardMeta(el, library) {
  el.textContent = `Year ${library.yearGroup} library loaded. Tests available: ${library.tests.length}.`;
}

export function renderTestPage(test, refs) {
  refs.meta.innerHTML = `<h2>${test.title}</h2><p><strong>Test ID:</strong> ${test.id} · <strong>Difficulty:</strong> ${test.difficulty} · <strong>Total marks:</strong> ${test.totalMarks}</p>`;
  refs.passage1.textContent = test.passages?.[0]?.text || 'Passage 1 missing';
  refs.passage2.textContent = test.passages?.[1]?.text || 'Passage 2 missing';

  refs.form.innerHTML = '';
  test.questions.forEach((q, i) => {
    const block = document.createElement('section');
    block.className = 'question';
    const label = document.createElement('label');
    label.textContent = `${i + 1}. ${q.stem} (${q.marks} marks)`;
    block.appendChild(label);
    block.appendChild(createQuestionInput(q));

    const scheme = document.createElement('div');
    scheme.className = 'scheme';
    scheme.hidden = true;
    scheme.innerHTML = `<p><strong>Accepted:</strong> ${(q.acceptedAnswers || []).join(' | ')}</p>
      <p><strong>Model (Gold):</strong> ${q.modelAnswerGold || 'Precise answer with clear text evidence.'}</p>
      <p><strong>Model (Silver):</strong> ${q.modelAnswerSilver || 'Mostly correct answer with some evidence.'}</p>
      <p><strong>Notes:</strong> ${q.markingNotes || 'Award based on evidence and correctness.'}</p>`;
    block.appendChild(scheme);

    refs.form.appendChild(block);
  });
}

export function collectAnswers(form, test) {
  const data = new FormData(form);
  const answers = {};
  for (const q of test.questions) {
    answers[q.id] = String(data.get(q.id) || '');
  }
  return answers;
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
