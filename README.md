# NFER Reading Builder (Static GitHub Pages App)

A static Year 4 reading assessment app that runs fully client-side in the browser.

## Primary data source

The app now uses:

- `/data/year4_combined_50_test_library_v3.json`

It can also load compatible JSON files from `/data/` using the dashboard file selector.

## Pages

- `index.html` – dashboard (library overview, recommended test, random fallback, weak domains)
- `test.html` – passages, questions, timer/progress, navigation, review, submission
- `diagnostic.html` – score, percentage, domain breakdown, strengths, focus area
- `tracker.html` – history table, score trend, difficulty progression

## Selection logic

- **Recommended test** uses a balanced selection algorithm that considers:
  - recent test IDs (avoid repeats)
  - recent topics (increase variety)
  - target difficulty (based on latest score)
  - weak domains from recent results
- **Random test** button is available as a fallback.

## LocalStorage history record

Each completed test is stored in a history array with fields such as:

- `testId`
- `percentage`
- `difficulty`
- `topicsCovered`
- `domainBreakdown` (domain → percentage)
- `completedAt`
- `score`
- `totalMarks`
- `timeTakenMinutes`

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## GitHub Pages

Deploy from the `main` branch, folder `/ (root)`.
