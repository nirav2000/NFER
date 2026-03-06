const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function main() {
  const passagesDir = path.join(__dirname, '..', 'data', 'passages');
  const fiction = readJson(path.join(passagesDir, 'fiction', 'cave_story.json'));
  const nonfiction = readJson(path.join(passagesDir, 'nonfiction', 'deep_sea.json'));
  const selectedPassage = pickRandom([fiction, nonfiction]);

  const questionsPath = path.join(
    __dirname,
    '..',
    'data',
    'questions',
    `${selectedPassage.id}_questions.json`
  );
  const questionSet = readJson(questionsPath);

  const test = {
    generated_at: new Date().toISOString(),
    year: selectedPassage.year,
    passage: selectedPassage,
    questions: questionSet.questions,
    total_marks: questionSet.questions.reduce((sum, q) => sum + (q.marks || 0), 0)
  };

  const outFile = path.join(__dirname, '..', 'tests', 'sample_test.json');
  fs.writeFileSync(outFile, JSON.stringify(test, null, 2));
  console.log(`Generated ${outFile}`);
}

main();
