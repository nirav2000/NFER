import { difficultyFromHistory } from './diagnostics.js';
import { getHistory } from './storage.js';

async function loadJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function sample(arr, count) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export async function generateTest() {
  const [fiction, nonFiction, fictionQs, nonFictionQs] = await Promise.all([
    loadJson('./data/passages/year4-fiction.json'),
    loadJson('./data/passages/year4-nonfiction.json'),
    loadJson('./data/questions/year4-fiction-questions.json'),
    loadJson('./data/questions/year4-nonfiction-questions.json')
  ]);

  const history = getHistory();
  const difficultyBand = difficultyFromHistory(history);

  const selectedPassages = [
    sample(fiction, 1)[0],
    sample(nonFiction, 1)[0]
  ];
  const ids = new Set(selectedPassages.map((p) => p.id));
  const relevant = [...fictionQs, ...nonFictionQs].filter((q) => ids.has(q.passageId));

  const distribution = { retrieval: 3, vocabulary: 2, inference: 4, structure: 1, authorIntent: 2 };
  const questions = [];
  const usedFine = new Set();

  for (const [domain, needed] of Object.entries(distribution)) {
    const pool = relevant.filter((q) => q.domain === domain).sort((a, b) => a.difficulty - b.difficulty);
    const tuned = difficultyBand === 'stretch'
      ? [...pool].reverse()
      : difficultyBand === 'foundation'
      ? [...pool]
      : pool;

    for (const q of tuned) {
      if (questions.length >= 12) break;
      if (questions.filter((x) => x.domain === domain).length >= needed) continue;
      if (usedFine.has(q.fineSkillTag) && tuned.some((x) => x.fineSkillTag !== q.fineSkillTag)) continue;
      questions.push(q);
      usedFine.add(q.fineSkillTag);
    }
  }

  while (questions.length < 12) {
    const candidate = relevant[Math.floor(Math.random() * relevant.length)];
    if (!questions.find((q) => q.id === candidate.id)) questions.push(candidate);
  }

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  return {
    id: `test-${Date.now()}`,
    createdAt: new Date().toISOString(),
    difficulty: difficultyBand,
    passages: selectedPassages,
    questions,
    totalMarks,
    targetTimeMinutes: 35
  };
}
