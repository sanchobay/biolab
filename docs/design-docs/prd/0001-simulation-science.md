# PRD-0001: Simulation and Science Specification

Defines what the BioLab MVP simulation models, the evidence behind each behaviour, and how every number is classified. Implements [BRD-0001](../brd/0001-biolab-mvp.md). Evidence comes from the independent science review (2026-09-27). Revised after the independent scientific audit by Astra (2026-09-27). Calibrated with Astra's implementation-calibration proposal, adopted as one coupled system on 2026-09-27 (§11, §12). Sources are listed at the end.

## Scope

### 1. Model scope statement

> This educational simulation represents a simplified *Arthrospira platensis*-dominant culture. The physical demonstration sample may contain other microorganisms and is not quantitatively reproduced by the simulation.

Limits on what we claim:

- Do not claim that *Arthrospira* dominance in the physical sample has been established.
- A suspected *Phormidium* presence affects claims about the sample, not the model. Organisms assigned to *Phormidium* fall into distinct phylogenetic lineages [17], so a provisional genus label is no basis for a response curve.
- Mixed cultures could alter net gas exchange, nutrient competition and pH trajectories; the direction cannot be assigned from a genus label (science review). Laboratory *Arthrospira* cultures are often not axenic [16].
- Straight filaments alone do not prove *Phormidium*: linear *A. platensis* strains exist [10].

**In-app "Model assumptions" note** (approved 2026-09-27; placement and styling belong to PRD-0002). One or two short sentences stating that:

1. this is a simplified educational model of an *A. platensis*-dominant culture;
2. biomass and oxygen are relative model values, not predictions for a real culture;
3. some numbers are educational calibrations, not measured constants;
4. the physical demonstration sample may contain other microorganisms and is not reproduced quantitatively.

### 2. Evidence classes

Every number and relationship in this document carries one class, following BRD-0001:

| Class | Meaning |
|---|---|
| `LIT` | Literature-backed. Direction or mechanism supported by cited sources. |
| `COND` | Condition-dependent literature. Valid only with its stated strain, medium, duration and endpoint. |
| `MD` | Modeling decision (non-numeric): a simplification chosen for the MVP. |
| `CAL` | Educational calibration: a numeric modeling decision where no defensible universal value exists. Must preserve cited directions; never presented as a measured constant or universal threshold. |

The current evidence provides no universal numerical constants. Every number in the model is therefore `COND` or `CAL`; `LIT` applies to directions and mechanisms.

**Evidence anchors vs model boundaries.** `COND-*` rows (§11) record what a study observed under its own conditions. `C-*` rows are BioLab's model choices. Where a model boundary must let a demonstration state appear at an anchor (for example, photoinhibition at 2,200 µmol photons m⁻² s⁻¹), that requirement is a model decision. It does not make the anchor a biological threshold, an onset point, or evidence of instantaneous injury.

### 3. Reference culture (MD-1)

Fixed for every run, so the five student controls are interpretable:

- **Organism:** one simplified *A. platensis*-dominant population. No strain-specific claims.
- **Medium:** Zarrouk-type bicarbonate medium (as used in [1], [5], [12]), with nutrients sufficient for the whole run and nitrate as the nitrogen source.
- **Light:** fixed spectrum. Intensity means incident photon flux at the vessel surface. The model's light response is an effective response for fixed, assumed culture optics. Self-shading is not modeled, and that omission does not make incident light equal to the light each cell receives.
- **Vessel:** fixed geometry, starting density and optical environment. These are assumed, not quantified; biomass is reported relative to its starting value (MD-12).
- **Initial state:** acclimated to favorable conditions and actively growing, with no lag phase. Lag phases of two to four days are reported [5]; skipping them is a modeling decision needed to show growth within 24 simulated hours.
- **Exposure:** configured conditions apply abruptly at simulated hour 0 and stay fixed (controls are locked during a run). Long-term acclimated results ([1], [4], [5]) inform direction only; 24-hour exposure results ([7], [8]) best match the run length.
- **Gas:** ordinary air when aeration is on; passive surface gas exchange continues when aeration is Off. Gas composition, CO₂ enrichment and fluid dynamics are not modeled. Aeration acts as one aggregate effect (MD-7).

### 4. Inputs

| Input | Unit / type | Control | Notes |
|---|---|---|---|
| Temperature | °C | continuous | 15–45 °C (C-01) |
| Starting pH | pH | continuous | 6.0–11.0 (C-08). Set before Run; simulated pH drifts during the run (MD-8, §12.7). |
| Light intensity | µmol photons m⁻² s⁻¹, incident at vessel surface | continuous | 0–2,200 (C-04). The control shows the actual photon-flux value and covers the full range. The model receives only that value; slider position is never itself a biological response. The control mapping, which includes 0, is specified in PRD-0002 §4.1 (U-8, resolved). No conversion from lux: spectral dependence matters [18]. |
| Light/dark cycle | hours light : hours dark | presets | 8:16, 10:14, 12:12, 14:10, 16:8 (studied [10], [11]) and 24:0 continuous light (used successfully [5]). Default 14:10. |
| Aeration | ordinal | Off / Low / Adequate | Aggregate mixing and gas-exchange setting, not a flow rate. Factors in C-18. |

### 5. Outputs

Oxygen terms used throughout this document:

| Term | Meaning | Modeled? |
|---|---|---|
| Photosynthetic O₂ production | Light-dependent O₂ evolution by the culture | Yes (MD-9) |
| Respiratory O₂ consumption | O₂ used by respiration, in light and in darkness | Yes (MD-9) |
| Net biological O₂-production rate | Photosynthetic production minus respiratory consumption. The displayed oxygen output. | Yes |
| Dissolved O₂ | O₂ concentration in the medium | **No.** Never displayed or implied. |

| Output | Definition |
|---|---|
| Relative biomass | Biomass relative to its hour-0 value (C-14). No absolute concentration and no experimentally calibrated prediction. **Model coupling assumption (qualitative):** biomass accumulates while photosynthetic production exceeds respiratory consumption and may decline slightly when consumption exceeds production, as in darkness. This is a model simplification, not an exact biological equivalence (MD-9). Kept above zero as a scope decision, not a survival prediction. |
| Net biological O₂-production rate | A relative rate per simulated hour, on one fixed reference scale shared by photosynthetic production and respiratory consumption (C-23). Displayed as **"Net O₂ production — relative units/simulated hour"**. One relative O₂ unit (RO) is an arbitrary common oxygen amount. Negative values are valid: respiratory consumption exceeds photosynthetic production, typically in darkness. |
| Simulated pH | Culture pH over the run, starting from the configured starting pH (MD-8). Shown on the virtual pH instrument readout. |
| Culture health | Categorical educational indicator: Healthy, Suboptimal or Stressed (MD-10, C-19). Not measured viability and not a survival probability. Always shown with its stress causes. |

### 6. Qualitative relationships

| ID | Relationship | Class | Sources |
|---|---|---|---|
| R-1 | Growth and photosynthesis rise toward a favorable temperature region, then decline. Cold limitation (slower growth) and heat injury are distinct. | LIT | [1], [3], [4] |
| R-2 | Photosynthesis and respiration respond differently to temperature (strain M2: photosynthesis peaked at 35 °C, dark respiration at 45 °C, both declining at the extremes). Heat can therefore disrupt the balance between photosynthetic production and respiratory consumption. | COND | [3] |
| R-3 | Off-optimum temperature increases susceptibility to photoinhibition. | LIT | [3] |
| R-4 | More usable light increases photosynthesis, which then saturates; excessive light can reduce photosynthetic capacity. A plateau is not damage. The decline depends on exposure and culture conditions. | LIT | [3], [9] |
| R-5 | Both too-low and too-high pH impair performance. Low pH directly inhibits photosynthesis and raises oxidative stress, while high CO₂ itself is tolerated if pH stays favorable. High pH involves cellular stress and changed carbon availability. | LIT | [5], [6], [7] |
| R-6 | *A. platensis* takes up bicarbonate; high-pH photosynthesis is not explained by free CO₂ alone. | LIT | [14] |
| R-7 | Photosynthetic growth can raise pH in bicarbonate media. | COND (strain H53, non-axenic) | [13], [14] |
| R-8 | pH tends downward in darkness from respiratory CO₂. This is a mechanistic inference; its visibility depends on buffering and gas exchange. | MD | science review |
| R-9 | Light enables photosynthetic O₂ production; respiratory O₂ consumption continues in light and darkness. More light hours do not guarantee proportionally more biomass. Continuous light is viable. | LIT | [5], [10], [11], [14] |
| R-10 | In real cultivation, mixing and gas exchange can support productivity (light redistribution, carbon supply, removal of accumulated O₂). The model represents this only as an aggregate aeration effect; self-shading and dissolved-O₂ inhibition are not modeled. | COND | [9], [12] |
| R-11 | Biomass production and photosynthetic O₂ evolution are linked through metabolism; reported ratios depend on nitrogen source, biomass composition and cultivation conditions. Standing biomass does not determine O₂ production by itself. | COND | [15] |

### 7. Qualitative response shapes (C-21)

These qualitative shapes are the approved scientific constraints. They are implemented by the calibrated functions in §12; the multiplicative combination of factors and every table ordinate there are `CAL`.

- **Temperature:** a broad favorable region, with reduced performance toward colder and hotter conditions. No symmetry is required, and growth, photosynthesis and respiration need not share one curve.
- **Light and photosynthesis:** increasing response at low light, then saturation, then possible high-light inhibition. Saturation itself is not damage.
- **Light and net O₂:** respiratory consumption can exceed photosynthetic production at low light, so net production crosses a compensation point. The net curve is not forced through zero in darkness.
- **pH:** an alkaline favorable region with reduced performance on either side. No evidence requires equal slopes or symmetry. Equal pH steps are not equal changes in hydrogen-ion concentration.
- **Aeration:** ordinal improvement, possibly with diminishing returns, within the selected regime. A universally linear benefit is not established.
- **Photoperiod:** the actual light and dark periods are applied. No "14:10 optimum" bonus and no assumption of proportional biomass gain with extra light hours.
- **Combined stress:** interactions are allowed. Independent multiplication of separate response curves is not presented as a biological law.

Supporting sources: temperature and light [3]; pH [5]; photoperiod dependence [10].

### 8. Modeling decisions

| ID | Decision | Status |
|---|---|---|
| MD-1 | Reference culture as in §3, including the qualitative gas conditions and an effective incident-light response for fixed assumed optics. | Approved 2026-09-27 |
| MD-2 | Each condition has a favorable region, a graded suboptimal zone and, where required, a stress zone. Exposure anchors support demonstrations; they do not establish universal onset boundaries or instantaneous injury. That a demonstration state appears at its anchor is a model requirement. Zone boundaries are calibrations, described as "in this model". | Approved 2026-09-27 |
| MD-3 | Stress impairs photosynthetic performance and reduces growth, and the health category worsens. Oxygen effects are stated per endpoint and period (light-period or whole-run integrated), never guaranteed at every instant. Keeping relative biomass above zero is a scope decision, not a survival prediction. | Approved 2026-09-27 |
| MD-4 | Within BioLab's selected temperature range and classification scheme, cold is Suboptimal, never a failure; thermal stress means strong heat stress. This does not teach that cold cannot injure real cultures. | Approved 2026-09-27 |
| MD-5 | The oxygen output is the net biological O₂-production rate (§5). Negative values are labeled as respiratory consumption exceeding photosynthetic production, never as negative dissolved O₂. | Approved 2026-09-27 |
| MD-6 | Light/dark presets as in §4, default 14:10; each run starts at the beginning of a light period. These are teaching choices: research supports studying 14:10, not its universal optimality. | Approved 2026-09-27 |
| MD-7 | Aeration is an aggregate educational effect (mixing and gas exchange combined) under the fixed gas assumptions in §3. The productivity ordering (C-18) and the fact that Off is not modeled as lethal are explicit model assumptions, not consequences of bicarbonate availability. | Approved 2026-09-27 |
| MD-8 | Photosynthetic growth can raise pH under the selected conditions (R-7). Neither the drift rate nor a fixed relationship to biomass is established; both are calibrations, as is a zero or smaller downward drift in darkness (R-8). Classification uses simulated pH. | Approved 2026-09-27 |
| MD-9 | Oxygen is represented as two separate processes: photosynthetic O₂ production (light-dependent, impaired by stress) and respiratory O₂ consumption (in light and darkness). The net rate is their difference. No single biomass-to-O₂ yield represents both processes; how each relates to biomass is a calibration (C-17). Linking biomass accumulation to the production–consumption balance is a qualitative model coupling assumption (§5), not an exact biological equivalence. | Approved 2026-09-27 |
| MD-10 | Culture health is a categorical educational indicator, not measured viability or survival probability. It is driven by condition stress and changes gradually; normal darkness does not worsen it. Category set and timing are calibrations (C-19, C-20). | Approved 2026-09-27 |
| MD-11 | The model is deterministic: identical inputs give identical outputs. This does not imply real cultures lack variability. Visual randomness (bubbles, particles) is outside the model. | Approved 2026-09-27 |
| MD-12 | Biomass is relative to its hour-0 value, and oxygen rates are in relative model units. Neither implies an experimentally calibrated absolute prediction. A fixed starting density and optical environment are still assumed (§3), not quantified. | Approved 2026-09-27 |

### 9. Outcome classification

States: **Healthy**, **Suboptimal**, **Thermal stress**, **Photoinhibition**, **pH stress** (low or high subtype). The three failures come from BRD-0001; Healthy and Suboptimal match DESIGN_SYSTEM.md §15. All boundaries below are `CAL` (§11).

| Condition | Favorable | Suboptimal | Stress (failure) |
|---|---|---|---|
| Temperature T (°C) | 30 < T < 35 | T ≤ 30 (cold), or 35 ≤ T < 40 | T ≥ 40 → Thermal stress |
| Light I (configured intensity, light periods only) | 150 < I < 800 | I ≤ 150 (light-limited) | I ≥ 800 → Photoinhibition |
| pH h (simulated) | 8.5 < h < 9.5 | 7.0 < h ≤ 8.5, or 9.5 ≤ h < 10.5 | h ≤ 7.0 → pH stress (low); h ≥ 10.5 → pH stress (high) |
| Light/dark cycle | All presets | — | — |
| Aeration | Adequate | Low, Off | — |

Rules:

1. **Current state.** Any condition currently in a stress zone → that failure state. If several, rank them by the improvement in specific photosynthetic capacity (f_T · f_h · f_L · A, §12) that correcting that control alone would give: temperature → 32 °C (recomputing the temperature–light interaction), light → 300, pH → 9.0. The largest improvement is the primary failure; the others are listed as contributing causes. In darkness, rank persistent non-light stresses using reference light 300 for ranking only; this generates no photosynthetic production. Exact ties follow the display order thermal, low-pH, high-pH, photoinhibition.
2. Otherwise, any condition in a suboptimal zone → Suboptimal, with each cause listed.
3. Otherwise → Healthy.
4. A value exactly on a boundary belongs to the more severe zone. Classification boundaries are conventions only: every performance response stays continuous across them.
5. Light is judged on the configured intensity during light periods. Darkness from the light/dark cycle is not light limitation and does not trigger photoinhibition.
6. **Run record.** Each failure type that occurs gets one entry storing the failure type, its first onset time, and its largest contribution over the run (the rule 1 improvement). The run outcome is the most severe state that occurred (Stress above Suboptimal above Healthy). If several failure types occurred, all are kept and the one with the largest recorded contribution is the overall primary. The record means the stress occurred during the run. It does not mean the culture remains physiologically stressed or is irreversibly injured.
7. A failure label that appears at the start of an exposure is a calibrated teaching classification, not evidence that full injury has already occurred. In particular, I = 800 is the calibrated boundary for entering the photoinhibition exposure classification, where the inhibition penalty is still zero (§12.3). It is not a claim that a large measurable reduction begins at 800; near the boundary, the classification may appear before a clearly visible data effect.
8. **Timing.** The initial state is classified at t = 0. After each simulation step, the updated state is classified using the light state of the next instant, so a high-light exposure classification ends exactly at nightfall (§12.11).
9. **Three separate views.** The current state (rules 1–5), the delayed health category (§12.10) and the run record (rule 6) are computed separately and may differ. Example: in S3 after nightfall, the current state is Healthy, health is still Stressed and recovering, and the run record shows Photoinhibition. PRD-0002 must present them distinctly.

### 10. Explanation content and visual interpretation

Each explanation follows DESIGN_SYSTEM.md §17: failure name, what happened, why, effect, suggested action.

| State | Why (key scientific points) | Effect | Suggested action | Sources |
|---|---|---|---|---|
| Thermal stress | Temperature is well above the favorable region in this model. Heat can disrupt the balance between photosynthetic O₂ production and respiratory O₂ consumption and impair photosynthetic performance, so growth slows. Off-favorable temperature also increases susceptibility to light stress. | Biomass growth ↓, photosynthetic O₂ production ↓, health category worsens | Lower temperature toward the favorable region | [1], [3] |
| Photoinhibition | Light has entered the model's high-light exposure zone. Past saturation, extra light no longer increases photosynthesis; excessive light can reduce photosynthetic capacity, more so away from the favorable temperature. Wording scales with exposure: it follows the model's current inhibition penalty (1 − j, §12.3). When the penalty is small, say the light is above the model's photoinhibition boundary and effects may not yet be visible. When it is large (for example, the 2,200 demonstration), describe the clear reduction. | Biomass growth ↓, photosynthetic O₂ production ↓ (in proportion to exposure), health category worsens | Reduce light intensity | [3], [9] |
| pH stress (low) | pH is too low for this alkaliphilic culture. Low pH disrupts photosynthesis and increases oxidative stress. | Biomass growth ↓, photosynthetic O₂ production ↓, health category worsens | Raise starting pH toward the favorable region | [5], [6] |
| pH stress (high) | pH is too high even for this alkaliphilic culture. Very high pH impaired photosynthetic O₂ evolution within 24 h in one strain and changes carbon availability. | Biomass growth ↓, photosynthetic O₂ production ↓, health category worsens | Lower starting pH toward the favorable region | [5], [7], [14] |
| Suboptimal | Names each cause: in this model cold slows growth without being a failure [4]; low light limits photosynthesis; reduced aeration lowers the aggregate mixing and gas-exchange benefit; or a condition sits between favorable and stress. | Biomass growth ↓ (moderate) | Move the named parameter toward its favorable region | per cause |
| Healthy | Conditions are within favorable regions. Biomass accumulates during light periods. The net O₂-production rate is positive in light and negative in darkness, when respiratory consumption continues without photosynthetic production. | — | — | [14] |

Wording rules:

- Say "too low for this alkaliphilic culture". Use "acidic" only when pH is below 7.
- A light plateau is saturation, not damage.
- Never say light is "far beyond what the culture can use" merely because I ≥ 800. Photoinhibition wording scales with the model's inhibition penalty.
- Darkness is normal, not illness.
- Use the four oxygen terms in §5 exactly. A negative net rate means "respiration is consuming more oxygen than photosynthesis produces". Never "negative oxygen", "oxygen level" or dissolved O₂.
- Say heat "can disrupt the balance between photosynthesis and respiration". Never claim respiration rises universally with temperature.
- Run-record wording: "[Stress] occurred during this run". Never "the culture is damaged" or "permanently stressed".
- Temperature claim allowed: "This model treats temperatures above 30 °C and below 35 °C as favorable. Reported optima vary with strain and cultivation conditions." Do not call the exact endpoints favorable, claim equal maximum growth within the region, or claim injury immediately outside it.
- Cold: "In this model, cold slows growth." Do not teach that cold cannot injure real cultures.
- Describe calibrated boundaries as "in this model". Never present a `CAL` value as a measured constant or universal threshold.
- Call 14:10 "a schedule supported by research", not "the optimal cycle".

**Visual interpretation (for PRD-0002).** Culture appearance in the chamber is an illustrative cue driven by model state, never a biological prediction.

- Heat stress is communicated by a clear heat-stress status or indicator.
- DESIGN_SYSTEM.md §15 lists "darker / less healthy culture" for thermal stress. Darkening is not a scientifically established heat response. [1] reports pigment disappearance at 45 °C over 25 days, which does not establish when any colour change would appear within a 24-hour run.
- Any culture colour or pigment change in the 24-hour visualization is an illustrative UI cue, not a measured one-day biological prediction. If a colour cue is used, paler is directionally more consistent with [1] than darker.
- Resolved (U-6): PRD-0002 §5 and §13 specify this, and DESIGN_SYSTEM.md §15 was corrected on 2026-09-27. There is no darkened culture; an explicit Heat stress indicator shows the state; any colour change is illustrative, paler, never darker.

### 11. Calibration register

Every number the implementation uses appears here, with its class (BRD-0001, success metric 3). The implementation must read these values from a single parameter source that mirrors this register and §12. The model values form one coupled system: changing any of them changes the regression targets (User flow(s)) and requires recomputation and re-approval.

**Evidence anchors.** What studies observed under their own conditions. Recorded; not model constants or thresholds. "Verified" by the Astra audit means the source supports the observation, not that transferring it to BioLab is validated.

| ID | Quantity | Class | Reported value | Conditions and limitations | Source |
|---|---|---|---|---|---|
| COND-T1 | Heat stress exposure | COND | 45 °C: negligible growth, pigment disappearance | Jaipur isolate, Zarrouk, 25 days. Not an instantaneous death temperature; does not establish bleaching kinetics within a day. Also adverse in a 24-h trial (source caution below). | [1], [8] |
| COND-T2 | Best-performing temperature | COND | 35 °C (max growth); 30 °C (max productivity) | Best tested condition in each study (Jaipur isolate, 25 days; strain SAG21.99). Neither is a universally precise optimum. | [1], [2] |
| COND-T3 | Photosynthesis vs dark-respiration peaks | COND | 35 °C vs 45 °C | Strain M2; both declined at the extremes; endpoints distinct from biomass growth. Not a universal temperature response. | [3] |
| COND-T4 | Cold growth reduction | COND | −59% (M2), −41% (Kenya) at 15 °C vs 30 °C | Acclimated cultures; unsuitable as abrupt-exposure penalties, so direction only. | [4] |
| COND-L1 | Light response in one photobioreactor setup | COND | No photoinhibition observed up to 400 incident (≤131 average internal); O₂-production plateau above ≈64 average internal | PCC7345. Condition-specific: not a transferable onset or saturation value, and internal-light values do not transfer to incident (surface) light. | [9] |
| COND-L2 | High-light stress exposure | COND | 2,200 | 24-h trial, modified Arnon medium; source caution below. Morphological change and filament fragmentation are not interchangeable with biomass or viability. | [8] |
| COND-L3 | Successful cultivation light | COND | 60; 250 at reactor surface | Different strains, spectra and vessels. Neither establishes saturation. | [5], [12] |
| COND-P1 | pH of best biomass | COND | 9.0; significantly reduced below 8.5 or above 9.5 | MIYE 101, Zarrouk, 31 ± 0.5 °C, continuous 60 µmol, 14 days. Tested pH points do not define continuous boundaries exactly. | [5] |
| COND-P2 | Low-pH impaired cultivation performance | COND | 7.5 | As COND-P1 (14 days). Longer-duration impaired performance, not an acute stress threshold. | [5] |
| COND-P3 | Low-pH stress exposure | COND | 6 | 24-h trial; source caution below. Required demonstration anchor, not a universal stress threshold. | [8] |
| COND-P4 | High-pH stress | COND | 11: O₂ evolution −68% within 24 h | NIES-39; strain-dependent. Not biomass loss, mortality, or a net reactor-O₂ percentage. Also adverse in a 24-h trial. | [7], [8] |
| COND-D1 | Studied light:dark schedules | COND | 8:16 to 16:8. Bhat: 14:10 gave the highest reported OD and protein among 10:14, 12:12, 14:10. Sun: 12:12 had the highest mean growth for OUC623 (not significantly superior to every longer schedule); no statistically significant difference detected for OUC793. | Bhat: white LED at 2,000 lux; OD ≠ dry biomass. Sun: flask cultures, 25 °C, 25 µmol. | [10], [11] |
| COND-G1 | Volumetric productivity example | COND | 0.10 ± 0.01 g L⁻¹ day⁻¹ | OUC623 at 14:10 under its tested conditions. Scale check only: volumetric productivity, not a specific growth rate or a first-day acute response. | [10] |
| COND-O1 | O₂ produced per dry biomass produced | COND | 1.9 g/g (nitrate); 1.5 g/g (ammonium) | *Arthrospira* sp. PCC8005 (related organism), continuous illuminated cultivation, 36 °C, pH 8.5, reported nitrogen limitation. Not a universal yield and not a respiratory coefficient. Not used by the model. | [15] |

Light values are in µmol photons m⁻² s⁻¹.

**Model values.** What the implementation uses. All are `CAL`: BioLab choices, separate from the anchors above, and never presented as literature-derived quantitative truths.

| ID | Quantity | Class | Value | Constraint and notes | Status |
|---|---|---|---|---|---|
| C-01 | Temperature control range | CAL | 15–45 °C | Covers both anchors (COND-T4, COND-T1) without extrapolating farther. Not survival limits. | approved 2026-09-27 |
| C-02 | Favorable temperature region | CAL | 30 < T < 35 °C | Endpoints are Suboptimal by the boundary rule. Plausible teaching region from differing COND-T2 optima; not equal maximum growth throughout; no injury immediately outside. | approved 2026-09-27 |
| C-03 | Heat-stress boundary | CAL | 40 °C (T ≥ 40 → Thermal stress) | Above 35 °C and below the 45 °C anchor; leaves a warm Suboptimal zone (35 ≤ T < 40). No universal threshold is established. | approved 2026-09-27 |
| C-04 | Light control range | CAL | 0–2,200 | Covers darkness, limitation, saturation and the demonstration exposure (COND-L2). Endpoints are not species-wide limits. Displayed in µmol photons m⁻² s⁻¹. | approved 2026-09-27 |
| C-05 | Favorable light region | CAL | 150 < I < 800 | I = 150 is Suboptimal; I = 800 enters Photoinhibition. Classification convention only; performance is continuous at both boundaries. Contains a rising region (150–300) and a plateau (300–800). | approved 2026-09-27 |
| C-06 | Photoinhibition boundary | CAL | 800 (I ≥ 800 in light → Photoinhibition) | Above C-22; below the 2,200 anchor. Entry into the calibrated exposure classification, not the start of a large measurable reduction: the penalty is zero at 800 (light factor 0.998 at 850, 0.972 at 1,000 at 32 °C). The clear demonstration for BRD success metric 2 is S3 at 2,200. Not derived from COND-L1. | approved 2026-09-27 |
| C-07 | Temperature–light interaction | CAL | Inhibition multiplier 1 + 1.5·d_T (§12.3) | Direction per R-3; bounded. A teaching choice, not a biological interaction law. | approved 2026-09-27 |
| C-08 | Starting-pH control range | CAL | 6.0–11.0 | Covers both pH demonstrations (COND-P3, COND-P4). Not a viable cultivation range. Simulated pH is not clamped to this range. | approved 2026-09-27 |
| C-09 | Favorable pH region | CAL | 8.5 < pH < 9.5 | Endpoints are Suboptimal by the boundary rule. From the COND-P1 neighbourhood; not equal optimality throughout. | approved 2026-09-27 |
| C-10 | Low-pH stress boundary | CAL | 7.0 (h ≤ 7.0 → pH stress (low)) | Stress guaranteed at the pH 6 anchor; pH 7.5 is Suboptimal (impaired cultivation, COND-P2). Not a universal threshold. | approved 2026-09-27 |
| C-11 | High-pH stress boundary | CAL | 10.5 (h ≥ 10.5 → pH stress (high)) | Stress guaranteed at the pH 11 anchor. Not a mortality threshold. | approved 2026-09-27 |
| C-12 | Light-period pH drift | CAL | Maximum +0.020 pH per simulated hour, scaled by the positive specific balance (§12.7) | Zero when the specific balance is ≤ 0. Keeps favorable starts between ≈8.415 and ≈9.980 (pedagogical constraint, not evidence). | approved 2026-09-27 |
| C-13 | Dark-period pH drift | CAL | −0.004 pH per simulated hour at reference respiration, scaled by r(T) (§12.7) | Smaller overnight decrease. | approved 2026-09-27 |
| C-14 | Biomass normalization | CAL | Relative biomass = 1.0 at hour 0 | Display convention (MD-12). No absolute starting density is specified. | approved 2026-09-27 |
| C-15 | Favorable growth over 24 h | CAL (derived target) | ≈1.306 relative biomass at 24 h in the S1 baseline (+30.6%) | **Derived calibration target, not an independent parameter.** Produced by C-16, C-17, C-23 and §12; checked as a regression target. | approved 2026-09-27 |
| C-16 | Respiratory O₂ consumption | CAL | Temperature table in §12.2; reference 0.120 RO per unit relative biomass per simulated hour at 32 °C | Positive in light and darkness; bounded and non-monotonic. The calibrated table, including its 40 °C peak, is `CAL`; it differs from the 45 °C peak observed in strain M2 (COND-T3) and is not literature-derived. | approved 2026-09-27 |
| C-17 | Biomass–O₂ coupling | CAL | Surplus coefficient 0.025; deficit coefficient 0.030 (relative biomass per RO) | Separate calibrated coupling coefficients on the net balance, not stoichiometric yields. COND-O1 is not used. | approved 2026-09-27 |
| C-18 | Aeration factor | CAL | Off 0.55; Low 0.80; Adequate 1.00 | Multiplies photosynthetic performance only. Clear, nonlethal differences; a positive factor does not guarantee positive net growth. | approved 2026-09-27 |
| C-19 | Health categories | CAL | Healthy, Suboptimal, Stressed | Categorical only; target set by the current classification (§12.10). No numeric score; no performance penalty. | approved 2026-09-27 |
| C-20 | Health timing | CAL | Worsen one category after 2 simulated hours; improve one category after 6 simulated hours | Delayed, staged transitions; never presented as measured injury kinetics. | approved 2026-09-27 |
| C-21 | Response functions | CAL | Lookup tables and functions in §12; step 1/60 simulated hour | Implements the §7 shapes. The multiplicative combination of temperature, pH, light and aeration factors and every table ordinate, including the pH 11 factor, are `CAL`. | approved 2026-09-27 |
| C-22 | Light saturation onset | CAL | 300 | Effective surface-light calibration; separate from C-05. COND-L1's internal-light plateau does not transfer to the surface control. | approved 2026-09-27 |
| C-23 | O₂ normalization | CAL | 1.000 RO per simulated hour of photosynthetic production at B = 1.0, T = 32 °C, pH 9.0, I = 300, aeration Adequate, in light | One fixed reference for all runs; never normalized per run. Photosynthetic production and respiratory consumption share this scale. Displayed as relative units per simulated hour. | approved 2026-09-27 |

**Source cautions**

- [8]: the abstract describes 40 °C as optimal while the results show greater relative biomass growth at 35 °C, and its preferred pH interval is worded inconsistently. Use its stress observations cautiously; take no optimum from its abstract. Its morphological endpoints are not biomass or viability.
- [5]: observed a two- to four-day lag phase. Its results support the direction of pH effects, not a first-day growth curve.
- [1]: 25-day experiment; no within-day kinetics.
- [13]: used a non-axenic culture but does not isolate a general causal effect of associated microorganisms.

### 12. Calibrated model

The complete calibrated model (C-21). Every coefficient and table ordinate here is `CAL`. The model is a pure, deterministic function of the five inputs.

#### 12.1 State, units and reference

- `k`: integer step index, 0 … 1440. `t = k / 60` simulated hours. Time is always computed from `k`, never accumulated.
- `B`: relative biomass, `B(0) = 1.0` (C-14).
- `h`: simulated pH, `h(0)` = configured starting pH. Not clamped to the C-08 range.
- Inputs: `T` (°C), `I` (µmol photons m⁻² s⁻¹, incident), `A` (aeration factor, C-18), `H_L` (light hours of the preset).
- **RO:** one relative O₂ unit, an arbitrary common oxygen amount. All oxygen rates are in RO per simulated hour.
- **Fixed reference (C-23):** at `B = 1`, `T = 32`, `h = 9.0`, `I = 300`, `A = 1.00`, in light, photosynthetic production is exactly 1 RO/h. This reference never changes between runs, and no rate is ever rescaled to a run.
- `clip(x) = min(1, max(0, x))`.

#### 12.2 Lookup tables

Piecewise-linear interpolation between adjacent knots; no additional curve fitting. Outside a table, hold the nearest endpoint value.

| Temperature (°C) | Photosynthetic temperature factor f_T | Specific respiratory rate r (RO per unit relative biomass per h) |
|---:|---:|---:|
| 15 | 0.40 | 0.050 |
| 25 | 0.80 | 0.090 |
| 30 | 0.97 | 0.115 |
| 32 | 1.00 | 0.120 |
| 35 | 0.95 | 0.135 |
| 40 | 0.55 | 0.160 |
| 45 | 0.10 | 0.140 |

| Simulated pH | Photosynthetic pH factor f_h |
|---:|---:|
| 5.5 | 0.08 |
| 6.0 | 0.12 |
| 7.5 | 0.60 |
| 8.5 | 0.95 |
| 9.0 | 1.00 |
| 9.5 | 0.95 |
| 10.5 | 0.45 |
| 11.0 | 0.25 |
| 11.6 | 0.10 |

- The different temperature curves for photosynthesis and respiration are deliberate calibrations. The respiration peak at 40 °C is `CAL`, not a claim about a universal optimum or a reading of COND-T3.
- The pH 11 factor (0.25) is `CAL`. It is not derived from COND-P4's 68% reduction in O₂ evolution.
- Only configured temperatures within C-01 are accepted. The outer pH knots cover drift beyond the starting-pH range; with permitted inputs simulated pH stays within 5.5–11.6 (at most +0.48 or about −0.085 in one run), so the held-endpoint rule is not reached in practice.

#### 12.3 Light response

```
u    = clip(I / 300)
s    = 2u − u²                                          # rises to a plateau at C-22 = 300
d_T  = clip(max((30 − T) / 15, (T − 35) / 10, 0))       # departure from the favorable temperature region
e    = clip((I − 800) / 1400)                           # excess-light exposure above C-06 = 800
j    = exp(−ln(4) · (1 + 1.5·d_T) · e²)                 # inhibition factor; C-07 multiplier (1 + 1.5·d_T)
f_L  = s · j
```

Consequences of these calibrations:

- Zero photosynthesis at zero light; rising response below 300; saturated without inhibition from 300 to 800.
- Above 800, inhibition grows continuously from zero; `1 − j` is the inhibition penalty used to scale the photoinhibition explanation (§10).
- At 2,200 and a favorable temperature, `f_L = 0.25`. Temperature departure strengthens the penalty: at 45 °C and 2,200, `f_L ≈ 0.031`.
- The interaction formula is a teaching choice, not an established biological interaction law.

#### 12.4 Photoperiod

```
D(k) = 1  if k < 60 · H_L      (light)
D(k) = 0  otherwise            (dark)
H_L ∈ {8, 10, 12, 14, 16, 24}
```

- `D(k)` applies to the interval from step `k` to `k + 1`. Integer light hours fall exactly on step boundaries, so no interval straddles a light/dark switch.
- The run covers one simulated day. The final displayed endpoint reports the condition immediately before hour 24, using `D(1439)`; no second day starts. Consequently 24:0 stays illuminated and 14:10 ends in darkness.

#### 12.5 Photosynthetic production, respiratory consumption and net O₂

```
p = D · f_T(T) · f_h(h) · f_L(T, I) · A      # specific photosynthetic production, RO per unit relative biomass per h
r = r(T)                                      # specific respiratory consumption, same units
P = B · p                                     # culture photosynthetic production, RO/h
R = B · r                                     # culture respiratory consumption, RO/h
N = P − R                                     # net biological O₂-production rate, RO/h (displayed)
```

- The multiplicative combination of the four factors is `CAL` (§7); the implicit coefficient 1 is the fixed C-23 reference.
- Display `N`. Keep `P` and `R` available for explanations and scenario verification.
- Respiration continues in darkness. No dissolved-O₂ quantity is calculated. No rate is rescaled to the maximum of an individual run.
- Specific photosynthetic capacity for classification ranking (§9 rule 1) is `f_T · f_h · f_L · A`, evaluated as if in light.

#### 12.6 Biomass coupling (C-17)

```
n     = p − r                                          # specific balance
g     = 0.025 · max(n, 0) − 0.030 · max(−n, 0)         # specific growth rate, per h
dB/dt = B · g              ( = 0.025 · max(N, 0) − 0.030 · max(−N, 0) )
```

- The coefficients are `CAL` coupling coefficients in relative biomass per RO, not stoichiometric yields. COND-O1 (1.9 g/g) is never used to reconstruct oxygen or biomass.
- Oxygen is calculated from its two processes first; biomass follows the net balance.
- Biomass rises with a positive balance and declines modestly with a deficit. Because the deficit coefficient exceeds the surplus coefficient, a run with negative integrated net O₂ cannot gain biomass.
- Because respiration never exceeds 0.160, `B(24) ≥ exp(−0.030 · 0.160 · 24) ≈ 0.891`. This is a scope safeguard arising from the calibrated rates, not a survival claim.

#### 12.7 pH drift (C-12, C-13)

```
light (D = 1):   dh/dt = 0.020 · clip(n / 0.880)       # 0.880 = reference balance 1 − 0.120
dark  (D = 0):   dh/dt = −0.004 · r(T) / 0.120         # 0.120 = reference respiration
```

- An aggregate buffered-drift calibration, not a carbonate-chemistry calculation. Drift follows specific activity, so it does not accelerate with standing biomass.
- During light, a negative specific balance gives zero pH drift under this calibration. During darkness, drift follows the calibrated respiration rule above.
- With a favorable start (8.5 < h < 9.5) and otherwise favorable conditions, simulated pH stays between ≈8.415 and ≈9.980, so it never enters a pH stress zone.

#### 12.8 Classification

Thresholds, ranking and the run record are defined in §9. The model evaluates them at t = 0 and after every step (§12.11).

#### 12.9 Healthy baseline

| Control | Baseline |
|---|---:|
| Temperature | 32 °C |
| Starting pH | 9.0 |
| Light intensity | 300 µmol photons m⁻² s⁻¹ |
| Light/dark cycle | 14:10 |
| Aeration | Adequate |

Initial relative biomass is 1.0; initial health is Healthy.

#### 12.10 Health timing (C-19, C-20)

- Initial health is Healthy, reflecting the initially favorable culture (MD-1).
- Target: **Stressed** when the current classification contains a failure; **Suboptimal** when conditions are suboptimal without a failure; **Healthy** otherwise.
- Health moves one category at a time: toward worse after 120 consecutive steps (2 simulated hours) with a worse target; toward better after 360 consecutive steps (6 simulated hours) with a better target.
- The transition timer resets whenever the target changes, whenever a category transition occurs, and whenever target and current health agree.
- Persistent stress from t = 0 gives Suboptimal at hour 2 and Stressed at hour 4. A high-light exposure ending at hour 14 leaves health Stressed at nightfall, Suboptimal at hour 20, and full recovery beyond the end of the run.
- The most recent cause is retained while health recovers.
- Health is a delayed educational indicator. It applies no performance penalty on top of the response factors.

#### 12.11 Numerical procedure

`Δt = 1/60` simulated hour; steps `k = 0 … 1439`; `t = k / 60`.

1. At t = 0: set `B = 1.0`, `h` = starting pH, health = Healthy. Classify the initial state (using `D(0)`) and record any failure present, with onset time 0.
2. For each step `k`:
   1. `D = D(k)`.
   2. Evaluate the pH drift at the start of the interval: `ḣ₀ = dh/dt(h)`.
   3. Estimate the midpoint pH: `h_mid = h + (Δt / 2) · ḣ₀`.
   4. Evaluate `p`, `n`, `g` and `ḣ_mid = dh/dt(h_mid)` at `h_mid`.
   5. Integrate oxygen, holding the midpoint `p`, `r`, `g` over the interval: `J_B = B · expm1(g · Δt) / g` (or `B · Δt` when `g = 0`). Add `p · J_B` to integrated photosynthetic production and `(p − r) · J_B` to integrated net production. Use an `expm1`-equivalent operation near zero.
   6. Update: `h ← h + Δt · ḣ_mid`; `B ← B · exp(g · Δt)`.
   7. Classify the updated state using the light state of the next instant, `D(k + 1)`, or `D(1439)` at the final endpoint. Update the run record and the health timer.
   8. Recompute the displayed rates `P`, `R`, `N` from the updated state with the same light state.
3. Results depend only on the step index and inputs, never on animation-frame timing or frame rate. Playback over about 30 seconds (BRD-0001) samples these precomputed results by simulated time.

## User flow(s)

From the model's perspective every run follows one flow: configured inputs → 24 simulated hours computed under fixed conditions, with the light/dark cycle applied (§12) → outputs over time (relative biomass, net O₂-production rate, simulated pH, health category) → current state and run record (§9) → explanation content (§10). Playback takes about 30 seconds of real time (BRD-0001). Reset returns to the initial configurable state; no model state carries over between runs.

**Reference scenarios.** S1 is the healthy baseline (§12.9). Stress scenarios use the demonstration anchors, where MD-2 requires the stress state to appear. These are the qualitative scientific assertions: directional and scoped to an endpoint and period. "Light-period photosynthetic O₂" means photosynthetic O₂ production integrated over the run's light periods.

| ID | Configuration (differences from S1) | Expected outcome | Expected directions (vs S1) |
|---|---|---|---|
| S1 | Baseline (§12.9): 32 °C, pH 9.0, 300 µmol photons m⁻² s⁻¹, 14:10, aeration Adequate | Healthy | Relative biomass > 1.0 at 24 h; light-period net O₂ > 0 (C-23); net O₂ < 0 in darkness; simulated pH rises during light under the §3 gas assumptions; health category stays Healthy |
| S2 | Temperature 45 °C | Thermal stress | Lower biomass gain; lower light-period photosynthetic O₂; health category worsens; biomass stays > 0. No expected ordering of dark-period net O₂. |
| S3 | Light 2,200 µmol photons m⁻² s⁻¹ | Photoinhibition | Lower biomass gain; lower light-period photosynthetic O₂; health category worsens. Not required to be lower than every lower-light condition. The clear photoinhibition demonstration for BRD success metric 2. |
| S4 | Starting pH 6.0 | pH stress (low) | Lower biomass gain; lower light-period photosynthetic O₂; health category worsens; explanation may use "acidic" |
| S5 | Starting pH 11.0 | pH stress (high) | Lower biomass gain; lower light-period photosynthetic O₂; health category worsens; biomass need not decline |
| S6 | Temperature 15 °C | Suboptimal (chosen classification), never Thermal stress | Lower biomass gain |
| S7 | Aeration Off | Suboptimal | Lower biomass gain; biomass stays > 0 (selected behaviour for this reference setup) |
| S8 | Light/dark 24:0, all else as S1 | Not a failure | No darkness-driven negative net O₂. Holds only with otherwise favorable S1 conditions. |
| S9 | Light 2,200 and temperature 45 °C | Failure: primary per §9 rule 1, other stress listed as contributing | Photosynthetic performance no better than S3; stronger impairment wherever S3 has not reached the model's minimum |
| S10 | Same configuration run twice | Identical | Identical trajectories, current states, health transition times and run record (MD-11) |

**Calibration regression targets.** Outputs of the calibrated system in §12, checked with a tolerance of **±0.001**. These are model regression targets, **not biological predictions**, and are kept separate from the qualitative S1–S10 assertions above. Each row changes only the named control from S1. "Light-period O₂" is integrated photosynthetic production in RO; the hour-24 net rate is in RO/h. If any calibration value changes, these targets must be recomputed and re-approved.

| Configuration | Biomass at 24 h | pH at 24 h | Light-period O₂ (RO) | Net O₂ rate at 24 h (RO/h) | Health at 24 h |
|---|---:|---:|---:|---:|---|
| Baseline (S1) | 1.306 | 9.236 | 16.129 | −0.157 | Healthy |
| 45 °C (S2) | 0.943 | 8.953 | 1.388 | −0.132 | Stressed |
| Light 2,200 (S3) | 1.009 | 9.001 | 3.573 | −0.121 | Suboptimal (recovering) |
| Starting pH 6.0 (S4) | 0.965 | 5.960 | 1.680 | −0.116 | Stressed |
| Starting pH 11.0 (S5) | 1.008 | 11.000 | 3.506 | −0.121 | Stressed |
| 15 °C (S6) | 1.113 | 9.094 | 5.922 | −0.056 | Suboptimal |
| Aeration Off (S7) | 1.120 | 9.096 | 8.248 | −0.134 | Suboptimal |
| Aeration Low | 1.220 | 9.174† | 12.491† | −0.146† | Suboptimal† |
| Light/dark 24:0 (S8) | 1.672 | 9.467 | 30.643† | 1.393† | Healthy |
| Light 2,200 and 45 °C (S9) | 0.905 | 8.953† | 0.043† | −0.127† | Stressed |

† Computed from §12 during the adoption review (2026-09-27); not stated in Astra's proposal. All other values are Astra's and were reproduced by the same check.

**Model invariants** (hold for every permitted input):

- Relative biomass at 24 h ≥ 0.891 (§12.6).
- No run with negative integrated net O₂ gains biomass (§12.6).
- A favorable starting pH (8.5 < h < 9.5) with otherwise favorable conditions stays between ≈8.415 and ≈9.980 (§12.7).
- Baseline pH ≈ 9.000 at hour 0, ≈ 9.276 at nightfall, ≈ 9.236 at hour 24.

## Edge cases

- **Several stresses at once:** one primary failure by the §9 rule 1 ranking, others listed as contributing.
- **Value exactly on a boundary:** belongs to the more severe zone; performance stays continuous.
- **Light just above 800:** the Photoinhibition classification begins while the performance effect is still small (light factor 0.998 at 850, 0.972 at 1,000 at 32 °C). The explanation says the light is above the model's boundary and effects may not yet be visible (§10). The clear demonstration is S3 at 2,200.
- **Cold combined with another stress:** cold is listed as a contributing Suboptimal cause; the failure comes from the other condition.
- **Light below the favorable region, including 0:** Suboptimal (light-limited). Net O₂ may be negative even during light, below the compensation point; same label as in darkness.
- **Strong heat:** if respiratory consumption exceeds photosynthetic production in light, net O₂ is negative; same label. Under this calibration this happens at 45 °C.
- **Continuous light (24:0):** with otherwise S1 conditions, no darkness-driven negative net O₂. Continuous light alone does not guarantee positive net O₂.
- **Starting pH near a boundary:** drift may carry simulated pH across it (for example, a favorable start near 9.5 can drift into Suboptimal). Classification uses simulated pH, and the explanation states both starting and simulated pH.
- **A stress condition ends mid-run** (high-light exposure ends at nightfall, or pH drifts back): the current state reflects the new conditions, and the run record keeps the occurrence. Neither implies immediate physiological recovery or lasting injury; the health category changes only gradually (C-20).
- **All controls at extremes:** one primary failure; relative biomass may decline slightly but stays at or above ≈0.891 (scope decision).
- **Darkness:** never worsens health and never counts as light limitation.

## Out of scope

- Mixed microbial communities, including *Phormidium*.
- Dissolved O₂ concentration and O₂ inhibition of growth.
- Absolute biomass concentration (biomass is relative).
- Nutrient depletion and nitrogen-source effects beyond the fixed medium.
- Light attenuation, self-shading, spectrum changes, lux conversion.
- Fluid dynamics and mixing models.
- Lag phase, acclimation during a run, runs longer than 24 simulated hours.
- Cell death, mortality, irreversible injury.
- Carbonate chemistry, CO₂ enrichment, gas composition.
- Strain selection or strain-specific behaviour.
- UI layout, visuals and chart design (PRD-0002); engine architecture (ADR-0002).

## Status

accepted

## Unresolved items

Framework accepted 2026-09-27 after the Astra re-audit, which resolves U-10. Resolved by human decision: U-1 relative biomass (MD-12), U-2 calibration values (complete coupled system adopted 2026-09-27, §11 and §12), U-3 (C-02, C-14 and the C-21 qualitative shapes approved), U-4 (all modeling decisions approved), U-5 pH anchors (COND-P2, COND-P3, C-10), U-7 categorical health (MD-10). U-9 citations corrected per the Astra audit. U-6 and U-8 resolved 2026-09-27 by the accepted PRD-0002 (§5 and §13; §4.1) and the approved DESIGN_SYSTEM.md corrections.

No items remain open.

## Sources

Peer-reviewed sources as provided by the science review, with bibliographic corrections from the Astra audit.

1. Kumar, M., Kulshreshtha, J. & Singh, G.P. (2011). Growth and biopigment accumulation of cyanobacterium *Spirulina platensis* at different light intensities and temperature. *Brazilian Journal of Microbiology*, 42, 1128–1135. https://www.scielo.br/j/bjm/a/sPmghdYLcYrcB9ZjXhMmB6y/?lang=en
2. Nghinaunye, T. et al. (2024). Response of *Arthrospira platensis* to different temperatures regarding growth and biochemical composition. *Clinical Hemorheology and Microcirculation*, 86(1–2), 205–211. https://doi.org/10.3233/CH-238104
3. Torzillo, G. & Vonshak, A. (1994). Effect of light and temperature on the photosynthetic activity of the cyanobacterium *Spirulina platensis*. *Biomass and Bioenergy*, 6, 399–403. https://doi.org/10.1016/0961-9534(94)00076-6 (institutional abstract: https://cris.bgu.ac.il/en/publications/effect-of-light-and-temperature-on-the-photosynthetic-activity-of-4/)
4. Vonshak, A. & Novoplansky, N. (2008). Acclimation to low temperature of two *Arthrospira platensis* strains involves down-regulation of PSII and improved resistance to photoinhibition. *Journal of Phycology*, 44, 1071–1079. https://doi.org/10.1111/j.1529-8817.2008.00546.x
5. Ismaiel, M.M.S., El-Ayouty, Y.M. & Piercey-Normore, M. (2016). Role of pH on antioxidants production by *Spirulina (Arthrospira) platensis*. *Brazilian Journal of Microbiology*, 47, 298–304. https://doi.org/10.1016/j.bjm.2016.01.003
6. Liu, W., Wang, J. & Liu, T. (2019). Low pH rather than high CO₂ concentration itself inhibits growth of *Arthrospira*. *Science of the Total Environment*, 666, 572–580. https://doi.org/10.1016/j.scitotenv.2019.02.312
7. Jangir, M.M. et al. (2021). Differential response of photosynthetic apparatus towards alkaline pH treatment in NIES-39 and PCC 7345 strains of *Arthrospira platensis*. *International Microbiology*, 24, 219–231. https://doi.org/10.1007/s10123-021-00160-6
8. Gomez Vico, R. et al. (2026). Morphological response of *Arthrospira platensis* to cultivation conditions using a microfluidic microscope. *Algal Research*, 93, 104466. https://doi.org/10.1016/j.algal.2025.104466
9. Franke, S., Steingröwer, J., Walther, T. & Krujatz, F. (2022). The Oxygen Paradigm—Quantitative Impact of High Concentrations of Dissolved Oxygen on Kinetics and Large-Scale Production of *Arthrospira platensis*. *ChemEngineering*, 6, 14. https://doi.org/10.3390/chemengineering6010014
10. Sun, J.-F., Shang, M.-H. & Zang, X.-N. (2023). Response surface optimization of light conditions for organic matter accumulation in two different shapes of *Arthrospira platensis*. *Frontiers in Nutrition*, 9, 1047685. https://doi.org/10.3389/fnut.2022.1047685
11. Bhat, O., Unpaprom, Y. & Ramaraj, R. (2025). Effect of Photoperiod and White LED on Biomass Growth and Protein Production by *Spirulina*. *Molecular Biotechnology*, 67, 3552–3560. Published online 21 June 2023. https://doi.org/10.1007/s12033-023-00787-y
12. Jung, C.H. et al. (2021). Morphology and Growth of *Arthrospira platensis* during Cultivation in a Flat-Type Bioreactor. *Life*, 11, 585. https://doi.org/10.3390/life11060585
13. Chotchindakun, K., Buddhasiri, S. & Kuntanawat, P. (2024). Enhanced Growth and Productivity of *Arthrospira platensis* H53 in a Nature-like Alkalophilic Environment and Its Implementation in Sustainable *Arthrospira* Cultivation. *Sustainability*, 16, 8627. https://doi.org/10.3390/su16198627
14. Berry, S. et al. (2003). Photosynthetic and respiratory electron transport in the alkaliphilic cyanobacterium *Arthrospira (Spirulina) platensis*. *Photosynthesis Research*, 78, 67–76. https://doi.org/10.1023/A:1026012719612
15. Sachdeva, N. et al. (2018). Assessment of transient effects of alternative nitrogen sources in continuous cultures of *Arthrospira* sp. using proteomic, modeling and biochemical tools. *Bioresource Technology*, 267, 492–501. https://doi.org/10.1016/j.biortech.2018.07.062
16. Sena, L. et al. (2011). A strategy to obtain axenic cultures of *Arthrospira* spp. cyanobacteria. *World Journal of Microbiology and Biotechnology*, 27, 1045–1053. https://pmc.ncbi.nlm.nih.gov/articles/PMC3079091/
17. Cheng, Y., Geng, R., Shan, L., Liu, Y., Zhang, H., Xiao, P., Ma, Z. & Li, R. (2022). Taxonomic Discussion on Cyanobacterial Systematics at Family Level, with Special Regards to Phormidiaceae by Using the Strains of Chinese Newly Recorded Genera *Ancylothrix* and *Potamolinea*. *Diversity*, 14(4), 301. https://doi.org/10.3390/d14040301 — supports taxonomic caution only; it does not establish a physiological range for unidentified *Phormidium*.
18. Farges, B., Laroche, C., Cornet, J.-F. & Dussap, C.-G. (2009). Spectral kinetic modeling and long-term behavior assessment of *Arthrospira platensis* growth in photobioreactor under red (620 nm) light illumination. *Biotechnology Progress*, 25(1), 151–162. https://doi.org/10.1002/btpr.95
