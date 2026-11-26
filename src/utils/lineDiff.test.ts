import { describe, expect, it } from 'vitest';
import { computeLineDiff } from './lineDiff';

describe('computeLineDiff', () => {
  it('marks identical multi-line snippets with zero added or removed lines', () => {
    const src = 'public class Crocus {\n  private int weight;\n}';
    const res = computeLineDiff(src, src);
    expect(res.added).toBe(0);
    expect(res.removed).toBe(0);
    expect(res.unchanged).toBe(3);
    expect(res.lines.every((l) => l.type === 'same')).toBe(true);
  });

  it('tracks insertions, deletions, and mid-block replacements accurately', () => {
    const before = 'line1\noldLine\nline3';
    const after = 'line1\nnewLineA\nnewLineB\nline3';
    const res = computeLineDiff(before, after);
    expect(res.removed).toBe(1);
    expect(res.added).toBe(2);
    expect(res.unchanged).toBe(2);
    expect(res.lines.map((l) => `${l.type}:${l.text}`)).toEqual([
      'same:line1',
      'remove:oldLine',
      'add:newLineA',
      'add:newLineB',
      'same:line3',
    ]);
  });

  it('handles empty strings cleanly', () => {
    expect(computeLineDiff('', '')).toEqual({
      lines: [],
      added: 0,
      removed: 0,
      unchanged: 0,
    });

    const addedOnly = computeLineDiff('', 'a\nb');
    expect(addedOnly.added).toBe(2);
    expect(addedOnly.removed).toBe(0);
  });
});
