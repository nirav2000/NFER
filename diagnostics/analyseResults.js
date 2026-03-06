const fs = require('fs');
const path = require('path');

function main() {
  const inputPath = path.join(__dirname, '..', 'tests', 'sample_test.json');
  if (!fs.existsSync(inputPath)) {
    console.error('No generated test found. Run: npm run generate');
    process.exit(1);
  }

  const test = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const summary = test.questions.reduce((acc, q) => {
    const skill = q.skill || 'unknown';
    acc[skill] = (acc[skill] || 0) + (q.marks || 0);
    return acc;
  }, {});

  const report = {
    generated_at: new Date().toISOString(),
    test_generated_at: test.generated_at,
    year: test.year,
    total_marks: test.total_marks,
    marks_by_skill: summary
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
