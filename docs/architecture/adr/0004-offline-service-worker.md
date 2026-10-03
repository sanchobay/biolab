# ADR-0004: Offline service worker and hosting headers

## Context

[PRD-0004](../../design-docs/prd/0004-offline-first.md) requires BioLab to work fully offline after one online visit, to offer an explicit update, and to show an offline indicator. Relevant constraints:

- **ADR-0001 §7:** no network after load.
- **ADR-0001 §8:** static files on Vercel, no serverless functions, no environment variables, no rewrites.
- **BRD-0002:** no backend, no third-party services, no runtime network requests.
- **AGENTS.md:** every new dependency must be justified.

The build has a small, fixed output:
- `index.html`
- one hashed JS file and one hashed CSS file
- 12 bundled `woff2` font files
- after PRD-0004: the manifest and the icons

The dev server (Vite) and the tests (Vitest with jsdom) must keep working without a service worker.

## Decision

1. **A small hand-written service worker, with no new dependency.**
   - **Source:** a plain JavaScript service worker of about 100 lines, kept under `src/pwa/`.
   - **Behaviour:**
     - it precaches a list of URLs into a cache named `biolab-<version>`
     - it serves navigations with the cached `index.html` and precached files cache-first
     - it sends other same-origin GET requests to the network with a cache fallback
     - it ignores cross-origin requests
     - on activation it deletes older `biolab-*` caches
     - it claims clients only on the first install
     - it waits for an explicit `SKIP_WAITING` message before activating an update
2. **A local Vite plugin generates the precache list.**
   - A small plugin defined in `vite.config.ts` runs only in `vite build`. After bundling it:
     - lists every emitted file plus the public files (manifest, icons)
     - derives the version from a hash of that list
     - writes `sw.js` to the output root with the list and version inlined
   - The list-building function is a pure, exported helper, so it is unit-tested.
3. **Registration runs in production only.**
   - `src/pwa/register.ts` registers `/sw.js` only when `import.meta.env.PROD` is true and `'serviceWorker' in navigator`, after the `load` event. Dev and tests never register it.
   - It exposes the state the UI needs to a small React hook: offline-ready, update-waiting, and online/offline.
   - The update prompt posts `SKIP_WAITING` and reloads once on `controllerchange`.
4. **Static files go in `public/`:**
   - `manifest.webmanifest`
   - the SVG icon and the committed PNG renders
   - the favicon
5. **`vercel.json` holds headers only:**
   - `Cache-Control: no-cache` for `/sw.js`, `/manifest.webmanifest`, `/` and `/index.html`
   - `public, max-age=31536000, immutable` for `/assets/*`

   There are still no rewrites, functions or environment variables.

## Alternatives considered

### vite-plugin-pwa (Workbox)

Version 1.3.0 checked on 2026-09-30. Its peer range covers Vite 8.

- **For:**
  - mature, widely used precaching
  - generates the manifest
  - ships `workbox-window` update hooks and a React `useRegisterSW`
  - an optional icon generator (`@vite-pwa/assets-generator`)
- **Against:**
  - It adds `vite-plugin-pwa`, `workbox-build` (37 direct dependencies, including a Babel and Rollup toolchain) and `workbox-window`. That is a large dev-dependency tree for a precache list of about 20 files.
  - The generated service worker includes the Workbox runtime, and the configuration surface is much larger than PRD-0004 needs.
  - It is one more toolchain to keep compatible with Vite and the lockfile.
- **Verdict:** rejected under the AGENTS.md "justify every dependency" rule. The hand-written worker covers PRD-0004 completely, and its risk is contained by unit tests of the precache list and routing, plus offline browser QA of the production build.

### Other alternatives

- **No service worker, and `npm run preview` on the laptop as the fallback (ADR-0001 §8):** already available, but it only works on the presenter's machine and not on the deployed site. It also shows no offline status. Kept as a secondary fallback, not a replacement.
- **The browser HTTP cache only (long `max-age`):** navigations still need the network for `index.html`, so a reload offline fails.
- **AppCache:** removed from browsers.

## Consequences

**Easier**
- The deployed site survives a lost network after one visit.
- There are no new packages. The whole caching logic is readable in one file.

**Harder or required**
- **Correctness is ours:**
  - cache cleanup
  - the navigation fallback
  - update activation

  It must be covered by unit tests (the precache list, the routing decision and the registration-state reducer) and by production-build browser QA with the network disabled.
- **Every future runtime resource must be covered.** A new route or a lazily loaded chunk is covered automatically, because the list is generated from the build output.
- **Updates appear only after a deploy and an online load.** During development the service worker is never active.

**Amends ADR-0001**
- §7 platform features: adds Service Worker and Cache Storage. They are optional: the app still works online without them.
- §8 deployment: adds `vercel.json` with cache headers only.

## Status

accepted
