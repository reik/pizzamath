---
name: new-feature
description: Create a new git worktree for parallel feature development in pizzamath. Use when starting a new feature that should be developed in isolation from current work.
---

# New Feature Worktree

Creates an isolated git worktree under `.worktrees/<name>` with its own branch, ports, and env config so you can develop in parallel with other in-progress work.

## Arguments

`$ARGUMENTS` — the feature name in kebab-case (e.g. `stripe`, `change-email`, `admin-pdf`)

## Steps

1. Sanitize the feature name: strip leading `feat/` if present, convert spaces to hyphens, lowercase.

2. Run the worktree creation script:
   ```bash
   bash scripts/new-worktree.sh <sanitized-name>
   ```

3. Report the output to the user: worktree path, branch name, frontend URL, backend port, and the `cd` + `npm run dev:all` command to start working.

4. Ask: "Want me to start planning the feature now, or will you pick it up later?"
   - If yes → invoke the `superpowers:writing-plans` skill with context about the new worktree path and branch.
   - If no → done.

## Error handling

- If the script exits non-zero, show the error message and stop.
- If `$ARGUMENTS` is empty, ask the user: "What should this feature be called?"
