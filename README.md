# NFER Reading Builder (Static GitHub Pages App)

A static Year 4 reading assessment app that runs fully client-side in the browser.

## Primary data source

The app uses:

- `/data/year4_combined_50_test_library_v3.json`

It can also load compatible JSON files from `/data/` using the dashboard file selector.

## Pages

- `index.html` – dashboard (library overview, recommended test, random fallback, weak domains)
- `test.html` – passages, questions, timer/progress, navigation, review, submission
- `diagnostic.html` – score, percentage, domain breakdown, strengths, focus area
- `tracker.html` – history table, score trend, difficulty progression (click `Test ID` to view full completed attempt)
- `attempt.html` – full completed attempt view with learner answers and model answers

## UI themes and settings

- Footer includes app version and style selector.
- Available styles:
  - `default`
  - `ocean` (dark)
  - `paper` (serif print feel)
  - `split` (alternate layout with side panel)
  - `arcade` (high-energy grid layout)
  - `zen210` (layout-driven retro editorial style inspired by CSS Zen Garden principles)
- Theme preference is saved to LocalStorage and applied instantly.
- Settings panel includes (auto-applied and auto-saved):
  - passage font size
  - input font size
  - hide marks per question
  - gentler wording mode

## Test usability features

- Header icon toggles for timer/progress and all-questions mode.
- Autosave of in-progress test state with return-and-continue support.
- Autocomplete/suggestion suppression on answer text fields.
- Interaction recording and replay module with replay speed control (captures timer state, scroll, toggles, and inputs).

## Selection logic

- **Recommended test** uses a balanced algorithm considering:
  - recent test IDs
  - recent topics
  - target difficulty from recent performance
  - weak domains from recent attempts
- **Random test** button is available as fallback.

## LocalStorage history record

Each completed test record includes fields such as:

- `testId`
- `percentage`
- `difficulty`
- `topicsCovered`
- `domainBreakdown`
- `completedAt`
- `score`
- `totalMarks`
- `timeTakenMinutes`
- `answers`
- `testSnapshot`

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## GitHub Pages

Deploy from the `main` branch, folder `/ (root)`.

## AI feedback assist

On **Diagnostic** and **Completed Attempt** pages, the app now generates a structured ChatGPT prompt containing passage text, question data, learner answers, and marking context.

- `Copy prompt` copies the full JSON-oriented instruction prompt.
- `Open in ChatGPT` opens ChatGPT with the prompt prefilled in the query URL.

This helps generate richer feedback while keeping the app itself fully static and client-side.


## Cache busting

- CSS and JS entry assets are versioned with `?v=` query strings.
- On each release/fix, increment `APP_VERSION` in `js/app.js` and update HTML asset query strings to force fresh fetches on GitHub Pages.

- Runtime diagnostics now come from dedicated module `js/runtimeDiagnostics.js` with a footer Diagnostics toggle and non-intrusive panel.

- `js/app.js` has been split into page-focused modules (`js/appDashboard.js`, `js/appReports.js`) to keep responsibilities smaller and easier to debug.
