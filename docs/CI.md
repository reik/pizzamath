# PizzaMath — CI Guide

Developer reference for testing, checks, GitHub Actions workflows, and deployment.
End-user documentation lives in `USER_GUIDE.md`.

---

## GitHub Actions workflows

Two workflows live in `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `claude-code-review.yml` | PR opened or marked ready (source files only) | Full-diff AI code review posted as a PR comment |
| `claude.yml` | `@claude` mentioned in a PR/issue comment or review | Runs Claude Code on the mentioned task |

**There is no standard CI pipeline** (lint + typecheck + unit test + build) running on
GitHub Actions yet. All automated checks are local-only. Adding a pipeline job is a
known gap — see the *Future work* section.

---

## Running checks locally

Run these before pushing to a PR branch:

```bash
npm run typecheck   # tsc --noEmit — catches type errors
npm run lint        # ESLint
npm run test        # Vitest unit tests (watch mode by default)
npm run build       # tsc -b && vite build — confirm the production build passes
```

Run tests once (no watch) in CI-style:

```bash
npx vitest run
```

With coverage:

```bash
npx vitest run --coverage
```

### Vitest configuration

Tests use `jsdom` as the environment. Config lives in `vite.config.ts` under the
`test` key. Cypress and `server/**` are excluded from the Vitest run.

Mock at the network boundary using MSW (`src/test/setup.ts`) — don't mock modules.

---

## E2E tests (Cypress)

### Setup

The frontend must be running before Cypress can connect:

```bash
npm run dev:backend   # or npm run dev:all for frontend + backend together
```

Then in a separate terminal:

```bash
npm run e2e          # headless run
npm run e2e:open     # interactive Cypress UI
```

### Environment variables

Cypress reads credentials from `.env` (via `dotenv`) or the environment:

| Variable | Default | Purpose |
|----------|---------|---------|
| `CYPRESS_TEST_EMAIL` | `cypress@pizzamath.test` | Test user email |
| `CYPRESS_TEST_PASSWORD` | `cypress123` | Test user password |

Create a `.env` file at the repo root (gitignored) with real values for local runs.
The test user must exist in the database — seed it alongside the admin user at deploy
time.

### Base URL

Cypress points to `http://localhost:5175/pizzamath` — the Vite dev server base path
(`/pizzamath/`) is required. Tests use `cy.visit('/login')` (relative to the base URL).

### Port assignments

| Service | Port | Set via |
|---------|------|---------|
| Vite frontend | 5175 | `VITE_PORT` env var or `vite.config.ts` default |
| Backend API | 3001 | `BACKEND_PORT` env var or `vite.config.ts` default |

---

## Deploy

Deploys to GitHub Pages at `https://reik.github.io/pizzamath`:

```bash
npm run build    # builds to dist/
npm run deploy   # gh-pages -d dist — pushes dist/ to gh-pages branch
```

The Vite `base` is set to `/pizzamath/` in `vite.config.ts`. If you change the
repo name or hosting path, update `base` and the Cypress `baseUrl` together.

---

## Claude AI workflows

### `claude-code-review.yml` — automated code review

Runs a full-diff code review on every PR that touches `src/` or `server/src/`,
posted as a comment by the Claude bot.

**When it runs:** PR opened or marked ready for review (not on every push — see *Token
spend controls* below).

**Skips:** draft PRs, forks, PRs that only touch config/docs/workflow files.

**Requesting a re-review after new commits:**
Since `synchronize` is not a trigger, the review doesn't re-run automatically on each
push. To get a fresh review after updating a PR:
1. Open the PR on GitHub.
2. Post a review comment containing `@claude review`.
3. `claude.yml` picks it up and runs the review.

### `claude.yml` — on-demand assistant

Runs Claude Code on any task described in a comment that contains `@claude`. Scoped
to OWNER / MEMBER / COLLABORATOR — won't run for external contributors.

---

## Token spend controls

A ~4M-token spike in June 2026 (PR #10) led to the following controls. See git
history for the full incident analysis.

### Layer 0 — Hard ceiling (Anthropic Console)

A dedicated **CI workspace** exists in the Anthropic Console with its own API key
and a monthly spend limit. The GitHub secret `ANTHROPIC_API_KEY` must point to this
workspace key — if it points to the root account key, the spend limit doesn't apply.

To verify: GitHub → Settings → Secrets and variables → Actions → `ANTHROPIC_API_KEY`.

### Layer 1 — Concurrency (cancel in-progress)

```yaml
concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

A burst of rapid pushes to the same PR cancels the in-flight review and runs only
the latest.

### Layer 2 — Trimmed triggers + paths filter

Triggers: `opened`, `ready_for_review` only (not `synchronize` or `reopened`).
Paths: `src/**`, `server/src/**` — config/docs/workflow-only PRs are skipped.

### Layer 3 — Per-run cap

```yaml
claude_args: '--max-turns 15 --model claude-haiku-4-5-20251001'
```

Bounds the agent loop and pins a cost-efficient model. Bump to `claude-sonnet-4-6`
for deeper reviews if needed.

### Layer 4 — Bot-loop guard

`!endsWith(github.actor, '[bot]')` — prevents Claude's own comments from
re-triggering `claude.yml`.

---

## Secrets inventory

| Secret | Scope | Purpose |
|--------|-------|---------|
| `ANTHROPIC_API_KEY` | Repo → Actions | Claude API for CI workflows. Must be the CI workspace key. |

---

## Future work

- **Standard CI pipeline:** add a GitHub Actions job that runs `typecheck`, `lint`,
  `npx vitest run`, and `build` on every PR. This is currently a gap — failures are
  only caught locally.
- **E2E in CI:** Cypress E2E runs are local-only. Running them in CI requires a
  running backend + test database, which needs environment setup (secrets, seeding).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Cypress can't connect | Dev server isn't running | Run `npm run dev:all` first |
| Cypress login fails | Test user doesn't exist in DB | Seed `CYPRESS_TEST_EMAIL` user in the database |
| Code review not posting | PR is a draft, or only non-source files changed, or it's from a fork | Mark PR ready; push a source-file change; or comment `@claude review` |
| Unexpected token spike | `synchronize` re-added to triggers, or concurrency group removed | Check `.github/workflows/claude-code-review.yml`; verify the Anthropic Console billing dashboard |
| Build fails locally but not seen in CI | No CI pipeline yet — CI doesn't run build | Run `npm run build` locally before pushing |
