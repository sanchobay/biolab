# PRD-0002: Experiment Workspace

Defines the product and UX behaviour of the BioLab experiment workspace: the single screen where a student configures, runs, watches and understands one 24-simulated-hour *Arthrospira platensis* experiment. Implements [BRD-0001](../brd/0001-biolab-mvp.md) and presents the simulation defined in [PRD-0001](0001-simulation-science.md). [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md) is the visual source of truth; §13 records the corrections to it that were approved and applied on 2026-09-27.

## Scope

### 1. Purpose and boundaries

- The workspace carries the learning flow **Experiment → Interaction → Simulation → Data → Scientific Explanation**. The student sets five conditions (Experiment, Interaction), runs the model (Simulation), watches the chamber and live data (Data), and reads why the result happened (Scientific Explanation).
- **The workspace never computes biology.** Every biomass, oxygen, pH, classification, health and run-record value comes from the simulation in PRD-0001. The UI only formats, lays out and animates those values.
- All scientific wording follows the PRD-0001 §10 wording rules. Numeric boundaries quoted to students are PRD-0001 calibrations and are always phrased "in this model".
- This PRD specifies behaviour, not implementation. Component structure, state management, file layout and the simulation interface belong to ADR-0001, ADR-0002 and the ExecPlan.
- **Formatting conventions:**
  - numbers use JetBrains Mono, units are always shown, and negatives use the minus sign "−"
  - thousands use "," (for example 2,200)
  - simulated clock times use `HH:MM` (for example `06:30`)

### 2. Layout and information hierarchy

**Presentation refinement requested by the user:** the following visual refinements supersede only the corresponding arrangement details below. The 56 px desktop header separates identity, session information and actions. Readouts share a surface with dividers. The chamber has a visible title and annotated hardware, with sensor readings beside or below the vessel according to available space. The run record follows interpretation vertically in the center explanation panel, avoiding a narrow text column. Controls, behavior, scientific wording, data availability and accessibility contracts are unchanged. See DESIGN_SYSTEM.md §27 and ExecPlan 0002.

**Light laboratory redesign (approved visual target, 2026-09-27):** these presentation changes supersede the arrangement, colour and typography details in §2–§7 and §12 where they differ. Behaviour, data, scientific wording, the three separate views and the accessibility contracts are unchanged. See DESIGN_SYSTEM.md §28 and ExecPlan 0003.

- **Theme:** light by default; the existing dark palette sits behind a header theme control.
- **Header:** brand, in-page navigation, theme control and experiment identity.
- **Moved elements:**
  - The run-status pill and the current-condition indicator move to the chamber's status bar.
  - Before a run, the current-condition slot reads "Set the conditions and run the experiment" beside the Ready status; together they replace "Ready — not running".
  - The simulated clock moves to the Key results header.
  - Run Experiment and Reset move to the bottom of the controls panel. Reset shows "Reset to current values" and keeps the accessible name "Reset".
  - The tab order follows the new visual order: controls, then Run Experiment and Reset, then the rest.
- **Chamber:**
  - Sensor cards for Light, Temperature, pH and Aeration sit beside the vessel. In Ready, the pH card shows the configured starting pH to one decimal.
  - The lamp glow uses the Lamp glow token with the same √(I / 2,200) rule. In the light theme its maximum opacity is 60%.
- **Charts:**
  - One "Trends over time" chart with Biomass / Oxygen / pH tabs replaces the three stacked charts.
  - Axes, dark bands, onset markers, the cursor, the zero line and caption, tooltips, the summary and the per-metric "Show values" table are unchanged.
  - Dark bands are labelled "Dark period", and the time-axis title reads "Simulated time (hours)".
- **Explanation:**
  - It spans the center and right columns under the chamber and data, with Model assumptions in its heading.
  - Its sections flow in two columns beside an *Arthrospira platensis* note.
  - The run record is a strip below it.
- **Compact screens:** at widths ≥ 1280 px and heights below 820 px, the page scrolls vertically.
- **UI copy that follows the new layout:**
  - The controls caption in Ready reads "Set conditions for the 24-hour simulation".
  - The running hint "Watch the Live data panel." becomes "Watch the Key results and Trends over time."
  - The Ready view adds a "What you'll see" list.
- **Scientific wording:** unchanged.

**Regions at 1440 × 900.** Page background is Main Background `#07111F`.

| Region | Position | Size | Surface | Radius / padding |
|---|---|---|---|---|
| Header | Top, full width | Height 56 px | Secondary Background `#091827`, Default Border below | — / 0 16 px |
| Body | Below header | Padding 16 px; column and row gap 12 px | Main Background | — |
| Experiment controls | Left column, full body height | 280 × 812 px | Primary Surface `#0D1B2A`, Default Border | 12 px / 20 px |
| Culture chamber | Center column, top | Fluid width (752 px) × remaining height (560 px) | Primary Surface, Default Border | 16 px / 20 px |
| Scientific explanation | Center column, bottom | Center width × 240 px | Primary Surface, Default Border | 12 px / 20 px |
| Live data | Right column, full body height | 352 × 812 px | Primary Surface, Default Border | 12 px / 20 px |

The explanation panel sits under the chamber in the center column, so the controls and live data keep full height (decision D-1). The chamber remains the largest region, per DESIGN_SYSTEM §9.

**Information hierarchy** (highest first):

1. Culture chamber and its current-condition indicator: the visual focus.
2. Run Experiment and Reset, run status and simulated clock (header).
3. Experiment controls.
4. Live readouts: relative biomass, net O₂ production, simulated pH, culture health.
5. Live charts.
6. Scientific explanation.
7. Run record.
8. Metadata: units, axis labels, captions, the "Model assumptions" element.

**Typography** (DESIGN_SYSTEM §5):

| Use | Style |
|---|---|
| Brand "BioLab", experiment name, panel titles | Inter 16 px semibold, Primary Text |
| Control names, section labels in the explanation | Inter 14 px medium |
| Body and explanation text | Inter 14 px regular, 1.5 line height |
| Control values | JetBrains Mono 16 px medium, Primary Text |
| Readout values | JetBrains Mono 24 px medium, Primary Text |
| Units, captions, axis labels, metadata | 12 px, Secondary Text (mono for numbers) |

Page-title size (24–28 px) is not used; the header is compact laboratory chrome, not a page heading. All icons are Lucide at 16 px with one stroke width throughout.

### 3. Header

- **Left group:**
  - FlaskConical icon and "BioLab"
  - a vertical Default Border divider
  - the experiment name "*Arthrospira platensis* culture · 24-hour experiment"
  - the run-status pill
  - the simulated clock "Simulated time `06:30` / `24:00`" (mono 14 px)
- **Right group:** Reset (secondary, RotateCcw icon) and Run Experiment (primary, Play icon), 12 px apart, both 32 px tall with 8 px radius.
- **Run Experiment:** Primary blue `#38BDF8` background with Main Background `#07111F` text for contrast. Hover `#7DD3FC`; pressed state adds an inset Strong Border.
- **Reset:** transparent background, Default Border, Primary Text; hover Interactive Surface.
- **Run-status pill.** It reports the run lifecycle only, never the culture's condition (§8).

| Run status | Icon | Text | Colour |
|---|---|---|---|
| Ready | — | Ready | Neutral: Interactive Surface background, Secondary Text |
| Preparing | Activity | Preparing… | Primary blue |
| Running | Activity | Running | Primary blue |
| Completed | Check | Completed | Neutral |
| Could not complete | AlertTriangle | Run could not complete | Warning amber |

"Completed" is deliberately neutral: finishing a run is not a biological success, so it never uses green.

### 4. Experiment controls

**Panel header:**
- title "Experiment controls"
- caption, which depends on the run status:
  - Ready: "Set before running"
  - Running: Lock icon + "Locked during run"
  - Completed: Lock icon + "Configuration used in this run — Reset to change"

**Control anatomy** (DESIGN_SYSTEM §12). Controls are stacked with 24 px between blocks.
- **Row 1:** icon and name on the left; value and unit on the right.
- **Row 2:** the interactive control.
- **Row 3 (optional):** reference ticks, caption or validation message, 12 px.

| Control | Icon | Control type | Range / options | Slider step | Typed entry | Keyboard | Value shown | First-load default |
|---|---|---|---|---|---|---|---|---|
| Temperature | Thermometer | Slider + editable value | 15.0–45.0 °C | 0.5 °C | 0.1 °C | ←/→ ±0.5; PageUp/PageDown ±5.0; Home/End 15.0/45.0 | `32.0 °C` | 32.0 °C |
| Starting pH | Droplets | Slider + editable value | 6.0–11.0 | 0.1 | 0.1 | ←/→ ±0.1; PageUp/PageDown ±1.0; Home/End 6.0/11.0 | `9.0` | 9.0 |
| Light intensity | Sun | Stepped slider + editable value + reference ticks | 0–2,200 µmol photons m⁻² s⁻¹ | Stops (§4.1) | Integer | §4.1 | `300` + unit line "µmol photons m⁻² s⁻¹" | 300 |
| Light/dark cycle | SunMoon | Radio group, 2 rows × 3 | 8:16, 10:14, 12:12, 14:10, 16:8, 24:0 | — | — | Arrow keys move the selection | `14 h light : 10 h dark` (24:0 shows "continuous light") | 14:10 |
| Aeration | Wind | Radio group, 1 row × 3 | Off, Low, Adequate | — | — | Arrow keys move the selection | `Adequate` | Adequate |

- **First-load defaults** are the PRD-0001 §12.9 healthy baseline (D-2).
- **Editable values:** the value in row 1 is also an input field. It shows a subtle Interactive Surface background on hover and focus. It commits on Enter or blur, and Escape reverts. Validation is in §10.
- **Slider style:**
  - track: Interactive Surface, 4 px
  - fill and 16 px thumb: Primary blue, with a 2 px Main Background ring on the thumb
  - hover: Primary Hover
  - disabled: track, fill and thumb use Muted, and the value text stays Primary Text so it remains readable
- **Radio segments:** selected uses a Primary blue border, Interactive Surface background and Primary Text. Unselected uses a Default Border, Primary Surface background and Secondary Text. Radius 8 px.
- **No zone hints.** Controls never mark favorable or stress zones. Students discover consequences by running the experiment (D-13).

#### 4.1 Light intensity control mapping (resolves U-8)

The control always displays the actual configured value in µmol photons m⁻² s⁻¹ and covers 0–2,200. **Only that value is passed to the simulation.** The slider position (stop index `s`) is a UI coordinate used solely to place the thumb; it is never passed to the model or used in any other calculation.

**Stops.** The slider has 79 discrete stops, `s = 0 … 78`, evenly spaced along the track:

| Stop index s | Value I (µmol photons m⁻² s⁻¹) | Step | Share of track |
|---|---|---|---|
| 0 – 30 | `I = 10 · s` (0, 10, … 300) | 10 | 38.5% |
| 30 – 50 | `I = 300 + 25 · (s − 30)` (300, 325, … 800) | 25 | 25.6% |
| 50 – 78 | `I = 800 + 50 · (s − 50)` (800, 850, … 2,200) | 50 | 35.9% |

- **Reference values:** 0 (`s` = 0, 0% of the track), 150 (`s` = 15, 19.2%), 300 (`s` = 30, 38.5%), 800 (`s` = 50, 64.1%) and 2,200 (`s` = 78, 100%). All five are exact stops.
- **Precision:** the 0–800 range gets 64% of the track with 10–25 unit resolution, and 2,200 is the end of the track. Zero is an ordinary stop, so no logarithmic scale is needed.
- **Typed values:** any integer 0–2,200 is accepted exactly, even between stops, and passed to the model unchanged. The thumb is placed at the continuous inverse position:
  - `0 ≤ I ≤ 300`: `s = I / 10`
  - `300 < I ≤ 800`: `s = 30 + (I − 300) / 25`
  - `800 < I ≤ 2,200`: `s = 50 + (I − 800) / 50`
- **Dragging** snaps to the nearest stop.
- **Keyboard:**
  - ←/↓ moves one stop down and →/↑ one stop up. From a typed value between stops, it moves to the adjacent stop in that direction.
  - PageUp/PageDown jumps to the next or previous reference value (0, 150, 300, 800, 2,200).
  - Home selects 0; End selects 2,200.
- **Reference ticks:** tick labels "0", "150", "300", "800" and "2,200" sit under the track at their positions. Each is a button (minimum 24 × 24 px target) that sets that value. They are plain values with no zone colouring or zone names.

### 5. Culture chamber

The chamber is the hero visual (DESIGN_SYSTEM §14). It is built from separate code-driven layers, never a static image. **Every chamber appearance is an illustrative cue driven by model outputs; it is never a biological prediction or measurement** (PRD-0001 §10).

**Composition.**
- **Center:** the glass vessel, about 75% of the chamber height.
- **Left of the vessel:** a vertical lamp panel whose glow falls on the vessel.
- **Base:** an aeration sparger at the bottom of the vessel.
- **Right side:** three sensor tags on leader lines. Temperature, pH and Light values use mono 12–14 px.
- **Overlays:**
  - top-left: the current-condition indicator (§8)
  - top-right: the light-period indicator (Sun + "Light period" or Moon + "Dark period")
  - bottom-right: the "Model assumptions" element

**Layers and what drives them.** Visual transitions ease over 1.5 s of real time; readouts and charts are never delayed.

| Layer | Driven by | Rule |
|---|---|---|
| Lamp glow | Configured light I and light/dark state | In light: glow opacity = 0.35 · √(I / 2,200), using Primary Text `#F8FAFC`. In darkness: lamp off. No flicker or pulsing. |
| Aeration bubbles (sparger) | Aeration setting only | Off: none. Low: sparse stream. Adequate: steady stream. Slow rise. Never tied to oxygen output. |
| Fine activity bubbles | Specific photosynthetic production `p` (0 in darkness) | Emission rate proportional to `p` against the fixed reference (`p` = 1 is full rate); none when `p` is near 0. An activity cue, not an oxygen measurement. |
| Biomass particles | Relative biomass `B` (count); aeration and `p` (motion) | Count proportional to `B`. Slow drift: a mixing component set by aeration, plus a small activity component proportional to `p`. |
| Culture liquid colour | Specific photosynthetic capacity `c` (evaluated as if in light) | Interpolated from the reduced-capacity culture colour at `c` = 0 to the base culture colour at `c` = 1 (§13, P-2). Never darker than the base. Unchanged by darkness. |
| Culture liquid density | Relative biomass `B` | Opacity 70% at `B` = 0.8 to 95% at `B` = 1.8, linear and clamped. |
| Sensor tags | Configured T; simulated pH `h(t)`; configured I and light state | Temperature `32.0 °C`; pH `9.24` (the virtual pH instrument readout); Light `300` in light or `0 · dark period` in darkness. A tag whose condition is a current failure or suboptimal cause gets a state-coloured border and the matching icon. |
| Current-condition indicator | Current classification (§8) | Status pill with icon and text. |

**Pre-run preview (Ready).** Only the hardware is previewed:
- the lamp at the configured intensity, since the run starts at lights-on
- aeration bubbles for the selected setting
- the base culture colour at initial density
- no fine activity bubbles and no condition-driven changes

The chamber never previews a biological outcome before Run.

**Dark periods.** The lamp is off, fine activity bubbles stop, and the indicator reads Moon + "Dark period". The culture colour does not change and health is unaffected. Darkness is normal and must never look like illness.

**Visual states.** These are results of the layer rules above, not separate recolourings.

| State | Primary communication | Chamber cues | Never show |
|---|---|---|---|
| Healthy | Green pill: CircleCheck + "Healthy" | Base colour; steady aeration bubbles for the setting; fine activity bubbles in light; slow particle drift; stable lamp | Sparkles, glow effects |
| Suboptimal | Amber pill: AlertTriangle + "Suboptimal · [first cause]" | Activity lower as `c` falls; slightly less saturated colour; the cause's sensor tag is amber | Red, dramatic change |
| Heat stress (Thermal stress) | Red pill: Thermometer + "Heat stress"; temperature tag red | Fewer fine activity bubbles; slower particle motion; biomass density thins slowly; slightly paler colour as an illustrative cue | Darkened culture, red or orange glow, fire, heat shimmer |
| Photoinhibition | Red pill: Sun + "Photoinhibition"; light tag red | Bright lamp glow (depicts the configured light, not a stress effect); activity reduced in proportion to `c`. Near 800 the visible change is small, matching the model. | Flashing, strobing, bleaching animation |
| Low-pH stress | Red pill: Droplets + "Low-pH stress"; pH tag red | Reduced activity; slightly paler colour as an illustrative cue | pH-indicator colours, bubbling or "acid" effects |
| High-pH stress | Red pill: Droplets + "High-pH stress"; pH tag red | Reduced activity; slightly paler colour as an illustrative cue | pH-indicator colours, corrosion effects |

**Heat stress (resolves U-6).**
- The explicit Heat stress status pill and the highlighted temperature tag are the primary communication.
- The chamber shows reduced apparent activity: fewer fine activity bubbles and slower particles.
- The culture is never darkened.
- Any colour change follows only the capacity rule (paler, never darker) and is an illustrative UI cue, not a measured one-day biological prediction.
- The UI label "Heat stress" names PRD-0001's Thermal stress state. Cold is never shown as heat or thermal stress (PRD-0001 MD-4).

**"Model assumptions" element.**
- **Trigger:** a text button "Model assumptions" with an Info icon, 12 px, Secondary Text.
- **Popover:** non-modal, maximum 320 px wide. It contains:
  - "This is a simplified educational model of an *Arthrospira platensis*-dominant culture: biomass and oxygen are relative model values, and some numbers are educational calibrations, not measured constants. The physical demonstration sample may contain other microorganisms and is not reproduced quantitatively."
  - A separate caption: "The chamber's appearance is illustrative; readouts and charts show the model's values."
- **Closing:** a close button, Escape, or a click outside. Focus returns to the trigger.

### 6. Live data panel

**Header:** "Live data" plus the simulated time `HH:MM`.

**Readouts.** A 2 × 2 grid of tiles, each on Elevated Surface `#122235` with 8 px radius and 12 px padding. Every tile shows a label (12 px Secondary), a value (24 px mono) and a unit or caption (12 px Secondary).

| Readout | Value format | Unit / caption |
|---|---|---|
| Relative biomass | `1.31` (2 decimals) | "× initial" |
| Net O₂ production | Signed, 2 decimals: `+0.85`, `−0.16`; `0.00` without sign when the magnitude is below 0.005 | "relative units / simulated hour". When negative, an extra caption: "Respiration exceeds photosynthesis". |
| Simulated pH | `9.24` (2 decimals) | "Started at 9.0" |
| Culture health | Category pill: CircleCheck "Healthy" (green), AlertTriangle "Suboptimal" (amber), OctagonAlert "Stressed" (red) | "Delayed indicator"; trend "Worsening", "Recovering" or "Steady"; retained cause, for example "due to Heat stress" |

- In Ready, readouts show `—` with the caption "Run the experiment to see data".
- The health trend comes from the model: Worsening when its target is worse than the current category, Recovering when better, Steady when equal (PRD-0001 §12.10).

**Charts.** Three stacked Chart.js charts share one time axis and fill the remaining panel height equally, each at least 112 px tall. Each chart has:
- a title row with the metric and unit (12–14 px medium)
- one Primary-blue line, 2 px, with no points, fill or legend
- dark transparent background and subtle grid lines in Default Border
- tick labels in mono 11–12 px Secondary Text

| Chart | Title | Y-axis |
|---|---|---|
| 1 | Relative biomass (× initial) | Fixed 0.8–1.8, ticks every 0.2 |
| 2 | Net O₂ production — relative units/simulated hour | Fixed −0.5 to 1.5, ticks every 0.5; emphasized zero line in Strong Border; static caption in the negative area: "Below 0: respiration exceeds photosynthesis" |
| 3 | Simulated pH | Fixed for each run at starting pH ± 0.6, ticks every 0.2. In Ready the window follows the configured starting pH. |

- **Time axis:** fixed 0–24 simulated hours, ticks every 4 h, label "Simulated time (h)".
- **Axis stability:** axes never rescale during playback. The biomass and oxygen axes are identical for every run, matching the fixed oxygen scale in PRD-0001 C-23 (D-11).
- **Dark periods:** shaded bands in Main Background at 60% opacity across all three charts, labelled "Dark". They are drawn for the whole day as soon as a cycle is selected, including in Ready, because the schedule is known in advance.
- **Stress onset markers:** a 1 px dashed vertical line in the failure colour, with icon and name text, at each run-record entry's first onset time. A marker appears when playback reaches it. Markers at `00:00` appear immediately.
- **Running:** each series is drawn from 0 to the current simulated time, with a Primary Hover cursor line at that time. There are no tooltips and no per-point animation; the progressive reveal is the smooth update (DESIGN_SYSTEM §13).
- **Completed:** full series and no cursor. Hover tooltips show `HH:MM`, the value and the unit. Each chart has a "Show values" toggle revealing an hourly table (0–24 h).
- **Display resolution:** at least one point per 5 simulated minutes. Charts may downsample for display but never smooth or alter model values.

### 7. Scientific explanation panel

**Structure.**
- **Header row:** state icon, title (for example "Heat stress" or "Healthy culture"), and a scope tag.
  - The scope tag is a compact pill: "Current condition" while running and "Run outcome" after completion.
- **Body:** two columns with 24 px between them.
  - Left: the explanation.
  - Right, 240 px: the run record (§8).
  - The panel scrolls internally if content overflows.
- **Explanation sections, always in this order.** Each has a 14 px medium Secondary label and 14 px regular body text:
  1. **What happened** — the condition, with this run's actual values.
  2. **Why** — the scientific reasoning, taken from the PRD-0001 §10 content for that state.
  3. **Effect on the model** — how the data moved.
  4. **Parameter to reconsider** — the control to change and in which direction. For a Healthy outcome this becomes **Try next**.
- **Optional blocks** after section 4:
  - **Also occurring:** other simultaneous failures.
  - **Suboptimal conditions:** suboptimal causes.
  - **Earlier in this run:** stresses in the run record that are no longer current.

**Content templates.** Values in braces come from the model. Boundary numbers are PRD-0001 calibrations and always carry "in this model".

| State | What happened | Parameter to reconsider |
|---|---|---|
| Heat stress | "Temperature is {T} °C, at or above this model's heat-stress boundary of 40 °C." | "Temperature — this model treats temperatures above 30 °C and below 35 °C as favorable. Reported optima vary with strain and cultivation conditions." |
| Photoinhibition, mild (inhibition penalty 1 − j below 0.10) | "Light intensity is {I} µmol photons m⁻² s⁻¹, above this model's photoinhibition boundary of 800. At this intensity the modeled effect is small and may not yet be visible in the data." | "Light intensity — in this model, light above 300 gives no further gain, and 800 or more enters the photoinhibition zone." |
| Photoinhibition, clear (1 − j at least 0.10) | "Light intensity is {I} µmol photons m⁻² s⁻¹, well above this model's photoinhibition boundary of 800; photosynthesis is clearly reduced in this model." | As above |
| Low-pH stress | "Simulated pH is {h} (started at {h₀}), at or below this model's low-pH stress boundary of 7.0." Use "acidic" only when pH is below 7. | "Starting pH — this model treats pH above 8.5 and below 9.5 as favorable." |
| High-pH stress | "Simulated pH is {h} (started at {h₀}), at or above this model's high-pH stress boundary of 10.5." | As for low-pH stress |
| Suboptimal | One line per cause, in the order temperature, light, pH, aeration. For example: "Temperature 15.0 °C is below this model's favorable region; in this model, cold slows growth." "Aeration Off reduces the aggregate mixing and gas-exchange benefit in this model." | The named parameter(s), with direction |
| Healthy | "All conditions are within this model's favorable regions." | Try next: "Change one condition and run again to see its effect." |

- The photoinhibition penalty `1 − j` is constant within a run, because light intensity and temperature are fixed. At 32 °C the 0.10 cutoff falls near 1,190 µmol photons m⁻² s⁻¹. The cutoff is a UI copy convention, not a biological threshold (D-9).
- The Why text for every state is the PRD-0001 §10 content, unchanged in meaning.

**Effect on the model.**
- **While running:** qualitative bullets from PRD-0001 §10 (for example "Biomass growth ↓", "Photosynthetic O₂ production ↓", "Culture health worsens"), plus "Watch the Live data panel." Numbers in the text do not change live.
- **At completion:** the final values, compared with the healthy baseline (D-10):
  - "Relative biomass at 24:00: {B} × initial (healthy baseline: {B_ref} ×)"
  - "Photosynthetic O₂ produced during light periods: {total} relative units (healthy baseline: {total_ref})"
  - "Culture health at 24:00: {category} ({trend})"
- **Baseline values** come from running the model once with the PRD-0001 §12.9 baseline; they are not hard-coded. If the run is the baseline configuration, the comparison reads "This run uses the healthy baseline configuration."

**Update timing.**
- **While running:** the panel explains the current condition. It changes only when the current state or its primary cause changes, never on every frame.
- **Ended stresses:** if the current condition is not a failure but the run record contains failures, an "Earlier in this run" block appears. Example: "Photoinhibition occurred during this run (first at 00:00). High-light exposure ends at nightfall; culture health recovers gradually."
- **At completion:** the panel switches to the run outcome, meaning the most severe state that occurred. The primary failure is the one with the largest recorded contribution (PRD-0001 §9 rule 6).

**Simultaneous stresses.**
- The primary failure, as chosen by the model (PRD-0001 §9 rules 1 and 6), gets the full four-section explanation.
- Every other current failure appears under **Also occurring**: name, one line of what happened, and the parameter to reconsider.
- Suboptimal causes appear under **Suboptimal conditions**.
- The UI never ranks causes itself; it displays the model's ranking.

### 8. Current condition, culture health and run record

PRD-0001 computes three separate views that can disagree (§9 rule 9). The workspace keeps them visually and verbally distinct.

| View | Question it answers | Where | Label | How it changes | Appearance |
|---|---|---|---|---|---|
| Current condition | What conditions is the culture experiencing now? | Chamber, top-left indicator | "Now:" while running; "At 24:00:" when completed; "Ready — not running" before a run | Immediately when the classification changes, including at nightfall | Pill: state icon and name in state colour. Primary failure plus "+N more" when several apply. Suboptimal shows its first cause plus "+N". |
| Culture health | How is the culture responding so far? | Live data, health tile | "Culture health" + caption "Delayed indicator" | Stepwise, one category at a time, lagging conditions (2 h worsening, 6 h recovery; PRD-0001 C-20) | Category pill, trend word, retained cause |
| Run record | What happened during this run? | Explanation panel, right column; onset markers on the charts | "Run record" | Adds entries only; never removes them | One row per failure type: icon, name, "occurred during this run — first at `HH:MM`"; the overall primary gets a compact "Primary" tag. Footer line: "Outcome: {most severe state}". Before a run: "No run yet". With no failures: "No stress failures occurred." |

- **When the views differ,** the explanation panel says so in words. Example for S3 after nightfall:
  - current condition "Now: Healthy"
  - health "Stressed · Recovering · due to Photoinhibition"
  - run record "Photoinhibition — occurred during this run"
  - the "Earlier in this run" block explains the gap
- **Run-record wording** is "occurred during this run", never "damaged", "injured" or "permanently stressed" (PRD-0001 §10).

### 9. Run lifecycle

**State machine.**

```
Ready ──Run──▶ Preparing ──result ready──▶ Running ──simulated 24:00──▶ Completed
  ▲                │                         │                           │
  │                └──error──▶ Ready (error notice)                      │
  │                                          ├──error──▶ Ready (error notice)
  └──────────────────────Reset───────────────┴───────────────Reset───────┘
```

**Exact states.**

| Aspect | Ready (pre-run) | Preparing | Running | Completed |
|---|---|---|---|---|
| Header status / clock | "Ready" / `00:00 / 24:00` | "Preparing…" / `00:00 / 24:00` | "Running" / live `HH:MM / 24:00` | "Completed" / `24:00 / 24:00` |
| Controls | Enabled; first-load defaults, or the last values after Reset | Disabled | Disabled; caption "Locked during run" | Disabled; show the run's configuration; caption "Configuration used in this run — Reset to change" |
| Run Experiment | Enabled | Disabled, label "Preparing…" | Disabled, label "Running…" | Disabled; tooltip "Reset to configure a new run" |
| Reset | Disabled | Disabled | Enabled (aborts the run) | Enabled |
| Chamber | Hardware preview; indicator "Ready — not running" | As Ready | Live, following the playback time | Frozen at the 24:00 model state, with a slow idle animation of that state |
| Readouts | `—` | `—` | Live | Final values at 24:00 |
| Charts | Empty axes; dark bands for the selected cycle; pH window around the configured start | As Ready | Progressive reveal with cursor | Complete; tooltips and "Show values" enabled |
| Explanation | Intro: "Set the five conditions, then press Run Experiment to simulate 24 hours." | As Ready | Current-condition explanation | Run-outcome explanation with final values and baseline comparison |
| Run record | "No run yet" | As Ready | Accumulating | Final, with the Primary tag |

The "Model assumptions" element is enabled in every state.

**Playback.**
- The full 24-hour result exists before playback starts (PRD-0001 §12.11). Playback only reveals it.
- Simulated time shown = min(24, 24 × active playback seconds / 30). The run therefore plays in about 30 seconds.
- The values displayed at simulated time `t` are the model's outputs at step `k = floor(60 · t)`. They are never interpolated between steps or extrapolated.
- **Active playback time** excludes any time the browser tab is hidden. Playback pauses while hidden and resumes on return (D-12).
- **Frame rate:** dropped or slow frames only skip display samples. They never change a value, a classification or a transition time.
- When simulated time reaches 24:00, the state becomes Completed and the 24:00 values are shown (the condition immediately before hour 24, per PRD-0001 §12.4).

**Reset.**
- From Running, Reset stops playback immediately. From Completed, it clears the result.
- In both cases it returns to Ready:
  - readouts, charts, run record and explanation are cleared
  - controls unlock with **the configured values kept**, so the student can change one condition at a time (D-3)
- Keyboard focus moves to Run Experiment, the next available action, and the screen reader announcement is "Reset. Controls unlocked." (Reset itself is disabled in Ready, so focus cannot stay on it; approved by human decision on 2026-09-27, ExecPlan 0004 F2.)
- Reset has no confirmation dialog (D-5).

### 10. Loading, errors and input validation

**Loading.**
- The workspace renders directly in Ready, with no splash screen.
- Fonts load with a system fallback shown until they swap in.
- If a result is not ready within 300 ms of pressing Run, the Preparing state is shown. Normally the result is ready well within that.

**Simulation error.** This covers the model failing to return, or returning any non-finite value.
- No partial result is ever shown.
- The workspace returns to Ready with the controls unlocked and their values kept. The header shows "Run could not complete" in amber.
- The explanation panel shows an AlertTriangle and "The simulation could not complete. Your settings are unchanged. Press Run Experiment to try again."
- The notice clears on the next action. A bare "ERROR" is never shown (DESIGN_SYSTEM §17).

**Chart failure.**
- If a chart cannot render, its area shows "Chart unavailable — values are shown in the readouts above."
- The readouts, chamber and explanation keep working.

**Impossible or invalid input.** Sliders and radio groups cannot produce out-of-range values. For typed values:

| Input | Behaviour |
|---|---|
| Empty or non-numeric | On commit, revert to the last valid value; inline message "Enter a number from 15.0 to 45.0 °C" (with the range and unit for that control) |
| Out of range | Clamp to the nearest limit; inline message "Adjusted to 45.0 °C (maximum)" |
| More precision than allowed | Round to the control's precision (0.1 °C, 0.1 pH, integer light) |
| Uncommitted edit when Run is pressed | Commit (and clamp if needed) first, then run |

- Inline messages use 12 px Secondary Text with an amber AlertTriangle and clear on the next valid commit.
- An invalid value is never sent to the model.

### 11. Accessibility (MVP)

- **Order:** a "Skip to experiment controls" link comes first and is visible on focus. Tab order then follows the visual order:
  1. Reset, then Run Experiment
  2. each control's slider and value field, then the light reference ticks, then the two radio groups
  3. "Model assumptions"
  4. the chart "Show values" toggles
  5. the explanation panel, if it scrolls
- **Sliders** expose their value with units as text. Examples: "32.0 degrees Celsius", "pH 9.0", "300 micromoles of photons per square metre per second".
- **Radio groups** use arrow keys, and every option has a text label.
- **Focus:** a visible 2 px Primary Hover `#7DD3FC` ring with a 2 px offset on every interactive element; it is never removed.
- **Locked controls:** during Running and Completed the controls are disabled and leave the tab order. The panel's "Locked during run" caption is visible and announced.
- **Screen reader announcements** are polite unless noted, and never fire on every data tick:
  - run started: "Experiment running. Controls locked."
  - current-condition changes: "Now: Heat stress."
  - health category changes: "Culture health: Stressed, worsening."
  - completion: "Run complete. Outcome: Photoinhibition occurred."
  - errors: assertive
- **No colour-only signals:** every state uses an icon and text. Sensor-tag highlights include an icon, chart markers carry text, and dark bands are labelled "Dark".
- **Contrast:** essential text (labels, values, units, axis text) uses Primary Text or Secondary Text. Muted Text is used only for non-essential decoration and disabled track styling (§13, P-4).
- **Charts:** each has an accessible name and a text summary of the metric, final value, minimum and maximum, updated at completion. The hourly "Show values" table is available after completion.
- **Reduced motion:** when the system requests reduced motion, bubbles and particles are static (counts still reflect the model) and visual transitions are instant. The chart reveal and simulated clock still advance.
- **Targets:** every interactive target is at least 24 × 24 px.
- **Zoom:** the workspace stays usable at 200% browser zoom through the stacked layouts in §12.

### 12. Responsive behaviour

Desktop and laptop are primary; a full mobile experience is out of scope.

| Viewport | Layout |
|---|---|
| Width ≥ 1600 | As §2, with the left column at 300 px and the right at 380 px |
| 1440–1599 | As §2 (280 / 352 px) |
| 1280–1439 | As §2, with the left column at 260 px and the right at 320 px |
| Width ≥ 1280, height 720–819 | Explanation panel 200 px; charts shrink toward their 112 px minimum. At 1280 × 720 no page scroll is required. |
| Width ≥ 1280, height < 720 | Same layout; the page scrolls vertically |
| 1024–1279 | Two columns: controls (260 px) and a main column stacking chamber (minimum 420 px tall), live data (readouts in one row of four, charts below) and explanation. Header pinned. Page scrolls. |
| < 1024 | Single column: header (pinned; status wraps under the brand), controls, chamber, live data, explanation. A dismissible notice: "BioLab is designed for desktop and laptop screens." Functional, not optimized. |

At every size the controls, the chamber and the four readouts stay present (DESIGN_SYSTEM §22).

### 13. DESIGN_SYSTEM.md reconciliation

The four conflicts below were approved by human decision on 2026-09-27, and corrections P-1 to P-4 have been applied to DESIGN_SYSTEM.md (§3 Culture Visualization, §12, §15 Thermal Stress, §21). This section records what changed and why.

**Conflict 1: thermal-stress appearance (U-6).** §15 lists "darker / less healthy culture". PRD-0001 §10 establishes that darkening is not a scientifically established heat response. This PRD uses an explicit Heat stress indicator, reduced apparent activity, and at most a paler illustrative cue. **P-1** (applied) replaced the §15 "Thermal Stress" block with:

```
### Thermal Stress

Visual characteristics:

- explicit Heat stress status indicator (critical) as the primary communication
- reduced apparent activity (fewer fine activity bubbles, slower particle motion)
- reduced growth visualization
- optional slight loss of culture saturation (paler, never darker), treated as an
  illustrative UI cue, not a measured biological response

Do not darken the culture to signal heat stress.
Avoid dramatic fire or unrealistic effects.
```

**Conflict 2: no culture colour exists.** §15 requires a "vivid but natural green culture", but §3 defines no culture colour. Its only green is the semantic Healthy colour, which §4 forbids using decoratively. §1 forbids new colours without updating the design system. **P-2** (applied) added to §3, after "Critical State":

```
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
```

**Conflict 3: ordinal parameters have no numerical value.** §12 requires every parameter to show a "current numerical value". Aeration is ordinal (Off / Low / Adequate); showing its internal calibration factor would present a `CAL` value as a measured quantity. **P-3** (applied) changed §12 item 2 to:

```
2. current value — numerical for numeric parameters; the selected setting
   (for example Off / Low / Adequate) for ordinal parameters
```

**Conflict 4: Muted Text contrast.** Muted Text `#64748B` on Primary Surface `#0D1B2A` has a contrast ratio of about 3.6:1. That is below the 4.5:1 normally required for small text, so it does not meet §21's "maintain strong text contrast" for essential information. **P-4** (applied) added to the §21 list:

```
- essential text (labels, values, units, axis text) uses Primary or Secondary Text;
  Muted Text is limited to non-essential decoration and disabled states
```

**Interpretations** that are consistent with DESIGN_SYSTEM.md and need no change:
- the Bottom explanation region sits under the center column (D-1)
- photoinhibition uses the critical indicator, which §15 allows ("warning or critical")
- Run Experiment uses Main Background text on Primary blue, satisfying §11's "high contrast text"
- the header shows no page-title-sized text, consistent with §5 "avoid oversized typography"

### 14. Data the workspace displays

All values below come from the PRD-0001 simulation; how they are passed is an ADR-0002 decision.

- **For every simulated step:**
  - simulated time and light/dark state
  - relative biomass `B`
  - net O₂ production `N`, plus photosynthetic production `P` and respiratory consumption `R`
  - simulated pH `h`
  - specific photosynthetic production `p` and specific photosynthetic capacity `c`
  - the current classification: state, primary failure, other failures and suboptimal causes
  - the health category, its target (for the trend) and the retained cause
- **For each run:**
  - run-record entries (failure type, first onset time, largest contribution, overall primary)
  - the run outcome
  - the photoinhibition penalty `1 − j`
  - photosynthetic O₂ integrated over light periods
- **Once:** the healthy-baseline run's final relative biomass and light-period photosynthetic O₂, for the comparison in §7.

## User flow(s)

1. **First healthy run.**
   1. The workspace opens in Ready with the baseline defaults.
   2. The student presses Run Experiment. Controls lock, and the status reads "Running".
   3. Over about 30 seconds:
      - the chamber shows activity in light
      - at `14:00` the lamp switches off and the indicator reads "Dark period"
      - biomass and pH rise during light
      - net O₂ drops below zero in darkness, with the caption "Respiration exceeds photosynthesis"
   4. At `24:00` the status reads "Completed". The explanation shows the "Healthy culture" run outcome with final values and a Try next prompt.
   5. Reset unlocks the controls with the same values.
2. **Heat stress.**
   1. After Reset, the student sets Temperature to 45.0 °C and runs.
   2. The chamber indicator reads "Now: Heat stress" from `00:00`, the temperature tag turns red, and fine activity bubbles and particle motion are reduced.
   3. Health moves to Suboptimal at `02:00` and Stressed at `04:00`.
   4. The run outcome explains heat stress, compares with the baseline, and suggests the temperature region.
3. **Photoinhibition demonstration.**
   1. The student presses End on the light slider (or the "2,200" tick) and runs.
   2. The indicator reads "Now: Photoinhibition" through the light period and the lamp glow is bright.
   3. At nightfall the indicator changes to "Now: Healthy". The run record keeps "Photoinhibition — occurred during this run". Health shows "Stressed · Recovering", then Suboptimal at `20:00`.
   4. The explanation uses the "clear" wording and the "Earlier in this run" block. This is the BRD success metric 2 demonstration.
4. **pH stress, both directions.** Starting pH 6.0 gives "Low-pH stress", and the explanation may say "acidic". Starting pH 11.0 gives "High-pH stress". The pH tag is highlighted in both.
5. **Several stresses.** Light 2,200 and 45.0 °C give an indicator of "Now: Heat stress · +1 more". The explanation gives heat stress in full, per the model's ranking, and lists photoinhibition under "Also occurring". The run record lists both, with heat stress tagged Primary.
6. **Abort.** During Running, the student presses Reset. Playback stops and the workspace returns to Ready with the values kept.
7. **Typed correction.** The student types "50" into Temperature and presses Enter. The value becomes 45.0 °C, with the message "Adjusted to 45.0 °C (maximum)".
8. **Keyboard-only run.** The student uses the skip link, sets each control with arrow keys, PageUp/PageDown and End, tabs back to Run Experiment, and presses Enter. Announcements report the run start, condition and health changes, and completion.

## Edge cases

- **Light just above 800:** the indicator reads "Photoinhibition" while the data barely differ from baseline. The explanation uses the "mild" wording: "effects may not yet be visible".
- **Light 0, or at or below 150:** Suboptimal (light-limited). Net O₂ can be negative even in the light period, with the same caption. The lamp is visibly dim or off.
- **Continuous light (24:0):** no dark bands and no "Dark period" indicator. The 24:00 state is illuminated.
- **Starting pH near a favorable boundary:** the pH readout and chart show the drift. The indicator can move to Suboptimal mid-run, and the explanation states both the starting and the simulated pH.
- **Value exactly on a boundary** (for example 30.0 °C or pH 8.5): shown as the more severe zone, per the model.
- **Cold combined with another stress:** the failure is primary, and cold is listed under "Suboptimal conditions".
- **Run pressed repeatedly:** only the first press counts. The button is disabled immediately.
- **Controls changed during Preparing:** not possible, because controls are disabled from the moment Run is pressed.
- **Tab hidden during Running:** playback pauses and resumes where it stopped. No time is skipped.
- **Window resized during Running:** the layout adapts and playback continues unaffected.
- **Reset pressed at exactly 24:00:** treated as Reset from Completed.
- **Reduced motion:** the chamber is static but correct; data playback still runs.
- **Simulated pH beyond the starting-pH range** (for example 5.96): shown as-is. The pH chart window of starting pH ± 0.6 always contains the run's drift.

## Out of scope

- Comparing, saving, exporting or sharing runs; run history across runs.
- Playback controls: pause, scrub, speed change or skip to end.
- Changing conditions during a run (BRD-0001).
- Scenario presets or guided demo buttons.
- Onboarding tours, tutorials, sound.
- AI tutor, voice, teacher dashboard, accounts, physics or Real-Life Science modules, other organisms (DESIGN_SYSTEM §24).
- Languages other than English.
- A full mobile experience.
- Advanced accessibility features beyond §11 (BRD-0001).
- Implementation architecture: components, state management, file structure, the simulation interface (ADR-0001, ADR-0002, ExecPlan).

## Status

accepted

## Decisions

All decisions below were approved by human decision on 2026-09-27. The DESIGN_SYSTEM.md corrections P-1 to P-4 were approved on the same date and have been applied (§13). PRD-0001's U-6 (resolved in §5 and §13) and U-8 (resolved in §4.1) are closed. No product or UI decisions remain open in this PRD.

**Layout and lifecycle** (approved 2026-09-27)
- **D-1** The explanation panel sits under the chamber in the center column, not full width.
- **D-2** First-load control values are the PRD-0001 §12.9 healthy baseline.
- **D-3** Reset returns the workspace to the configurable pre-run state while preserving the currently configured experiment values; there is no separate "restore defaults".
- **D-4** In Completed, controls stay locked and Run is disabled until Reset.
- **D-5** Reset is available during a run and needs no confirmation.
- **D-12** Playback pauses while the browser tab is hidden.

**Controls** (approved 2026-09-27)
- **D-6** Light control mapping exactly as specified in §4.1: 79 stops (steps of 10, 25 and 50), clickable reference ticks, and PageUp/PageDown jumps between reference values. Only the configured photon-flux value reaches the simulation.
- **D-7** Temperature slider step 0.5 °C, typed 0.1 °C; pH step 0.1.
- **D-13** No favorable or stress zone hints on controls or charts; boundaries are named only in the explanation text.

**Data display** (approved 2026-09-27)
- **D-8** Display precision: 2 decimals for relative biomass, net O₂ and simulated pH.
- **D-11** Chart axes: fixed biomass (0.8–1.8) and net O₂ (−0.5 to 1.5) axes for every run; pH window of starting pH ± 0.6, fixed for each run.
- **D-17** An hourly "Show values" table for each chart after completion.

**Explanation and wording** (approved 2026-09-27; section labels relabelled by PRD-0003 §6 to What happened / Why it happened / Effect on the culture / Try next, awaiting review)
- **D-9** Photoinhibition copy cutoff: inhibition penalty 0.10, a UI copy convention.
- **D-10** The Effect section compares final values with a model-computed healthy baseline.
- **D-14** "Heat stress" is the UI label for PRD-0001's Thermal stress state.

**DESIGN_SYSTEM.md corrections (§13)** (approved and applied 2026-09-27)
- **D-15** P-2: culture colours `#2F8F62` (base) and `#6F9384` (reduced capacity, illustrative), plus the lamp glow in Primary Text at 0–35% opacity.
- **D-16** P-1: no darkened culture for thermal stress; an explicit Heat stress indicator and reduced apparent activity; any colour change is illustrative only and may become paler, never darker. P-3: ordinal controls such as Aeration show their selected setting instead of a numerical value. P-4: Muted Text is limited to non-essential decoration and disabled states.
