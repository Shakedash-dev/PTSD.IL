# CLAUDE.md

Project-specific workflow rules for Claude Code in this repo. See `AGENTS.md` for stack/conventions/directory map - this file is workflow-only.

## Branching

**No worktrees, no feature branches for routine work.** This is a small, solo project - don't create a worktree or branch just because a task involves writing to a file. Work directly on `master`.

- Commit directly to `master`.
- Push `master` only when Ofri says to ship - see **Shipping** below. Never open a PR, never force-push.
- Worktrees/branches are fine only when explicitly requested, or for something genuinely large enough to need isolation from other in-flight work - not the default for doc edits, content fixes, or small features.

## Scope

All current work is the **v3 Metiv merged-site demo** - `src/pages/metiv-demos/v3/`, served at `/metiv-site-demo-v3`. v1, v2 and v4 are parked. Default any "change the site" request to v3 unless told otherwise, and follow the hard rules in `src/pages/metiv-demos/README.md` (write only inside the v3 folder, plus `src/test/metiv-demo-v3.test.jsx` and `src/public/images/metiv-demo/`).

## Previewing

Ofri reviews every change in the browser himself. After making a change, start the dev server and hand him the URL - don't describe the change and ask him to picture it, and don't push first.

- `preview_start {name: "ptsd-il"}` (see `.claude/launch.json`), then give him the deep link, normally `http://localhost:5173/metiv-site-demo-v3`.
- Requires Node on PATH and `npm install` already run in `src/`.

## Shipping

"ship it", "publish", "תפבלש" or anything of that shape means: commit to `master` and `git push origin master`. Render auto-deploys from `master`, so it goes live at `https://ptsd-il.site/metiv-site-demo-v3`.

Preview first and wait for his go-ahead - shipping is never the first step.
