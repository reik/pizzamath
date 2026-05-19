# Mistake-Aware Practice — Implementation Status

**Last updated:** 2026-05-19
**Worktree:** `/Users/reikurata/dev/pizzamath/.claude/worktrees/mistake-aware-practice`
**Branch:** `worktree-mistake-aware-practice` (off `master`)
**Plan:** [`./2026-05-18-mistake-aware-practice.md`](./2026-05-18-mistake-aware-practice.md) — 17 tasks, full code blocks per task

---

## Resume briefing (copy-paste into a fresh session)

> We're mid-feature in the worktree at `.claude/worktrees/mistake-aware-practice` (branch `worktree-mistake-aware-practice`, off master). The full plan with verbatim code blocks for every task lives at `docs/superpowers/plans/2026-05-18-mistake-aware-practice.md`. Tasks 1–3 are shipped. Read `docs/superpowers/plans/STATUS.md` for current SHAs and the next task. Dispatch the implementer subagent for the next pending task.

---

## Progress

| # | Task | Status | Commit |
|---|---|---|---|
| 1 | Backend test infra (vitest + supertest, extract `app.ts`) | shipped | `47d67cd` |
| 2 | Shared error taxonomy (server + client mirror) | shipped | `bc8e79c` |
| 3 | DB schema for gradings (`worksheet_gradings`, `grading_problems`) | shipped | `cd0dd6e` |
| 4 | Domain Zod schemas (`gradedProblemSchema`, `gradingResponseSchema`) | **next** | — |
| 5 | Claude vision grader module | pending | — |
| 6 | `POST /api/gradings` endpoint | pending | — |
| 7 | `GET /api/gradings/:id` endpoint | pending | — |
| 8 | Frontend gradings API client | pending | — |
| 9 | `GradingResult` per-problem card | pending | — |
| 10 | `ErrorBreakdown` summary | pending | — |
| 11 | `useGrading` hook + `GradingPage` + route | pending | — |
| 12 | "Grade this" button on `MyUploadsPage` | pending | — |
| 13 | Targeted-generation prompt module | pending | — |
| 14 | `POST /api/gradings/:id/generate-practice` endpoint | pending | — |
| 15 | `GeneratePracticeButton` + flow | pending | — |
| 16 | `GET /api/gradings/insights/me` endpoint | pending | — |
| 17 | `InsightsChart` + `InsightsPage` + Navbar link | pending | — |

---

## Current test baseline (after commit `cd0dd6e`)

- **Backend** (`cd server && npm test`): 5/5 passing — 1 health + 2 errorTaxonomy + 2 db schema
- **Frontend** (`npm test -- --run` from worktree root): 46/46 passing

Any regression below these numbers blocks the next task.

---

## Workflow conventions for this feature

- One commit per task, message format follows each task spec in the plan.
- TDD: failing test first, then implementation. Never skip the red step.
- Dispatch a fresh subagent per task — don't reuse, don't widen scope.
- No `git push`, no `--amend`, no `--no-verify`.
- Stage explicitly per task spec; never `git add .` or `git add -A`.
- Co-authored-by `Claude Opus 4.7 <noreply@anthropic.com>` trailer on every commit.

---

## Known deviations from the plan (preserve in future tasks)

- **CORS origins** in `server/src/app.ts`: live code uses `http://localhost:5173`, **not** `5175` as the plan snippet hardcodes. Keep `5173`.
- **`/uploads` static mount** in `server/src/app.ts` was preserved from the original `index.ts`. The plan didn't mention it.
- **Root `vite.config.ts`** has `test.exclude: ["node_modules", "dist", "cypress", "server/**"]` added during Task 1 so the root vitest doesn't auto-discover server tests (server has its own setup file).
- **DB location:** the SQLite file is at `/Users/reikurata/dev/pizzamath/data/pizzamath.db` (project root, not `server/data/`).
- **`.gitignore` line removed**: `src/mocks/db.ts` is now tracked (was incorrectly excluded — fixed in baseline-repair commit `6cb4aa7`).

---

## Out-of-scope for this feature (per plan §"Out of scope")

- File-export formats beyond PDF/doc (already supported separately).
- Real-time grading (current MVP is async-per-upload).
- Multi-user comparison / leaderboards.
- Sharing gradings between users.

---

## Resume command (one-liner)

After `/clear`, paste:

> Read `docs/superpowers/plans/STATUS.md` in worktree `.claude/worktrees/mistake-aware-practice`, then dispatch the implementer subagent for the next pending task.
