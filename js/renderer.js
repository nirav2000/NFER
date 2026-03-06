export function renderTest(container, test, { includeAnswers = false } = {}) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'card';
  header.innerHTML = `<h2>Generated Test</h2><p><strong>Difficulty:</strong> ${test.difficulty} | <strong>Total marks:</strong> ${test.totalMarks}</p>`;
  container.appendChild(header);

  test.passages.forEach((p, idx) => {
    const sec = document.createElement('section');
    sec.className = 'card';
    sec.innerHTML = `<h3>Passage ${idx + 1}: ${p.title} (${p.genre})</h3><p><strong>Year:</strong> ${p.yearGroup} | <strong>Word count:</strong> ${p.wordCount}</p><p>${p.text}</p>`;
    container.appendChild(sec);
  });

  const qWrap = document.createElement('section');
  qWrap.className = 'card';
  qWrap.innerHTML = '<h3>Questions</h3>';
  const ol = document.createElement('ol');
  test.questions.forEach((q) => {
    const li = document.createElement('li');
    li.className = 'question-item';
    li.innerHTML = `<p><strong>[${q.domain}]</strong> ${q.stem} <em>(${q.marks} marks)</em></p>`;

    if (q.options && q.options.length) {
      const ul = document.createElement('ul');
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

export function renderMarkForm(container, test) {
  container.innerHTML = '';
  const form = document.createElement('form');
  form.id = 'markForm';

  test.questions.forEach((q, idx) => {
    const block = document.createElement('div');
    block.className = 'card question-item';
    const label = document.createElement('label');
    label.htmlFor = `ans_${q.id}`;
    label.innerHTML = `${idx + 1}. <strong>[${q.domain}]</strong> ${q.stem}`;

    const input = document.createElement(q.questionType === 'mcq' ? 'select' : 'textarea');
    input.id = `ans_${q.id}`;
    input.name = q.id;

    if (q.questionType === 'mcq') {
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = 'Select answer';
      input.appendChild(ph);
      q.options.forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else {
      input.rows = 3;
      input.placeholder = 'Type your answer here...';
    }

    block.appendChild(label);
    block.appendChild(input);
    form.appendChild(block);
  });

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Mark Test';
  btn.className = 'no-print';
  form.appendChild(btn);
  container.appendChild(form);
  return form;
}
