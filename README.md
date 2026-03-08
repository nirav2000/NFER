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
  - `zen210` (layout-driven retro editorial style inspired by CSS Zen Garden principles, scoped so test interactions remain stable)
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
- Optional **Generate AI feedback in app** can call the OpenAI API directly from the browser using your own API key (Responses API with chat-completions fallback for compatibility).

> Security note: because this is a static GitHub Pages app (no backend), any API key entered is client-side only and stored in browser LocalStorage for convenience. Use a restricted/rotatable key.

This helps generate richer feedback while keeping the app itself fully static and client-side.

## Versioning

- App version is set in `js/app.js` (`APP_VERSION`) and displayed in every page footer.
- For each push that changes behaviour/UI, patch version is incremented (e.g. `v3.4.1` → `v3.4.2`).


## Cache busting

- JS assets are versioned via query string (for example `app.js?v=3.4.9`).
- When releasing a fix, increment `APP_VERSION` in `js/app.js` and update the script query versions in HTML/imports so browsers fetch the latest modules instead of stale cache.

- Added `js/fallback.js` as a resilient core-interaction fallback module for theme/settings/start actions if the main app module fails to initialise.

- `fallback.js` now shows a **Fallback status** toggle so you can confirm whether fallback mode is active or primary app bootstrap completed.
