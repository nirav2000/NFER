# NFER Reading Builder (Static GitHub Pages App)

A static Year 4 reading assessment app that loads a starter pack JSON library and runs fully client-side.

## Data source

The app fetches:

- `/data/year4_reading_starter_pack_10_tests.json`

## Pages

- `index.html` – dashboard (library count, generate test, tracker link)
- `test.html` – passages, questions, answer inputs, mark-scheme toggle
- `diagnostic.html` – score, percentage, domain breakdown, strengths, focus area
- `tracker.html` – history table, score trend, difficulty progression

## Structure

- `css/styles.css`
- `js/app.js`
- `js/generator.js`
- `js/renderer.js`
- `js/diagnostics.js`
- `js/storage.js`
- `data/year4_reading_starter_pack_10_tests.json`
- `.nojekyll`

## How it works

- Random test selection from starter pack JSON
- Client-side marking using `acceptedAnswers`
- Domain score breakdown and diagnostic summary
- Progress saved to LocalStorage with:
  - `date`
  - `testId`
  - `score`
  - `percentage`
  - `difficulty`
  - `answers`

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## GitHub Pages

Deploy from `main` branch, folder `/ (root)`.
