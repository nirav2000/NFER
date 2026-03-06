export function markTest(test, userAnswers) {
  let score = 0;
  let max = 0;
  const domainBreakdown = {};

  for (const q of test.questions) {
    const domain = q.domain;
    const marks = Number(q.marks || 0);
    max += marks;

    if (!domainBreakdown[domain]) domainBreakdown[domain] = { score: 0, max: 0 };
    domainBreakdown[domain].max += marks;

    const accepted = (q.acceptedAnswers || []).map((a) => String(a).trim().toLowerCase());
    const ans = String(userAnswers[q.id] || '').trim().toLowerCase();

    let earned = 0;
    if (accepted.includes(ans)) {
      earned = marks;
    } else if (q.questionType !== 'mcq' && ans.length > 20) {
      earned = Math.min(1, marks);
    }

    score += earned;
    domainBreakdown[domain].score += earned;
  }

  const percentage = max ? Math.round((score / max) * 100) : 0;
  const byDomain = Object.entries(domainBreakdown).map(([domain, d]) => ({
    domain,
    score: d.score,
    max: d.max,
    percentage: d.max ? Math.round((d.score / d.max) * 100) : 0
  }));

  return { score, max, percentage, domainBreakdown: byDomain };
}

export function buildDiagnostic(marked) {
  const sorted = [...marked.domainBreakdown].sort((a, b) => b.percentage - a.percentage);
  return {
    ...marked,
    strengths: sorted.filter((d) => d.percentage >= 70).map((d) => d.domain),
    focusArea: sorted.find((d) => d.percentage < 60)?.domain || 'Maintain balanced practice'
  };
}
