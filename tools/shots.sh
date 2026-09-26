#!/usr/bin/env bash
# Regenerates shots/*.webp from the live apps.
#
#   tools/shots.sh              # all apps
#   tools/shots.sh color time   # just these
#
# Needs google-chrome (or $CHROME), node >= 22 and python3. Pillow is installed
# into a throwaway venv under $WORK on first run. Countdown takes ~70 s because
# it records a real one-minute timer.
set -euo pipefail

repo=$(cd "$(dirname "$0")/.." && pwd)
WORK=${WORK:-/tmp/apphub-shots}
CHROME=${CHROME:-google-chrome}
mkdir -p "$WORK"

if [ ! -x "$WORK/venv/bin/python" ]; then
  python3 -m venv "$WORK/venv"
  "$WORK/venv/bin/pip" install -q pillow
fi

# Fresh profile each run so the apps start from their default settings.
rm -rf "$WORK/profile"
"$CHROME" --headless=new --no-sandbox --hide-scrollbars --remote-debugging-port=9222 \
  --user-data-dir="$WORK/profile" about:blank >/dev/null 2>&1 &
chrome=$!
trap 'kill $chrome 2>/dev/null || true' EXIT
for _ in $(seq 40); do curl -sf http://127.0.0.1:9222/json/version >/dev/null && break; sleep 0.25; done

node "$repo/tools/capture.mjs" "$repo/shots" "$WORK/frames" "$@"

for dir in "$WORK"/frames/*/; do
  app=$(basename "$dir")
  if [ $# -eq 0 ] || [[ " $* " == *" $app "* ]]; then
    "$WORK/venv/bin/python" "$repo/tools/assemble.py" "$dir" "$repo/shots/$app-anim.webp"
  fi
done
