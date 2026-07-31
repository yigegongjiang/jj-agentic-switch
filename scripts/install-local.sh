#!/usr/bin/env bash
# Build the CLI locally and install it to ~/.local/bin — for local verification.
# Usage: ./scripts/install-local.sh   (run from anywhere; the script cd's to the repo root)
# Override target dir: INSTALL_DIR=/some/dir ./scripts/install-local.sh

set -euo pipefail

cd "$(dirname "$0")/.."

BIN_NAME="jj-agentic-switch"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
BIN="${INSTALL_DIR}/${BIN_NAME}"

err() { printf 'error: %s\n' "$*" >&2; exit 1; }

path_hint() {
  case ":$PATH:" in
    *":${INSTALL_DIR}:"*) ;;
    *) echo "warning: add to PATH → export PATH=\"${INSTALL_DIR}:\$PATH\"" >&2 ;;
  esac
}

command -v bun >/dev/null 2>&1 || err "bun is required"

[ "$(uname -s)" = "Darwin" ] || err "unsupported OS: $(uname -s) (macOS only)"
case "$(uname -m)" in
  arm64)  arch="arm64" ;;
  x86_64) arch="x64" ;;
  *)      err "unsupported arch: $(uname -m)" ;;
esac

echo "==> Typechecking"
bun run typecheck

echo "==> Building ${BIN_NAME} (macOS arm64 + x64)"
bun run build

artifact="dist/${BIN_NAME}-macos-${arch}"
[ -f "$artifact" ] || err "build artifact not found: ${artifact}"

echo "==> Installing ${BIN_NAME} → ${INSTALL_DIR}"
mkdir -p "$INSTALL_DIR"
# Stage then rename: overwriting the binary in place fails if it is running.
tmp="${BIN}.tmp.$$"
trap 'rm -f "$tmp"' EXIT
cp -f "$artifact" "$tmp"
chmod +x "$tmp"
mv -f "$tmp" "$BIN"

echo "==> Installed: ${BIN} (v$("$BIN" -v))"
path_hint
