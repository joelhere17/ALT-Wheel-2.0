# Contributing

Thanks for helping out. The project has no build step, so changes are easy to try.

1. Fork the repository and clone your fork.
2. Open `index.html` in a browser (double-click it), or run `python -m http.server 8000` and visit `http://localhost:8000`.
3. Make your change. Keep each file focused on one job (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).
4. Run the test (optional but appreciated): `pip install playwright` then `playwright install chromium` then `python tests/e2e.py`.
5. Open a pull request that says what changed and why. Screenshots help for visual changes.

Style: two-space indent, plain JavaScript (no frameworks), no new dependencies without a good reason.
