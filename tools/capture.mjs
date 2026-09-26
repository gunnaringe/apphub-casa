// Captures the card screenshots from the live apps via the Chrome DevTools
// protocol. Run through tools/shots.sh, which starts Chrome on :9222.
//
//   node capture.mjs <shotsdir> <framedir> [app...]
//
// Stills are written straight to <shotsdir>/<app>.webp (640x400). Apps in
// ANIMATED also get frames + durations.json in <framedir>/<app>/, which
// assemble.py turns into <shotsdir>/<app>-anim.webp.
const [shotsDir, frameDir, ...only] = process.argv.slice(2);
const fs = await import('node:fs');

const APPS = ['clock', 'time', 'chores', 'runenavn', 'color', 'countdown'];
const W = 1280, H = 800, SCALE = 0.5;

const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); pending.get(m.id)?.(m.result); };
const send = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const capture = async (format) => {
  const { data } = await send('Page.captureScreenshot', {
    format, quality: format === 'webp' ? 80 : undefined,
    clip: { x: 0, y: 0, width: W, height: H, scale: SCALE },
  });
  return Buffer.from(data, 'base64');
};
const space = async () => {
  for (const type of ['keyDown', 'keyUp'])
    await send('Input.dispatchKeyEvent', { type, key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: type === 'keyDown' ? ' ' : undefined });
};
const click = sel => send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(sel)}).click()` });
const open = async app => {
  await send('Page.navigate', { url: `https://${app}.apphub.casa` });
  await sleep(3500);
};

// Frame recorder: shot(ms) grabs a frame that is shown for ms in the animation.
const recorder = app => {
  const dir = `${frameDir}/${app}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const durations = [];
  return {
    durations,
    shot: async ms => {
      fs.writeFileSync(`${dir}/${String(durations.length).padStart(3, '0')}.png`, await capture('png'));
      durations.push(ms);
    },
    save: () => fs.writeFileSync(`${dir}/durations.json`, JSON.stringify(durations)),
  };
};

// Stills show the app's first screen, unless a setup step makes it more telling.
const STILL_SETUP = {
  color: async () => { await space(); await sleep(1200); }, // idle screen is almost all black
};

const ANIMATED = {
  // Start screen → a few colours → settings panel → back.
  color: async ({ shot }) => {
    await shot(1600);
    for (let i = 0; i < 5; i++) {
      await space();
      await sleep(120); await shot(120);   // mid-transition
      await sleep(500); await shot(900);   // settled colour
    }
    await click('#gear');
    await sleep(150); await shot(150);
    await sleep(600); await shot(2000);
    await click('#close');
    await sleep(150); await shot(150);
    await sleep(500); await shot(700);
  },
  // 5:00 idle → pick 1 min → a real minute sampled every 2 s, played at 10x → "Ferdig!".
  countdown: async ({ shot, durations }) => {
    await shot(1400);
    await click('#presets button');
    await sleep(600); await shot(900);
    await space();
    const start = Date.now();
    while (Date.now() - start < 60500) { await shot(200); await sleep(2000 - 60); }
    await sleep(700);
    for (let i = 0; i < 10; i++) { await shot(250); await sleep(200); }
    durations[durations.length - 1] = 1500;
  },
};

await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
fs.mkdirSync(shotsDir, { recursive: true });
for (const app of only.length ? only : APPS) {
  await open(app);
  await STILL_SETUP[app]?.();
  fs.writeFileSync(`${shotsDir}/${app}.webp`, await capture('webp'));
  console.log('still', app);
  if (ANIMATED[app]) {
    await open(app);
    const rec = recorder(app);
    await ANIMATED[app](rec);
    rec.save();
    console.log('frames', app, rec.durations.length);
  }
}
ws.close();
