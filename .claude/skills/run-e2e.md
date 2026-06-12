---
name: run-e2e
description: Start the pizzamath dev server and run the Cypress e2e suite, then stop the server. Use when you need to verify e2e tests pass without doing it manually.
---

# Run E2E Tests

Starts the dev server if not already running, runs Cypress headlessly, reports results, then stops the server if we started it.

## Arguments

`$ARGUMENTS` — optional spec filter (e.g. `insights`, `grading`, `auth`). If empty, runs the full suite.

## Steps

### 1. Check if dev server is already running

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/pizzamath/ 2>/dev/null
```

If the response is `200`, the server is already up — skip to step 3 and do NOT stop it at the end.
If not `200`, continue to step 2.

### 2. Start the dev server in the background

```bash
npm run dev:all &>/tmp/pizzamath-e2e-server.log &
echo $! > /tmp/pizzamath-e2e-server.pid
```

Then poll until port 5175 is ready (max 30 seconds):
```bash
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/pizzamath/ | grep -q 200 && break
  sleep 1
done
```

### 3. Run Cypress

If `$ARGUMENTS` is set:
```bash
npx cypress run --spec "cypress/e2e/*$ARGUMENTS*" --headless 2>&1
```

If `$ARGUMENTS` is empty:
```bash
npx cypress run --headless 2>&1
```

Capture the full output and exit code.

### 4. Stop the server (only if we started it in step 2)

```bash
kill $(cat /tmp/pizzamath-e2e-server.pid) 2>/dev/null
rm -f /tmp/pizzamath-e2e-server.pid
```

### 5. Report

Show a summary table:
- Each spec with pass/fail counts
- Total: N passing, N failing
- Duration

If any tests failed, list the failing test names and suggest next steps.

## Notes

- Cypress uses the config at `cypress.config.ts` (baseUrl: `http://localhost:5175/pizzamath`)
- All Claude/vision API calls are intercepted in tests — no real AI calls needed
- If the server fails to start within 30 seconds, report the last 20 lines of `/tmp/pizzamath-e2e-server.log`
