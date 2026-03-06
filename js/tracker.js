import { getHistory, clearHistory } from './storage.js';

export function renderTracker(tableBody, warningEl) {
  const history = getHistory();
  tableBody.innerHTML = '';

  history.forEach((row) => {
    const tr = document.createElement('tr');
    const lowDomains = (row.domainBreakdown || []).filter((d) => d.percentage < 60).map((d) => d.domain).join(', ');
    tr.innerHTML = `
      <td>${new Date(row.date).toLocaleDateString('en-GB')}</td>
      <td>${row.totalScore}/${row.totalMarks}</td>
      <td>${row.percentage}%</td>
      <td>${row.difficulty}</td>
      <td>${row.timeTakenMinutes} mins</td>
      <td>${lowDomains || '—'}</td>
    `;
    tableBody.appendChild(tr);
  });

  const below60 = history.flatMap((h) => h.domainBreakdown || []).filter((d) => d.percentage < 60);
  warningEl.textContent = below60.length
    ? 'Alert: some domain scores are below 60%. Prioritise targeted practice.'
    : 'Great: no domains currently below 60%.';
}

export function attachClear(button, onDone) {
  button.addEventListener('click', () => {
    clearHistory();
    onDone();
  });
}
