import { difficultyFromHistory } from './diagnostics.js';
import { getHistory } from './storage.js';

async function loadJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function sampleOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createSyntheticQuestion(passage, domain, idx, difficulty) {
  const templates = {
    retrieval: {
      questionType: 'short',
      marks: 1,
      stem: `Find one detail from '${passage.title}' that supports the main idea.`,
      acceptedAnswers: ['detail', 'evidence', passage.topic.toLowerCase()],
      fineSkillTag: 'locating-evidence',
      gold: `One clear detail is identified and linked directly to the passage focus on ${passage.topic}.`,
      silver: 'A valid detail is identified but the explanation is brief.',
      wrong: 'Vague statement with no text detail.'
    },
    vocabulary: {
      questionType: 'mcq',
      marks: 1,
      stem: 'Which word is closest in meaning to "careful" in the passage?',
      options: ['thoughtful', 'reckless', 'silent', 'distant'],
      acceptedAnswers: ['thoughtful'],
      fineSkillTag: 'meaning-in-context',
      gold: 'Thoughtful is the best synonym because the passage suggests considered actions and decisions.',
      silver: 'Thoughtful is correct.',
      wrong: 'Choosing a word that does not match context clues.'
    },
    inference: {
      questionType: 'short',
      marks: 2,
      stem: `What can you infer about the situation in '${passage.title}'? Use evidence from the text.`,
      acceptedAnswers: ['because', 'evidence', 'suggests'],
      fineSkillTag: 'multi-cue-inference',
      gold: 'A likely inference is stated and supported with a clear text reference.',
      silver: 'A plausible inference is given with limited or general evidence.',
      wrong: 'An opinion is given with no supporting evidence from the passage.'
    },
    structure: {
      questionType: 'short',
      marks: 1,
      stem: 'How does the order of ideas help the reader understand the text?',
      acceptedAnswers: ['order', 'sequence', 'paragraph'],
      fineSkillTag: 'text-organisation',
      gold: 'The response explains sequence (opening, development, conclusion) and how it supports understanding.',
      silver: 'Mentions order but gives limited explanation.',
      wrong: 'Describes content only, not structure.'
    },
    authorIntent: {
      questionType: 'short',
      marks: 2,
      stem: 'Why did the writer include this topic for Year 4 readers?',
      acceptedAnswers: ['inform', 'engage', 'encourage'],
      fineSkillTag: 'author-purpose',
      gold: 'Purpose is identified and linked to Year 4 audience interests/learning needs.',
      silver: 'Purpose is identified but audience link is brief.',
      wrong: 'Retells facts without discussing writer purpose.'
    }
  };

  const t = templates[domain];
  return {
    id: `syn-${passage.id}-${domain}-${idx}`,
    passageId: passage.id,
    domain,
    fineSkillTag: t.fineSkillTag,
    difficulty,
    marks: t.marks,
    questionType: t.questionType,
    stem: t.stem,
    options: t.options || [],
    acceptedAnswers: t.acceptedAnswers,
    markingNotes: 'Accept equivalent responses grounded in the passage.',
    modelAnswerGold: t.gold,
    modelAnswerSilver: t.silver,
    commonWrongAnswer: t.wrong
  };
}

export async function loadLibraries() {
  const [fiction, nonFiction, fictionQs, nonFictionQs] = await Promise.all([
    loadJson('./data/passages/year4-fiction.json'),
    loadJson('./data/passages/year4-nonfiction.json'),
    loadJson('./data/questions/year4-fiction-questions.json'),
    loadJson('./data/questions/year4-nonfiction-questions.json')
  ]);
  return { fiction, nonFiction, fictionQs, nonFictionQs };
}

export async function generateTest() {
  const { fiction, nonFiction, fictionQs, nonFictionQs } = await loadLibraries();
  const history = getHistory();
  const difficultyBand = difficultyFromHistory(history);

  const preferGenre = history.length % 2 === 0 ? 'fiction' : 'nonfiction';
  const passage = preferGenre === 'fiction' ? sampleOne(fiction) : sampleOne(nonFiction);
  const bank = preferGenre === 'fiction' ? fictionQs : nonFictionQs;
  const passageQuestions = bank.filter((q) => q.passageId === passage.id);

  const distribution = { retrieval: 3, vocabulary: 2, inference: 4, structure: 1, authorIntent: 2 };
  const selected = [];

  for (const [domain, needed] of Object.entries(distribution)) {
    const pool = passageQuestions.filter((q) => q.domain === domain);
    const ordered =
      difficultyBand === 'stretch'
        ? [...pool].sort((a, b) => b.difficulty - a.difficulty)
        : [...pool].sort((a, b) => a.difficulty - b.difficulty);

    for (const q of ordered) {
      if (selected.filter((x) => x.domain === domain).length >= needed) break;
      selected.push(q);
    }

    while (selected.filter((x) => x.domain === domain).length < needed) {
      const idx = selected.filter((x) => x.domain === domain).length + 1;
      selected.push(createSyntheticQuestion(passage, domain, idx, passage.difficulty));
    }
  }

  const totalMarks = selected.reduce((s, q) => s + q.marks, 0);
  return {
    id: `test-${Date.now()}`,
    createdAt: new Date().toISOString(),
    difficulty: difficultyBand,
    passages: [passage],
    questions: selected,
    totalMarks,
    targetTimeMinutes: 25,
    scaffolded: difficultyBand === 'supported' || difficultyBand === 'foundation'
  };
}
