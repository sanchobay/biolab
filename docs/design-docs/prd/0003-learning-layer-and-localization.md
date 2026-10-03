# PRD-0003: Learning layer and localization

Extends the approved workspace ([PRD-0002](0002-experiment-workspace.md)) with a lightweight educational layer and three interface languages. Requested by the user on 2026-09-27. The workspace layout, visual design, simulation ([PRD-0001](0001-simulation-science.md)) and playback are unchanged. Architecture: [ADR-0003](../../architecture/adr/0003-localization.md).

## Scope

### 1. Methodology

BioLab teaches one flow: **Theory → Protocol → Experiment → Results → Explanation.**

- **Methodology bar:** a slim bar under the header shows the five stages on every view.
  - Theory and Protocol open the matching Learn section.
  - Experiment, Results and Explanation open the workspace and move focus to the controls, Key results or the explanation panel.
- **Current stage:** marked with `aria-current="step"`.
  - Learn view: the Learn section last opened.
  - Workspace: Experiment before and during a run, Results after completion.
- **Not a wizard:** every stage is always reachable, and the workspace remains the default view.

### 2. Views and navigation

A view is a state of the single page. There is no router.

| Nav item | Opens |
|---|---|
| Experiments | The workspace (the one available experiment), with focus on the experiment controls. |
| Learn | The Learn view: Methodology, Theory, Experiment protocol, Knowledge check, Video lessons (coming soon) and AI Lab Tutor (preview), with an in-page contents list. |
| About | A short About view: what BioLab is, the experiment library (one available experiment, more planned, and no fake entries), model assumptions, what is functional and what is a preview, and languages. |

- Switching views never resets or pauses the experiment. The run state lives above the views.
- Each view has "Open the experiment" links back to the workspace.

### 3. Theory

Short sections sourced only from PRD-0001 §1, §3, §6 and §10 and the PARAMETERS zones, always phrased "in this model":
- *Arthrospira platensis*
- photosynthesis and respiration
- biomass growth
- oxygen production
- pH change
- temperature
- light intensity
- photoinhibition
- light/dark cycle
- aeration

Each section has one line, "In the experiment", naming the control or readout it explains.

Three small response diagrams plot the model's own factor functions (`temperatureFactor`, `lightFactor` at 32 °C, `pHFactor`) with this model's boundaries marked. They are labelled "relative photosynthesis in this model".

### 4. Experiment protocol

The Experiment protocol has these parts:
- objective
- hypothesis
- variables:
  - five independent: Temperature, Starting pH, Light intensity, Light/dark cycle, Aeration
  - four simulated outcomes: Relative biomass, Net O₂ production, Simulated pH, Culture health
- baseline, read from `PARAMETERS.baseline` (32.0 °C, pH 9.0, 300 µmol photons m⁻² s⁻¹, 14 h light : 10 h dark, Adequate)
- the ten-step procedure

It ends with "Open the experiment".

### 5. Results framing

The Learn → Methodology section frames results as **Initial conditions → Environmental response → Culture response → Final results**, and maps each step to an existing part of the workspace:
- initial conditions: the controls and sensors
- environmental response: simulated pH and net O₂
- culture response: relative biomass and culture health
- final results: Key results at 24:00 and the run record

There is no new dashboard. The only workspace addition is an **Initial → Final** reading for relative biomass: "Initial 1.00", which is the model's C-14 initial biomass. pH already shows "Started at …".

### 6. Explanation labels

The existing explanation sections are relabelled:
- What happened
- Why it happened
- Effect on the culture
- Try next (previously "Parameter to reconsider")

The content, the model-driven selection logic and the "in this model" wording are unchanged.

### 7. Knowledge check

Three single-answer questions, each consistent with PRD-0001:
1. photoinhibition above 800
2. why net O₂ is negative in darkness
3. heat stress and biomass

Selecting an answer immediately shows **Correct** or **Try again**, with a one- or two-sentence explanation, announced politely. The student can change the answer at any time. There is no score, storage or backend.

### 8. Previews (roadmap)

Previews are marked "Preview" or "Coming soon" wherever they appear, so it is unambiguous what is real.

- **AI Lab Tutor — Preview:**
  - four example questions as buttons
  - Activating one shows "AI Lab Tutor — Preview. Full conversational tutoring is coming soon." It shows no answer, input field or fake conversation.
- **Video lessons — Coming soon:** three lessons with durations:
  - Introduction to *Arthrospira*, 2–3 min
  - Photosynthesis & oxygen, 3–4 min
  - Understanding your results, 3–4 min

  There is no play control.

### 9. Localization

- **Languages:** English (default), Қазақша and Русский.
- **Switcher:** a compact header control, "EN | ҚАЗ | RU", with `aria-pressed` buttons and each language's own name as its accessible label.
- **Switching** updates the whole interface immediately, without a reload, and never affects the experiment state. It also sets `<html lang>` (`en`, `kk`, `ru`) and the document title.
- **Coverage:** all user-facing text, including:
  - navigation, controls, statuses and captions
  - validation, errors and empty states
  - chart titles, axes and overlay labels
  - hourly tables, accessible names and value texts
  - screen-reader announcements
  - the dynamic scientific explanations and run record
  - all Learn and About content
- **Not translated:**
  - *Arthrospira platensis*
  - units (°C, pH, O₂, µmol photons m⁻² s⁻¹)
  - chemical notation
  - numbers: the decimal point and the "," thousands separator stay as in PRD-0002 §1, so values read identically in every language and typed input keeps one format
- **Terminology:** natural scientific Russian and Kazakh high-school STEM terms (for example, Kazakh: Тәжірибе, Тәжірибе хаттамасы, Нәтижелер, Түсіндірме, Оттек).

## User flow(s)

1. **Judge overview.**
   1. The page opens on the workspace in English, with the methodology bar visible.
   2. Theory opens the Learn view.
   3. Experiment returns to the workspace.
2. **Protocol-led run.**
   1. Learn → Experiment protocol shows the baseline.
   2. "Open the experiment" opens the workspace.
   3. The student changes one condition and runs.
   4. Results and Explanation in the bar focus the Key results and the explanation.
3. **Language switch mid-run.**
   1. During a run, RU is selected.
   2. Every label, the explanation and the chart text switch to Russian, and the run continues.
   3. KK, then EN, switch again.
4. **Knowledge check:** Learn → Knowledge check. A wrong answer shows "Try again" with an explanation, and the correct answer shows "Correct".
5. **Previews:** activating an AI Lab Tutor example shows the preview notice. The video lessons show "Coming soon".

## Edge cases

- **Longer strings:** Russian and Kazakh strings are longer. Labels wrap rather than clip, and scroll regions absorb extra lines.
- **Switching language while an input has an uncommitted edit:** the edit is kept.
- **Switching view during a run:** the run continues. Returning shows the current state.
- **Reduced motion:** view switches and in-page jumps do not animate.

## Out of scope

- Real AI tutoring, video playback, accounts, persistence of language, quiz scoring, and additional experiments.
- Locale-specific number formatting.

## Status

accepted
