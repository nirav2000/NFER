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

function inferHighQualityFallback(q) {
  if (q.questionType === 'mcq') {
    return {
      gold: `The correct option is selected and matches the context of the question: ${q.acceptedAnswers?.[0] || 'accepted answer'}.`,
      silver: 'A plausible option is chosen but does not match all context clues.',
      wrong: 'An option is chosen that contradicts passage evidence.'
    };
  }

  return {
    gold: 'Clear answer with precise text evidence and an explicit link back to the question focus.',
    silver: 'Partly correct answer with limited evidence or explanation.',
    wrong: 'General or copied response without relevant evidence.'
  };
}

function renderModelAnswerScheme(q) {
  const fallback = inferHighQualityFallback(q);
  return `
    <details class="scheme-block" open>
      <summary>Mark scheme and model answers</summary>
      <p><strong>Marking notes:</strong> ${q.markingNotes || 'Award marks for relevant points grounded in the passage, accepting clear equivalents.'}</p>
      <p><strong>Gold model answer:</strong> ${q.modelAnswerGold || fallback.gold}</p>
      <p><strong>Silver model answer:</strong> ${q.modelAnswerSilver || fallback.silver}</p>
      <p><strong>Common wrong answer:</strong> ${q.commonWrongAnswer || fallback.wrong}</p>
      <p><strong>Accepted keywords:</strong> ${(q.acceptedAnswers || []).join(' | ')}</p>
    </details>
  `;
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
      li.insertAdjacentHTML('beforeend', renderModelAnswerScheme(q));
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
    label.className = 'question-stem';
    label.innerHTML = `${idx + 1}. ${domainBadge(q.domain)} ${q.stem}`;
    block.appendChild(label);

    if (q.questionType === 'mcq') {
      const radioWrap = document.createElement('div');
      radioWrap.className = 'radio-wrap';
      q.options.forEach((opt, i) => {
        const row = document.createElement('label');
        row.className = 'radio-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = q.id;
        input.value = opt;
        input.id = `${formId}_ans_${q.id}_${i}`;

        const text = document.createElement('span');
        text.textContent = opt;

        row.appendChild(input);
        row.appendChild(text);
        radioWrap.appendChild(row);
      });
      block.appendChild(radioWrap);
    } else {
      const input = document.createElement('textarea');
      input.rows = 4;
      input.placeholder = 'Type your answer here...';
      input.id = `${formId}_ans_${q.id}`;
      input.name = q.id;
      block.appendChild(input);
    }

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
