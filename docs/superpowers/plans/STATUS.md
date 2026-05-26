# Mistake-Aware Practice — Implementation Status

**Last updated:** 2026-05-22
**Branch:** `feat/mistake-aware-practice` (off `master`)
**Plan:** [`./2026-05-18-mistake-aware-practice.md`](./2026-05-18-mistake-aware-practice.md) — 17 tasks, full code blocks per task

> **PR-time watch:** the `magic-link-auth` branch (4 commits ahead of master, unmerged as of 2026-05-21) carries the magic-link feature and the original 5173→5175 port migration. If it merges before this feature, expect conflicts in `server/src/app.ts` (CORS) and possibly auth-adjacent files. Master itself is currently at the same base — no rebase needed today.

---

## Resume briefing (copy-paste into a fresh session)

> We're mid-feature on branch `feat/mistake-aware-practice` (off master). The full plan with verbatim code blocks for every task lives at `docs/superpowers/plans/2026-05-18-mistake-aware-practice.md`. Tasks 1–4 are shipped, plus a one-off `.env.test` fix that restored MSW interception. Read `docs/superpowers/plans/STATUS.md` for current SHAs and the next task. Dispatch the implementer subagent for the next pending task.

---

## Progress

| # | Task | Status | Commit |
|---|---|---|---|
| 1 | Backend test infra (vitest + supertest, extract `app.ts`) | shipped | `47d67cd` |
| 2 | Shared error taxonomy (server + client mirror) | shipped | `bc8e79c` |
| 3 | DB schema for gradings (`worksheet_gradings`, `grading_problems`) | shipped | `cd0dd6e` |
| 4 | Domain Zod schemas (`gradedProblemSchema`, `gradingResponseSchema`) | shipped | `d6397a8` |
| 5 | Claude vision grader module | shipped | `3ad6e4d` |
| 6 | `POST /api/gradings` endpoint | shipped | `882aa4b` (+ idempotency fix `abf3d23`) |
| 7 | `GET /api/gradings/:id` endpoint | shipped | `d2735f6` |
| 8 | Frontend gradings API client | shipped | `688fc65` |
| 9 | `GradingResult` per-problem card | shipped | `4e93326` |
| 10 | `ErrorBreakdown` summary | shipped | `272bd63` |
| 11 | `useGrading` hook + `GradingPage` + route | shipped | `324c329` |
| 12 | "Grade this" button on `MyUploadsPage` | shipped | `51f4bf2` |
| 13 | Targeted-generation prompt module | shipped | `b59c6ef` |
| 14 | `POST /api/gradings/:id/generate-practice` endpoint | shipped | `c5c66a7` |
| 15 | `GeneratePracticeButton` + flow | shipped | `8495085` |
| 16 | `GET /api/gradings/insights/me` endpoint | shipped | `175ef72` |
| 17 | `InsightsChart` + `InsightsPage` + Navbar link | shipped | `88c9210` |

---

## Current test baseline (after commit `88c9210`) — FEATURE COMPLETE

- **Backend** (`cd server && npm test`): 23/23 passing — 1 health + 2 errorTaxonomy + 2 db schema + 4 grading-schema + 4 visionGrader + 7 gradings route (POST + GET + generate-practice + insights) + 3 targetedGen
- **Frontend** (`npm test -- --run`): 56/56 passing (added 2 InsightsChart tests)
- **Frontend** (`npm test -- --run` from project root): 54/54 passing — added gradings API client, GradingResult, ErrorBreakdown, GradingPage, useCreateGrading

Any regression below these numbers blocks the next task.

### Side fix needed to reach a real green baseline

Commit `43abd26` added `.env.test` with `VITE_API_BASE_URL=`. Before this, Vitest loaded `.env` (which points at the prod Render URL), so test fetches were built as absolute URLs that MSW's relative-path handlers could not intercept — 16 of the 46 frontend tests had been silently failing via React Query timeouts. Prior STATUS.md numbers (claiming 46/46 since commit `6cb4aa7`) were bookkeeping errors, not reality. Do NOT delete `.env.test`.

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

- **CORS origins** in `server/src/app.ts`: allowlist now includes both `http://localhost:5173` and `http://localhost:5175` (latter added because the local Vite server runs on 5175). Either port works.
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

> Check out branch `feat/mistake-aware-practice`, read `docs/superpowers/plans/STATUS.md`, then dispatch the implementer subagent for the next pending task.
