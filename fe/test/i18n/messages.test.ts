import { describe, expect, it } from 'vitest';
import { IntlMessageFormat } from 'intl-messageformat';
import { messages } from '../intl';

type Tree = { [key: string]: unknown };

/** Leaf paths; arrays (legal sections) count as one leaf so their length may differ between languages. */
function leaves(tree: Tree, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of leaves(value as Tree, path)) out.set(k, v);
    } else {
      out.set(path, value);
    }
  }
  return out;
}

const vi = leaves(messages.vi);

describe('messages (vi / en / zh)', () => {
  it.each(['en', 'zh'] as const)('%s has exactly the same keys as vi', (locale) => {
    const other = leaves(messages[locale]);
    expect([...other.keys()].sort()).toEqual([...vi.keys()].sort());
  });

  it.each(['vi', 'en', 'zh'] as const)('%s: every message is non-empty valid ICU', (locale) => {
    for (const [key, value] of leaves(messages[locale])) {
      if (Array.isArray(value)) {
        expect(value.length, key).toBeGreaterThan(0);
        continue;
      }
      expect(typeof value, key).toBe('string');
      expect((value as string).trim(), key).not.toBe('');
      expect(() => new IntlMessageFormat(value as string, locale), key).not.toThrow();
    }
  });

  it('uses the same placeholders in every language', () => {
    const placeholders = (s: string) => [...s.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();
    for (const locale of ['en', 'zh'] as const) {
      const other = leaves(messages[locale]);
      for (const [key, value] of vi) {
        if (typeof value !== 'string') continue;
        expect(placeholders(other.get(key) as string), `${locale}:${key}`).toEqual(placeholders(value));
      }
    }
  });
});
