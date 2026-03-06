# NFER Reading Builder

NFER Reading Builder is a static Year 4 reading-assessment tool designed for GitHub Pages.
It generates original tests, marks answers, provides diagnostics and tracks progress in browser LocalStorage.

## Static hosting model

This project is 100% static:

- HTML/CSS/JavaScript only
- JSON content files stored in the repository
- No server-side runtime, database, API routes or build pipeline required

## Main pages

- `index.html` – dashboard
- `generator.html` – generate a new test
- `test.html` – pupil test + teacher guide/answer key
- `mark.html` – mark responses
- `diagnostic.html` – diagnostic report
- `tracker.html` – progress tracker

## Repository structure

- `css/styles.css` – shared and print styles
- `js/` – modular client-side logic (`generator`, `renderer`, `diagnostics`, `tracker`, `storage`, `app`)
- `data/passages/` – fiction and nonfiction Year 4 passage sets
- `data/questions/` – question banks linked by `passageId`
- `tests/sample-generated-tests.json` – sample generated metadata
- `.nojekyll` – ensures GitHub Pages serves files as-is

## Content updates

### Add a new passage

1. Append a new object to either:
   - `data/passages/year4-fiction.json`, or
   - `data/passages/year4-nonfiction.json`
2. Include at least: `id`, `year`, `genre`, `title`, `topic`, `difficulty`, `word_count`, `text`.
3. Keep text original and Year 4 suitable (roughly 300–450 words).

### Add new questions

1. Add items in the matching question file:
   - `data/questions/year4-fiction-questions.json` or
   - `data/questions/year4-nonfiction-questions.json`
2. Ensure each question includes required fields:
   `id`, `passageId`, `domain`, `fineSkillTag`, `difficulty`, `marks`, `questionType`, `stem`, `options`, `acceptedAnswers`, `markingNotes`, `modelAnswerGold`, `modelAnswerSilver`, `commonWrongAnswer`.
3. Use the supported domains:
   `retrieval`, `vocabulary`, `inference`, `structure`, `authorIntent`.

## Local run

From repository root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## GitHub Pages deployment

1. Push to `main`.
2. In GitHub: **Settings → Pages**.
3. Source: **Deploy from a branch**.
4. Branch: `main`, Folder: `/ (root)`.
5. Save.

The app runs directly from static files, so no compile step is needed.
