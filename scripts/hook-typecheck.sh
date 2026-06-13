#!/usr/bin/env bash
# PostToolUse hook: runs TypeScript typecheck after a .ts/.tsx file is written.
# Exits 2 on failure so asyncRewake wakes Claude with the error output.
#
# Skips: test/spec files, Cypress files, non-TS files.
# Detects server vs frontend files and runs the correct tsc invocation.

file=$(jq -r '.tool_input.file_path // ""')

# Only run for TypeScript source files
echo "$file" | grep -qE '\.(tsx?|ts)$'   || exit 0
echo "$file" | grep -qE '\.(test|spec)\.' && exit 0
echo "$file" | grep -q '/cypress/'        && exit 0

if echo "$file" | grep -q '/server/src/'; then
  output=$(cd "$(git rev-parse --show-toplevel)/server" && npx tsc --noEmit 2>&1)
else
  output=$(cd "$(git rev-parse --show-toplevel)" && npm run typecheck 2>&1)
fi

[ $? -eq 0 ] && exit 0

echo "TypeScript errors after editing $(basename "$file"):"
echo "$output"
exit 2
