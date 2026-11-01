# apphub-casa

Start page for apphub.casa: one `index.html` plus `shots/`, no build.

## Deploy

Cloudflare Worker `startpage-apphub-casa` with static assets, connected to
Workers Builds: push to `main` is live ~30 s later; other branches upload a
preview version only. Never rename the Worker in `wrangler.jsonc` — the apex
custom domain is bound to it.

Assets are served from the repo root, so anything that shouldn't be public
goes in `.assetsignore` (currently `tools/`, `LICENSE` and this file).

## Layout

Featured apps first (Sermon Studio, Chores: full-width cards in
`ul.apps.featured`, screenshot left on wide screens, a few `.points`), then
grouped lists under `h2` headings (Everyday with Clock first, Fun & games),
then About (free, fork or use the hosted ones, no ads or tracking, hobby
projects, contact mail@apphub.casa) and the footer. The About text promises
every app can be forked: a new app needs a licence in its repo. Clock is much used: keep it
first after the featured apps.

## Adding an app

One `<li class="app">` per app in `index.html`, in the right group: add an
accent colour variable in `:root`, a 24px stroke icon, the hosts with
language tags, a `source` link to its GitHub repo as the last item in
`.hosts` (links outside `.hosts` are covered by the card's stretched link),
and a screenshot (`tools/shots.sh <app>` after adding it to `APPS` in
`tools/capture.mjs`, plus `URLS` if it isn't at `<app>.apphub.casa`).

## Screenshots

`tools/shots.sh [app...]` regenerates `shots/<app>.webp` (640x400 stills) from
the live sites with headless Chrome over CDP. Apps with an entry in `ANIMATED`
in `capture.mjs` also get `shots/<app>-anim.webp` (animated WebP via Pillow);
the page shows those in a `<picture>` with the still as the
`prefers-reduced-motion` fallback. Clock/Time/Countdown capture the current
time, so rerunning changes them even if the app didn't change.

Featured apps (`LARGE` in `capture.mjs`) also get `shots/<app>-large.webp`
(960x600). `tools/shots.sh og` renders `tools/og.html` from the shots to
`shots/og.jpg`, the link preview (`og:image`); a full run does it last.
Apex caching keeps assets up to 4 h in browsers, so a changed image may show
late; a new file name avoids that.

## PRs

Changes go in PRs with screenshots of the page served locally:
`tools/pr-shots.sh [--pr] <png>...` uploads them to the orphan `pr-shots`
branch and prints (or adds) the Markdown.
