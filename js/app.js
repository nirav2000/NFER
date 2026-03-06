import { generateTest, loadLibraries } from './generator.js';
import { renderTest, renderMarkForm } from './renderer.js';
import { saveCurrentTest, getCurrentTest, saveResult, getLastResult, getHistory } from './storage.js';
import { markTest, createDiagnostic } from './diagnostics.js';
import { renderTracker, attachClear } from './tracker.js';

function byId(id) {
  return document.getElementById(id);
}

function bindMarking(form, test, startTime) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const answers = {};
    for (const [k, v] of data.entries()) answers[k] = String(v);

    const base = markTest(test, answers);
    const diagnostic = createDiagnostic(base);
    const result = {
      ...diagnostic,
      id: test.id,
      date: new Date().toISOString(),
      difficulty: test.difficulty,
      timeTakenMinutes: Math.max(1, Math.round((Date.now() - startTime) / 60000))
    };

    saveResult(result);
    window.location.href = './diagnostic.html';
  });
}

async function initDashboard() {
  const latest = getLastResult();
  const history = getHistory();
  if (byId('latestSummary')) {
    byId('latestSummary').textContent = latest
      ? `Latest score: ${latest.totalScore}/${latest.totalMarks} (${latest.percentage}%)`
      : 'No completed tests yet.';
  }
  if (byId('historyCount')) byId('historyCount').textContent = String(history.length);
}

async function initGenerator() {
  const btn = byId('generateBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const test = await generateTest();
    saveCurrentTest(test);
    window.location.href = './test.html';
  });
}

function initTestPage() {
  const container = byId('testContainer');
  if (!container) return;

  const test = getCurrentTest();
  if (!test) {
    container.innerHTML = '<div class="card">No test generated yet. Go to Generate Test first.</div>';
    return;
  }

  renderTest(container, test, { includeAnswers: false });

  const answerArea = byId('quickAnswerContainer');
  if (answerArea) {
    const form = renderMarkForm(answerArea, test, 'quickMarkForm');
    bindMarking(form, test, Date.now());
  }
}

function initTeacherGuidePage() {
  const container = byId('teacherGuideContainer');
  if (!container) return;

  const test = getCurrentTest();
  if (!test) {
    container.innerHTML = '<div class="card">No test generated yet.</div>';
    return;
  }

  renderTest(container, test, { includeAnswers: true });
}

function initMarkPage() {
  const wrap = byId('markContainer');
  if (!wrap) return;

  const test = getCurrentTest();
  if (!test) {
    wrap.innerHTML = '<div class="card">No test generated yet.</div>';
    return;
  }

  const form = renderMarkForm(wrap, test, 'markForm');
  bindMarking(form, test, Date.now());
}

function initDiagnosticPage() {
  const out = byId('diagnosticOutput');
  if (!out) return;

  const result = getLastResult();
  if (!result) {
    out.innerHTML = '<div class="card">No marked test found.</div>';
    return;
  }

  out.innerHTML = `
    <div class="card">
      <h2>Diagnostic Report</h2>
      <p><strong>Total score:</strong> ${result.totalScore}/${result.totalMarks} (${result.percentage}%)</p>
      <p><strong>Strengths:</strong> ${result.strengths.join(', ') || 'None yet'}</p>
      <p><strong>Development areas:</strong> ${result.developmentAreas.join(', ') || 'None'}</p>
      <p><strong>Recommended next focus:</strong> ${result.recommendedNextFocus}</p>
    </div>
  `;

  const table = byId('domainTable');
  if (table) {
    table.innerHTML = '';
    result.domainBreakdown.forEach((d) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d.domain}</td><td>${d.score}/${d.marks}</td><td>${d.percentage}%</td>`;
      table.appendChild(tr);
    });
  }
}

function initTrackerPage() {
  const tbody = byId('trackerBody');
  if (!tbody) return;
  renderTracker(tbody, byId('trackerWarning'));
  attachClear(byId('clearHistoryBtn'), () => renderTracker(tbody, byId('trackerWarning')));
}

async function initPassageLibraryPage() {
  const body = byId('passageTableBody');
  if (!body) return;

  const { fiction, nonFiction } = await loadLibraries();
  [...fiction, ...nonFiction].forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.id}</td><td>${p.title}</td><td>${p.genre}</td><td>${p.topic}</td><td>${p.difficulty}</td><td>${p.wordCount}</td>`;
    body.appendChild(tr);
  });
}

async function initQuestionLibraryPage() {
  const body = byId('questionTableBody');
  if (!body) return;

  const { fictionQs, nonFictionQs } = await loadLibraries();
  const all = [...fictionQs, ...nonFictionQs];
  byId('questionSummary').textContent = `Total questions: ${all.length}`;

  all.forEach((q) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${q.id}</td><td>${q.passageId}</td><td>${q.domain}</td><td>${q.fineSkillTag}</td><td>${q.questionType}</td><td>${q.marks}</td>`;
    body.appendChild(tr);
  });
}

initDashboard();
initGenerator();
initTestPage();
initTeacherGuidePage();
initMarkPage();
initDiagnosticPage();
initTrackerPage();
initPassageLibraryPage();
initQuestionLibraryPage();
