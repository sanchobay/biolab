# PRD-0005: Display settings and read aloud

Implements [BRD-0002](../brd/0002-demo-readiness-offline-access-tutor.md) goals 2 and 3. Architecture: [ADR-0005](../../architecture/adr/0005-speech-and-preferences.md). Existing behaviour is kept: the Announcer, focus handling, the themes, the three languages and playback.

## Scope

### 1. Display settings control

- **Where:** a header button "Display settings" (Lucide `ALargeSmall`, 16 px, with an accessible name), placed with the theme and language controls.
- **Panel behaviour:** it opens a non-modal panel under the button, behaving like the existing Model assumptions note:
  - Escape, a click outside and the close button close it
  - focus returns to the button when it closes
  - Tab order stays inside the page flow
- **Settings, each as a segmented radio group with arrow-key selection (the existing pattern):**

| Setting | Options | Default |
|---|---|---|
| Text size | 100% · 125% · 150% · 200% | 100% |
| Line spacing | Standard · Wide · Extra wide | Standard |
| Motion | Follow device · Reduce motion | Follow device |

- **Reset:** a "Reset to defaults" text button restores all three settings.
- **Applying and persisting:** changes apply immediately and persist (see 4).

### 2. What each setting does

- **Text size:**
  - **Scales:**
    - all interface text: controls, readouts, explanation, Learn, About, header
    - chart tick labels and axis titles
  - **Does not scale:** spacing and icons.
  - **Graphics:** SVG text inside the reactor and the Theory diagrams is part of the graphic. Those graphics already have text alternatives. Their labels scale only with browser zoom. This is a documented limit.
  - **Layout:** above 100% the fit-to-viewport workspace turns off and the page scrolls naturally, as it already does for RU/KK. At larger sizes the regions stack into fewer columns.
  - **Requirement:** at 200% text, at 1280 × 720, every label wraps, nothing essential is clipped and there is no horizontal scroll.
  - **Implementation:** exact breakpoints are set in the ExecPlan from browser measurement.
- **Line spacing:**
  - **Standard:** today's values.
  - **Wide:** body and prose line height at least 1.8.
  - **Extra wide:** line height at least 2.0, and paragraph spacing at least twice the font size (WCAG 1.4.12 values).
  - Applies to body text, explanation, Learn, About and the tutor answer. Single-line controls keep their height but grow when their text wraps.
- **Motion:**
  - **Follow device:** today's behaviour. The operating system's reduced-motion setting is honoured.
  - **Reduce motion:** applies exactly what the operating-system setting applies:
    - static reactor cues, with counts still reflecting the model
    - no status-dot pulse
    - no colour or opacity transitions on the reactor
    - no smooth scrolling for in-page jumps or "More below"
  - It never turns motion back on when the device asks for less.
  - **Unaffected:** the simulated clock and the chart reveal still advance, as PRD-0002 §11 requires.

### 3. Lighthouse

- **Audit:** a Lighthouse accessibility audit runs on the production build (`npm run preview`) for the workspace, Learn and About.
- **Fixes:** issues in scope are fixed, and the score is recorded in the ExecPlan.
- **Target:** at least 95.

### 4. Persistence

- **Stored:** the three settings, in browser storage on the device, under one versioned key.
- **Invalid values:** missing, unreadable or invalid stored values fall back to defaults.
- **Storage errors** (private windows, blocked storage): the settings still work for the session and simply do not persist.
- **Timing:** they apply before the first render, so the page never flashes at the wrong size.
- **Not persisted:** language and theme, unchanged from today (English and light by default).

### 5. Read aloud

- **Where:**

| Region | What is read |
|---|---|
| "What's happening in the culture?" | The current explanation in order: title, then each section label and its lines, then the extra blocks. |
| Key results | A generated summary: simulated time, then each readout with its unit in spoken words, then culture health, its trend and its cause. Before a run: "Run the experiment to see data". |
| Learn: Methodology, Theory, Experiment protocol | The section's heading and text. |
| Lab Tutor answer (PRD-0006) | The question and the current answer. |

- **Controls:** a compact button group in each region's heading row.
  - **Idle:** "Read aloud" (Volume2).
  - **While reading:** "Pause" (Pause) and "Stop" (Square).
  - **While paused:** "Resume" (Play) and "Stop".
  - All names are localized.
- **One reader at a time:** starting a region stops any other.
- **Never autoplays.** Reading starts only on a click or key press.
- **Reading stops when:**
  - Stop is pressed
  - the text ends
  - the language changes
  - the region unmounts (for example on a view change)
- **Snapshot:** the text read is a snapshot taken when reading starts. It does not jump as a run updates.
- **Voices:**
  - Only voices installed on the device are used (`localService === true`), so reading works offline and makes no network request.
  - The voice language must match the interface language: `en`, `ru` or `kk` primary subtag, preferring `en-US`/`en-GB`, `ru-RU`, `kk-KZ`.
  - **Never another language's voice.**
- **Unavailable states:** the control stays visible but disabled, and shows a localized reason:
  - no local voice for the current language, for example: "No Kazakh voice is installed on this device, so read aloud is unavailable in Kazakh."
  - speech not supported in this browser: "Read aloud is not supported in this browser."
- **Spoken text:** symbols are converted to words in the current language:
  - O₂ → "O 2"
  - × → "times"
  - ↓ / ↑ → "decreased" / "increased"
  - − → "minus"
  - °C → "degrees Celsius"
  - µmol photons m⁻² s⁻¹ → "micromoles of photons per square metre per second"
- **Long texts** are read sentence by sentence, so browsers do not cut long utterances.
- **The Announcer is unchanged.** Read aloud does not use the live regions.

### 6. Localization

Every new label, state, reason and spoken-word replacement is in EN, KK and RU (ADR-0003).

## User flow(s)

1. **Text size in the demo:**
   1. Display settings → Text size 200%.
   2. The workspace reflows into stacked regions.
   3. Every value and label is still readable. The setting survives a reload, also offline.
2. **Read the explanation:**
   1. After a heat-stress run, "Read aloud" on the explanation reads the title, what happened, why, the effect and what to try next, with a local English voice.
   2. Switching to RU stops reading. Pressing Read aloud again reads the Russian explanation with a Russian voice.
3. **Kazakh without a voice:** with ҚАЗ selected on a device without a Kazakh voice, the control is disabled and shows the "no Kazakh voice" reason. Nothing is read.
4. **Reduce motion:** Display settings → Reduce motion. The reactor becomes static and in-page jumps stop animating, while the run still plays.

## Edge cases

- **Voices load late:** Chrome loads voices asynchronously. Availability updates when the voice list arrives.
- **The voice list changes while reading:** reading continues with the chosen voice.
- **Pause and resume quirks:** some browsers do not resume reliably. If resume fails, Stop and Read aloud start again from the beginning.
- **Tab hidden while reading:** the browser decides whether speech continues. BioLab does not force it.
- **200% text and a long Kazakh or Russian label:** it wraps. Buttons grow in height.
- **Stored text size set but the default browser font size is larger:** the percentages apply on top of the browser's default size, so the user's own browser setting is respected.

## Out of scope

- Voice commands or speech recognition (BRD-0002 non-goals).
- A voice picker, a reading-rate control, and word highlighting while reading.
- Reading charts point by point (the hourly values tables already exist).
- A high-contrast theme: deferred until after the demo by decision on 2026-09-30. It needs new colour tokens and a DESIGN_SYSTEM.md change first.
- Persisting language or theme.

## Design system changes (proposed, to be added to DESIGN_SYSTEM.md on acceptance)

- **§21 Accessibility:**
  - replace "Future accessibility features such as voice interaction, text-to-speech, and advanced visual controls are outside MVP scope" with the scope of this PRD
  - voice interaction stays out of scope
- **§24 MVP scope:** the voice-assistant prohibition stays. Read aloud is not a voice assistant.
- **Display settings panel:**
  - the Model-assumptions popover pattern
  - Primary Surface, Strong Border, 12 px radius
  - existing segmented radio styles
  - 13 px labels
  - no new colours
- **Read-aloud control:**
  - ghost buttons of 28 px height with a 16 px icon and 13 px text
  - the existing `ghost-button` pattern
  - disabled state with the reason in 12 px Secondary Text
- **Type tokens:**
  - converted from px to rem at the same sizes, so 100% renders identically
  - root size set by the text-size preference

## Status

accepted
