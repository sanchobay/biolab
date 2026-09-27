// W24: the three locales share one key tree and contain no empty strings (PRD-0003 §9, ADR-0003).
import { describe, expect, it } from 'vitest';
import { LOCALES, MESSAGES } from '../../src/i18n';

type Tree = Record<string, unknown>;

/** Every leaf path with its kind ("string", "function" or "number"). */
function leaves(node: unknown, path = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
    for (const [key, child] of Object.entries(node as Tree)) for (const [p, kind] of leaves(child, `${path}.${key}`)) out.set(p, kind);
  } else if (Array.isArray(node)) {
    node.forEach((child, index) => {
      for (const [p, kind] of leaves(child, `${path}[${index}]`)) out.set(p, kind);
    });
  } else {
    out.set(path, typeof node);
  }
  return out;
}

describe('locale completeness (W24)', () => {
  const reference = leaves(MESSAGES.en);

  it.each(LOCALES)('%s has the same key tree as English', (locale) => {
    expect([...leaves(MESSAGES[locale]).entries()].sort()).toEqual([...reference.entries()].sort());
  });

  it.each(LOCALES)('%s has no empty strings', (locale) => {
    const empty: string[] = [];
    const walk = (node: unknown, path: string) => {
      if (typeof node === 'string') {
        if (node.trim() === '') empty.push(path);
      } else if (node !== null && typeof node === 'object') {
        for (const [key, child] of Object.entries(node as Tree)) walk(child, `${path}.${key}`);
      }
    };
    walk(MESSAGES[locale], locale);
    expect(empty).toEqual([]);
  });
});
