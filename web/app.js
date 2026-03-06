const sources = [
  {
    passage: '../data/passages/fiction/cave_story.json',
    questions: '../data/questions/cave_story_questions.json'
  },
  {
    passage: '../data/passages/nonfiction/deep_sea.json',
    questions: '../data/questions/deep_sea_questions.json'
  }
];

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function renderPassage(passage) {
  const card = document.getElementById('passageCard');
  card.textContent = `${passage.title} (${passage.genre}, Year ${passage.year})\n\n${passage.text}`;
}

function renderQuestions(questions) {
  const list = document.getElementById('questionList');
  list.innerHTML = '';

  for (const question of questions) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>[${question.skill}]</strong> ${question.question}`;

    if (Array.isArray(question.options)) {
      const options = document.createElement('ul');
      question.options.forEach((option) => {
        const opt = document.createElement('li');
        opt.textContent = option;
        options.appendChild(opt);
      });
      li.appendChild(options);
    }

    list.appendChild(li);
  }
}

function analyse(questions) {
  return questions.reduce((acc, q) => {
    const skill = q.skill || 'unknown';
    acc[skill] = (acc[skill] || 0) + (q.marks || 0);
    return acc;
  }, {});
}

async function generate() {
  const chosen = pickRandom(sources);
  const passage = await fetch(chosen.passage).then((r) => r.json());
  const questionSet = await fetch(chosen.questions).then((r) => r.json());

  renderPassage(passage);
  renderQuestions(questionSet.questions);

  const summary = {
    generated_at: new Date().toISOString(),
    year: passage.year,
    total_marks: questionSet.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
    marks_by_skill: analyse(questionSet.questions)
  };

  document.getElementById('analysis').textContent = JSON.stringify(summary, null, 2);
}

document.getElementById('generateBtn').addEventListener('click', generate);
