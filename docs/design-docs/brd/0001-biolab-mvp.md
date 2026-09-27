# BRD-0001: BioLab MVP — Arthrospira Culture Experiment

## Problem

High-school students mostly learn biology from finished results in textbooks. They rarely get to run an experiment themselves, change a condition, and watch what happens. With living cultures this is especially hard: real experiments are slow, need lab equipment, and don't let students safely push conditions until the culture fails.

So students memorise that "temperature, pH and light affect growth" without seeing cause and effect, reading real data, or understanding why a culture fails.

## Goal

Build a browser-based virtual laboratory with a single experiment that demonstrates BioLab's core learning loop:

**Experiment → Interaction → Simulation → Data → Scientific Explanation**

In the MVP, a student works with one culture of *Arthrospira platensis* and can:

1. **Configure** five conditions before the run: temperature, starting pH, light intensity, light/dark cycle, aeration.
2. **Run** the experiment. One run represents 24 simulated hours and plays back in about 30 seconds of real time. Controls are locked during the run. Reset returns the experiment to its initial configurable state.
3. **Observe** the culture chamber react visually as the run progresses.
4. **Inspect live data**: biomass growth over time, oxygen production, simulated pH, culture health. pH may drift from its starting value during the run and is shown as a simulated output.
5. **Understand the result**: when conditions go wrong, the app explains what happened, why, what the effect was, and which parameter to reconsider.

The MVP must demonstrate at least these failure states, alongside a healthy outcome for contrast:

- thermal stress
- photoinhibition
- pH stress: one failure category covering both too-low and too-high pH

Simulated behaviour must be scientifically plausible in direction and trend: which way each variable moves and roughly why. It does not need to be quantitatively accurate. No numerical values are defined in this BRD; they belong in the simulation/science specification. Before implementation, every numerical range, optimum value, constant, biological threshold, and quantitative relationship (including how pH drifts) must be documented there as one of:

- **Literature-backed:** verified against a credible scientific source and cited.
- **Condition-dependent literature:** cited together with its conditions and limitations (for example strain, medium, duration, measured endpoint).
- **Educational calibration:** used only where the literature does not provide a defensible universal value. It is explicitly labeled as a modeling decision, must preserve the direction and qualitative relationships supported by the cited evidence, and must never be presented as a measured biological constant or a universal threshold.

## Non-goals

- Research-grade or quantitatively predictive biological simulation.
- Defining scientific constants, optimum values, parameter ranges, biological thresholds, or equations in this document.
- Changing conditions during a run.
- Physics simulations and Real-Life Science modules.
- AI tutor and voice assistant.
- Teacher dashboard and user accounts.
- Multiple organisms or multiple experiments.
- Languages other than English.
- Advanced accessibility features (voice interaction, text-to-speech, advanced visual controls). The baseline accessibility in DESIGN_SYSTEM.md §21 still applies.
- A full mobile experience (desktop-first, per DESIGN_SYSTEM.md §22).

## Success metric

The MVP succeeds if, in a short live demo in a desktop browser:

1. A user reaches a healthy outcome and each failure state only by configuring conditions and running the experiment. This includes pH stress from both too-low and too-high pH. No scripted states or presenter-only shortcuts.
2. For every outcome, every stage of the loop is visible: the chamber changes, the live data shows the effect over the 24 simulated hours, and an explanation gives the condition, its cause, its effect, and a corrective parameter.
3. Before implementation, every numerical value and quantitative relationship used by the simulation is documented as literature-backed (with a credible source), condition-dependent literature (with its source, conditions and limitations), or an explicitly labeled educational calibration consistent with the cited evidence.

Secondary, only if testing with students is possible before the demo: after one failed run, a high-school student can name the parameter that caused it and how to correct it, using only the in-app explanation.

## Status

accepted

## Assumptions and open questions

Recorded here per AGENTS.md "Context Preservation".

**Assumptions**

- Primary users are high-school students; the immediate audience is hackathon judges watching a short demo.
- Single user, single session. Nothing needs to persist between sessions (follows from "no accounts").
- Desktop/laptop browser is the target (DESIGN_SYSTEM.md §22).
- A healthy outcome is in scope as the contrast case, even though only failures were listed.
- Light/dark cycle and aeration affect the simulation but don't need their own failure state in the MVP.
- Scientific verification is recorded in the simulation/science specification, with credible sources attached to each literature-backed numerical value and quantitative relationship, and each educational calibration labeled as a modeling decision. Human acceptance confirms the product specification is approved, but does not by itself establish scientific validity.

**Open questions**

1. **Demo length and judging criteria.** Still unknown. The MVP assumes a short demo; revisit the success metric if judging criteria become available. Not blocking.
