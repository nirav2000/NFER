# NFER Reading Builder

NFER Reading Builder is a static Year 4 reading-assessment web app designed for GitHub Pages.
It generates original tests, marks answers, provides diagnostics and tracks progress in browser LocalStorage.

## Static hosting model

This project is 100% static:

- HTML/CSS/JavaScript only
- JSON content files stored in the repository
- No server-side runtime, database, API routes or build pipeline required

## Main pages

- `index.html` – dashboard
- `passage-library.html` – passage library
- `question-library.html` – question library
- `generator.html` – generate a new test (single-passage mode)
- `test.html` – pupil test preview
- `teacher-guide.html` – teacher guide and answer key
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

## Local run

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

No compile step is required.


## Generation behaviour

- Each generated test uses one passage at a time.
- All generated questions apply to that same passage.
- If a passage has fewer than 12 stored questions, the app adds synthetic spec-aligned questions client-side to complete the target mix.


## Local data saved

The app stores the following in browser LocalStorage:
- current generated test
- latest diagnostic result
- result history
- completed test records (including submitted answers and scored outcomes)
