# Hero performance test

`npm run perf` measures how heavy the hero is and compares it with the numbers saved in `baseline.json`. It's the measuring step that guardrail C-009 ("Measured Before Done", `cone/project/architecture/GUARDRAILS.md`) asks for before an always-on visual counts as done.

## Commands

| Command | What it does |
|---|---|
| `npm run perf` | Measures and compares with the baseline. Exit code 1 if something got worse beyond its tolerance, 2 if the baseline is from another GPU. |
| `npm run perf -- --save-baseline` | Measures and saves the result as the new baseline. Only on the reference PC, and only after a change you've accepted. |

A run takes about 2–3 minutes and keeps the PC busy while it runs (it renders the hero 6 times in a headless browser). It never runs on its own.

## What it measures

The production build (`vite build`, served by `vite preview`), not the dev server, so the numbers match what visitors get.

| Number | How |
|---|---|
| Hero frame rate | Frames counted for 8 s, the hero as a visitor sees it, 60 fps cap on |
| Hero CPU | CPU time of all the browser's processes over those 8 s. 100% = one core fully busy |
| Browser RAM | Working set of all the browser's processes at the end of the sample |
| 3D background alone, per frame | Everything else in the hero hidden and the videos paused, frame cap off, so the background draws as fast as it can: 1000 ÷ frames per second |

Each measurement starts a fresh headless Microsoft Edge on the real GPU (it stops if Edge falls back to software rendering), at 1920 × 969, and waits 6 s after the 3D background appears before sampling. The two modes alternate, 3 runs each, and the middle value of the 3 is reported, so one noisy run can't move the result.

## Reading the result

- Run-to-run noise on the reference PC is about ±15% for CPU, less for the rest. The tolerances are wider than that: frame rate may drop 10%, CPU rise 25%, RAM rise 10%, background frame time rise 15% before a run says WORSE.
- A single WORSE can still be noise. Run again; if it repeats, it's real.
- At the 60 fps cap the frame rate can't show improvements, only drops. The background frame time is the number that shows how much headroom the GPU has left (16.7 ms per frame is the 60 fps limit).
- RAM includes the browser itself, so it's always several hundred MB.

## Reference PC

Intel Core i5-4440, Intel HD Graphics 4600, 8 GB RAM, 1920 × 1080 at 60 Hz. The baseline records the GPU it was measured on; comparing on another machine is refused because the numbers wouldn't mean anything.

## Why no Playwright

`edge.mjs` drives Edge directly over the DevTools Protocol with Node's built-in WebSocket. Playwright was removed from this project at the user's request because it made the PC lag (`cone/project/memory/PLAYBOOK.md`); don't add it or Puppeteer back without asking.
