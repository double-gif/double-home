#!/bin/zsh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  export PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
fi
if [ ! -d node_modules ]; then
  if command -v pnpm >/dev/null 2>&1; then pnpm install || exit 1; else npm install || exit 1; fi
fi
node server.mjs
