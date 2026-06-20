# PizzaMath — Operations Guide

Developer and ops reference. End-user documentation lives in `USER_GUIDE.md`.

---

## Claude API cost controls

### Background

In June 2026, the `claude-code-review.yml` CI workflow introduced via PR #10 caused a
~4M-token spike in a single day. Root cause: the workflow was triggered by every push
to a PR branch (`synchronize` event) with no concurrency control, so a burst of rapid
commits fired multiple full-diff code reviews simultaneously. The changes below prevent
recurrence.

---

### Layer 0 — Hard spend ceiling (Anthropic Console)

This is the only control that *guarantees* a runaway loop cannot drain the account.
All other layers reduce frequency but cannot set a hard cap.

**Setup (already done):**
1. A dedicated **CI workspace** has been created in the Anthropic Console
   (Settings → Workspaces) with its own API key and a monthly spend limit.
2. The monthly limit is set on that workspace — a spike in CI is contained
   within it and cannot affect the main account.

**Critical:** the GitHub secret `ANTHROPIC_API_KEY` in the `pizzamath` repo must
point to the **CI workspace key**, not the main account key — otherwise the
workspace spend limit doesn't apply to CI runs.

To verify or update:
- GitHub → Settings → Secrets and variables → Actions → `ANTHROPIC_API_KEY`
- The value should be the key generated from the CI workspace, not the root account.

**Monitoring:** set a billing alert on the CI workspace so you're notified before
hitting the limit rather than after.

---

### Layer 1 — Concurrency control (`claude-code-review.yml`)

```yaml
concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

A burst of pushes to the same PR cancels any in-flight review and only runs the
latest one. This is the direct fix for the Jun 2026 burst.

---

### Layer 2 — Trimmed triggers (`claude-code-review.yml`)

```yaml
on:
  pull_request:
    types: [opened, ready_for_review]   # synchronize and reopened removed
    paths:
      - "src/**"
      - "server/src/**"
```

- **No `synchronize`** — the workflow no longer auto-fires on every push to a PR.
  To request a re-review mid-PR, comment `@claude review` (handled by `claude.yml`).
- **`paths` filter** — config, docs, or workflow-only PRs don't trigger a code review.
- **Draft guard** — `github.event.pull_request.draft == false` skips reviews while
  a PR is still in progress.

---

### Layer 3 — Per-run cost cap (`claude-code-review.yml`)

```yaml
claude_args: '--max-turns 15 --model claude-haiku-4-5-20251001'
```

- `--max-turns 15` bounds the agent loop so a single review can't spiral.
- `claude-haiku-4-5-20251001` is ~75% cheaper than Sonnet for routine review.
  Switch to `claude-sonnet-4-6` in `claude_args` for deeper review if needed.

> **Verify before relying on this:** confirm that `claude-code-action` passes
> `claude_args` through for the plugin-prompt path — see the action's
> `docs/usage.md` (linked in the workflow comments).

---

### Layer 4 — Bot-loop guard (`claude.yml`)

```yaml
!endsWith(github.actor, '[bot]') && ...
```

Prevents Claude's own review comments from re-triggering `claude.yml` — a comment
posted by the bot would otherwise fire a new `pull_request_review_comment` event,
which could chain indefinitely.

---

### Requesting a re-review

Since `synchronize` was removed, the review no longer auto-fires when you push new
commits to a PR. To trigger a fresh review after updating a PR branch:

1. Open the PR on GitHub.
2. Add a review comment containing `@claude review`.
3. `claude.yml` picks it up and runs the review action.

---

## Secrets inventory

| Secret | Scope | Purpose |
|--------|-------|---------|
| `ANTHROPIC_API_KEY` | Repo → Actions | Claude API calls from CI (workflows + code review). Must use the CI workspace key, not the root account key. |

---

## Troubleshooting CI

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Code review not running on a PR | PR is a draft, or only non-source files changed (paths filter), or PR is from a fork | Mark PR ready, push a source file change, or trigger manually with `@claude review` |
| Unexpected token spike | Check the Anthropic Console billing dashboard for the CI workspace; look for rapid-fire runs in GitHub Actions | Verify concurrency group is in the workflow; check for any `synchronize` trigger re-added |
| Review runs but uses wrong model | `claude_args` may not be passed through for plugin-prompt invocations | Check action version's `docs/usage.md`; fall back to setting the model via a custom prompt |
