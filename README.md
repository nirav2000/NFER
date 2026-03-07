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
- `tracker.html` – history table, score trend, difficulty progression
- `attempt.html` – full completed attempt view with learner answers and model answers

## UI themes and settings

- Footer includes app version and style selector.
- Available styles:
  - `default`
  - `ocean` (dark)
  - `paper` (serif print feel)
  - `split` (alternate layout with side panel)
  - `arcade` (high-energy grid layout)
- Theme preference is saved to LocalStorage.
- Settings panel includes:
  - passage font size
  - input font size
  - hide marks per question
  - gentler wording mode

## Test usability features

- Header icon toggles for timer/progress and all-questions mode.
- Autosave of in-progress test state with return-and-continue support.
- Autocomplete/suggestion suppression on answer text fields.
- Interaction recording and replay module with replay speed control.

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
