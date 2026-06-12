#!/usr/bin/env bash
# PreToolUse hook: injects a context reminder when committing user-facing files
# without updating docs/USER_GUIDE.md.
#
# Non-blocking — only injects additionalContext, never blocks the commit.

cmd=$(jq -r '.tool_input.command // ""')

# Only trigger on git commit commands
echo "$cmd" | grep -qE '^git commit' || exit 0

staged=$(git diff --cached --name-only 2>/dev/null || true)

# Check for staged user-facing source files
user_facing=$(echo "$staged" | grep -E '^src/(pages|features)/' || true)
# Check if the user guide is also staged (grep -c always prints a number)
doc_staged=$(echo "$staged" | grep -c 'docs/USER_GUIDE.md')

if [ -n "$user_facing" ] && [ "$doc_staged" -eq 0 ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"REMINDER: User-facing files are staged (src/pages/ or src/features/) but docs/USER_GUIDE.md is not. Per CLAUDE.md, commits that change pages or features must update the user guide. Check if this commit needs a doc update before proceeding."}}\n'
fi
