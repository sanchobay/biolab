# BioLab — Design System

## 1. Purpose

This document is the single source of truth for BioLab's visual language.

All coding agents must read this file before implementing or modifying UI.

Do not introduce new colors, typography, spacing systems, component styles,
or visual patterns without updating this document first.

---

## 2. Product Visual Direction

BioLab is an interactive educational scientific laboratory.

The interface should feel like a modern scientific instrument:
precise, clean, immersive, data-driven, and educational.

### Keywords

- Scientific
- Precise
- Modern
- Experimental
- Clean
- Immersive
- Trustworthy
- Educational

### Avoid

- Generic AI SaaS aesthetic
- Excessive gradients
- Excessive glassmorphism
- Cyberpunk / gaming aesthetic
- Cartoon laboratory graphics
- Oversized marketing typography
- Excessively rounded cards
- Decorative elements without scientific purpose
- Emoji as interface icons

The experiment itself must always be the visual focus.

---

## 3. Color System

### Background

Main Background:
`#07111F`

Secondary Background:
`#091827`

### Surfaces

Primary Surface:
`#0D1B2A`

Elevated Surface:
`#122235`

Interactive Surface:
`#16293D`

### Borders

Default Border:
`rgba(255,255,255,0.08)`

Strong Border:
`rgba(255,255,255,0.14)`

### Text

Primary Text:
`#F8FAFC`

Secondary Text:
`#94A3B8`

Muted Text:
`#64748B`

### Scientific Accent

Primary / Interactive:
`#38BDF8`

Primary Hover:
`#7DD3FC`

### Biological State

Healthy:
`#4ADE80`

### Warning State

Warning:
`#FBBF24`

### Critical State

Critical:
`#F87171`

### Culture Visualization

Culture liquid, base:
`#2F8F62`

Culture liquid, reduced capacity (illustrative):
`#6F9384`

Illumination glow:
Primary Text `#F8FAFC` at 0–35% opacity

These colors depict the culture and the lamp, not a biological state.
They are not semantic colors; state is always shown by the status indicator.
Intermediate culture shades are interpolated between the two culture values only.

---

## 4. Semantic Colors

Colors must communicate scientific state consistently.

### Healthy

Use green only for:
- healthy culture
- successful experiment
- optimal conditions
- positive biological response

### Warning

Use amber only for:
- approaching unsafe conditions
- suboptimal parameters
- experiment warnings

### Critical

Use red only for:
- experiment failure
- thermal stress
- severe pH stress
- photoinhibition
- destructive conditions

### Primary Blue

Use blue for:
- controls
- selected states
- active parameters
- navigation
- neutral scientific data

Do not use semantic colors decoratively.

---

## 5. Typography

### Primary UI Font

Inter

Use for:
- navigation
- labels
- buttons
- explanations
- headings

### Scientific / Data Font

JetBrains Mono

Use for:
- measurements
- numerical values
- timestamps
- experiment readouts
- chart values

Example:

Temperature

`37.0 °C`

### Hierarchy

Page Title:
24–28px / Semibold

Panel Title:
16–18px / Semibold

Section Label:
12–14px / Medium

Body:
14–16px / Regular

Scientific Measurement:
20–28px / Medium / Monospace

Small Metadata:
11–12px

Avoid oversized typography.

BioLab is an application, not a marketing landing page.

---

## 6. Spacing

Use a consistent 4px-based spacing system.

Allowed values:

`4px`
`8px`
`12px`
`16px`
`20px`
`24px`
`32px`
`40px`
`48px`

Default panel padding:
`20px`

Default component gap:
`12px`

Major section gap:
`24px`

Do not introduce arbitrary spacing values unless necessary.

---

## 7. Border Radius

Small controls:
`8px`

Buttons:
`8px`

Panels:
`12px`

Major experiment containers:
`16px`

Do not use excessive pill-shaped components.

Pills are allowed only for:
- status indicators
- compact tags
- experiment state

---

## 8. Borders and Shadows

Prefer borders over heavy shadows.

Panels should generally use:

- subtle border
- slightly elevated background
- minimal shadow

Avoid floating-card SaaS appearance.

Scientific instruments should feel structurally connected.

---

## 9. Main Application Layout

BioLab MVP is desktop-first.

The primary experiment workspace uses three regions.

### Left — Experiment Controls

Contains:

- Temperature
- pH
- Light intensity
- Light/dark cycle
- Aeration

Approximate width:
`260–300px`

---

### Center — Experiment Visualization

The largest and most visually important region.

Contains:

- Arthrospira culture chamber / bioreactor
- culture liquid
- bubbles / aeration
- biological particles
- lighting visualization
- experiment status

The culture chamber must visually react to simulation state.

The center should receive the largest amount of screen space.

---

### Right — Live Data

Contains:

- Biomass
- Oxygen production
- pH
- culture health
- live charts

Approximate width:
`320–380px`

---

### Bottom — Scientific Explanation

Contains:

- experiment interpretation
- warnings
- failure explanation
- scientific reasoning
- suggested corrective action

---

## 10. Application Header

Header should be compact.

Possible structure:

BioLab logo/name

Experiment name

Experiment status

Reset

Run Experiment

Do not use a large website-style navigation bar.

The application should feel like laboratory software.

---

## 11. Buttons

### Primary Action

Used for:

`Run Experiment`

Style:

- Primary blue background
- High contrast text
- 8px radius
- clear hover state
- clear pressed state

### Secondary Action

Used for:

`Reset`

Style:

- transparent or surface background
- subtle border
- primary text

### Destructive / Critical

Do not use red buttons unless the action itself is destructive.

Red is primarily reserved for experiment failure states.

---

## 12. Experiment Controls

Parameters should primarily use sliders, toggles, or compact numeric controls.

Every parameter must show:

1. parameter name
2. current value — numerical for numeric parameters; the selected setting (for example Off / Low / Adequate) for ordinal parameters
3. unit where applicable
4. interactive control

Example:

Temperature                         37.0 °C

────────────●────────────

Do not hide the exact numerical value.

Scientific precision is important.

---

## 13. Charts

Charts are scientific instruments, not decoration.

Use Chart.js.

Charts should:

- use dark transparent backgrounds
- have subtle grid lines
- use readable axes
- show units
- animate smoothly
- avoid unnecessary legends
- avoid excessive visual effects

Primary metrics:

- Biomass
- Oxygen production
- pH

Chart colors must follow semantic tokens.

Charts must remain readable without relying only on color.

---

## 14. Culture Chamber / Bioreactor

The bioreactor is the hero visual of the application.

It should be implemented primarily using:

- SVG
- CSS
- React
- lightweight animation

Do not use a static generated image as the complete interactive reactor.

The visualization should be composed from separate controllable layers.

Suggested structure:

CultureChamber
- glass vessel
- culture liquid
- biomass particles
- bubbles
- illumination
- sensors
- status indicator

This allows simulation state to affect the visualization.

---

## 15. Culture Visual States

### Healthy

Visual characteristics:

- vivid but natural green culture
- steady subtle bubbles
- moderate particle activity
- stable illumination
- green status indicator

### Suboptimal

Visual characteristics:

- slightly reduced saturation
- reduced biological activity
- warning indicator
- subtle amber accents

### Thermal Stress

Visual characteristics:

- explicit Heat stress status indicator (critical) as the primary communication
- reduced apparent activity (fewer fine activity bubbles, slower particle motion)
- reduced growth visualization
- optional slight loss of culture saturation (paler, never darker), treated as an illustrative UI cue, not a measured biological response

Do not darken the culture to signal heat stress.
Avoid dramatic fire or unrealistic effects.

### Photoinhibition

Visual characteristics:

- excessive illumination
- reduced biological activity
- visible stress state
- warning or critical indicator

Avoid arcade-style flashing.

### pH Stress

Visual characteristics:

- reduced biological activity
- status indicator changes
- subtle culture appearance change

Scientific clarity is more important than dramatic visuals.

---

## 16. Motion

Animation should communicate biological processes.

Good animation:

- bubbles rising
- slow liquid movement
- subtle particle movement
- smooth chart updates
- gradual state transitions
- subtle illumination changes

Avoid:

- bouncing UI
- excessive glowing
- fast particles
- dramatic transitions
- decorative motion unrelated to the experiment

Animations should generally feel slow and organic.

---

## 17. Failure Explanation Component

Experiment errors must be educational.

Never display only:

`ERROR`

Use the following hierarchy:

### Failure name

Example:

`Photoinhibition detected`

### What happened?

Short description of the detected condition.

### Why?

Simple scientific explanation.

### Effect

Show consequences such as:

- biomass growth ↓
- oxygen production ↓
- culture health ↓

### Suggested action

Tell the student which experimental parameter should be reconsidered.

The UI should teach, not simply report failure.

---

## 18. Icons

Use Lucide icons for interface icons.

Examples:

- FlaskConical
- Thermometer
- Sun
- Wind
- Activity
- RotateCcw
- Play
- AlertTriangle
- CircleCheck
- Info
- Droplets

Do not use emoji as production UI icons.

Use a consistent icon size and stroke width.

---

## 19. Laboratory Assets

Priority order:

1. SVG / CSS / React visualization
2. custom vector assets
3. transparent WebP/PNG when necessary
4. AI-generated imagery only for non-interactive supporting visuals

Do not mix:

- photorealistic laboratory equipment
- cartoon illustrations
- flat icon equipment
- 3D game assets

inside the same experiment workspace.

All laboratory visuals must belong to one visual language.

---

## 20. AI-Generated Images

AI-generated imagery may be used for:

- design references
- presentation visuals
- educational illustrations
- future-feature concepts

Do NOT use AI-generated images for:

- buttons
- sliders
- charts
- interactive reactor state
- parameter controls
- core application UI

Core interactive elements must be implemented in code.

---

## 21. Accessibility

For the MVP:

- maintain strong text contrast
- essential text (labels, values, units, axis text) uses Primary or Secondary Text; Muted Text is limited to non-essential decoration and disabled states
- do not communicate state using color alone
- controls must have visible labels
- interactive elements must have focus states
- buttons must have understandable text or accessible labels
- charts should show labels and values

Read aloud (local device voices only) and display settings (text size,
line spacing, reduced motion) are in scope since BRD-0002 and PRD-0005; see §31.
Voice interaction (speech recognition, voice commands) remains out of scope.

---

## 22. Responsive Behavior

Primary target:

Desktop / laptop.

The application should work well around:

`1440 × 900`

and remain usable at:

`1280 × 720`

At smaller widths:

- preserve experiment controls
- preserve reactor
- preserve essential measurements
- allow panels to reorganize vertically if necessary

Do not compromise desktop quality to build a full mobile experience during the MVP.

---

## 23. Scientific UI Language

Use concise scientific language.

Prefer:

`Temperature`

instead of:

`Change how hot the environment is`

Prefer:

`Oxygen production`

instead of:

`Oxygen being created`

However, scientific explanations should remain understandable to high-school students.

Numbers must always include units where applicable.

---

## 24. MVP Scope Protection

The current UI is designed only for the BioLab biochemistry MVP.

Do NOT add UI for:

- AI Tutor
- Physics simulations
- Real-Life Science
- Teacher Dashboard
- User accounts
- Voice assistant
- Multiple organisms

unless explicitly requested.

These are roadmap concepts and must not clutter the current experiment interface.

The **Lab Tutor** (PRD-0006) is not an "AI Tutor": it answers a fixed set of questions with rules over the student's run and the model, and says so on screen. **Read aloud** (PRD-0005) is not a voice assistant. Both were explicitly requested (BRD-0002); the prohibitions above still apply to AI tutors and voice assistants.

---

## 25. Coding Agent Rules

Before modifying UI, every coding agent must:

1. Read this entire document.
2. Inspect existing reusable components.
3. Reuse existing design tokens.
4. Reuse existing components where appropriate.
5. Preserve the established visual hierarchy.

Agents must NOT:

- invent new colors without updating this document
- introduce another icon library
- introduce another typography system
- replace the visual style
- add decorative gradients without justification
- create generic SaaS cards everywhere
- use emoji as interface icons
- introduce unrelated product features
- redesign the application without explicit approval

When uncertain, prefer consistency over novelty.

---

## 26. Core Visual Principle

Every UI decision should reinforce this learning flow:

**Experiment → Interaction → Simulation → Data → Scientific Explanation**

The interface should make the student feel that they are operating
a scientific experiment rather than filling out a web form.

## 27. Workspace refinement

The user-requested refinement retains the tokens and scientific-instrument direction above.

- Separate experiment identity from session status, clock and actions in the compact header.
- Use fine rules and shared surfaces to group readouts; avoid a separate filled card for each number.
- Keep the chamber title visible. Sensor labels use slim leader-like rules; vessel annotations identify real depicted components without implying physical measurements.
- Stack the run record beneath interpretation when a side column would squeeze the explanation. Keep both accessible through the explanation panel's own scrolling region.
- Use existing 12 px metadata for units and instrument annotations. Keep long units on their own line.
- Group controls with subtle dividers, retaining visible values and existing keyboard interactions.
- All widths adapt to the available panel space; compact-height screens preserve chart readability through panel scrolling.

## 28. Light laboratory theme (approved visual target, 2026-09-27)

The user approved a screenshot as the primary visual reference for the workspace. This section records where it supersedes earlier sections. The implementation plan is ExecPlan 0003.

It keeps: the scientific-instrument direction, Inter and JetBrains Mono, Lucide icons, the 4 px spacing system, the radii (8/12/16 px), and every accessibility rule (§21).

### Themes

- **Light is the default theme.** The §3 dark palette stays as the dark theme.
- **Theme control:** a sun/moon control in the header switches themes. It sets `data-theme="dark"` on the document root.
- **Tokens:** all colours remain `--bl-*` tokens defined once in `src/styles/index.css`, with one block per theme.

| Token | Light | Dark (§3) |
|---|---|---|
| Main Background | `#EEF3F9` | `#07111F` |
| Primary Surface | `#FFFFFF` | `#0D1B2A` |
| Elevated Surface | `#F6F9FC` | `#122235` |
| Interactive Surface | `#EAF0F7` | `#16293D` |
| Default / Strong Border | `#E0E7F0` / `#C8D3E1` | `rgba(255,255,255,0.08)` / `0.14` |
| Primary / Secondary / Muted Text | `#0D1B3E` / `#4A5A78` / `#8190A8` | `#F8FAFC` / `#94A3B8` / `#64748B` |
| Primary / Hover | `#1B6FE0` / `#155BC0` | `#38BDF8` / `#7DD3FC` |
| Primary text on tinted surfaces | `#1557B8` | `#7DD3FC` |
| Healthy / Warning / Critical | `#127A38` / `#A15208` / `#C62828` | `#4ADE80` / `#FBBF24` / `#F87171` |
| Culture liquid base / reduced | `#3CC04A` / `#A9C6AD` | `#2F8F62` / `#6F9384` |
| Lamp glow | `#FFD766` (0–60% opacity, √ rule) | `#F8FAFC` (0–35%, √ rule) |

The light semantic values are darker than their usual swatches, so state text passes WCAG AA on white and on 10% tints of each colour.

### Parameter identity accents

These are not state colours. They identify a parameter or metric, and appear only in icons, slider fills and chart lines, never in text or state pills:

| Parameter / metric | Light | Dark |
|---|---|---|
| Temperature | coral `#E5484D` | `#FB7185` |
| pH | green `#1FA971` | `#34D399` |
| Light | yellow `#F2AE00` | `#FBBF24` |
| Aeration, oxygen | blue `#2F86EB` / `#1B6FE0` | `#38BDF8` |
| Biomass | green `#2E9E45` | `#4ADE80` |

Culture state still uses Healthy, Warning or Critical, always with an icon and text (§4, §21).

### Layout (supersedes §9 widths, §10 and §27 where they differ)

- **Header, 64 px:**
  - brand and tagline
  - compact navigation: Experiments (current), Learn (links to the explanation area), About (links to the organism note)
  - theme control
  - a static experiment identity box
  - No website-style menus. No dropdown while the MVP has one experiment (§24).
- **Left:** controls as individual cards, with Run Experiment and Reset at the bottom.
- **Center:** the chamber panel.
  - A status bar: run status, current condition, light period.
  - A bright stage: layered SVG reactor, lamp, probes, aeration.
  - Sensor cards beside the vessel.
- **Right:**
  - Key results: four cards, plus the simulated clock.
  - Trends over time: one Chart.js chart with Biomass / Oxygen / pH tabs, on a light chart surface. It replaces §13's "dark transparent backgrounds".
- **Bottom, spanning center and right:**
  - "What's happening in the culture?": explanation, "What you'll see", the organism note, and Model assumptions.
  - A run-record strip below it.
- **Surfaces:** white panels with a Default Border and a very soft shadow, `0 1px 2px` plus `0 6px 20px` at 4–5% Primary Text alpha. There are no heavy floating shadows (§8).

## 29. Workspace polish (ExecPlan 0004, 2026-09-27)

A refinement of §28, requested by the user to remove generic "AI-slop" patterns. The layout, tokens, colours, fonts, icons and the reactor are unchanged. This section records the component rules that now apply. Approved by the user on 2026-09-27.

**Containers**
- One surface per region. Inside a panel, group with hairline rules (Default Border) and spacing, never with a nested card.
  - Experiment controls: parameters separated by rules.
  - Key results: a 2 × 2 readout grid split by rules.
  - Explanation: the organism note is a column behind a rule.
- The sensor readings form one instrument rail beside the vessel: a single bordered surface with hairline rows, no per-reading shadows.
- No icon tiles. Icons sit inline at 16–18 px, in the parameter's identity accent (§28), beside their label.

**Header**
- Brand 18 px semibold.
- Navigation has one active indicator: ink text plus a 2 px Primary bar on the header's bottom edge. Hover shows a Strong Border bar.
- The theme control is one compact segmented group.
- The experiment identity is plain text behind a rule. It must not look like a selector while the MVP has one experiment (§24).

**Controls and actions**
- Value fields: JetBrains Mono 16 px. When locked they read as plain values on Elevated Surface.
- Sliders: 4 px track. Keyboard focus shows a 2 px ring on the thumb.
- Locked radio options: the configured option stays readable in neutral colours.
- Run Experiment: single-line, 44 px, with no coloured glow. The phase hint is a 12 px caption under the actions.
- Metric tabs: a quiet segmented control. The selected tab is a raised surface with a Strong Border, not a filled Primary block.

**Readouts**
- Anatomy: label, then the value with its unit beside it.
- A long unit wraps into two short lines beside the value, or drops below it when there is no room.
- Rows pair readouts of similar height: biomass and pH, then net O₂ and culture health.

**Type roles**

| Role | Style |
|---|---|
| Panel title | 16 px semibold |
| Explanation state title | 18 px semibold |
| Body | 14 px |
| Labels | 13 px |
| Units and metadata | 12 px |
| Chart ticks | 11 px mono |
| Readout values | 24 px mono |
| Sensor values | 18 px mono |
| Control values | 16 px mono |

Numbers use tabular figures.

**Pills** are limited to run status, current condition, culture health, and the compact "Run outcome" / "Current condition" / "Primary" tags. Status and condition pills are 28 px, 13 px text.

**Interaction states**
- Hover, active, focus and disabled states are defined for every control, with 150 ms colour transitions.
- A disabled control that is waiting for a phase explains itself (for example Show values: "Available after the run completes").
- Header links move focus to their in-page destination and mark it for 1.6 s.
- A scroll region that hides content shows an edge fade and a "More below" control.

## 30. Learning layer and languages (PRD-0003, ExecPlan 0005, 2026-09-27)

This section extends §28–§29 without changing the workspace design. It awaits human review.

**Scope (§24)**
- Video lessons are a preview only. The former "AI Lab Tutor" preview became the functional Lab Tutor (PRD-0006, §31).
- Every remaining roadmap feature is visibly tagged "Preview" or "Coming soon", and uses dashed outlines where it looks interactive.
- A preview never simulates an answer or playback.

**Methodology bar**
- A 36 px bar under the header, on every view: numbered stages (1–5) joined by chevrons.
- The current stage has a filled Primary number and semibold ink text. The other stages use outlined numbers and Secondary Text.
- It is a stepper, not a wizard: every stage is always clickable.

**Language switcher**
- A segmented control in the header, beside the theme control, with the labels EN · ҚАЗ · RU.
- Each button is marked with its own `lang` and named in its own language.

**Reading views (Learn, About)**
- A single prose column, at most 780 px, with a sticky 200 px contents list. The page title is 26 px semibold.
- Sections are separated by hairline rules: section headings 20 px semibold, sub-headings 15 px semibold, prose 15 px / 1.6 in 68ch lines.
- No card grids: theory topics are a two-column list divided by rules, and the baseline and variables are ruled lists.
- Response diagrams:
  - small SVG plots drawn from the model's own factor functions
  - the curve in the parameter's identity accent
  - favourable regions as a Healthy band at 12%
  - boundaries as dashed Muted rules with 11 px labels near the x-axis
- Knowledge check:
  - native radio options in 8 px-radius rows
  - a correct answer has a Healthy border and tint; "Try again" uses Warning
  - feedback is always text plus an icon

**Localized layout**
- Labels wrap rather than truncate, and buttons grow with their text.
- The fit-to-viewport workspace (§28) applies to English from 820 px of height, and to Russian and Kazakh from 1000 px. Below that the page scrolls, so longer labels are never clipped.
- Numbers, units and *Arthrospira platensis* are identical in every language.

## 31. Offline, display settings, read aloud and Lab Tutor (BRD-0002, PRD-0004–0006, 2026-09-30)

This section extends §28–§30. It adds components that use only the existing tokens. No new colours, fonts, icon libraries or radii.

**Offline status (PRD-0004)**
- A compact header status next to the language switcher.
  - Lucide `CloudCheck` ("Available offline") or `CloudOff` ("Offline — running from this device")
  - the icon at 16 px, with 12 px Inter in Secondary Text
  - no pill, border or background: it is status, not a control
- Hidden until the app is actually cached.
- **Update notice:** the narrow-notice pattern.
  - a full-width slim bar under the methodology bar: Elevated Surface, Default Border below, 13 px Secondary Text
  - a secondary 28 px "Reload" button and a "Dismiss" text button
  - it never reloads by itself

**Display settings (PRD-0005)**
- **Trigger:** a header button with Lucide `ALargeSmall` at 16 px, in the header-tools group, with an accessible name.
- **Panel:** the Model-assumptions popover pattern: Primary Surface, Strong Border, 12 px radius, the panel shadow token.
- **Controls:** the existing segmented radio groups (§29), with 13 px labels and a "Reset to defaults" text button.
- **Type tokens are rem:**
  - 1 rem = 16 px, at the same sizes as the §29 type roles, so 100% renders identically
  - the root size follows the text-size setting (100 / 125 / 150 / 200%)
  - spacing, radii and icons stay in px
- **Line spacing:**
  - Standard keeps today's values
  - Wide: prose line height 1.8
  - Extra wide: prose line height 2.0, and paragraph spacing twice the font size
- **Reduce motion:** the same rules as the operating-system setting (§16, PRD-0002 §11), applied through the attribute. It never forces motion on.
- **Layout:** above 100% text the fit-to-viewport workspace (§28, §30) switches to natural page scroll. Regions stack into fewer columns so that text wraps and never clips.
  - **Column count:** the workspace uses the column count it would have at (viewport width ÷ text scale): two columns from 1024 px × scale, three from 1280 px × scale. For example, 125% at 1440 px gives two columns, and 150% or 200% at 1440 px gives one.
  - **Controls with a fixed height** keep that height as a minimum and grow when their label wraps.
  - **Long words** break rather than spill.
- **Header:** with the Display settings control added, the tagline hides below 1536 px for RU and KK (EN still at 1440 px), so the header stays on one row at 100%.
- **Line spacing scope:** Wide and Extra wide change prose only (explanation, Learn, About). Pills and badges keep a compact line box.

**Read aloud (PRD-0005)**
- **Controls:** in each readable region's heading row, ghost buttons 28 px high, with a 16 px Lucide icon and 13 px text.
  - `Volume2` "Read aloud", then `Pause` "Pause" or `Play` "Resume", plus `Square` "Stop"
- **Unavailable:** the control is disabled, and the reason shows in 12 px Secondary Text (no local voice for the language, or not supported).
- **No indication by colour alone.** No animated equalizer.

**Lab Tutor (PRD-0006)**
- **Heading:** "Lab Tutor" with no Preview tag. Below it, the honesty line: Lucide `Info` and 13 px Secondary Text.
- **Question chips:**
  - wrapping buttons, 32 px minimum height, 8 px radius, Default Border, 14 px text
  - selected: the §29 segment-selected style (Primary border, Primary soft background, Primary-ink text), with `aria-pressed`
  - contextual chips look identical to fixed chips
- **Answer:**
  - one at a time, below the chips, behind a hairline rule
  - a 15 px semibold heading (the question), and prose with the reading-view roles (15 px / 1.6)
  - the provenance line in 12 px Secondary Text
  - no chat bubbles, avatars or typing indicators
- **"Ask the Lab Tutor":** a ghost text button in the explanation panel heading row.
