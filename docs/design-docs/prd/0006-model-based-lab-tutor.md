# PRD-0006: Model-based Lab Tutor

Implements [BRD-0002](../brd/0002-demo-readiness-offline-access-tutor.md) goal 4.

**This PRD supersedes [PRD-0003](0003-learning-layer-and-localization.md) §8 for the AI Lab Tutor.** The "AI Lab Tutor — Preview" with its "Full conversational tutoring is coming soon" notice is replaced by the working Lab Tutor below. The Video lessons part of PRD-0003 §8 is unchanged and stays "Coming soon". Everything else in PRD-0003 is unchanged.

It needs no new architecture. It adds pure presentation functions, React components and locale strings within ADR-0001 §4 and ADR-0003.

## Scope

### 1. Name and honesty

- **Name:** "Lab Tutor". The word "AI" is removed everywhere, including the Learn contents list, About and README.
- **Label:** a permanent line under the heading, in all three languages: "Answers are generated from your run and the model — not by an AI language model."
- **No pretence:**
  - no chat bubbles, typing indicator or avatar
  - no free-text field (decision of 2026-09-30: chips only)
  - no claim of understanding beyond the listed questions

### 2. Where

- **Learn view:** the existing tutor section, now functional.
- **Explanation panel:** an "Ask the Lab Tutor" text button in the heading row of "What's happening in the culture?". It opens Learn at the tutor section with focus on it, using the existing navigation and arrival marker.
- **The run is kept.** Views share the run state, so switching views never interrupts or loses the run.

### 3. Questions

The questions are chips: buttons in a wrapping row. The chosen chip is marked `aria-pressed="true"`.

**Fixed chips** (always shown, the four existing questions):

| Id | Question | Needs a run |
|---|---|---|
| F1 | Why did my biomass decrease? | yes |
| F2 | Why did pH increase? | yes |
| F3 | What parameter should I investigate next? | no (better with a run) |
| F4 | Explain photoinhibition simply. | no |

**Contextual chips** (at most three, in this order, only when the run supports them):

| Id | Shown when | Question |
|---|---|---|
| C1 | The run record has a primary failure | "Why did {failure} happen?" |
| C2 | Culture health at the current time is not Healthy | "Why is culture health {category}?" |
| C3 | Net O₂ was below zero at any time so far | "Why is net O₂ negative in the dark?", or **C3′** "Why is net O₂ negative even in the light?" when net O₂ was below zero during a light period with light intensity above 0 (amended 2026-10-01, see below) |

"The run so far" means samples 0 to the current playback step while running, and the full day when completed. Before any run only the fixed chips show.

**Amendments of 2026-10-01** (user decisions on the S4 wording review):
- **C3′ replaces "…when light is low?".**
  - A 45.0 °C run has negative net O₂ at light 300, so light is not low and the old wording would be wrong.
  - C3′ shows only if net O₂ < 0 during a light period while light intensity is above 0. Otherwise C3 ("in the dark") is used. A light period at 0 µmol photons m⁻² s⁻¹ counts as dark.
- **C1 and C2 in RU and KK** are built as "{failure}: почему это произошло?" / "{failure}: неліктен болды?", and the health category is quoted, so case and gender agreement are never needed.
- **F1 and F2:** when the premise of the question did not hold (biomass did not decrease; pH did not increase), the answer starts by saying so directly.
- **Kazakh answers** put numbers apart from case endings (for example "Салыстырмалы биомасса: 1.00 → 0.94"). Russian answers write the biomass multiple without "×" ("0.94 от исходной").

### 4. Answers

Answers are produced by pure, deterministic functions in `src/presentation/`. Their inputs are:
- the simulation result up to the current step
- `PARAMETERS`
- the model-computed healthy baseline (PRD-0002 D-10)
- the messages of the current language

They never run a new simulation and never change a model value.

**Every answer:**
- restates the question as its heading
- gives 2–5 short sentences or bullets built from this run's actual values, formatted with the existing formatters and units
- ends with a provenance line, for example "Based on your run at 24:00: 45.0 °C, pH 9.0, 2,200 µmol photons m⁻² s⁻¹, 14 h light : 10 h dark, Adequate."
- follows PRD-0001 §10:
  - boundaries "in this model"
  - the four oxygen terms
  - "occurred during this run", never "damaged"
  - "too low for this alkaliphilic culture"
  - "acidic" only below pH 7
  - saturation is not damage
  - darkness is normal

**Content per question:**

| Id | Content |
|---|---|
| F1 | Biomass from 1.00 to its current value. If it did **not** decrease, say so plainly and explain what drove the change. When completed and not the baseline configuration, compare with the healthy baseline's final biomass. Cause, in the model's own ranking: the primary failure and its what/why wording; else the suboptimal causes; else normal growth in light and a slight decline in darkness. |
| F2 | pH from the starting value to its current value, and its direction. If it did not increase, say so. Mechanism: photosynthetic growth raises pH in a bicarbonate medium, and pH tends downward in darkness. When a pH stress or suboptimal pH occurred, add this model's boundaries. |
| F3 | The model's primary failure → its existing "Try next" text. Else the first suboptimal cause → its "Try next" text. Else, for a healthy run: "change one condition at a time", with two concrete suggestions within the control ranges (for example light 2,200 to see photoinhibition, temperature 45.0 °C to see heat stress). Before a run: suggest starting from the healthy baseline. |
| F4 | Plain-language photoinhibition with this model's numbers: saturation from 300, the photoinhibition zone from 800, a stronger effect away from the favourable temperature. Add this run's light setting and whether it is in the zone, using the existing mild/clear wording rule (PRD-0002 D-9). |
| C1 | The failure's name, onset time, and existing what-happened and why wording, plus its "Try next". |
| C2 | Category, trend and retained cause, and the fact that health is a delayed indicator. Worsening follows conditions after the model's lag and recovery is slower: take the 2 h and 6 h lags from `PARAMETERS.health`, never hard-coded. |
| C3 | The run's most negative net O₂ value and its time. Respiration consumes O₂ in light and darkness, and photosynthesis needs light. Darkness is normal. |

**When a question needs a run and none exists:** the answer says "Run the experiment first — I answer from your run." This is a real answer, not a disabled chip.

### 5. Presentation

- **One answer at a time**, shown below the chips in a region announced politely. Choosing another chip replaces it. There is no history.
- **Read aloud:** the answer has the Read aloud control from PRD-0005.
- **Localization:** all chip labels, templates, the honesty label and the provenance line are in EN, KK and RU.

### 6. Label updates elsewhere

- **About:**
  - "Working in this version" gains "Lab Tutor (answers from your run and the model)"
  - "Previews of planned features" keeps only "Video lessons"
- **Learn contents list:** "Lab Tutor".
- **README:** the tutor is described as functional and model-based.
- **DESIGN_SYSTEM §30:** the "previews only" rule is updated. See the design system changes below.

## User flow(s)

1. **Demo:**
   1. Set 45.0 °C and light 2,200 and run.
   2. Press "Ask the Lab Tutor" in the explanation panel.
   3. Choose "Why did my biomass decrease?".
   4. The answer states biomass 1.00 → 0.91 × initial against the baseline's 1.31 ×, names Heat stress as the primary cause with photoinhibition also occurring, and cites this model's 40 °C boundary.
   5. Read aloud reads the answer.
2. **Healthy run:** F1 says biomass did not decrease (1.00 → 1.31 × initial). F3 suggests trying light 2,200 or 45.0 °C, one change at a time.
3. **Before any run:** F1 answers "Run the experiment first — I answer from your run." F4 explains photoinhibition with the model's numbers.

## Edge cases

- **Mid-run:** answers describe the run so far and say the time, for example "at 07:10". Chips can appear as conditions develop, for example C1 once a failure occurs.
- **Reset:** answers and contextual chips return to the no-run state.
- **Several failures:** the model's ranking picks the primary one (PRD-0001 §9). The others are named as also occurring.
- **Language switch:** the current answer re-renders in the new language from the same run.

## Out of scope

- Free-text questions, keyword matching, language models and conversation history.
- Counterfactual answers that would need a new simulation run.
- Saving or exporting answers.

## Design system changes (proposed, to be added to DESIGN_SYSTEM.md on acceptance)

- **§24:** "AI Tutor" stays prohibited. The Lab Tutor is a rule-based, explicitly requested feature, not an AI tutor.
- **§30:** the tutor is no longer a preview. The dashed outlines stay only on remaining previews (Video lessons).
- **Chips:**
  - 32 px minimum height, 8 px radius, Default Border, 14 px text
  - the selected chip uses the existing segment selected style: Primary border, Primary soft background, Primary-ink text
- **Answer block:**
  - 15 px heading, prose with the reading-view type roles (15 px / 1.6)
  - separated by a hairline rule
  - the provenance line in 12 px Secondary Text
  - the honesty label in 13 px Secondary Text with a Lucide `Info` icon

## Status

accepted
