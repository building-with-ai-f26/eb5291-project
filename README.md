# Keep in Touch

> Remember the context behind conversations, plans, and promises, then track when to follow up.

## Run the local prototype

This prototype uses plain HTML, CSS, and JavaScript. No packages, accounts, API keys, or external services are needed. Python 3 is used only to serve the files locally.

1. Open Terminal and go to this repository. Replace `/path/to/eb5291-project` with the location of your project folder (you can drag the folder into Terminal after typing `cd `):

   ```bash
   cd /path/to/eb5291-project
   ```

2. Start the local server:

   ```bash
   python3 -m http.server 8000 --bind 127.0.0.1 --directory app
   ```

3. Leave Terminal running and open **http://127.0.0.1:8000** in your browser.
4. Stop the server with **Control+C** in Terminal when finished.

If port 8000 is already in use, use `8001` in both the command and browser address. Keep using the same address and port to see the same saved entries. If Python is missing, install Python 3 before running the command.

## Review the Build 1 product page locally

The class product page is separate from the app. From this repository, open a second Terminal and run:

```bash
python3 -m http.server 8001 --bind 127.0.0.1 --directory docs
```

Open **http://127.0.0.1:8001**. This serves only the product-page files and does not publish anything. The app can keep running on port 8000 with its saved data unchanged.

1. Read the introduction and use the three navigation links to jump to the screenshot, PRD v1, and Build 1 log.
2. Click the screenshot or its full-size link to check the example data. Use the browser's Back button to return.
3. Check that current features and future ideas are clearly separated, and that the PRD describes the planned classmate/friend test without claiming completed interviews.
4. Confirm the Build 1 log reflects your learning, the move from a list to profiles, about 3 hours, and no project-specific payments so far. Shared tool costs have not been allocated.
5. Narrow the window and check readability, then use Tab to move through the links and expandable architecture section.
6. Stop the product-page server with **Control+C** in its Terminal when finished.

The supplied fictional-data screenshot is copied to `docs/assets/keep-in-touch-build-1.png`. No app files or saved entries are changed by this page. Publishing, pushing, and submission are separate steps requiring your instruction.

Product-page checks on November 8, 2026: the page and screenshot returned HTTP 200 locally; all section anchors and local file links resolved; image dimensions and alternative text were checked; desktop and 640px-wide Chrome previews were reviewed. The page has no scripts or external resource requests. Full manual keyboard and screen-reader review remains to do.

## Try it step by step

Use fictional names and conversations throughout these checks.

1. Open the app at **http://127.0.0.1:8000** in the same browser you used before. Existing follow-ups should appear inside person profiles. If there were no saved entries, you will see fictional examples. A previously saved empty list stays empty.
2. Click **+ Add a person**. Enter `Robin Fiction`, where you met (`Imaginary library`), how you met (`A fictional study group`), and who introduced you (`Morgan Example`). Choose both **Friend** and **Classmate**. Add a recent interaction date and choose **Video call**, then save. Only the name is required.
3. Confirm the profile shows those details. Click **Edit profile**, change a field, and save. Try opening the editor again, changing something, and clicking **Cancel**: the saved profile should stay the same.
4. Click **+ Add note**, write a fictional detail, and save. Edit that note and save again.
5. Add two follow-ups with context: one with a date and one without. The dated one appears under **Coming up**; the undated one appears under **When the time is right**. Click a person's name in either list to open their profile. Past dates are allowed and shown in the dated list.
6. Mark a follow-up done. It stays in the profile with a **Done** label and leaves the overview. Use **Mark as not done** to reopen it. Edit the context or add, change, or clear its date.
7. Refresh the page. Check that people, categories, notes, dates, and completion status remain saved. Choose a person from **Your people** to reopen their details.
8. Try saving a blank name, note, or follow-up context, including spaces only. The form should ask for actual text. Empty optional dates and categories should save successfully.
9. Delete a note or follow-up and confirm the prompt. Then click **Delete profile** and choose **Keep it** to check cancellation. Try again and choose **Delete**: that profile and all its notes and follow-ups should disappear, while other profiles remain. Deletion cannot be undone in the app.
10. Try the app with the keyboard and a narrow browser window. Dialogs should keep keyboard focus inside, Escape should cancel, and the layout should fit a phone-sized window.

## How saving and the upgrade work

Everything stays in this browser's local storage. Keep using the same browser, address, and port; `localhost` and `127.0.0.1`, different ports, different browsers, and private windows have separate storage. Clearing site data removes saved information. Nothing is sent to a service.

The old prototype saved a flat list under `keep-in-touch-follow-ups-v1`. This version uses `keep-in-touch-relationships-v2`, with three simple collections: people, notes, and follow-ups. Notes and follow-ups use a person's ID, so renaming a profile preserves its connections. The introducer is plain text; it does not require a separate profile.

On the first upgrade, each exact name in the old list becomes a profile. Repeated exact names are grouped together; differences in spelling, capitalization, or spacing stay separate. Context, follow-up dates, IDs, and done status are preserved. Meeting details and interaction fields stay blank until you add them. If the same name actually refers to two people, you will need to create another profile and manually recreate the relevant follow-ups there; there is no move or merge feature yet.

The original old list is left untouched as a backup. The upgrade runs only when the new storage key is absent, so a refresh or deleting all profiles will not reimport the backup. Changes and deletions in the new app do not change that old backup. It remains until you clear site data; it is not an undo feature or a separate backup file.

Unreadable saved data disables changes and shows a warning rather than replacing your information with examples. If a save fails, the previous saved state remains intact and an open editing form keeps your text so you can retry. Use one tab at a time: if another tab saves changes, an older tab refuses to overwrite them and asks you to reload. There is no automatic synchronization between tabs.

## App files and checks

- `app/index.html`: the main page and accessible editing/deletion dialogs.
- `app/styles.css`: warm colors, spacing, and responsive layout.
- `app/data.js`: data validation, migration, browser saving, and linked profile deletion.
- `app/app.js`: people and follow-up lists, profile details, and editing controls.
- `tests/data.test.js`: automated data and migration checks.
- `tests/browser.html`: browser workflow checks using fictional data on a separate test address.
- `docs/index.html`: the separate class product page and living PRD template.

If Node.js is installed, run the automated data checks from this repository:

```bash
node --test tests/data.test.js
node --check app/data.js
node --check app/app.js
```

For optional automated browser checks, leave your normal app server separate. Open a second Terminal in this repository and run:

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

Open **http://127.0.0.1:8766/tests/browser.html** in a current browser. Wait for **All browser workflow checks passed**. These checks refuse to run if app data already exists at that test address. They create fictional test records and remove them afterward. Use port 8766 only for testing. Stop the test server with **Control+C**. The browser checks exercise forms, migration, edits, cancellation, deletion, completion, refresh, and literal-text rendering; manually check appearance, keyboard navigation, and mobile layout using the steps above.

This version keeps one manually updated most recent interaction per person; it does not build an interaction history. Group events, notifications, AI integrations, connection suggestions, login, and external integrations are left for later. No publication or submission is part of this work.

---

## Class project template and assignment guidance

- **Builder:** [Your Name] (`@github-handle`)
- **Pod:** [Pod Name / Number]
- **Product Page & Living PRD:** [Add your GitHub Pages URL]
- **App:** runs locally through Week 4; add a cloud URL in Build 5.

## Start here: Build 1

**Due Monday, November 9 at noon, New York time.** No class November 3; keep building that week.

1. Join the [class organization](https://github.com/building-with-ai-f26), then use this template to create a **public** repo named `<netid>-<project-slug>`. Ask Christian or Hew if the organization is missing from the owner list.
2. Set up Git and one coding agent during the week of October 27. Follow the [Icerynk setup guide](https://www.icerynk.com/c/fa26-tech-gb-2160-dm2-f2/content/pre-class-setup-github-openrouter-your-coding-agent).
3. Publish [`docs/index.html`](./docs/index.html): **Settings → Pages → Deploy from a branch → main → /docs → Save**. When deployment finishes, open `https://building-with-ai-f26.github.io/<your-repo-name>/`.
4. Fill in PRD v1: a reachable user, their painful before/after workflow, one core workflow, and three non-goals.
5. Build a rough local prototype. Add a screenshot or GIF and an honest Build 1 log to the Product Page, including progress, learning, problems, costs, and hours.
6. Push meaningful commits on **at least two separate days each week outside class**, including the November 3 break.
7. Submit your **Product Page URL and repository URL in Icerynk**. Come ready to demo the prototype in two minutes on November 10.

Create your PostHog account in Week 1. Install it on the Product Page and local app in **Build 2**, then verify events. The Product Page is public from Build 1; the app can stay local through Week 4.

## Repository map

| File / folder | Purpose |
| --- | --- |
| [`docs/index.html`](./docs/index.html) | Required public pitch, living PRD, and weekly build log. Update with actual work and evidence. |
| [`Intent.md`](./Intent.md), [`Plan.md`](./Plan.md), [`journal/`](./journal/) | Optional drafting aids. No duplicate submission is required. |
| [`AGENTS.md`](./AGENTS.md) | Local run commands, project context, and agent rules. Build 2 onward. |
| [`tests/`](./tests/) | Verification guidance. Build 4 offers Track A domain evals **or** Track B user replays. |
| [`SPONSOR_MEMO.md`](./SPONSOR_MEMO.md) | One-page recommendation backed by actual usage, full costs, and risks. Due December 14 at noon. |

[Icerynk](https://www.icerynk.com/c/fa26-tech-gb-2160-dm2-f2/content) holds the assignment instructions and submissions.

## Local setup

Clone **your own repository** and ask your coding agent to document the exact install and run commands here and in `AGENTS.md`.

```bash
git clone https://github.com/building-with-ai-f26/<your-repo-name>.git
cd <your-repo-name>
```

If your app needs API keys, use a local environment file such as `.env`. Keep private keys out of source code, browser code, screenshots, and commits. The template ignores `.env`; `.env.example` contains placeholders only.
