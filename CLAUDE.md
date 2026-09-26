# apphub-casa

Start page for apphub.casa: one `index.html` plus `shots/`, no build.

## Deploy

Cloudflare Worker `startpage-apphub-casa` with static assets, connected to
Workers Builds: push to `main` is live ~30 s later; other branches upload a
preview version only. Never rename the Worker in `wrangler.jsonc` — the apex
custom domain is bound to it.

Assets are served from the repo root, so anything that shouldn't be public
goes in `.assetsignore` (currently `tools/` and this file).

## Adding an app

One `<li class="app">` per app in `index.html`: add an accent colour
variable in `:root`, a 24px stroke icon, the hosts with language tags, and a
screenshot (`tools/shots.sh <app>` after adding it to `APPS` in
`tools/capture.mjs`).

## Screenshots

`tools/shots.sh [app...]` regenerates `shots/<app>.webp` (640x400 stills) from
the live sites with headless Chrome over CDP. Apps with an entry in `ANIMATED`
in `capture.mjs` also get `shots/<app>-anim.webp` (animated WebP via Pillow);
the page shows those in a `<picture>` with the still as the
`prefers-reduced-motion` fallback. Clock/Time/Countdown capture the current
time, so rerunning changes them even if the app didn't change.
