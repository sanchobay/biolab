# BioLab

An interactive virtual biology laboratory for high-school students. Students run a simulated 24-hour experiment with an *Arthrospira platensis* (spirulina) culture, watch the culture respond, analyse the data and read why the result happened.

**Live demo:** https://biolab-sigma.vercel.app

The interface is available in **English, Қазақша and Русский**.

---

## The learning flow

BioLab follows the way scientists work:

**Theory → Protocol → Experiment → Results → Explanation**

1. **Theory:** short explanations of the key concepts:
   - photosynthesis and respiration
   - biomass growth and oxygen production
   - pH, temperature, light, photoinhibition and aeration

   Response curves are drawn directly from the simulation model.
2. **Protocol:** the objective, hypothesis, variables, the healthy baseline and a ten-step procedure.
3. **Experiment:** set five conditions and run 24 simulated hours in about 30 seconds.
   - The five conditions: temperature, starting pH, light intensity, light/dark cycle and aeration.
   - An animated photobioreactor shows the culture's response.
4. **Results:**
   - relative biomass, net O₂ production, simulated pH and culture health
   - trend charts with hourly value tables
   - a run record of every stress that occurred
5. **Explanation:** what happened, why it happened, the effect on the culture, and what to try next. The explanation is generated from the simulation state and compared with the healthy baseline.

A three-question **knowledge check** gives immediate feedback.

The **AI Lab Tutor** and **video lessons** are shown as clearly labelled previews of planned features. They are not functional yet.

## Features

- **Deterministic simulation:** the same conditions always produce the same result.
- **Stress states:**
  - heat stress
  - photoinhibition
  - low- and high-pH stress
  - suboptimal conditions (cold, low light, reduced aeration)
- **Culture health:** a delayed indicator that worsens and recovers gradually.
- **Three interface languages,** switchable instantly without interrupting a running experiment.
- **Light and dark themes.**
- **Accessibility:**
  - full keyboard control
  - screen-reader announcements
  - visible focus
  - reduced-motion support
  - text alternatives for charts

## About the model

This is a **simplified educational model** of an *Arthrospira platensis*-dominant culture:
- Biomass and oxygen are relative model values, not predictions for a real culture.
- Boundaries such as "40 °C is heat stress" are educational calibrations of this model, not universal constants.
- The full scientific specification, with sources, is in [`docs/design-docs/prd/0001-simulation-science.md`](docs/design-docs/prd/0001-simulation-science.md).

## Tech stack

- **React 19, TypeScript, Vite**
- **Tailwind CSS 4** with design tokens for both themes
- **Chart.js** (via `react-chartjs-2`) for the trend charts
- **Lucide** icons, Inter and JetBrains Mono fonts
- **Vitest and Testing Library** for tests
- A lightweight typed localization layer (`src/i18n/`), with no external i18n library

The simulation engine (`src/simulation/`) is pure and deterministic. It has no UI, browser or language dependencies; lint rules enforce this.

## Getting started

Requires **Node.js 20.19+ or 22.12+**.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite (usually http://localhost:5173).

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite |
| `npm run typecheck` | Type-check the app and the tests |
| `npm run lint` | Lint the project |

## Project structure

```
src/
  simulation/     Deterministic culture model (engine, parameters, classification, health)
  presentation/   Formatting, labels, chart data and explanation logic
  i18n/           English, Kazakh and Russian messages
  ui/             React components: workspace, chamber, controls, data, explanation, Learn and About views
  styles/         Design tokens and component styles
tests/            Simulation, presentation and UI tests
docs/             Product requirements, architecture decisions and design documents
DESIGN_SYSTEM.md  Visual language and component rules
```

---

**Қазақша:** BioLab — жоғары сынып оқушыларына арналған биология бойынша интерактивті виртуалды зертхана. Оқушылар *Arthrospira platensis* культурасымен 24 сағаттық модельденген тәжірибе жүргізеді, нәтижелерді талдайды және ғылыми түсіндірмесін оқиды.

**Русский:** BioLab — интерактивная виртуальная лаборатория по биологии для старших классов. Ученики проводят смоделированный 24-часовой эксперимент с культурой *Arthrospira platensis*, анализируют результаты и читают научное объяснение.
