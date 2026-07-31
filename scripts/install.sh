#!/usr/bin/env bash
# Install the latest jj-agentic-switch binary from GitHub Releases.
# Usage:     curl -fsSL https://raw.githubusercontent.com/yigegongjiang/jj-agentic-switch/main/scripts/install.sh | bash
# Uninstall: curl -fsSL https://raw.githubusercontent.com/yigegongjiang/jj-agentic-switch/main/scripts/install.sh | bash -s uninstall
# Override target dir: INSTALL_DIR=/some/dir bash scripts/install.sh

set -euo pipefail

REPO="yigegongjiang/jj-agentic-switch"
BIN_NAME="${REPO##*/}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
BIN="${INSTALL_DIR}/${BIN_NAME}"

err() { printf 'error: %s\n' "$*" >&2; exit 1; }

path_hint() {
  case ":$PATH:" in
    *":${INSTALL_DIR}:"*) ;;
    *) echo "warning: add to PATH → export PATH=\"${INSTALL_DIR}:\$PATH\"" >&2 ;;
  esac
}

if [ "${1:-}" = "uninstall" ]; then
  rm -f "$BIN"
  echo "==> Removed: ${BIN}"
  exit 0
fi

command -v curl >/dev/null 2>&1 || err "curl is required"

[ "$(uname -s)" = "Darwin" ] || err "unsupported OS: $(uname -s) (macOS only)"
case "$(uname -m)" in
  arm64)  arch="arm64" ;;
  x86_64) arch="x64" ;;
  *)      err "unsupported arch: $(uname -m)" ;;
esac

asset="${BIN_NAME}-macos-${arch}"
base="https://github.com/${REPO}/releases/latest/download"

echo "==> Installing ${BIN_NAME} → ${INSTALL_DIR}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
tmp="${tmpdir}/${asset}"

curl -fL --progress-bar --retry 3 -o "$tmp" "${base}/${asset}" || err "download failed"

# Best-effort sha256 verification; fail only on a real mismatch.
if line="$(curl -fsSL --retry 3 "${base}/checksums.txt" 2>/dev/null | grep " ${asset}\$" || true)"; then
  if [ -n "$line" ]; then
    expected="${line%% *}"
    actual="$(shasum -a 256 "$tmp" | awk '{print $1}')"
    [ "$expected" = "$actual" ] || err "checksum mismatch"
  fi
fi

mkdir -p "$INSTALL_DIR"
chmod +x "$tmp"
mv -f "$tmp" "$BIN"

echo "==> Installed: ${BIN} (v$("$BIN" -v))"
path_hint
