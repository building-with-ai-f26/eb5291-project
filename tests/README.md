# Verification: Tests, Evals & User Feedback

Review agent changes and verify that the product works throughout the course. Use automated tests for application behavior when useful, model evals for output quality, and manual checks for the user experience. A test shows what it checked; record its limits.

## Local relationship prototype checks

- Run `node --test tests/data.test.js` from the repository root. No test dependencies are needed beyond Node.js 18 or newer.
- For actual browser workflows, follow the separate-port instructions for `tests/browser.html` in the main `README.md`. The fixture refuses to run when it finds existing app storage at its address, uses fictional records, and cleans up its test records. Never use the regular app port for browser fixtures.
- Manual steps for the main app are in `README.md`: profile details, categories, recent interaction, note/follow-up editing, optional dates, completion, refresh, deletion confirmation, keyboard use, and narrow windows.

Verified November 8, 2026: all 10 Node data tests passed; the browser workflow fixture passed in headless Chrome, including migration, create/edit/delete, cancellation, refresh, literal text rendering, completion/reopening, a 350px-wide page/editor, and initial editor focus. JavaScript syntax and `git diff --check` passed. The desktop screenshot was visually reviewed. Full keyboard traversal, Escape behavior, screen-reader output, mobile touch use, and other browser engines still need manual review. No Build 4 track has been selected or completed by these checks.

## Build 4: choose one track

**Track A — Domain quality**

Define 3–4 rules for good output. Evaluate 10 cases: 5 normal, 3 messy, and 2 adversarial. Compare results before and after improvements, and ask one outside target user to review the result.

**Track B — User friction**

Watch 3–5 outside users try the product without coaching. Review PostHog replays, identify the top three friction points, and document fixes with before/after evidence. The app can still run locally.

Both tracks update PRD v4 and the build log on `docs/index.html`. Follow [Icerynk Build 4](https://www.icerynk.com/c/fa26-tech-gb-2160-dm2-f2/content/build-4-test-py-tests-model-evals) for the rubric. You do not need to complete both tracks.
