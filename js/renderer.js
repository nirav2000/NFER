const domainMeta = {
  retrieval: { icon: '🔎', className: 'domain-retrieval' },
  vocabulary: { icon: '🧠', className: 'domain-vocabulary' },
  inference: { icon: '💡', className: 'domain-inference' },
  structure: { icon: '🧱', className: 'domain-structure' },
  authorIntent: { icon: '✍️', className: 'domain-author' }
};

function domainBadge(domain) {
  const meta = domainMeta[domain] || { icon: '•', className: 'domain-generic' };
  return `<span class="domain-chip ${meta.className}" title="${domain}">${meta.icon}</span>`;
}

export function renderTest(container, test, { includeAnswers = false } = {}) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'card';
  header.innerHTML = `
    <h2>Generated Test</h2>
    <p><strong>Difficulty:</strong> ${test.difficulty} · <strong>Total marks:</strong> ${test.totalMarks}</p>
    <p class="muted">This generated test uses one passage. All questions below refer to this passage.</p>
  `;
  container.appendChild(header);

  const p = test.passages[0];
  const sec = document.createElement('section');
  sec.className = 'card passage-card';
  sec.innerHTML = `
    <h3>${p.title} (${p.genre})</h3>
    <p class="muted"><strong>Year:</strong> ${p.yearGroup} · <strong>Word count:</strong> ${p.wordCount}</p>
    <p class="passage-text">${p.text}</p>
  `;
  container.appendChild(sec);

  const qWrap = document.createElement('section');
  qWrap.className = 'card';
  qWrap.innerHTML = '<h3>Questions</h3>';
  const ol = document.createElement('ol');
  ol.className = 'questions-list';

  test.questions.forEach((q) => {
    const li = document.createElement('li');
    li.className = 'question-item';
    li.innerHTML = `<p class="question-stem">${domainBadge(q.domain)} ${q.stem} <em>(${q.marks} marks)</em></p>`;

    if (q.options && q.options.length) {
      const ul = document.createElement('ul');
      ul.className = 'option-list';
      q.options.forEach((opt) => {
        const oi = document.createElement('li');
        oi.textContent = opt;
        ul.appendChild(oi);
      });
      li.appendChild(ul);
    }

    if (includeAnswers) {
      const a = document.createElement('p');
      a.className = 'answer-key';
      a.textContent = `Accepted: ${q.acceptedAnswers.join(' | ')}`;
      li.appendChild(a);
    }

    ol.appendChild(li);
  });

  qWrap.appendChild(ol);
  container.appendChild(qWrap);
}

export function renderMarkForm(container, test, formId = 'markForm') {
  container.innerHTML = '';
  const form = document.createElement('form');
  form.id = formId;

  test.questions.forEach((q, idx) => {
    const block = document.createElement('div');
    block.className = 'card question-item';

    const label = document.createElement('label');
    label.htmlFor = `${formId}_ans_${q.id}`;
    label.className = 'question-stem';
    label.innerHTML = `${idx + 1}. ${domainBadge(q.domain)} ${q.stem}`;

    let input;
    if (q.questionType === 'mcq') {
      input = document.createElement('select');
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = 'Select one answer';
      input.appendChild(ph);
      q.options.forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else {
      input = document.createElement('textarea');
      input.rows = 4;
      input.placeholder = 'Type your answer here...';
    }

    input.id = `${formId}_ans_${q.id}`;
    input.name = q.id;

    block.appendChild(label);
    block.appendChild(input);
    form.appendChild(block);
  });

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Submit and Mark';
  btn.className = 'no-print';
  form.appendChild(btn);

  container.appendChild(form);
  return form;
}
