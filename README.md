# NFER

Starter repository for creating NFER-style reading assessments with reusable passage and question banks.

## Quick start

- Generate a sample test: `node generator/generateTest.js`
- Analyse a generated test: `node diagnostics/analyseResults.js`
- Run the local web UI: `python3 -m http.server 8000` then open `http://localhost:8000/docs/`

## GitHub Pages (no compile step)

This repo now includes a static app in `docs/` that works directly on GitHub Pages.

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Select branch **main** and folder **/docs**.
4. Save. Your app will be served by GitHub Pages with no build tooling required.
