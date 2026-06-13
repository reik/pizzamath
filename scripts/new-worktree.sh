#!/usr/bin/env bash
# Creates an isolated git worktree for parallel feature development.
# Usage: ./scripts/new-worktree.sh <feature-name>
#
# Each worktree gets its own ports (frontend and backend) so multiple
# dev servers can run simultaneously without conflicts.
set -euo pipefail

NAME=${1:-}
if [ -z "$NAME" ]; then
  echo "Usage: $0 <feature-name>" >&2
  echo "Example: $0 stripe" >&2
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
WORKTREES_DIR="$REPO_ROOT/.worktrees"
WORKTREE_PATH="$WORKTREES_DIR/$NAME"
BRANCH="feat/$NAME"

if [ -d "$WORKTREE_PATH" ]; then
  echo "Error: worktree '$WORKTREE_PATH' already exists." >&2
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Error: branch '$BRANCH' already exists." >&2
  exit 1
fi

# Count existing worktrees (excluding main) to assign port offset
EXISTING=$(ls -d "$WORKTREES_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ')
OFFSET=$((EXISTING + 1))

VITE_PORT=$((5175 + OFFSET))
BACKEND_PORT=$((3001 + OFFSET))

mkdir -p "$WORKTREES_DIR"
git worktree add "$WORKTREE_PATH" -b "$BRANCH"

# Symlink node_modules so npm install isn't needed in the worktree
ln -sf "$REPO_ROOT/node_modules" "$WORKTREE_PATH/node_modules"
ln -sf "$REPO_ROOT/server/node_modules" "$WORKTREE_PATH/server/node_modules"

# Frontend env: override ports
cat > "$WORKTREE_PATH/.env" <<EOF
VITE_PORT=$VITE_PORT
BACKEND_PORT=$BACKEND_PORT
EOF

# Backend env: copy from main, override PORT and APP_BASE_URL
cp "$REPO_ROOT/server/.env" "$WORKTREE_PATH/server/.env"
sed -i '' "s/^PORT=.*/PORT=$BACKEND_PORT/" "$WORKTREE_PATH/server/.env"
sed -i '' "s|^APP_BASE_URL=.*|APP_BASE_URL=http://localhost:$VITE_PORT/pizzamath|" \
  "$WORKTREE_PATH/server/.env"

echo ""
echo "✓  Worktree : $WORKTREE_PATH"
echo "✓  Branch   : $BRANCH"
echo "✓  Frontend : http://localhost:$VITE_PORT/pizzamath"
echo "✓  Backend  : http://localhost:$BACKEND_PORT"
echo ""
echo "Start developing:"
echo "  cd $WORKTREE_PATH && npm run dev:all"
echo ""
echo "When done, clean up with:"
echo "  git worktree remove $WORKTREE_PATH && git branch -d $BRANCH"
