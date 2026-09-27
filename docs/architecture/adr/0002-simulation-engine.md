# ADR-0002: Simulation Engine

## Context

[PRD-0001](../../design-docs/prd/0001-simulation-science.md) (accepted) fully specifies the calibrated model:
- lookup tables and response functions
- photoperiod, oxygen processes, biomass coupling and pH drift (§12)
- the outcome classification and primary-cause ranking (§9)
- delayed health (§12.10)
- the numerical procedure (§12.11)
- the single parameter source requirement (§11)
- the regression targets and model invariants (User flow(s))

[PRD-0002](../../design-docs/prd/0002-experiment-workspace.md) (accepted) requires:
- playback of a **precomputed** result over about 30 seconds (§9)
- the data list in §14
- a healthy-baseline comparison (D-10)
- defined error behaviour (§10)
- three separate views: current condition, delayed health, and the run record (§8)

AGENTS.md requires verification tests before implementation, so the science must be testable without any UI. [ADR-0001](0001-app-stack.md) places the engine in its own dependency-free module.

This ADR defines the architecture of that module. PRD-0001 remains the only source of truth for equations and values; nothing here restates or changes them.

## Decision

**1. One pure module, one entry point.**
- The engine is a TypeScript module (`src/simulation/`, per ADR-0001). Its public surface is a single index that exports:
  - `validateInput(input)`: returns every validation error for an input.
  - `simulate(input)`: computes the complete 24-simulated-hour result in one synchronous call.
  - `BASELINE_INPUT`: the PRD-0001 §12.9 healthy baseline.
  - `PARAMETERS`: the read-only calibration set (see 3).
  - The result and input types described below.
- **Result, not exceptions:** `simulate` returns either a success carrying the result or a failure carrying errors. It does not throw for invalid input.
- **Pure internals:** lookup interpolation, response factors, specific rates, pH drift, classification, ranking, health transition and run-record update are pure functions, each testable alone. No stateful engine object is exposed.

**2. Dependency rules, enforced.**
- **Allowed:** the engine imports only its own files. It uses no npm package, only TypeScript and `Math`.
- **Forbidden:**
  - React, the DOM (`window`, `document`, `performance`, `requestAnimationFrame`), Chart.js, Lucide
  - timers, `Date`, `Math.random`, network and storage
- **Enforcement:**
  - The engine folder is type-checked without the DOM library, so any browser reference fails the build.
  - An ESLint restricted-imports and restricted-globals rule covers the folder.
  - Engine tests run in Vitest's Node environment.
- **UI access:** the UI imports only the public index, never engine internals.

**3. Single parameter source (PRD-0001 §11).**
- **Contents:** one deep-frozen parameters module holds every value the model uses:
  - C-01 to C-23
  - both lookup tables and all classification boundaries
  - health timing
  - step size and run length
  - the fixed oxygen reference state (C-23)
  - the photoperiod presets, aeration factors and the healthy baseline
- **Traceability:** each entry is labelled with its PRD-0001 register ID.
- **No duplicate numbers:** no PRD-0001 number appears anywhere else in engine or UI code. UI text that quotes a boundary (for example "this model's heat-stress boundary of 40 °C") reads it from `PARAMETERS`.
- **UI conventions stay out:** conventions that are not model parameters live in the presentation layer (ADR-0001). Examples are the photoinhibition copy cutoff of 0.10 (PRD-0002 D-9) and the light-control stop mapping (PRD-0002 §4.1).
- **Changes:** changing any parameter is a PRD-0001 change. It requires recomputing the regression targets and re-approval.

**4. Inputs and validation.**

| Field | Meaning | Accepted values | Source |
|---|---|---|---|
| Temperature | °C | Finite, 15 to 45 inclusive | C-01 |
| Starting pH | pH | Finite, 6.0 to 11.0 inclusive | C-08 |
| Light intensity | µmol photons m⁻² s⁻¹, incident | Finite, 0 to 2,200 inclusive | C-04 |
| Light hours | Light hours of the preset | Exactly one of 8, 10, 12, 14, 16, 24 | PRD-0001 §4, §12.4 |
| Aeration | Ordinal setting | Exactly one of Off, Low, Adequate | C-18 |

- **Validation output:** a list of errors, each naming the field, the reason (not finite, out of range, or unknown option) and the accepted range or options.
- **No correction in the engine:** it never clamps or rounds. The UI clamps and rounds typed values per PRD-0002 §10 before calling, and the engine rejects anything still invalid.
- **Only the photon-flux value enters:** the light-control slider position never enters the engine (PRD-0002 §4.1).

**5. Time and integration.**
- **Step and time:** the integer step index `k` runs over 1,440 steps with `t = k / 60` simulated hours and `Δt = 1/60` h. This yields **1,441 samples**, one for each `k = 0 … 1440`. Time is always computed from `k` and never accumulated.
- **Numerical procedure:** exactly PRD-0001 §12.11 (midpoint pH, exponential biomass update, `expm1`-based oxygen integration). Light state follows §12.4.
- **Light state per sample:** sample `m`, the state at `t = m / 60`, is classified and its displayed rates computed with the light state `D(min(m, 1439))`.
  - Sample 0 uses `D(0)`.
  - Every later sample uses the light state of the interval that begins at that instant, so a high-light classification ends exactly at nightfall.
  - The final sample uses `D(1439)`.
  - This formalizes PRD-0001 §12.11 steps 1, 7 and 8.
- **No real time:** the engine has no notion of real time, frames or playback speed.

**6. Result structure.** `simulate` returns an immutable result with these parts.

*Result*

| Part | Contents |
|---|---|
| Input | The validated input, echoed back |
| Parameter set ID | Identifies the calibration set (PRD-0001, adopted 2026-09-27), for traceability |
| Samples | 1,441 trajectory samples (below) |
| Run record | The run history (below) |
| Totals | Integrated photosynthetic O₂ over light periods (RO); integrated net O₂ over the run (RO) |
| Photoinhibition penalty | `1 − j`, constant within a run (PRD-0001 §12.3) |
| Summary | The regression outputs (below) |

*Trajectory sample*: one per step. This is everything PRD-0002 §14 lists for each simulated step.

| Field | Meaning | PRD-0001 |
|---|---|---|
| Step, time | `k` and simulated hours | §12.1 |
| Light | Light state used for this sample | §12.4, §12.11 |
| Biomass | Relative biomass `B` | §12.6 |
| pH | Simulated pH `h` | §12.7 |
| Photosynthetic, respiratory and net O₂ rates | `P`, `R`, `N` in RO per simulated hour | §12.5 |
| Specific production and capacity | `p`, and `c` evaluated as if in light | §12.5 |
| Current condition | See below | §9 rules 1–5 |
| Health | See below | §12.10 |

*Current condition*: the classification at this instant.

| Field | Meaning |
|---|---|
| Severity | Healthy, Suboptimal or Failure |
| Failures | The failure types currently present (Thermal stress, Photoinhibition, pH stress low, pH stress high), each with its ranking contribution, ordered by the §9 rule 1 ranking and tie order |
| Primary failure | The first failure, or none |
| Suboptimal causes | Ordered temperature, light, pH, aeration, each with a direction: temperature cold or warm, light-limited, pH low or high, aeration Low or Off |

*Health*: the delayed indicator, computed separately from the current condition.

| Field | Meaning |
|---|---|
| Category | Healthy, Suboptimal or Stressed |
| Target | The category implied by the current condition |
| Trend | Worsening, Recovering or Steady, derived from target versus category |
| Retained cause | The cause behind a non-Healthy category. It is kept while recovering and cleared on return to Healthy (PRD-0001 §12.10). |

*Run record*: history that only accumulates, separate from both.

| Field | Meaning |
|---|---|
| Entries | One per failure type that occurred: type, first onset step and hours, largest contribution. Ordered by first onset. |
| Primary failure | The entry with the largest recorded contribution, using the §9 tie order; none if no failure occurred |
| Outcome severity | The most severe severity reached in any sample (PRD-0001 §9 rule 6) |

*Summary*: the verification outputs, matching the PRD-0001 regression table.

| Field | Meaning |
|---|---|
| Final biomass | `B` at step 1440 |
| Final pH | `h` at step 1440 |
| Light-period photosynthetic O₂ | From totals |
| Final net O₂ rate | `N` at step 1440 |
| Final health | Category and trend at step 1440 |

- **Invariants:** they are checked from the samples and totals. Relative biomass never falls below 0.891. Negative integrated net O₂ never comes with a biomass gain. The favorable-start pH bounds hold, and the baseline pH has its stated values at 0, 14 and 24 h.
- **Facts only:** the engine returns structured facts. It contains no user-facing text. Explanations, "in this model" wording, severity copy and formatting are produced by the React-free presentation layer (ADR-0001) from these facts and `PARAMETERS`.

**7. Determinism.**
- `simulate` is a pure function of its input and the frozen parameters. It has no global mutable state, randomness, clock or locale-dependent logic.
- **Same engine:** identical inputs give bit-identical results within the same JavaScript engine (PRD-0001 MD-11, scenario S10).
- **Across browsers:** `Math.exp` and `Math.expm1` may differ in the last bit between browsers. The effect is many orders of magnitude below the ±0.001 regression tolerance. A value landing exactly on a classification boundary after drift could, in principle, classify differently across browsers; this is accepted as unobservable at display precision.

**8. Errors.**
- **Invalid input:** a failure result with the validation errors. The UI should never trigger this, because it validates first (PRD-0002 §10); the engine checks defensively.
- **Non-finite output:** after computing, every numeric field in the samples and totals is checked. Any non-finite value produces a failure result of kind "non-finite output", and no partial result is ever returned. The UI then shows the PRD-0002 §10 simulation-error state.
- **Unexpected exceptions:** engine code is written not to throw for valid input. The UI still wraps the call and treats any thrown error as a simulation error.

**9. How the UI consumes the result.**
- **On Run:**
  1. The UI validates and rounds the inputs.
  2. It calls `simulate` once.
  3. It keeps the immutable result and enters Running.
- **Playback:**
  - The playback controller lives in the UI and uses `requestAnimationFrame` and the Page Visibility API. It converts active playback seconds to `t = min(24, 24 · seconds / 30)` and then to `k = floor(60 · t)`, and reads sample `k` (PRD-0002 §9).
  - The engine is never called during playback.
  - The ~30-second clock affects only which precomputed sample is displayed.
- **Baseline:** the UI calls `simulate(BASELINE_INPUT)` once at load and caches the result for the Effect comparison (PRD-0002 D-10).
- **Charts:** chart data is sampled from the trajectory at one point per 5 simulated minutes or finer. Values are never smoothed or altered.
- **No Web Worker:** a run is 1,440 fixed steps, estimated at a few milliseconds and well under PRD-0002's 300 ms Preparing threshold. This is an estimate to be measured during implementation. If profiling shows otherwise, moving the engine to a worker is a new ADR; the engine's purity makes that move mechanical.

**10. Verification support.** The next workflow step writes tests against the public API only, in Vitest's Node environment. The engine needs no test-only hooks.
- **Unit tests:**
  - interpolation at table knots and midpoints
  - light-factor properties: zero at zero light, a plateau from 300 to 800, 0.25 at 2,200 with a favorable temperature, about 0.031 at 45 °C and 2,200
  - the boundary rule (the more severe zone wins)
  - ranking and its tie order
  - health timing (2 h worsening, 6 h recovery, timer resets)
  - light/dark switch steps
- **Scenario tests:** S1–S10, with the directional assertions from PRD-0001.
- **Regression tests:** the ten rows of the PRD-0001 regression table, within ±0.001, from the summary.
- **Invariant tests:** the four PRD-0001 invariants, including a sweep over a coarse grid of permitted inputs.
- **Determinism test:** the same input run twice gives deep-equal results (S10).

## Alternatives considered

- **Stepping the model inside the animation loop:** rejected. It ties results to frame timing and contradicts PRD-0001 §12.11 and the PRD-0002 playback rule.
- **A stateful engine object with `step()` and `getState()`:** rejected. It means more surface and mutable state, and determinism is harder to guarantee. With inputs fixed for the whole run, computing everything once is simpler.
- **Implementing the model in React hooks or a reducer:** rejected. The science could not be tested without the UI, and concerns would mix.
- **Running the engine in a Web Worker now:** rejected. Message passing and asynchronous state add more complexity than a run of a few milliseconds justifies. It stays open as a future ADR.
- **A numerical or ODE library:** rejected. The accepted scheme is a specific, tiny fixed-step procedure, and a library would add a dependency and could change results.
- **Storing only hourly samples:** rejected. Classifications and health transitions change at minute resolution, and playback maps to exact steps. 1,441 samples of about twenty fields is well under 1 MB.
- **Explanation text inside the engine:** rejected. Wording is presentation (PRD-0002 §7) and changes independently of the science. The engine returns facts.
- **Throwing exceptions for invalid input:** rejected in favour of an explicit result type, so the UI's error state is an ordinary code path.

## Consequences

**Easier**
- **Science in isolation:** every PRD-0001 rule, scenario, regression target and invariant can be verified without a browser or the UI.
- **Identical runs:** results are deterministic and independent of playback timing.
- **Simple UI:** playback only reads samples by index, and the three views (current condition, delayed health, run record) arrive already separated.
- **One source of numbers:** a single parameter set matches PRD-0001 §11, and UI text quotes boundaries from it rather than copying them.
- **Cheap baseline:** the healthy-baseline comparison is one extra call.

**Harder or required**
- **Memory:** the full trajectory is held in memory. This is small, but it is stored.
- **Main-thread compute:** computation is synchronous on the main thread, which is acceptable only while runs stay fast. Timing is measured during implementation.
- **Cross-browser bits:** last-bit floating-point differences across browsers are accepted (Decision 7).
- **Recalibration cost:** any calibration change forces regression targets to be recomputed and re-approved.
- **Keeping layers in sync:** the presentation layer depends on the engine's result types; TypeScript keeps them in step.

**Follow-ups**
- Verification tests are written against this API before implementation (AGENTS.md).
- The ExecPlan fixes the internal file list and build order.

**Approved by human decision on 2026-09-27**
1. This ADR, in full.
2. Synchronous computation on the main thread, with no Web Worker.
3. Determinism scoped to bit-identical results within one JavaScript engine (Decision 7).
4. Errors returned as a result type rather than thrown.
5. All user-facing text kept outside the engine, in the presentation layer.
6. The per-sample light-state rule in Decision 5, formalizing PRD-0001 §12.11.

## Status

accepted
