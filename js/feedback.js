function cleanText(value) {
  return String(value || '').trim();
}

function safeLines(value) {
  return cleanText(value).replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean);
}

function buildQuestionSummary(question, answer = '') {
  return {
    id: question.id,
    domain: question.domain,
    questionType: question.questionType,
    marks: question.marks,
    stem: question.stem,
    learnerAnswer: cleanText(answer),
    acceptedAnswers: question.acceptedAnswers || [],
    modelAnswerGold: question.modelAnswerGold || '',
    modelAnswerSilver: question.modelAnswerSilver || '',
    markingNotes: question.markingNotes || ''
  };
}

export function createFeedbackPrompt({ test, result, answers }) {
  if (!test) return '';

  const payload = {
    context: {
      app: 'NFER Reading Builder',
      testId: test.id,
      title: test.title,
      difficulty: test.difficulty,
      topicsCovered: test.topicsCovered || [],
      domainsCovered: test.domainsCovered || [],
      score: result?.score,
      totalMarks: result?.totalMarks || result?.max,
      percentage: result?.percentage,
      timeTakenMinutes: result?.timeTakenMinutes,
      domainBreakdown: result?.domainBreakdown || {}
    },
    passages: (test.passages || []).map((passage, index) => ({
      passageId: passage.id || `P${index + 1}`,
      title: passage.title || `Passage ${index + 1}`,
      genre: passage.genre || '',
      text: cleanText(passage.text)
    })),
    questions: (test.questions || []).map((question) => buildQuestionSummary(question, answers?.[question.id]))
  };

  return [
    'You are an expert UK Year 4 reading tutor. Analyse this completed reading task and return feedback in JSON only.',
    '',
    'Goals:',
    '- Give actionable pupil-friendly feedback in British English.',
    '- Identify strengths, misconceptions, and precise next steps.',
    '- Include teaching tips for parent/tutor and one short follow-up task per weak domain.',
    '',
    'Required JSON output schema:',
    '{',
    '  "overallSummary": "...",',
    '  "strengths": ["..."],',
    '  "priorityImprovements": ["..."],',
    '  "domainFeedback": [',
    '    {',
    '      "domain": "retrieval|vocabulary|inference|structure|authorIntent",',
    '      "whatWentWell": "...",',
    '      "whatToImprove": "...",',
    '      "nextPracticeTask": "..."',
    '    }',
    '  ],',
    '  "questionLevelNotes": [',
    '    {',
    '      "questionId": "...",',
    '      "verdict": "correct|partially_correct|incorrect",',
    '      "feedback": "...",',
    '      "improvedAnswerExample": "..."',
    '    }',
    '  ],',
    '  "coachScript": {',
    '    "start": "1-2 sentence encouragement",',
    '    "midLessonPrompt": "...",',
    '    "finish": "..."',
    '  }',
    '}',
    '',
    'Input payload:',
    JSON.stringify(payload, null, 2)
  ].join('\n');
}

export function openPromptInChatGPT(promptText) {
  const prompt = cleanText(promptText);
  if (!prompt) return;
  const target = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  window.open(target, '_blank', 'noopener,noreferrer');
}

export function copyPrompt(promptText) {
  return navigator.clipboard.writeText(cleanText(promptText));
}

export function summariseFeedbackPreview(promptText) {
  const lines = safeLines(promptText);
  return lines.slice(0, 4).join(' ');
}
