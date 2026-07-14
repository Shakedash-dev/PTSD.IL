# CLAUDE.md

Project-specific workflow rules for Claude Code in this repo. See `AGENTS.md` for stack/conventions/directory map - this file is workflow-only.

## Branching

**No worktrees, no feature branches for routine work.** This is a small, solo project - don't create a worktree or branch just because a task involves writing to a file. Work directly on `master`.

- Commit directly to `master`.
- Never push, never open a PR - the repo owner pushes when ready.
- Worktrees/branches are fine only when explicitly requested, or for something genuinely large enough to need isolation from other in-flight work - not the default for doc edits, content fixes, or small features.
