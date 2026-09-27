# ADR-0001: App Stack

## Context

BioLab's MVP is one browser screen: a student sets five conditions, runs a precomputed 24-simulated-hour experiment, and watches it play back in about 30 seconds.

- **[BRD-0001](../../design-docs/brd/0001-biolab-mvp.md):** single user, single session. No accounts, no persistence, English only. It is shown in a short hackathon demo on a desktop browser.
- **[DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md)** already fixes several technology choices:
  - React with an SVG/CSS culture chamber (§14)
  - Chart.js for charts (§13)
  - Lucide icons (§18)
  - Inter and JetBrains Mono fonts (§5)
  - a closed set of colour, spacing and radius tokens (§3, §6, §7)
- **[PRD-0001](../../design-docs/prd/0001-simulation-science.md):** a small, pure, deterministic model of 1,440 fixed steps per run.
- **[PRD-0002](../../design-docs/prd/0002-experiment-workspace.md):** a single-screen workspace with a run lifecycle, playback, three charts, accessibility and responsive layouts. It delegates architecture to this ADR and ADR-0002.
- **AGENTS.md:** every dependency must be justified, and verification tests must exist before implementation.

The goal is the smallest stack that meets these constraints for a hackathon timeline.

## Decision

**1. Stack.** A client-side single-page app built with Vite, React and TypeScript, styled with Tailwind CSS locked to the design-system tokens, and deployed as static files to Vercel. There is no backend, no database and no authentication.

**Runtime dependencies**

| Package | Why it exists |
|---|---|
| `react`, `react-dom` | UI component model; DESIGN_SYSTEM §14 names React. Renders model output declaratively into controls, chamber and panels. |
| `chart.js` | Mandated by DESIGN_SYSTEM §13. Only the needed parts are registered (line chart, linear scales, tooltip) to keep the bundle small. |
| `react-chartjs-2` | Thin binding that creates, updates and destroys Chart.js instances inside React, so no hand-written chart lifecycle code is needed. |
| `lucide-react` | DESIGN_SYSTEM §18 icons as tree-shakable components; only imported icons are bundled. |
| `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` | Self-hosted design-system fonts, bundled with the app. The demo works offline and makes no third-party font requests. |

**Development dependencies**

| Package | Why it exists |
|---|---|
| `vite`, `@vitejs/plugin-react` | Dev server with fast refresh, and the static production build. |
| `typescript` | Strict type checking of the simulation types and the UI. |
| `tailwindcss`, `@tailwindcss/vite` | Utility styling bound to the design-system tokens (see 2). |
| `vitest` | Unit, scenario, regression and invariant tests. Shares the Vite configuration. The simulation engine is tested in a plain Node environment. |
| `@testing-library/react`, `@testing-library/user-event`, `jsdom` | Workspace behaviour tests for PRD-0002: run lifecycle, control locking, Reset and keyboard operation. |
| `eslint` with `typescript-eslint` and `eslint-plugin-react-hooks` (the Vite React-TS template set) | Linting, including the rule that stops the engine importing UI code or browser APIs (ADR-0002). |

- **Package manager:** npm, with the lockfile committed.
- **Versions:** current stable major versions, pinned at scaffold time (ExecPlan).
- **Tooling runtime:** Node.js active LTS.

**2. Tailwind under DESIGN_SYSTEM.md.**
- **Single token source:** design-system tokens are defined once, as CSS custom properties in the Tailwind theme. They cover:
  - colours from §3, including the culture colours
  - only the allowed spacing values from §6
  - the radii from §7
  - the font families and type sizes from §5
- **No off-system classes:** Tailwind's default colour palette and unused default scales are removed, so a class like `text-emerald-500` does not exist.
- **No arbitrary values:** arbitrary values (for example `p-[13px]`) are not used for anything a token covers. This is a code-review rule.
- **Shared tokens:** the SVG chamber uses the same CSS variables. Chart.js reads the resolved token values when a chart is created, so colours are never copied into a second list.
- **No UI component library:** shadcn, MUI and similar are not used. The design system has few, specific components, and a library would bring its own visual language.

**3. Rendering and state.**
- **Culture chamber:** React-rendered SVG with CSS transitions. Bubble and particle motion uses `requestAnimationFrame` inside the chamber only, driven by the current trajectory sample, and honours `prefers-reduced-motion`. There is no animation library.
- **Charts:**
  - Chart.js canvas charts.
  - A small local Chart.js plugin draws the dark-period bands, stress-onset markers, playback cursor and the zero line. It replaces `chartjs-plugin-annotation`.
  - Chart data is prepared by pure functions that are testable without a canvas.
- **State:** React's built-in state. A reducer holds the run lifecycle (Ready, Preparing, Running, Completed); context is used only if passing props becomes awkward. There is no Redux, Zustand or XState.
- **Routing:** none, since there is only one screen.

**4. Module boundaries.** Folder names are indicative; the ExecPlan fixes the final layout.

| Module | Contents | May depend on | Must not depend on |
|---|---|---|---|
| `src/simulation/` | The engine (ADR-0002) | Nothing: TypeScript and `Math` only | React, the DOM, Chart.js, Lucide, Tailwind, any npm package |
| `src/presentation/` | Pure, React-free display logic: number and time formatting, explanation content (PRD-0002 §7), run-record rows, the light-control stop mapping (PRD-0002 §4.1), chart data preparation | The engine's public API and parameters | React, the DOM, Chart.js |
| `src/ui/` | React components: header, controls, chamber, live data, explanation panel, playback controller | React, `react-chartjs-2`/Chart.js, `lucide-react`, the engine's public API, `src/presentation/` | Engine internals |
| `src/styles/` | Tailwind theme with design-system tokens; font imports | Tailwind, fontsource | — |
| `tests/` | Vitest suites | Vitest; React Testing Library and jsdom for UI tests only | — |

**5. Why no game engine.** Phaser, PixiJS, Three.js and similar are not needed.
- **The design system already chose SVG.** It mandates SVG, CSS and React for the chamber (§14). It also calls for slow, organic motion (§16) and rules out game aesthetics (§2, §19).
- **The scene is small:** one vessel with a handful of layers, tens of bubbles and particles, and no physics, collisions, sprites, cameras or game loop.
- **A game engine would get in the way:**
  - it renders to a canvas outside the DOM, which weakens the accessibility PRD-0002 §11 requires and bypasses the design-system styling
  - it adds a large bundle
  - it runs a second scene graph and loop that would duplicate React state
- **Plain SVG already fits the model.** Every chamber layer maps to one model value (PRD-0002 §5).

**6. Why no backend.**
- There is nothing to serve or store. The model runs in a few milliseconds in the browser (ADR-0002).
- BRD-0001 excludes accounts, persistence and a teacher dashboard.
- No data is collected and no secrets exist.
- A backend would add hosting, latency, failure modes and cost for no product benefit.
- If accounts, saved runs or teacher features enter scope later, a new ADR will decide how.

**7. Browser and runtime assumptions.**
- **Browsers:** desktop evergreen browsers (current and previous major version of Chrome, Edge, Firefox and Safari) at 1280 × 720 or larger. Smaller layouts work but are not optimized (PRD-0002 §12).
- **Build target:** ES2022.
- **Required platform features:**
  - JavaScript, Canvas 2D, SVG, CSS transforms and transitions
  - `requestAnimationFrame`
  - the Page Visibility API, for pausing playback (PRD-0002 D-12)
  - `matchMedia` for `prefers-reduced-motion`
  - `Intl.NumberFormat`
  - `Math.expm1`
- **No network after load:** fonts are bundled, and nothing is fetched at runtime.

**8. Deployment.**
- `vite build` produces a static `dist/` folder: HTML, JavaScript, CSS and fonts.
- **Vercel:** a project using the Vite preset.
  - build command `npm run build`, output directory `dist`
  - no serverless functions, no environment variables, no rewrites (single page)
  - preview deployments per branch are optional
- **Offline demo fallback:** the same build can run on the demo laptop with `npm run preview`, with no network needed.
- **Timing:** creating the Vercel project and deploying are outward-facing steps, done later with explicit confirmation.

## Alternatives considered

- **Frameworks and build tools:**
  - **Next.js or Remix:** their server rendering, routing and server functions are unneeded. More configuration and concepts for a single static screen.
  - **Create React App:** deprecated.
  - **Svelte, Vue or plain TypeScript without a framework:** DESIGN_SYSTEM §14 names React.
- **Styling and components:**
  - **CSS Modules or plain CSS instead of Tailwind:** fully viable. Tailwind follows the stated preference, with tokens locked to the design system (see 2).
  - **A UI component library:** brings its own visual language; the design system's components are few and bespoke.
- **Charts:**
  - **Recharts, ECharts, D3 or uPlot:** DESIGN_SYSTEM §13 mandates Chart.js.
  - **Chart.js without `react-chartjs-2`:** viable, with one dependency fewer. The wrapper was chosen for lifecycle simplicity and can be dropped if it causes friction.
  - **`chartjs-plugin-annotation`:** replaced by a small local plugin covering the four overlays PRD-0002 needs.
- **Fonts:**
  - **Google Fonts CDN:** needs the network at demo time and makes third-party requests. Self-hosting was chosen.
- **Rendering, motion and state:**
  - **Phaser, PixiJS or Three.js:** rejected (Decision 5).
  - **Framer Motion or GSAP:** unnecessary; CSS transitions and `requestAnimationFrame` suffice for slow motion.
  - **Redux, Zustand or XState:** a four-state lifecycle does not need a state library.
- **Backend and testing:**
  - **A backend or backend-as-a-service** (Express, serverless functions, Supabase, Firebase): rejected (Decision 6).
  - **Playwright end-to-end tests:** deferred. Heavy for the MVP; behaviour tests with React Testing Library cover the PRD-0002 flows. Revisit if needed.

## Consequences

**Easier**
- **Few moving parts:** a static, offline-capable app with one deployment target and no server to operate.
- **Fast development loop:** Vite and Vitest share one configuration.
- **Design system enforced:** off-system colours and spacing cannot be expressed as Tailwind classes.
- **Isolated science:** the simulation cannot accidentally import UI or browser code.

**Harder or required**
- **Tailwind discipline:** arbitrary values must be kept out through code review.
- **Canvas charts:** they need the local overlay plugin, and their accessibility depends on the text summaries and hourly tables required by PRD-0002 §11. jsdom cannot render a canvas, so chart rendering is checked visually and chart data preparation is unit-tested as pure functions.
- **Main-thread compute:** the engine runs on the main thread, which is acceptable while a run takes a few milliseconds (ADR-0002).
- **Lockfile maintenance:** dependency versions must be pinned and kept current through the lockfile.

**Follow-ups**
- ADR-0002 defines the simulation engine.
- Verification tests come next, then the ExecPlan: scaffold, exact versions, file layout.

**Approved by human decision on 2026-09-27**
1. This ADR, in full.
2. Dependencies beyond the stated preference:
   - `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`
   - `vitest`
   - `@testing-library/react`, `@testing-library/user-event`, `jsdom`
   - the build plugins `@vitejs/plugin-react` and `@tailwindcss/vite`
   - the template's ESLint set
3. A local Chart.js overlay plugin instead of `chartjs-plugin-annotation`.
4. The browser support matrix and the Node.js active LTS tooling runtime.

## Status

accepted
