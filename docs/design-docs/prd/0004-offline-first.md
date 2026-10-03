# PRD-0004: Offline-first

Implements [BRD-0002](../brd/0002-demo-readiness-offline-access-tutor.md) goal 1. Architecture: [ADR-0004](../../architecture/adr/0004-offline-service-worker.md). The simulation, the workspace and all existing behaviour are unchanged.

## Scope

### 1. What works offline

- **Condition:** one visit with a network connection, on the deployed site or on `npm run preview`.
- **After that, with the network fully disabled:** the whole app works.
  - reload
  - a full 24-hour run
  - EN / ҚАЗ / RU
  - Learn and About
  - the knowledge check
  - both themes
  - the display settings and read aloud from PRD-0005
  - the Lab Tutor from PRD-0006
- **Scope limit:** "the whole app" means every file of the production build: HTML, hashed JS and CSS, the bundled fonts, the manifest and the icons. Nothing else exists to cache, because BioLab makes no runtime network requests (ADR-0001 §7).
- **Dev and tests:** the development server and the tests never register the service worker.

### 2. Web app manifest and icons

- **Manifest:**
  - name "BioLab", short name "BioLab"
  - start URL and scope `/`
  - display `standalone`
  - background and theme colour `#EEF3F9` (Main Background, light)
  - `lang: "en"`
  - the existing page description
- **Icons:**
  - **Artwork:** simple original SVG, drawn for BioLab (not a copy of a Lucide or other library icon).
    - an Erlenmeyer flask outline in Primary `#1B6FE0`
    - culture liquid in the culture base colour `#3CC04A`
    - on a Primary Surface `#FFFFFF` rounded square
  - **Formats:**
    - an SVG favicon, replacing today's empty `data:,` favicon
    - PNG 192 and 512
    - a maskable PNG 512 with safe-zone padding
    - a 180 px `apple-touch-icon`
  - **PNG generation:** the PNGs are rendered once from the SVG and committed. No icon-generator dependency is used.
- **No install prompt.** The browser's own install UI is enough (BRD-0002 non-goals).

### 3. Caching behaviour

- **Precache:** the service worker caches every build file into one versioned cache when it installs.
- **Version:** the cache version is derived from the list of built files, so every deploy produces a new version.
- **Page loads:** the app shell (`index.html`) and every precached file are served from the cache first, so the page opens instantly and without the network.
- **Other requests:** same-origin requests outside the precache go to the network, with the cache as a fallback. Cross-origin requests are not intercepted, and none exist.
- **Old caches:** older BioLab caches are deleted when a new version activates.

### 4. New version

- When a newer version has been installed in the background, a slim localized notice appears under the methodology bar: "A new version of BioLab is available." with a **Reload** button. The notice is announced politely.
- **Nothing reloads by itself.** A run in progress is never interrupted unless the student presses Reload. Reload activates the new version and reloads the page once.
- The notice can be dismissed. It returns on the next page load if the update is still waiting.

### 5. Offline status indicator (header)

- **Position:** a compact status next to the language switcher: a Lucide icon plus short 12 px Secondary Text.
- **States:**

| Situation | Shown |
|---|---|
| Service worker unsupported, development build, or the first visit is not cached yet | Nothing |
| Cached, online | CloudCheck + "Available offline" |
| Cached, network lost (`navigator.onLine` is false) | CloudOff + "Offline — running from this device" |

- The status element has a text label for screen readers. Changes are not announced on every network flicker; the text simply updates.

### 6. Hosting headers (Vercel)

| Path | Cache-Control | Why |
|---|---|---|
| `/sw.js` | `no-cache` | The browser must see a new worker on every deploy. |
| `/manifest.webmanifest` | `no-cache` | The manifest can change between deploys. |
| `/` and `/index.html` | `no-cache` | The app shell always revalidates online. |
| `/assets/*` | `public, max-age=31536000, immutable` | These files are content-hashed. |

These headers are set in `vercel.json` (headers only; still no rewrites or functions).

### 7. Localization

Every new string is in EN, KK and RU:
- the indicator states
- the update notice
- the Reload and Dismiss buttons

## User flow(s)

1. **Prepare the demo.**
   1. Open the site once online. After a moment, "Available offline" appears.
   2. Disable Wi-Fi and reload. The lab opens.
   3. Run an experiment, switch to ҚАЗ and RU, open Learn and About, and switch the theme. Everything works, and the header shows "Offline — running from this device".
2. **New deploy.**
   1. A new version is deployed while a tab is open.
   2. On the next online navigation or reload check, the notice appears.
   3. The student finishes the run, presses Reload, and the new version loads.

## Edge cases

- **Private windows or blocked storage:** the service worker may fail to install. The app works online as before, and the indicator stays hidden.
- **A precache download fails during install:** the install is abandoned and retried on the next visit. The indicator stays hidden until it succeeds, so it never claims offline readiness that does not exist.
- **Reload during a run:** the run is lost, as today. Runs are never persisted.
- **Two tabs:** the new version activates in all tabs after Reload in one tab. The other tabs keep working and reload on their next navigation.
- **Offline when Reload is pressed:** the new version is already fully cached, so the reload works offline.

## Out of scope

- Offline use before the first online visit.
- Background sync, push notifications and periodic updates.
- An install button or custom install prompt.
- Caching any third-party resource (none exist).

## Design system changes (proposed, to be added to DESIGN_SYSTEM.md on acceptance)

- **Offline indicator:**
  - Lucide icon at 16 px, Secondary Text colour
  - 12 px Inter Secondary Text
  - no pill, border or background
  - it is status, not a control
- **Update notice:**
  - reuses the existing narrow-notice pattern: a full-width slim bar, Elevated Surface, Default Border below, 13 px Secondary Text
  - a secondary 28 px Reload button
  - a Dismiss text button

## Status

accepted
