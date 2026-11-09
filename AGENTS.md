# AGENTS.md — Coding Agent Operating Manual

> Give this file to your coding agent and check that it is using these instructions. Keep the stack, commands, and ground rules current.

## 1. Project Overview
- **What this repo builds:** Keep in Touch, a local person-centered relationship prototype using fictional data, with profiles, meeting context, multiple categories, a most recent interaction, notes, and follow-ups.
- **Primary user & core workflow:** Create or open a person, maintain their profile and notes, and add optional-date follow-ups that can be completed, edited, or deleted. Confirm before deleting a profile and its linked items. The class living PRD template remains in `docs/index.html`.
- **Tech stack:** Plain HTML, CSS, and JavaScript in `app/`; browser localStorage; Python 3's built-in static server. No backend, dependencies, API keys, or external services.

## 2. Commands
- **Install dependencies:** None. Python 3 is required for the local server.
- **Run locally:** `python3 -m http.server 8000 --bind 127.0.0.1 --directory app`, then open `http://127.0.0.1:8000`.
- **Run deterministic tests:** `node --test tests/data.test.js`; `node --check app/data.js`; `node --check app/app.js`. Optional browser workflow checks: serve the repository root separately with `python3 -m http.server 8766 --bind 127.0.0.1`, then open `http://127.0.0.1:8766/tests/browser.html`. Never run browser test fixtures against the normal app's storage. See `README.md` for manual checks.
- **Run model evals:** Not applicable; this prototype does not call a model. No Build 4 evaluation track has been selected yet.

## 3. Non-Negotiable Engineering Rules
Browser data: `app/data.js` upgrades `keep-in-touch-follow-ups-v1` into `keep-in-touch-relationships-v2` only when the latter is absent. Preserve the legacy key; never overwrite unreadable data. People, notes, and follow-ups are linked by stable IDs. Failed saves must not change the current saved state.

1. **Plan before coding:** Before touching multiple files, propose a brief plan and wait for approval.
2. **Small batches:** Make small, focused changes that can be reviewed and explained by a human in a single Pull Request.
3. **Explainability:** Avoid unnecessary abstractions or dependencies. Help the human builder understand the main components, what changed, why it matters, what could break, and how it was checked.
4. **Verify changes:** Run relevant checks. For a reproducible logic bug, use a failing test to demonstrate the fix when practical. Record manual checks and known limitations; follow the selected Build 4 evaluation track.
5. **Zero secrets in code:** Never hardcode API keys, tokens, or credentials. Always read from environment variables (`.env`) and update `.env.example` when new variables are needed.
6. **Stop when looping:** If a fix fails twice in a row, stop, summarize what failed, and ask the human before trying a third approach.
