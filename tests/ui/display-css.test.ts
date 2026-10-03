// D5 (ExecPlan 0008, PRD-0005 §2, ADR-0005 §3–§4): the stylesheet contract that makes text size, line spacing and
// reduce motion work without changing how 100% renders.
import { describe, expect, it } from 'vitest';

// Vitest stubs every CSS import (including ?raw) as an empty string, so the stylesheet is read from disk. The project has
// no @types/node (tsconfig keeps tests on browser types), hence the minimal local typing of Node's built-in loader.
const { readFileSync } = (
  globalThis as unknown as { process: { getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, encoding: 'utf8'): string } } }
).process.getBuiltinModule('node:fs');
const css = readFileSync('src/styles/index.css', 'utf8');

// SVG text inside the Theory response diagrams is part of the graphic and scales only with browser zoom (PRD-0005 §2).
const GRAPHIC_TEXT = ['.diagram-band-label', '.diagram-tick', '.diagram-mark-label'];

/** Innermost rules as [selector, body]; at-rule preludes are dropped because a selector cannot contain "{" or "}". */
function rules(source: string): [string, string][] {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => [match[1].trim(), match[2]]);
}

const all = rules(css);

describe('D5 text scales with rem', () => {
  it('has no px font sizes or line heights outside the diagram graphics', () => {
    const offenders = all
      .filter(([selector]) => !GRAPHIC_TEXT.some((name) => selector.includes(name)))
      .flatMap(([selector, body]) =>
        [...body.matchAll(/(?:^|;|\s)((?:font-size|line-height)\s*:\s*[\d.]+px)/g)].map((match) => `${selector} → ${match[1]}`),
      );
    expect(offenders).toEqual([]);
  });

  it('defines the Tailwind type tokens in rem and keeps Tailwind spacing in px', () => {
    const tokens = [...css.matchAll(/--text-([\w-]+):\s*([^;]+);/g)].filter(([, name]) => name !== '*');
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.filter(([, , value]) => value.includes('px')).map(([whole]) => whole)).toEqual([]);
    expect(css).toMatch(/--spacing:\s*4px;/);
  });

  it('sets the root size from the text-size preference, as a share of the browser default', () => {
    for (const size of [125, 150, 200]) {
      const rule = all.find(([selector]) => selector === `:root[data-text-size="${size}"]`);
      expect(rule?.[1]).toMatch(new RegExp(`font-size:\\s*${size}%`));
    }
  });

  it('keeps the fit-to-viewport workspace for 100% text only', () => {
    const fitted = all.filter(([, body]) => body.includes('100dvh - var(--bl-header-height)'));
    expect(fitted.length).toBeGreaterThan(0);
    for (const [selector] of fitted) expect(selector).toContain('data-text-size');
  });
});

describe('D5 line spacing and reduce motion', () => {
  it('widens prose line height for Wide and Extra wide', () => {
    const wide = all.find(([selector]) => selector.includes('[data-line-spacing="wide"]'));
    const extra = all.filter(([selector]) => selector.includes('[data-line-spacing="extra"]'));
    expect(wide?.[1]).toMatch(/line-height:\s*1\.8/);
    expect(extra.some(([, body]) => /line-height:\s*2(\.0)?\b/.test(body))).toBe(true);
    expect(extra.some(([, body]) => /margin-block-end:\s*2em/.test(body))).toBe(true);
  });

  it('applies the reduced-motion rules for the in-app setting as well as the device setting', () => {
    const reduce = all.filter(([selector]) => selector.includes('[data-motion="reduce"]'));
    const joined = reduce.map(([selector, body]) => `${selector}{${body}}`).join('\n');
    expect(joined).toMatch(/\.bl-anim[\s\S]*animation:\s*none/);
    expect(joined).toMatch(/\.status-dot\.is-running/);
    expect(joined).toMatch(/\.rx-air-bubble/);
    expect(joined).toMatch(/\.bl-fade[\s\S]*transition:\s*none/);
  });
});
