# ADR-0005: Browser speech synthesis, display preferences and text scaling

## Context

[PRD-0005](../../design-docs/prd/0005-display-settings-and-read-aloud.md) adds read aloud and persistent display settings. The constraints:

- **Offline and private:** no runtime network requests, no third-party services, works offline (BRD-0002).
- **No speech recognition:** voice commands were dropped because browser speech recognition sends audio to a cloud service (BRD-0002 non-goals).
- **Engine untouched:** `src/simulation/` stays unchanged. The language layer is ADR-0003.
- **Text size:** it must scale the interface text by up to 200% while spacing and layout keep working. Today every font size and most line heights in `src/styles/index.css` and the Tailwind type tokens are in px: 87 `font-size` and 31 `line-height` declarations.
- **Reduced motion** is currently read in three places: one CSS `@media (prefers-reduced-motion)` block and two `matchMedia` calls (`navigation.ts`, `ExplanationPanel.tsx`).

## Decision

1. **Read aloud uses the Web Speech API `speechSynthesis`, with no dependency.**
   - **Voices:** only local voices (`SpeechSynthesisVoice.localService === true`) whose primary language subtag equals the interface locale (`en`, `ru`, `kk`). Such voices synthesize on the device, so they work offline and send nothing anywhere.
   - **No voice:** if no local voice matches, the control is disabled with a localized reason. A voice for another language is never used.
   - **Feature detection:** the feature checks for `window.speechSynthesis`. Voice lists that load asynchronously are handled through `voiceschanged`.
   - **Structure:** one module-level controller guarantees a single active reader. It splits text into sentence-sized utterances and exposes `idle | speaking | paused` to a React hook.
   - **Text:** spoken-text normalization (symbols and units to words) is a pure function in `src/presentation/` that uses locale messages, so it is unit-tested.
   - **Not used:** `SpeechRecognition`.
2. **Preferences are stored in `localStorage`.**
   - **Key:** one key, `biolab.preferences`, holding a versioned JSON object: `{ v: 1, textSize: 100|125|150|200, lineSpacing: 'standard'|'wide'|'extra', motion: 'system'|'reduce' }`.
   - **Safety:** every read and write is wrapped in try/catch. Invalid or missing data returns the defaults.
   - **Timing:** preferences load synchronously in `main.tsx` before the first render and are applied as `<html>` attributes: `data-text-size`, `data-line-spacing`, `data-motion`.
   - **React side:** a `PreferencesProvider` context, following the `I18nProvider` pattern, updates both the attributes and storage.
3. **Text scales with rem.**
   - **Conversion:** all interface `font-size` values and px line heights of text become rem at 16 px = 1 rem, so today's 100% renders identically. The Tailwind `--text-*` tokens convert the same way.
   - **Root size:** it is set from `data-text-size` (100/125/150/200%) as a percentage of the browser default, so a user's larger browser font is respected.
   - **Spacing, radii and icons** stay in px.
   - **Chart.js:** tick and axis font sizes are multiplied by the current root scale when a chart is configured.
   - **Layout:** larger sizes switch the workspace to the natural-scroll layout and fewer columns through attribute-gated CSS, following the existing `:root[lang]` gating pattern.
4. **Reduced motion has one source of truth.**
   - A helper `prefersReducedMotion()` combines the OS media query with `data-motion="reduce"`.
   - The two JS call sites use it.
   - The CSS reduced-motion block also applies under `:root[data-motion="reduce"]`.

## Alternatives considered

- **Speech:**
  - **Cloud TTS** (Google, Azure, and others): network, API keys, cost. Rejected by BRD-0002.
  - **A bundled speech engine** (for example eSpeak-NG or Piper compiled to WebAssembly):
    - voice models add several to tens of MB to an offline-first bundle
    - Kazakh quality is uncertain
    - it does not fit the demo time box

    Rejected. Revisit only if device voices prove insufficient after the demo.
  - **Allowing any voice, including network voices** such as Chrome's "Google …" voices: breaks offline use and sends text to a server. Rejected.
- **Preferences:**
  - **Cookies:** sent to the server on every request for no benefit.
  - **IndexedDB:** asynchronous, and too heavy for four values.
  - **Keeping preferences for the session only:** fails PRD-0005 §4.
- **Text size:**
  - **CSS `zoom` on the page:** scales everything without re-evaluating media queries, so a 1280 px layout at 200% overflows horizontally. Rejected.
  - **Telling users to use browser zoom:** not an in-app control, and it cannot be shown in the demo. It remains supported.
  - **Scaling font sizes with `calc(Npx * var(--scale))`:** equivalent in effect, but noisier than rem and it ignores the user's browser font setting.

## Consequences

**Easier**
- Read aloud and settings work offline, add no packages and send nothing off the device.
- The rem conversion makes BioLab respect the user's browser default font size.

**Harder or required**
- **Voices depend on the device.** A Kazakh local voice is often missing, and that can only be checked on the demo device.
- **Browser quirks:** Chrome's pause and resume, and its cut of long utterances, need the chunking and a Stop fallback.
- **The rem conversion is a broad mechanical CSS change.** It must be verified to render identically at 100%, by comparing screenshots at 1440 × 900 before and after, and then at 125–200%.
- **Every future motion behaviour must use `prefersReducedMotion()`** and the attribute-gated CSS.

**Amends ADR-0001 §7 (browser and runtime assumptions)**

Adds these optional platform features. If any of them is missing, the app keeps working without the feature:
- `speechSynthesis` with local voices (read aloud)
- `localStorage` (preferences)
- Service Worker and Cache Storage (ADR-0004)

"No network after load" still holds: speech uses local voices only, and speech recognition is not used.

## Status

accepted
