# ADR-0003: Localization and view architecture

## Context

PRD-0003 adds three interface languages (EN, KK, RU) and two new views (Learn, About) to a single-page React app (ADR-0001). The user's request of 2026-09-27 specified:
- a lightweight centralized localization layer with shared translation resources (`src/i18n/en.ts`, `ru.ts`, `kk.ts`, `index.ts`)
- stable keys
- no heavy i18n dependency unless genuinely necessary
- no large routing architecture
- a language-independent simulation engine

The explanation engine (`src/presentation/explanation.ts`) builds sentences from model values, so translations need interpolation and per-language sentence order.

## Decision

1. **Typed message objects, no dependency.** `en.ts` exports the source messages. Its type, `Messages`, is enforced on `ru.ts` and `kk.ts`, so a missing key fails typecheck.
   - Dynamic sentences are typed functions (for example `(temperature: string) => string`), so each language owns its word order and plural forms.
   - A test checks that no string is empty.
2. **One React context.**
   - `I18nProvider` holds the locale.
   - `useI18n()` returns `{ locale, m, setLocale }`.
   - Changing the locale sets `<html lang>` and `document.title`. There is no reload and no persistence; the default is English.
3. **Presentation layer only.**
   - `src/presentation/*` functions receive `m`. `src/simulation/` is untouched and language-independent.
   - Chart overlay labels are passed in through the plugin options.
4. **Numbers are locale-invariant** (PRD-0003 §9).
5. **Views are App state, not routes.** `view: 'experiment' | 'learn' | 'about'` lives in `App`, above the run state, so switching views never interrupts a run.
6. **Theory diagrams read the model.** They import the pure factor functions from `src/simulation/model.ts` read-only, so each drawn curve is the model's own response.

## Alternatives considered

- **i18next / react-intl:** mature, but add dependencies and runtime message parsing that three static locales do not need. ICU plural rules are not required: the sentences avoid counts or handle them in typed functions.
- **JSON message files with `{placeholder}` interpolation:** these lose type checking of arguments and per-language sentence logic.
- **A router for Learn and About:** unnecessary for two static views, and it would risk unmounting the run.

## Consequences

- Adding a string requires adding it to all three locale files; typecheck enforces this.
- Components read `m` from context. Tests render in English by default, so the existing English assertions stay valid.
- Translators edit TypeScript files. That is acceptable for an MVP with the developer as the translator.
- Locale-specific number formats would need a later ADR, because input parsing depends on the format.

## Status

accepted
