function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normaliseQuestionType(type) {
  return type === 'mcq' ? 'mcq' : 'short-answer';
}

function mapUnitQuestion(question, index) {
  const mappedType = normaliseQuestionType(question.questionType);
  const accepted = toArray(question.acceptedAnswers);
  const correct = question.correctAnswer == null ? [] : [String(question.correctAnswer)];

  return {
    id: question.questionId || `Q${index + 1}`,
    questionNumber: question.questionNumber || index + 1,
    passageId: 'P1',
    domain: question.domain || 'inference',
    questionType: mappedType,
    marks: Number(question.marks || 1),
    difficulty: Number(question.difficulty || 3),
    stem: question.stem || 'Question text missing',
    options: mappedType === 'mcq' ? toArray(question.options) : [],
    acceptedAnswers: accepted.length ? accepted : correct,
    modelAnswerGold: question.modelAnswerGold || '',
    modelAnswerSilver: question.modelAnswerSilver || '',
    markingNotes: question.markScheme
      ? Object.entries(question.markScheme).map(([k, v]) => `${k}: ${v}`).join(' | ')
      : '',
    requiresManualReview: Boolean(question.requiresManualReview)
  };
}

function mapUnitToLegacyTest(unit) {
  const questions = toArray(unit.coreQuestions).map(mapUnitQuestion);
  const domainsCovered = [...new Set(questions.map((q) => q.domain).filter(Boolean))];

  return {
    id: unit.unitId || `U${unit.unitNumber || 1}`,
    title: unit.title || 'Reading Session',
    week: unit.week,
    sequence: unit.unitNumber,
    difficulty: Number(unit.difficulty || 3),
    totalMarks: Number(unit.totalCoreMarks || unit.marks?.core || questions.reduce((sum, q) => sum + (q.marks || 0), 0)),
    questionCount: questions.length,
    topicsCovered: [unit.topic, unit.subtopic].filter(Boolean),
    domainsCovered,
    passageGenres: [unit.genre].filter(Boolean),
    passages: [
      { id: 'P1', text: unit.passage?.text || 'Passage missing' },
      { id: 'P2', text: 'This session includes one passage only.' }
    ],
    questions
  };
}

function isLegacyLibraryShape(raw) {
  return raw && Array.isArray(raw.tests);
}

function isSingleUnitShape(raw) {
  return raw && raw.unitId && raw.passage && Array.isArray(raw.coreQuestions);
}

function isV6UnitLibraryShape(raw) {
  return raw && raw.structure && Array.isArray(raw.structure.units);
}

function isSchemaDefinitionOnly(raw) {
  return raw && (raw.unitSchema || raw.structure?.units?.length === 0) && !Array.isArray(raw.tests) && !raw.unitId;
}

export function inspectLibraryCompatibility(rawLibrary) {
  if (isLegacyLibraryShape(rawLibrary)) {
    return { supported: true, format: 'legacy-tests', version: rawLibrary.version || 'unknown' };
  }

  if (isSingleUnitShape(rawLibrary)) {
    return { supported: true, format: 'single-unit', version: rawLibrary.version || '7.0-compatible' };
  }

  if (isV6UnitLibraryShape(rawLibrary)) {
    return { supported: true, format: 'unit-library', version: rawLibrary.version || '6.0' };
  }

  if (isSchemaDefinitionOnly(rawLibrary)) {
    return {
      supported: false,
      format: 'schema-definition',
      version: rawLibrary.version || 'unknown',
      reason: 'Schema definition file only (no units/tests payload).'
    };
  }

  return {
    supported: false,
    format: 'unknown',
    version: rawLibrary?.version || rawLibrary?.schemaVersion || 'unknown',
    reason: 'Unsupported JSON shape. Extend js/schemaAdapter.js to map this schema.'
  };
}

export function normaliseLibrarySchema(rawLibrary) {
  if (isLegacyLibraryShape(rawLibrary)) return rawLibrary;

  if (isSingleUnitShape(rawLibrary)) {
    return {
      version: rawLibrary.version || 'v6-adapted',
      yearGroup: rawLibrary.yearGroup || 4,
      libraryTitle: 'Single Unit Import',
      tests: [mapUnitToLegacyTest(rawLibrary)]
    };
  }

  if (isV6UnitLibraryShape(rawLibrary)) {
    const units = rawLibrary.structure.units.map(mapUnitToLegacyTest);
    return {
      version: rawLibrary.version || '6.0',
      yearGroup: rawLibrary.yearGroup || 4,
      libraryTitle: rawLibrary.libraryTitle || 'Year 4 Single Passage Library',
      tests: units
    };
  }

  return rawLibrary;
}
