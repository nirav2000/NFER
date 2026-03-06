export function markTest(test, answersByQuestionId) {
  let totalScore = 0;
  let totalMarks = 0;
  const domainScores = {};

  for (const question of test.questions) {
    const answer = (answersByQuestionId[question.id] || '').trim().toLowerCase();
    const accepted = (question.acceptedAnswers || []).map((a) => a.toLowerCase());
    const domain = question.domain;
    totalMarks += question.marks;
    if (!domainScores[domain]) domainScores[domain] = { score: 0, marks: 0 };
    domainScores[domain].marks += question.marks;

    let earned = 0;
    if (question.questionType === 'mcq') {
      if (accepted.includes(answer)) earned = question.marks;
    } else {
      if (accepted.some((key) => answer.includes(key))) {
        earned = question.marks;
      } else if (answer.length > 18) {
        earned = Math.max(1, question.marks - 1);
      }
    }
    totalScore += earned;
    domainScores[domain].score += earned;
  }

  const percentage = totalMarks ? Math.round((totalScore / totalMarks) * 100) : 0;
  return { totalScore, totalMarks, percentage, domainScores };
}

export function difficultyFromHistory(history) {
  const latest = history[history.length - 1];
  if (!latest) return 'standard';
  const p = latest.percentage;
  if (p >= 85) return 'stretch';
  if (p >= 70) return 'standard';
  if (p >= 50) return 'supported';
  return 'foundation';
}

export function createDiagnostic(result) {
  const weak = [];
  const strong = [];
  const breakdown = Object.entries(result.domainScores).map(([domain, v]) => {
    const pct = v.marks ? Math.round((v.score / v.marks) * 100) : 0;
    if (pct < 60) weak.push(domain);
    if (pct >= 75) strong.push(domain);
    return { domain, ...v, percentage: pct };
  });

  const nextFocus = weak.length
    ? `Focus next on ${weak[0]} with short daily practice.`
    : 'Maintain challenge with mixed-domain inference practice.';

  return {
    totalScore: result.totalScore,
    totalMarks: result.totalMarks,
    percentage: result.percentage,
    domainBreakdown: breakdown,
    strengths: strong,
    developmentAreas: weak,
    recommendedNextFocus: nextFocus
  };
}
