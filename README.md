# processing-vez

Small [p5.js](https://p5js.org/) sketches that render to **SVG** via [p5.js-svg](https://github.com/zenozeng/p5.js-svg), bundled with [Vite](https://vitejs.dev/).

## Requirements

- **Node.js** — see [`.nvmrc`](./.nvmrc) (e.g. `nvm use`).

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the URL Vite prints (default port **5173**). The app loads [`index.html`](./index.html), which runs [`irisSewingSketch.js`](./irisSewingSketch.js) by default.

Other scripts:

- `npm start` — same as `dev`
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the build locally

## Sketches

| File | Description |
|------|-------------|
| [`irisSewingSketch.js`](./irisSewingSketch.js) | Iris-style flowers and leaves with **dashed** strokes (`setLineDash`). **S** saves `iris-sew-<timestamp>.svg`. **R** calls `loop()` again. |
| [`mySketch.js`](./mySketch.js) | Separate SVG experiment (grid / clip demo). Not loaded unless you point `index.html` at it. |

To switch the entry sketch, change the module script `src` in [`index.html`](./index.html).

## Versions

**p5.js is pinned to 1.x** (`1.11.11`). [p5.js-svg@1.6.0](https://www.npmjs.com/package/p5.js-svg) targets the 1.x API; p5 v2 is not supported here.

## Legacy

[`sketches/hello.pde`](./sketches/hello.pde) is a small Processing-style sketch and is not wired into the current Vite + p5 flow.
