# arc-dag docs site (not published to npm)

**Maintainers only** — this folder is separate from the `arc-dag` npm package.  
`npm install arc-dag` installs **only** `dist/` + README (no VitePress).

Serves markdown from [`../docs`](../docs) via [VitePress](https://vitepress.dev/).

## Prerequisites

- Node.js **>= 20**
- Install deps **in this folder only** (never required for library users):

```bash
cd docs-site
npm install          # also symlinks docs/node_modules → docs-site/node_modules
```

If the dev server shows Vite cache errors, reset and restart:

```bash
npm run clean && npm start
```

## Run

```bash
npm start          # dev server → http://localhost:3000
npm run build      # static output → docs/.vitepress/dist/
npm run serve      # preview build
```

## Edit content

Change files under [`../docs/`](../docs/). Config lives in `docs/.vitepress/`; deps install here in `docs-site/`.

## GitHub Pages (public)

**Live site:** [https://arcpx-eng.github.io/arc-dag/](https://arcpx-eng.github.io/arc-dag/)

Pushes to `main` that touch `docs/` or `docs-site/` run [`.github/workflows/docs-pages.yml`](../.github/workflows/docs-pages.yml).

**One-time repo setup (maintainers):**

1. GitHub → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. Push to `main` (or run the workflow manually) — first deploy may take a few minutes

Preview production build locally (uses `/arc-dag/` base like GitHub Pages):

```bash
npm run build && VITEPRESS_BASE=/arc-dag/ npm run serve
```
